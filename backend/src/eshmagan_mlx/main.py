from machine import Pin, UART
import time

# =============================================================================
# EshMagan MLX90640 Pico Gateway
# Board: Raspberry Pi Pico / RP2040 running MicroPython
# Sensor module: GY-MCU90640 over UART
#
# Wiring:
#   GY-MCU90640 VIN -> Pico 3V3(OUT)
#   GY-MCU90640 GND -> Pico GND
#   GY-MCU90640 TX  -> Pico GP1 / UART0 RX
#   GY-MCU90640 RX  -> Pico GP0 / UART0 TX
#
# Output format over Pico USB serial:
#   STATUS_V2,<seq>,<ms>,<accepted>,<rejected>,<message>
#   FRAME_V2,<seq>,<ms>,<min_centi>,<max_centi>,<mean_centi>,<hot60_count>,<hot75_count>,<bad_pixel_count>,<768 centi-celsius pixels>
#
# Why centi-celsius integers?
#   2356 means 23.56°C. This is smaller, faster, and safer for AI parsing than
#   printing 768 floating point strings on a microcontroller.
# =============================================================================

SENSOR_UART_ID = 0
SENSOR_BAUD_RATE = 115200
SENSOR_TX_PIN = 0
SENSOR_RX_PIN = 1

HEADER_1 = 0x5A
HEADER_2 = 0x5A
FRAME_PAYLOAD_LENGTH = 1538
TOTAL_FRAME_LENGTH = 4 + FRAME_PAYLOAD_LENGTH
PIXEL_COUNT = 768
TEMP_DATA_LENGTH = PIXEL_COUNT * 2
WIDTH = 32
HEIGHT = 24

MIN_VALID_CENTI = -4000      # -40.00°C
MAX_VALID_CENTI = 12500      # 125.00°C
MIN_ACCEPTED_PIXELS = 760
MAX_BAD_PIXELS = PIXEL_COUNT - MIN_ACCEPTED_PIXELS

HOT_WARNING_CENTI = 6000     # 60.00°C, matches notebook thermal hot threshold
HOT_CRITICAL_CENTI = 7500    # 75.00°C, matches notebook critical threshold

MAX_BUFFER_BYTES = TOTAL_FRAME_LENGTH * 4
READ_SLEEP_SEC = 0.003
STATUS_EVERY_MS = 5000

uart = UART(
    SENSOR_UART_ID,
    baudrate=SENSOR_BAUD_RATE,
    tx=Pin(SENSOR_TX_PIN),
    rx=Pin(SENSOR_RX_PIN),
)

buffer = bytearray()
sequence = 0
accepted_frames = 0
rejected_frames = 0
last_status_ms = time.ticks_ms()


def ticks_ms():
    return time.ticks_ms()


def read_signed_16_little_endian(low_byte, high_byte):
    value = low_byte | (high_byte << 8)

    if value >= 32768:
        value -= 65536

    return value


def find_header(data):
    limit = len(data) - 1

    for index in range(limit):
        if data[index] == HEADER_1 and data[index + 1] == HEADER_2:
            return index

    return -1


def trim_buffer_to_header():
    global buffer

    header_index = find_header(buffer)

    if header_index == -1:
        buffer = bytearray()
        return False

    if header_index > 0:
        buffer = buffer[header_index:]

    return True


def parse_frame_to_centi(frame):
    pixels = []
    bad_pixels = 0
    hot60_count = 0
    hot75_count = 0
    total = 0
    min_value = 32767
    max_value = -32768

    index = 4
    end_index = 4 + TEMP_DATA_LENGTH

    while index + 1 < end_index:
        value = read_signed_16_little_endian(frame[index], frame[index + 1])
        pixels.append(value)

        if value < MIN_VALID_CENTI or value > MAX_VALID_CENTI:
            bad_pixels += 1
        else:
            total += value

            if value < min_value:
                min_value = value

            if value > max_value:
                max_value = value

            if value >= HOT_WARNING_CENTI:
                hot60_count += 1

            if value >= HOT_CRITICAL_CENTI:
                hot75_count += 1

        index += 2

    good_pixels = PIXEL_COUNT - bad_pixels

    if good_pixels <= 0:
        mean_value = 0
    else:
        mean_value = int(total / good_pixels)

    return {
        "pixels": pixels,
        "bad_pixels": bad_pixels,
        "good_pixels": good_pixels,
        "min_value": min_value,
        "max_value": max_value,
        "mean_value": mean_value,
        "hot60_count": hot60_count,
        "hot75_count": hot75_count,
    }


def is_accepted(parsed):
    if parsed["bad_pixels"] > MAX_BAD_PIXELS:
        return False

    center_index = 12 * WIDTH + 16
    center_value = parsed["pixels"][center_index]

    if center_value < MIN_VALID_CENTI or center_value > MAX_VALID_CENTI:
        return False

    return True


def emit_status(message):
    print(
        "STATUS_V2,{},{},{},{},{}".format(
            sequence,
            ticks_ms(),
            accepted_frames,
            rejected_frames,
            message,
        )
    )


def emit_frame(parsed):
    header = [
        "FRAME_V2",
        str(sequence),
        str(ticks_ms()),
        str(parsed["min_value"]),
        str(parsed["max_value"]),
        str(parsed["mean_value"]),
        str(parsed["hot60_count"]),
        str(parsed["hot75_count"]),
        str(parsed["bad_pixels"]),
    ]

    body = [str(value) for value in parsed["pixels"]]
    print(",".join(header + body))


emit_status("PICO_READY")

while True:
    incoming = uart.read()

    if incoming:
        buffer = buffer + incoming

    if len(buffer) > MAX_BUFFER_BYTES:
        if not trim_buffer_to_header():
            rejected_frames += 1
            time.sleep(READ_SLEEP_SEC)
            continue

    if len(buffer) < TOTAL_FRAME_LENGTH:
        now = ticks_ms()

        if time.ticks_diff(now, last_status_ms) >= STATUS_EVERY_MS:
            last_status_ms = now
            emit_status("WAITING_FOR_SENSOR_FRAME")

        time.sleep(READ_SLEEP_SEC)
        continue

    if not trim_buffer_to_header():
        rejected_frames += 1
        time.sleep(READ_SLEEP_SEC)
        continue

    if len(buffer) < TOTAL_FRAME_LENGTH:
        time.sleep(READ_SLEEP_SEC)
        continue

    payload_length = buffer[2] | (buffer[3] << 8)

    if payload_length != FRAME_PAYLOAD_LENGTH:
        buffer = buffer[1:]
        rejected_frames += 1
        continue

    raw_frame = buffer[:TOTAL_FRAME_LENGTH]
    buffer = buffer[TOTAL_FRAME_LENGTH:]

    parsed_frame = parse_frame_to_centi(raw_frame)

    if not is_accepted(parsed_frame):
        rejected_frames += 1
        continue

    sequence += 1
    accepted_frames += 1
    emit_frame(parsed_frame)
