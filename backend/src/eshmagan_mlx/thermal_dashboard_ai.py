"""
EshMagan MLX90640 Thermal Dashboard + Colab AI Bridge

Runs on the laptop/Raspberry Pi gateway, not on the Pico.

Responsibilities:
1. Opens the Pico USB serial port once.
2. Reads clean FRAME_V2 lines produced by Pico main.py.
3. Reconstructs each thermal frame as 24x32 Celsius data.
4. Displays a live heatmap.
5. Sends each valid thermal frame to Google Colab AI.
6. Displays the AI result returned by Colab.
7. Does NOT call the EshMagan backend directly.

Important:
- Do not open MicroPico Serial Monitor while this script is running.
- Only one process can use COM4 at the same time.
- Colab AI is responsible for deciding fire confirmation and calling the backend.
"""

import time
from collections import deque

import numpy as np
import serial
import matplotlib.pyplot as plt
import json
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer

try:
    import requests
except ImportError:
    requests = None


# =============================================================================
# Serial configuration
# =============================================================================

PORT = "COM4"
BAUD_RATE = 115200

WIDTH = 32
HEIGHT = 24
PIXEL_COUNT = WIDTH * HEIGHT


# =============================================================================
# Colab AI configuration
# =============================================================================

# Replace this URL whenever Colab prints a new Cloudflare tunnel URL.
# Current URL from your Colab output:
COLAB_AI_URL = input("Paste Colab AI /analyze_frame URL: ").strip()

SENSOR_ID = "MLX_PICO_001"
SENSOR_LABEL = "Laptop-connected MLX90640 Sensor"

# Filled dynamically when the dashboard starts.
SENSOR_INFO = {
    "sensor_id": SENSOR_ID,
    "label": SENSOR_LABEL,
    "location_wkt": None,
    "latitude": None,
    "longitude": None,
    "accuracy_m": None,
}

AI_REQUEST_TIMEOUT_SECONDS = 15

# Send every frame to Colab.
# If the dashboard becomes slow, change this to 2 or 3.
SEND_EVERY_N_FRAMES_TO_AI = 1


# =============================================================================
# Local thermal display configuration
# =============================================================================

# These values are used for local dashboard visualization/status only.
# The final AI decision comes from Colab.
WARNING_TEMP_C = 35.0
FIRE_TEMP_C = 43.0
CRITICAL_TEMP_C = 50.0

MIN_FIRE_HOT_PIXELS = 2
MIN_FIRE_HOTSPOT_AREA = 2
MIN_HOTSPOT_FRACTION = 0.0025

SMOOTHING_WINDOW = 3

VALID_MIN_TEMP_C = -40.0
VALID_MAX_TEMP_C = 125.0

NEIGHBOURS_8 = [
    (-1, -1), (-1, 0), (-1, 1),
    (0, -1),           (0, 1),
    (1, -1),  (1, 0),  (1, 1),
]


# =============================================================================
# Heatmap display configuration
# =============================================================================

DISPLAY_MIN_FALLBACK = 18.0
DISPLAY_MAX_FALLBACK = 42.0
DISPLAY_PADDING_C = 2.0

# Visual-only upscaling/smoothing.
# This makes the dashboard look smoother without changing the real 24x32 frame
# sent to Colab AI.
VISUAL_UPSCALE_FACTOR = 6
SPATIAL_SMOOTHING_PASSES = 1

# Blue = cold, red = hot.
HEATMAP_COLORMAP = "jet"


# =============================================================================
# Runtime state
# =============================================================================

frame_history = deque(maxlen=SMOOTHING_WINDOW)

valid_frames = 0
skipped_frames = 0
ai_success_count = 0
ai_error_count = 0
backend_trigger_count = 0

last_ai_result = {
    "status": "WAITING_FOR_AI",
    "final_probability": 0.0,
    "alert_level": "UNKNOWN",
    "confirmation_votes": 0,
    "confirmation_required": 3,
    "backend": {
        "triggered": False
    }
}


# =============================================================================
# Parsing
# =============================================================================

