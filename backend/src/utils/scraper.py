import requests
from datetime import datetime
import pytz

api_url = "https://www.weatherlink.com/embeddablePage/getData/80f6b8d1b7cc4791b2ec9245ef25f522"
response = requests.get(api_url)
data = response.json()

# Helper function to convert ms timestamps to readable time
def format_time(ms_timestamp, tz_name="Asia/Beirut"):
    if ms_timestamp is None:
        return "N/A"
    tz = pytz.timezone(tz_name)
    dt = datetime.fromtimestamp(ms_timestamp / 1000, tz)
    return dt.strftime("%Y-%m-%d %H:%M:%S")

print("+ Location:", data["systemLocation"])
print("+ Time Zone:", data["timeZoneId"])
print()

# Temperature section
print("+ Temperature Report")
print("     Current:", data["temperature"], "°C")
print("     Feels like:", data["temperatureFeelLike"], "°C")
print("     High:", data["hiTemp"], "°C at", format_time(data["hiTempDate"], data["timeZoneId"]))
print("     Low:", data["loTemp"], "°C at", format_time(data["loTempDate"], data["timeZoneId"]))
print()

# Wind section
print("+ Wind Report")
print("     Wind speed:", data["wind"], data["windUnits"])
print("     Gust:", data["gust"], data["windUnits"], "at", format_time(data["gustAt"], data["timeZoneId"]))
print("     Direction:", data["windDirection"], "°")
print()

# Humidity section
print("+ Humidity Report")
print("     Humidity:", data["humidity"], "%")
print()

# Rain section
print("+ Rain Report")
print("     Rain today:", data["rain"], data["rainUnits"])
print("     Seasonal rain:", data["seasonalRain"], data["rainUnits"])
print()

# Barometer section
print("+ Barometer Report")
print("     Pressure:", data["barometer"], data["barometerUnits"])
print("     Trend:", data["barometerTrend"])
print()

# Forecast section
print("+ Forecast Overview")
for day in data["forecastOverview"]:
    print("     Date:", day["date"])
    print("     Morning:", day["morning"]["temp"], "°C,", day["morning"]["weatherDesc"])
    print("     Afternoon:", day["afternoon"]["temp"], "°C,", day["afternoon"]["weatherDesc"])
    print("     Evening:", day["evening"]["temp"], "°C,", day["evening"]["weatherDesc"])
    print("     Night:", day["night"]["temp"], "°C,", day["night"]["weatherDesc"])
    print()