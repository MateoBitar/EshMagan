# EshMagan MLX90640 → Colab AI → Backend Integration Summary

## 1. What We Built and Fixed

We connected the full live fire-detection flow:

```text
MLX90640 thermal camera
→ Raspberry Pi Pico
→ laptop thermal_dashboard_ai.py
→ Google Colab AI server
→ trained AI fire detection pipeline
→ backend GraphQL mutation
→ fire creation
→ evacuation route generation
→ NATS alerts/notifications
→ frontend dashboards
```

The laptop script does **not** call the backend directly. It only:

1. Opens the Pico serial port.
2. Reads thermal frames.
3. Shows the live heatmap.
4. Gets the laptop location.
5. Sends each thermal frame to the Colab AI API.

Colab is responsible for deciding if a fire is confirmed and then calling the backend.

---

## 2. Wiring

Use this wiring for the GY-MCU90640 UART module connected to the Raspberry Pi Pico:

```text
GY-MCU90640 VIN -> Pico 3V3(OUT)
GY-MCU90640 GND -> Pico GND
GY-MCU90640 TX  -> Pico GP1 / UART0 RX
GY-MCU90640 RX  -> Pico GP0 / UART0 TX
```

Important notes:

```text
The module TX goes to Pico RX.
The module RX goes to Pico TX.
Use 3.3V from Pico, not 5V.
Only one program can use COM4 at the same time.
Close MicroPico Serial Monitor before running thermal_dashboard_ai.py.
```

---

## 3. Project Files

```text
main.py
```

Runs on the Raspberry Pi Pico. It reads the GY-MCU90640 / MLX90640 UART thermal frames and prints clean `FRAME_V2` lines over USB serial.

```text
thermal_dashboard_ai.py
```

Runs on the laptop/Raspberry Pi gateway. It opens COM4 once, reads Pico frames, displays the live heatmap, gets laptop location, and sends each valid frame to the Colab AI API.

```text
EshMagan_Ai.ipynb
```

Runs on Google Colab. It hosts the AI server, runs the trained fire detection pipeline, generates common evacuation routes, and calls the backend.

```text
backend/
```

Runs locally on the laptop. It receives the GraphQL mutation through ngrok, creates/updates fires, publishes NATS events, creates alerts/notifications, and exposes data to the frontend.

Important: `thermal_dashboard_ai.py` replaces the old idea of running `heat_viewer.py` and `edge_ai_detector.py` separately. Only one program should use COM4.

---

## 4. Backend URL and GraphQL Mutation

The backend runs locally on:

```text
PORT=5000
```

The backend GraphQL endpoint locally is:

```text
http://localhost:5000/eshmagan
```

But Colab cannot call `localhost` on your laptop directly, so ngrok exposes it as:

```text
https://broadband-pelvis-jigsaw.ngrok-free.dev/eshmagan
```

The Colab AI calls this backend GraphQL mutation after fire confirmation:

```graphql
mutation CreateFireAndTriggerSystem($input: CreateFireInput!) {
  createFireAndTriggerSystem(input: $input) {
    fire_id
    fire_source
    fire_location
    fire_severitylevel
    is_extinguished
    is_verified
    created_at
    updated_at
  }
}
```

The backend service then calls:

```js
fireService.createFireAndTriggerSystem(input)
```

That creates or updates a fire, dispatches a responder if needed, publishes `assignmentCreated`, publishes `fireDetected`, and the downstream subscribers create alerts and notifications.

Important: the laptop dashboard does **not** call this mutation directly anymore. Colab calls it after AI confirmation.

---


## 2. Temperature and Detection Thresholds

### Local thermal dashboard thresholds

These values are used by the local dashboard for visualization/status only:

```python
WARNING_TEMP_C = 35.0
FIRE_TEMP_C = 43.0
CRITICAL_TEMP_C = 50.0
```

Meaning:

```text
35°C+  → local warning
43°C+  → local fire candidate
50°C+  → local critical heat candidate
```