def parse_frame_v2(line):
    """
    Parse one FRAME_V2 line from the Pico into a 24x32 numpy frame.

    Expected format:
    FRAME_V2,seq,ms,min,max,mean,hot60_count,hot75_count,bad_pixel_count,768 pixels...

    Pixel values are integer centi-celsius.
    Example:
    2356 means 23.56°C
    """
    line = line.strip()

    if line.startswith("STATUS_V2,"):
        print(line)
        return None

    if not line.startswith("FRAME_V2,"):
        return None

    parts = line.split(",")
    expected_parts = 1 + 8 + PIXEL_COUNT

    if len(parts) != expected_parts:
        print(f"Skipped malformed FRAME_V2: got {len(parts)} fields, expected {expected_parts}")
        return None

    try:
        sequence = int(parts[1])
        timestamp_ms = int(parts[2])
        pico_min = int(parts[3]) / 100.0
        pico_max = int(parts[4]) / 100.0
        pico_mean = int(parts[5]) / 100.0
        hot60_count = int(parts[6])
        hot75_count = int(parts[7])
        bad_pixels = int(parts[8])
        pixels = np.array([int(value) / 100.0 for value in parts[9:]], dtype=np.float32)
    except ValueError:
        print("Skipped FRAME_V2 with non-numeric data")
        return None

    frame = pixels.reshape((HEIGHT, WIDTH))

    if np.any(frame < VALID_MIN_TEMP_C) or np.any(frame > VALID_MAX_TEMP_C):
        print("Skipped frame with out-of-range pixels")
        return None

    return {
        "sequence": sequence,
        "timestamp_ms": timestamp_ms,
        "pico_min": pico_min,
        "pico_max": pico_max,
        "pico_mean": pico_mean,
        "hot60_count": hot60_count,
        "hot75_count": hot75_count,
        "bad_pixels": bad_pixels,
        "frame": frame,
    }


# =============================================================================
# Local thermal feature extraction for dashboard display
# =============================================================================

def smooth_frame(frame):
    """Temporal smoothing to reduce flicker and single-frame noise."""
    frame_history.append(frame)
    return np.mean(np.stack(frame_history), axis=0).astype(np.float32)


def spatial_smooth_frame(frame, passes=1):
    """Small 3x3 spatial smoothing for display stability."""
    smoothed = frame.astype(np.float32)

    for _ in range(passes):
        padded = np.pad(smoothed, 1, mode="edge")
        smoothed = (
            padded[0:-2, 0:-2] + 2 * padded[0:-2, 1:-1] + padded[0:-2, 2:] +
            2 * padded[1:-1, 0:-2] + 4 * padded[1:-1, 1:-1] + 2 * padded[1:-1, 2:] +
            padded[2:, 0:-2] + 2 * padded[2:, 1:-1] + padded[2:, 2:]
        ) / 16.0

    return smoothed.astype(np.float32)


def upscale_for_display(frame, scale=VISUAL_UPSCALE_FACTOR):
    """Upscale 24x32 data for a smoother-looking heatmap only."""
    return np.repeat(np.repeat(frame, scale, axis=0), scale, axis=1)


def connected_hotspot_areas(mask):
    """Return connected-component areas from a boolean hot-pixel mask."""
    rows, cols = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    areas = []

    for row in range(rows):
        for col in range(cols):
            if not mask[row, col] or visited[row, col]:
                continue

            stack = [(row, col)]
            visited[row, col] = True
            area = 0

            while stack:
                current_row, current_col = stack.pop()
                area += 1

                for d_row, d_col in NEIGHBOURS_8:
                    next_row = current_row + d_row
                    next_col = current_col + d_col

                    if 0 <= next_row < rows and 0 <= next_col < cols:
                        if mask[next_row, next_col] and not visited[next_row, next_col]:
                            visited[next_row, next_col] = True
                            stack.append((next_row, next_col))

            areas.append(area)

    return areas


def analyse_frame_for_dashboard(frame):
    """
    Local lightweight analysis for visualization only.
    The final AI decision comes from Colab.
    """
    frame = np.asarray(frame, dtype=np.float32)

    if frame.shape != (HEIGHT, WIDTH):
        raise ValueError(f"Expected {(HEIGHT, WIDTH)} frame, got {frame.shape}")

    max_temp = float(np.max(frame))
    mean_temp = float(np.mean(frame))
    min_temp = float(np.min(frame))
    thermal_delta = max_temp - mean_temp

    warning_mask = frame >= WARNING_TEMP_C
    fire_mask = frame >= FIRE_TEMP_C
    critical_mask = frame >= CRITICAL_TEMP_C

    warning_pixel_count = int(np.sum(warning_mask))
    hot_pixel_count = int(np.sum(fire_mask))
    critical_pixel_count = int(np.sum(critical_mask))

    hotspot_areas = connected_hotspot_areas(fire_mask)
    hotspot_count = len(hotspot_areas)
    largest_hotspot_area = max(hotspot_areas) if hotspot_areas else 0
    hotspot_fraction = hot_pixel_count / frame.size
    hotspot_mean_temp = float(np.mean(frame[fire_mask])) if hot_pixel_count > 0 else 0.0

    hottest_y, hottest_x = np.unravel_index(np.argmax(frame), frame.shape)

    confidence_from_area = min(largest_hotspot_area / 20.0, 1.0) * 0.35
    confidence_from_fraction = min(hotspot_fraction / 0.05, 1.0) * 0.30
    confidence_from_peak = min(max(max_temp - FIRE_TEMP_C, 0.0) / 40.0, 1.0) * 0.35
    ir_confidence = round(confidence_from_area + confidence_from_fraction + confidence_from_peak, 4)

    fire_candidate = (
        (largest_hotspot_area >= MIN_FIRE_HOTSPOT_AREA and max_temp >= FIRE_TEMP_C)
        or (hot_pixel_count >= MIN_FIRE_HOT_PIXELS and max_temp >= FIRE_TEMP_C)
        or (hotspot_fraction >= MIN_HOTSPOT_FRACTION and max_temp >= FIRE_TEMP_C)
        or (critical_pixel_count >= 1)
    )

    if fire_candidate:
        status = "LOCAL FIRE CANDIDATE"
    elif warning_pixel_count > 0:
        status = "LOCAL WARNING"
    else:
        status = "LOCAL NORMAL"

    return {
        "fire_candidate": bool(fire_candidate),
        "status": status,
        "ir_confidence": ir_confidence,
        "min_temp_c": round(min_temp, 2),
        "max_temp_c": round(max_temp, 2),
        "mean_temp_c": round(mean_temp, 2),
        "thermal_delta_c": round(thermal_delta, 2),
        "warning_pixel_count": warning_pixel_count,
        "hot_pixel_count": hot_pixel_count,
        "critical_pixel_count": critical_pixel_count,
        "hotspot_count": hotspot_count,
        "largest_hotspot_area": int(largest_hotspot_area),
        "hotspot_fraction": round(hotspot_fraction, 4),
        "hotspot_mean_temp_c": round(hotspot_mean_temp, 2),
        "hotspot_x": int(hottest_x),
        "hotspot_y": int(hottest_y),
    }

def get_laptop_location_via_browser(timeout_seconds=120):
    """
    Opens a local browser page that asks for location permission.
    The browser returns latitude/longitude to this Python script.

    This uses the laptop/browser location, not the Pico location.
    WKT format returned is POINT(longitude latitude).
    """
    location_result = {}

    html = """
    <!DOCTYPE html>
    <html>
    <head>
      <title>EshMagan MLX Location</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 720px;
          margin: 60px auto;
          padding: 24px;
          background: #f8fafc;
          color: #0f172a;
        }
        .card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
        }
        button {
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 12px 18px;
          font-size: 16px;
          cursor: pointer;
        }
        #status {
          margin-top: 18px;
          font-size: 15px;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>EshMagan MLX Sensor Location</h2>
        <p>This page gets the laptop location for the MLX/Pico fire detection demo.</p>
        <p>Allow location permission when the browser asks.</p>
        <button onclick="getLocation()">Get Laptop Location</button>
        <div id="status">Waiting...</div>
      </div>

      <script>
        function getLocation() {
          const status = document.getElementById("status");

          if (!navigator.geolocation) {
            status.innerHTML = "Geolocation is not supported by this browser.";
            return;
          }

          status.innerHTML = "Requesting location permission...";

          navigator.geolocation.getCurrentPosition(
            async function(position) {
              const data = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy_m: position.coords.accuracy
              };

              status.innerHTML =
                "Location received:<br>" +
                "Latitude: " + data.latitude + "<br>" +
                "Longitude: " + data.longitude + "<br>" +
                "Accuracy: " + data.accuracy_m + " meters<br><br>" +
                "Sending location to Python...";

              const response = await fetch("/location", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
              });

              if (response.ok) {
                status.innerHTML += "<br><br>Done. You can close this tab.";
              } else {
                status.innerHTML += "<br><br>Failed to send location.";
              }
            },
            function(error) {
              status.innerHTML = "Location error: " + error.message;
            },
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0
            }
          );
        }

        window.onload = getLocation;
      </script>
    </body>
    </html>
    """

    class LocationHandler(BaseHTTPRequestHandler):
        def log_message(self, format, *args):
            return

        def do_GET(self):
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(html.encode("utf-8"))

        def do_POST(self):
            if self.path != "/location":
                self.send_response(404)
                self.end_headers()
                return

            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)

            try:
                data = json.loads(body.decode("utf-8"))

                latitude = float(data["latitude"])
                longitude = float(data["longitude"])
                accuracy_m = float(data.get("accuracy_m", 0))

                location_result["latitude"] = latitude
                location_result["longitude"] = longitude
                location_result["accuracy_m"] = accuracy_m
                location_result["location_wkt"] = f"POINT({longitude:.7f} {latitude:.7f})"

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"ok": true}')

            except Exception as error:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "ok": False,
                    "error": str(error)
                }).encode("utf-8"))

    server = HTTPServer(("127.0.0.1", 8765), LocationHandler)
    server.timeout = 1

    print("Opening browser to get laptop location...")
    print("Allow location permission in the browser.")
    webbrowser.open("http://127.0.0.1:8765")

    start_time = time.time()

    while time.time() - start_time < timeout_seconds:
        server.handle_request()

        if location_result.get("location_wkt"):
            server.server_close()
            return location_result

    server.server_close()
    raise TimeoutError("Laptop location was not received before timeout.")