### Colab AI thermal thresholds

In the Colab AI notebook, the main thermal thresholds are:

```python
THERMAL_HOT_THRESHOLD_C = 43.0
THERMAL_CRITICAL_MAX_C = 50.0
MIN_HOTSPOT_AREA = 2
MIN_HOTSPOT_FRACTION = 0.003
```

Practical candle-demo behavior:

```text
Around 43°C+ with a small heat cluster → fire evidence starts
Around 50°C+ with at least 2 connected hot pixels → strong fire evidence
50–55°C+ with stable area/hot pixels → should become HIGH/CRITICAL
```

The backend fire trigger is **not based on only one temperature value**. It depends on:

```text
max temperature
hotspot area
hot pixel count
IR confidence
AI/model probability
confirmation votes
```

---

## 3. Camera Weight vs Weather Weight

We changed the AI so the camera/thermal evidence has more importance than weather.

Before, the neural model mixed weather + thermal features, and weather could keep the final probability lower.

Now the final probability is camera-first:

```text
75% camera / MLX thermal evidence
25% neural model / weather-fusion output
```

The thermal camera score is based on:

```text
max temperature
hotspot area
hot pixel count
IR confidence
```

So the MLX heatmap now dominates the detection decision, which is better for the live candle demo.

---

## 4. Confirmation Votes

We kept:

```python
CONFIRMATION_FRAMES = 3
```

So the backend triggers only after 3 confirmed fire frames.

Expected terminal progression:

```text
Votes=1/3
Votes=2/3
Votes=3/3
AI=FIRE_CONFIRMED
```

The important success line is:

```text
AI=FIRE_CONFIRMED | Reason=backend_trigger_started_async
```

---

## 5. Threading / Async Backend Trigger

This was the major latency fix.

### Old blocking flow

Before, Colab did this inside one request:

```text
receive frame
→ run AI
→ confirm fire
→ generate evacuation routes
→ call backend
→ wait for backend
→ return response to laptop
```

That made the dashboard feel delayed. It looked like alerts appeared only after removing the flame because the request was blocked while Colab generated routes and called the backend.

### New async flow

Now, once the fire is confirmed, Colab starts a background thread:

```python
threading.Thread(
    target=run_backend_trigger_async,
    args=(ai_result.copy(), sensor_info.copy()),
    daemon=True,
).start()
```

So `/analyze_frame` returns quickly with:

```text
Reason=backend_trigger_started_async
```

Then Colab continues in the background:

```text
create fire
generate common evacuation routes
send them to backend
publish alerts
```

This keeps the live thermal stream responsive while backend work continues.

---

## 6. Dynamic Fire Location

We removed the static fire location.

Now the local dashboard opens a browser page that asks for location permission. It gets:

```text
latitude
longitude
accuracy
location_wkt = POINT(longitude latitude)
```

Then every thermal frame sent to Colab includes:

```python
"sensor": SENSOR_INFO
```

So Colab creates the backend fire at the laptop/Pico location instead of a hardcoded point.

---

## 7. Evacuation Route Behavior

The AI generates **common fire-level evacuation routes**, not per-user resident routes.

The AI route generation is based on:

```text
fire location
fire radius
predicted spread direction
FWI score
nearby road network
safe zones
```

The resident frontend then uses OSRM for the personalized route:

```text
resident current location → selected safe zone
```

So the architecture is:

```text
Colab AI = common evacuation options and safe zones
Frontend OSRM = personalized resident route
```

This is the correct setup.


## 8. Full Run Guide

### Step 1 — Start the backend

Open PowerShell in the backend folder:

```powershell
cd C:\Projects\EshMagan\backend
npm run dev
```

or:

```powershell
node server.js
```

Keep this terminal open.

Expected:

```text
Server running on port 5000
NATS connected
All subscribers started
```

---

### Step 2 — Start ngrok for backend

Open a second PowerShell:

```powershell
ngrok http --domain=broadband-pelvis-jigsaw.ngrok-free.dev 5000
```

Keep this terminal open.

Backend GraphQL URL:

```text
https://broadband-pelvis-jigsaw.ngrok-free.dev/eshmagan
```

---

### Step 3 — Run the Colab notebook

In Google Colab:

```text
Runtime → Restart runtime
```

Then run the notebook from top to bottom.

Make sure the final API server cell is at the end of the notebook and run it last.

It should print:

```text
Colab AI server started.
Public URL:
https://something.trycloudflare.com

Copy this into your local thermal dashboard:
https://something.trycloudflare.com/analyze_frame
```

Copy the full `/analyze_frame` URL.

---

### Step 4 — Test Colab health

Open this in the browser:

```text
https://something.trycloudflare.com/health
```

Expected response:

```json
{"message":"EshMagan Colab AI server is running","status":"ok"}
```

Do not run the dashboard until `/health` works.

---

### Step 5 — Upload/run Pico code

Upload:

```text
main.py
```

to the Pico as:

```text
/main.py
```

Then:

```text
Disconnect MicroPico serial monitor.
Close anything using COM4.
Replug Pico normally if needed.
```

---

### Step 6 — Make sure Pico is free

Close:

```text
MicroPico serial monitor
old thermal dashboard terminal
anything using COM4
```

Only one process can use COM4 at a time.

---

### Step 7 — Run thermal dashboard

Open PowerShell in:

```powershell
cd C:\Projects\EshMagan\backend\src\eshmagan_mlx
```

Run:

```powershell
python thermal_dashboard_ai.py
```

Paste the Colab URL:

```text
https://something.trycloudflare.com/analyze_frame
```

Allow browser location.

Expected output:

```text
Laptop location received:
WKT: POINT(...)
Dashboard will NOT call backend directly.
Colab AI is responsible for backend trigger.
Waiting for frames...
```

---

### Step 8 — Candle test

Put the candle/heat source in front of the MLX.

Expected progression:

```text
LOCAL WARNING
LOCAL FIRE CANDIDATE
Alert=HIGH or CRITICAL
Votes=1/3
Votes=2/3
Votes=3/3
AI=FIRE_CONFIRMED
Reason=backend_trigger_started_async
```

Then wait a few seconds.

In Colab output, you should see:

```text
Async backend trigger result:
```

In backend/frontend, you should see:

```text
new fire created
alerts created
evacuation routes created
resident dashboard shows evacuation options
```

---

## 9. Full Terminal Checklist

You should have these running:

```text
Terminal 1: backend server
Terminal 2: ngrok backend tunnel
Colab: final AI Flask/Cloudflare server cell
Terminal 3: thermal_dashboard_ai.py
Browser: frontend dashboard
```

---

## 10. What Success Looks Like

Best successful terminal line:

```text
AI=FIRE_CONFIRMED | Alert=CRITICAL | Votes=3/3 | Reason=backend_trigger_started_async
```

Then after a few seconds:

```text
fire appears in database
fire alert appears in app
evacuation routes appear
```

That means the full pipeline is working.

---

## 11. Common Problems

### COM4 access denied

Cause:

```text
MicroPico serial monitor or another Python process is using COM4.
```

Fix:

```text
Close MicroPico serial monitor.
Stop old thermal_dashboard_ai.py.
Replug Pico.
Run again.
```

---

### Cloudflare link not reachable

Cause:

```text
Colab tunnel died or old URL is being used.
```

Fix:

```text
Rerun final Colab API server cell.
Copy the new /analyze_frame URL.
Test /health first.
```

---

### Backend not triggered immediately

Expected now:

```text
Reason=backend_trigger_started_async
```

This means Colab started backend work in the background. Wait a few seconds and check Colab output for:

```text
Async backend trigger result:
```

---

### Routes are 0

Possible causes:

```text
OSMnx route generation failed.
Road network was unavailable.
Safe zones could not be reached.
```

Check Colab output for route generation errors.