# =============================================================================
# Colab AI bridge
# =============================================================================

def send_frame_to_colab_ai(seq, frame, local_stats):
    """
    Sends one 24x32 thermal frame to Google Colab AI.

    Colab responsibilities:
    - Run the AI notebook pipeline.
    - Confirm fire using its own consecutive-frame logic.
    - Call EshMagan backend if fire is confirmed.
    """
    if requests is None:
        return {
            "ok": False,
            "status": "REQUESTS_NOT_INSTALLED",
            "error": "requests is not installed. Run: pip install requests"
        }

    payload = {
        "seq": int(seq),
        "sensor": SENSOR_INFO,
        "pixels": [float(value) for value in frame.reshape(-1).tolist()],
        "stats": {
            "min_temp": float(local_stats["min_temp"]),
            "max_temp": float(local_stats["max_temp"]),
            "mean_temp": float(local_stats["mean_temp"]),
        }
    }

    try:
        response = requests.post(
            COLAB_AI_URL,
            json=payload,
            timeout=AI_REQUEST_TIMEOUT_SECONDS,
        )

        if response.status_code != 200:
            return {
                "ok": False,
                "status": "AI_HTTP_ERROR",
                "error": response.text[:500]
            }

        return response.json()

    except Exception as error:
        return {
            "ok": False,
            "status": "AI_CONNECTION_ERROR",
            "error": str(error)
        }


def format_ai_result(ai_result):
    """Create a short readable summary from the Colab response."""
    if not ai_result or not ai_result.get("ok"):
        return "AI=ERROR"

    backend_info = ai_result.get("backend", {})
    backend_triggered = backend_info.get("triggered", False)
    backend_reason = backend_info.get("reason", "no_reason")
    backend_error = backend_info.get("error", "")
    route_count = backend_info.get("evacuation_route_count", 0)
    routes_generated = backend_info.get("evacuation_routes_generated", False)
    
    return (
        f"AI={ai_result.get('status', 'UNKNOWN')} | "
        f"Prob={ai_result.get('final_probability', 0):.3f} | "
        f"Alert={ai_result.get('alert_level', 'UNKNOWN')} | "
        f"Votes={ai_result.get('confirmation_votes', 0)}/"
        f"{ai_result.get('confirmation_required', 3)} | "
        f"Backend={backend_triggered} | "
        f"Reason={backend_reason} | "
        f"Error={backend_error} | "
        f"Routes={route_count} | "
        f"Generated={routes_generated}"
    )


# =============================================================================
# Main dashboard loop
# =============================================================================

def main():
    global valid_frames, skipped_frames, ai_success_count, ai_error_count, backend_trigger_count, last_ai_result

    print(f"Opening {PORT}...")
    print(f"Colab AI URL: {COLAB_AI_URL}")
    
    global SENSOR_INFO

    try:
        location = get_laptop_location_via_browser()

        SENSOR_INFO["latitude"] = location["latitude"]
        SENSOR_INFO["longitude"] = location["longitude"]
        SENSOR_INFO["accuracy_m"] = location["accuracy_m"]
        SENSOR_INFO["location_wkt"] = location["location_wkt"]

        print("Laptop location received:")
        print(f"  Latitude : {SENSOR_INFO['latitude']}")
        print(f"  Longitude: {SENSOR_INFO['longitude']}")
        print(f"  Accuracy : {SENSOR_INFO['accuracy_m']} meters")
        print(f"  WKT      : {SENSOR_INFO['location_wkt']}")

    except Exception as error:
        print("Could not get laptop location:", error)
        print("Stopping because fire location must be dynamic.")
        return
    
    print("Dashboard will NOT call backend directly.")
    print("Colab AI is responsible for backend trigger.")
    print("Waiting for frames...")

    serial_port = serial.Serial(PORT, BAUD_RATE, timeout=2)

    plt.ion()
    figure, axis = plt.subplots()

    image = axis.imshow(
        np.zeros((HEIGHT * VISUAL_UPSCALE_FACTOR, WIDTH * VISUAL_UPSCALE_FACTOR), dtype=np.float32),
        cmap=HEATMAP_COLORMAP,
        vmin=DISPLAY_MIN_FALLBACK,
        vmax=DISPLAY_MAX_FALLBACK,
        interpolation="lanczos",
    )

    hot_marker, = axis.plot([], [], "wo", markersize=8, markeredgecolor="black")
    colorbar = plt.colorbar(image, ax=axis)
    colorbar.set_label("Temperature °C")

    axis.set_xlabel("Upscaled thermal X view")
    axis.set_ylabel("Upscaled thermal Y view")
    axis.set_title("Waiting for EshMagan MLX frames...")

    while True:
        raw_line = serial_port.readline()

        if not raw_line:
            continue

        line = raw_line.decode("utf-8", errors="ignore")
        parsed = parse_frame_v2(line)

        if parsed is None:
            skipped_frames += 1
            continue

        valid_frames += 1

        # Keep raw frame for AI. Use smoothed frame for display.
        raw_frame = parsed["frame"]

        display_source_frame = smooth_frame(raw_frame)
        display_source_frame = spatial_smooth_frame(display_source_frame, SPATIAL_SMOOTHING_PASSES)
        display_frame = upscale_for_display(display_source_frame)

        local_thermal = analyse_frame_for_dashboard(display_source_frame)

        local_stats = {
            "min_temp": float(np.min(raw_frame)),
            "max_temp": float(np.max(raw_frame)),
            "mean_temp": float(np.mean(raw_frame)),
        }

        if valid_frames % SEND_EVERY_N_FRAMES_TO_AI == 0:
            ai_result = send_frame_to_colab_ai(
                parsed["sequence"],
                raw_frame,
                local_stats,
            )

            if ai_result.get("ok"):
                ai_success_count += 1
                last_ai_result = ai_result

                backend_info = ai_result.get("backend", {})
                if backend_info.get("triggered", False):
                    backend_trigger_count += 1

                print(
                    f"Frame {parsed['sequence']} | "
                    f"Local={local_thermal['status']} | "
                    f"max={local_thermal['max_temp_c']}°C | "
                    f"mean={local_thermal['mean_temp_c']}°C | "
                    f"area={local_thermal['largest_hotspot_area']} | "
                    f"hot_px={local_thermal['hot_pixel_count']} | "
                    f"{format_ai_result(ai_result)}"
                )

            else:
                ai_error_count += 1
                print(
                    f"Frame {parsed['sequence']} | "
                    f"Local={local_thermal['status']} | "
                    f"Colab AI error: {ai_result.get('status')} | "
                    f"{ai_result.get('error')}"
                )

        display_min = max(DISPLAY_MIN_FALLBACK, local_thermal["min_temp_c"] - DISPLAY_PADDING_C)
        display_max = max(DISPLAY_MAX_FALLBACK, local_thermal["max_temp_c"] + DISPLAY_PADDING_C)

        image.set_data(display_frame)
        image.set_clim(display_min, display_max)

        hot_marker.set_data(
            [local_thermal["hotspot_x"] * VISUAL_UPSCALE_FACTOR + VISUAL_UPSCALE_FACTOR / 2],
            [local_thermal["hotspot_y"] * VISUAL_UPSCALE_FACTOR + VISUAL_UPSCALE_FACTOR / 2],
        )

        ai_status = last_ai_result.get("status", "WAITING_FOR_AI")
        ai_probability = last_ai_result.get("final_probability", 0.0)
        ai_alert = last_ai_result.get("alert_level", "UNKNOWN")
        ai_votes = last_ai_result.get("confirmation_votes", 0)
        ai_required = last_ai_result.get("confirmation_required", 3)
        ai_backend = last_ai_result.get("backend", {}).get("triggered", False)

        axis.set_title(
            f"{local_thermal['status']} | "
            f"Max {local_thermal['max_temp_c']:.1f}°C | "
            f"Mean {local_thermal['mean_temp_c']:.1f}°C | "
            f"Area {local_thermal['largest_hotspot_area']} | "
            f"Hot px {local_thermal['hot_pixel_count']} | "
            f"AI {ai_status} | "
            f"Prob {ai_probability:.2f} | "
            f"Alert {ai_alert} | "
            f"Votes {ai_votes}/{ai_required} | "
            f"Backend {ai_backend} | "
            f"Sent {ai_success_count} | Errors {ai_error_count}"
        )

        plt.pause(0.01)


if __name__ == "__main__":
    main()