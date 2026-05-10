import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import styles, { C } from '../../styles/screens/IncidentDetailsScreen.styles';
import {
  gqlFetch,
  GET_FIRE,
  GET_ASSIGNMENTS_BY_FIRE,
  GET_ALERTS_BY_FIRE,
} from '../../services/api';

const ASSETS = {
  flame: Platform.select({
    web: { uri: '/flame_solid.png' },
    android: { uri: 'flame_solid' },
    ios: { uri: 'flame_solid' },
    default: { uri: 'flame_solid' },
  }),
}

// ---------------------------------------------------------------------------
// UPDATE THIS when your Cloudflare tunnel restarts
// ---------------------------------------------------------------------------
const COLAB_BASE_URL = 'https://quotations-actual-handmade-garmin.trycloudflare.com';

// ---------------------------------------------------------------------------
// FireLab
// ---------------------------------------------------------------------------
const FIRELAB_PDF_URLS = {
  Mf: 'https://firelab.balamand.edu.lb/FireLabWeb/Content/PDF/Mf/Fire_Danger_ForeCast_Report_{date}.pdf',
  Ecmwf: 'https://firelab.balamand.edu.lb/FireLabWeb/Content/PDF/Ecmwf/Fire_Danger_ForeCast_Report_{date}.pdf',
};

const FIRELAB_RISK_LABELS = {
  NR: 'No Risk',
  VL: 'Very Low',
  L: 'Low',
  M: 'Moderate',
  H: 'High',
  VH: 'Very High',
  E: 'Extreme',
};

const FIRELAB_RISK_COLORS = {
  NR: '#94a3b8',
  VL: '#64748b',
  L: '#16a34a',
  M: '#d97706',
  H: '#ea580c',
  VH: '#dc2626',
  E: '#7c3aed',
};

const GOVERNORATE_CENTROIDS = {
  'North Lebanon': { lat: 34.3733, lng: 35.8317 },
  Akkar: { lat: 34.55, lng: 36.15 },
  'Baalbek-Hermel': { lat: 34.0, lng: 36.2167 },
  Bekaa: { lat: 33.8462, lng: 35.902 },
  'Mount Lebanon': { lat: 33.8333, lng: 35.75 },
  Beirut: { lat: 33.8886, lng: 35.5017 },
  'South Lebanon': { lat: 33.2667, lng: 35.3667 },
  Nabatieh: { lat: 33.3792, lng: 35.4833 },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function safeParseJson(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getSeverityColor(level) {
  if (!level) return '#94a3b8';
  if (level >= 8) return '#dc2626';
  if (level >= 6) return '#ea580c';
  if (level >= 3) return '#d97706';
  return '#16a34a';
}

function getSeverityLabel(level) {
  if (!level) return 'Unknown';
  if (level >= 8) return 'Critical';
  if (level >= 6) return 'High';
  if (level >= 3) return 'Moderate';
  return 'Low';
}

function parseDateValue(value) {
  if (!value) return null;

  // Backend returns timestamps like "1778357762761"
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const num = Number(value);

    // 13 digits = milliseconds, 10 digits = seconds
    return new Date(value.length === 10 ? num * 1000 : num);
  }

  if (typeof value === 'number') {
    return new Date(value < 10000000000 ? value * 1000 : value);
  }

  return new Date(value);
}

function formatDateTime(value) {
  if (!value) return 'N/A';

  try {
    const d = parseDateValue(value);
    if (!d || isNaN(d.getTime())) return 'N/A';

    return d.toLocaleString();
  } catch {
    return 'N/A';
  }
}

function formatTime(value) {
  if (!value) return 'N/A';

  try {
    const d = parseDateValue(value);
    if (!d || isNaN(d.getTime())) return 'N/A';

    return d.toLocaleTimeString();
  } catch {
    return 'N/A';
  }
}

function getFireCreatedAt(fire) {
  return (
    fire?.created_at ??
    fire?.fire_created_at ??
    fire?.detected_at ??
    fire?.createdAt ??
    fire?.timestamp ??
    null
  );
}

function getFireUpdatedAt(fire) {
  return (
    fire?.updated_at ??
    fire?.fire_updated_at ??
    fire?.updatedAt ??
    fire?.last_updated ??
    null
  );
}

function fmt(value, suffix = '') {
  if (value === null || value === undefined || value === '' || value === 'N/A') {
    return null;
  }

  return `${value}${suffix}`;
}

function fmtPercent(value) {
  if (value === null || value === undefined) return null;

  const n = Number(value);
  if (isNaN(n)) return null;

  return n <= 1 ? `${(n * 100).toFixed(0)}%` : `${n.toFixed(0)}%`;
}

function todayStr() {
  const d = new Date();

  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function toneStyles(tone) {
  const map = {
    orange: {
      bg: 'rgba(249,115,22,0.09)',
      border: 'rgba(249,115,22,0.25)',
      accent: '#ea580c',
    },
    rose: {
      bg: 'rgba(244,114,182,0.09)',
      border: 'rgba(244,114,182,0.22)',
      accent: '#e11d48',
    },
    blue: {
      bg: 'rgba(59,130,246,0.09)',
      border: 'rgba(59,130,246,0.22)',
      accent: '#2563eb',
    },
    gold: {
      bg: 'rgba(245,158,11,0.09)',
      border: 'rgba(245,158,11,0.26)',
      accent: '#d97706',
    },
    green: {
      bg: 'rgba(16,185,129,0.09)',
      border: 'rgba(16,185,129,0.26)',
      accent: '#059669',
    },
    purple: {
      bg: 'rgba(139,92,246,0.09)',
      border: 'rgba(139,92,246,0.24)',
      accent: '#7c3aed',
    },
    scarlet: {
      bg: 'rgba(220,38,38,0.09)',
      border: 'rgba(220,38,38,0.24)',
      accent: '#dc2626',
    },
    slate: {
      bg: 'rgba(148,163,184,0.09)',
      border: 'rgba(148,163,184,0.26)',
      accent: '#64748b',
    },
    teal: {
      bg: 'rgba(20,184,166,0.09)',
      border: 'rgba(20,184,166,0.24)',
      accent: '#0d9488',
    },
    amber: {
      bg: 'rgba(251,191,36,0.09)',
      border: 'rgba(251,191,36,0.24)',
      accent: '#b45309',
    },
  };

  return map[tone] || map.slate;
}

// ---------------------------------------------------------------------------
// Geo parsing
// ---------------------------------------------------------------------------
function parsePoint(value) {
  if (!value) return null;

  if (typeof value === 'object') {
    const lat = Number(value.latitude ?? value.lat ?? value.y ?? value?.coordinates?.[1]);
    const lng = Number(
      value.longitude ?? value.lng ?? value.lon ?? value.x ?? value?.coordinates?.[0]
    );

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  const parsed = safeParseJson(value);

  if (parsed?.type === 'Point' && Array.isArray(parsed.coordinates)) {
    const lat = Number(parsed.coordinates[1]);
    const lng = Number(parsed.coordinates[0]);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  const match = String(value).match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);

  if (match) {
    const lng = Number(match[1]);
    const lat = Number(match[2]);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// AI payload extraction
// ---------------------------------------------------------------------------
function extractAiPayload(fire) {
  if (!fire) return {};

  const candidates = [
    fire.ai_output,
    fire.prediction_payload,
    fire.fire_ai_output,
    fire.fire_metadata,
    fire.analysis,
    fire.ai_result,
    fire.ai_payload,
    fire.sensor_analysis,
    fire.prediction,
    fire.metadata,
  ];

  for (const c of candidates) {
    const p = safeParseJson(c);

    if (p && typeof p === 'object' && Object.keys(p).length > 0) {
      return p;
    }
  }

  return {};
}

function extractWeather(ai, fire) {
  for (const c of [
    safeParseJson(ai.weather_data),
    safeParseJson(fire?.weather_data),
    safeParseJson(fire?.weather),
  ]) {
    if (c && typeof c === 'object' && Object.keys(c).length > 0) {
      return c;
    }
  }

  return {};
}

function extractThermal(ai, fire) {
  for (const c of [
    safeParseJson(ai.thermal_analysis),
    safeParseJson(ai.thermal),
    safeParseJson(fire?.thermal_analysis),
    safeParseJson(fire?.sensor_analysis),
  ]) {
    if (c && typeof c === 'object' && Object.keys(c).length > 0) {
      return c;
    }
  }

  return {};
}

function extractBehavior(ai, fire) {
  for (const c of [
    safeParseJson(ai.predicted_behavior),
    safeParseJson(fire?.predicted_behavior),
    safeParseJson(fire?.behavior_data),
  ]) {
    if (c && typeof c === 'object' && Object.keys(c).length > 0) {
      return c;
    }
  }

  return {};
}

function extractFireRadius(fire, thermal) {
  if (fire?.fire_radius_m && Number.isFinite(Number(fire.fire_radius_m))) {
    return Number(fire.fire_radius_m);
  }

  if (fire?.radius && Number.isFinite(Number(fire.radius))) {
    return Number(fire.radius);
  }

  const maxTemp = Number(thermal?.max_temp_c);

  if (Number.isFinite(maxTemp) && maxTemp > 33) {
    return Math.min(900, Math.max(300, (maxTemp - 55) * 8 + 300));
  }

  const sev = Number(fire?.fire_severitylevel);

  if (Number.isFinite(sev)) {
    return Math.max(200, sev * 60);
  }

  return 200;
}

function extractSpreadDeg(behavior, weather) {
  const v = behavior?.wind_direction_deg ?? behavior?.spread_direction_deg ?? weather?.wind_dir;

  if (v !== null && v !== undefined && Number.isFinite(Number(v))) {
    return Number(v);
  }

  return null;
}

function guessGovernoratFromCoords(coords) {
  if (!coords) return 'North Lebanon';

  let best = 'North Lebanon';
  let bestDist = Infinity;

  for (const [name, c] of Object.entries(GOVERNORATE_CENTROIDS)) {
    const d = Math.hypot(coords.lat - c.lat, coords.lng - c.lng);

    if (d < bestDist) {
      bestDist = d;
      best = name;
    }
  }

  return best;
}

// ---------------------------------------------------------------------------
// Leaflet injection
// ---------------------------------------------------------------------------
let _leafletInjected = false;
let _leafletReady = false;
const _leafletQueue = [];

function ensureLeaflet(cb) {
  if (typeof window === 'undefined') return;

  if (_leafletReady && window.L) {
    cb();
    return;
  }

  _leafletQueue.push(cb);

  if (_leafletInjected) return;

  _leafletInjected = true;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(css);

  const js = document.createElement('script');
  js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

  js.onload = () => {
    _leafletReady = true;
    _leafletQueue.forEach(fn => {
      try {
        fn();
      } catch (e) {
        console.warn('Leaflet cb error', e);
      }
    });
    _leafletQueue.length = 0;
  };

  js.onerror = () => console.error('Leaflet script failed to load from CDN');

  document.head.appendChild(js);
}

// ---------------------------------------------------------------------------
// Map components
// ---------------------------------------------------------------------------
function WebIncidentMap({ coords, radiusM, spreadDeg, severityColor }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!coords || !containerRef.current) return;

    let destroyed = false;
    let invalidateTimer = null;

    ensureLeaflet(() => {
      if (destroyed || !containerRef.current) return;

      const L = window.L;

      if (!L) {
        setErr('Leaflet not available');
        return;
      }

      try {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }

        const map = L.map(containerRef.current, {
          center: [coords.lat, coords.lng],
          zoom: 14,
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 20,
          detectRetina: true,
        }).addTo(map);

        L.circle([coords.lat, coords.lng], {
          radius: radiusM,
          color: severityColor,
          fillColor: severityColor,
          fillOpacity: 0.12,
          weight: 2,
          dashArray: '6 4',
        }).addTo(map);

        if (spreadDeg !== null && Number.isFinite(spreadDeg)) {
          const halfAngle = 30;
          const coneLen = radiusM * 2.4;

          const pointOnBearing = (bearing, dist) => {
            const b = (bearing * Math.PI) / 180;
            const cosLat = Math.cos((coords.lat * Math.PI) / 180);

            return [
              coords.lat + (dist / 111320) * Math.cos(b),
              coords.lng + (dist / (111320 * cosLat)) * Math.sin(b),
            ];
          };

          const arc = [];

          for (let a = spreadDeg - halfAngle; a <= spreadDeg + halfAngle; a += 3) {
            arc.push(pointOnBearing(a, coneLen));
          }

          L.polygon([[coords.lat, coords.lng], ...arc, [coords.lat, coords.lng]], {
            color: '#f97316',
            fillColor: '#f97316',
            fillOpacity: 0.2,
            weight: 2,
          }).addTo(map);
        }

        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              width:38px;
              height:38px;
              border-radius:50%;
              background:#fff;
              border:4px solid ${severityColor};
              display:flex;
              align-items:center;
              justify-content:center;
              box-shadow:0 2px 14px rgba(0,0,0,0.22);
            ">
              <img
                src="${ASSETS.flame.uri}"
                style="
                  width:20px;
                  height:20px;
                  object-fit:contain;
                  display:block;
                "
              />
            </div>
            `,
          iconSize: [14, 14],
          iconAnchor: [19, 19],
        });

        L.marker([coords.lat, coords.lng], { icon }).addTo(map);

        invalidateTimer = setTimeout(() => {
          if (
            !destroyed &&
            mapRef.current === map &&
            map &&
            map._container
          ) {
            map.invalidateSize();
          }
        }, 150);

        mapRef.current = map;
      } catch (e) {
        setErr(e.message);
      }
    });

    return () => {
      destroyed = true;

      if (invalidateTimer) {
        clearTimeout(invalidateTimer);
      }

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [coords?.lat, coords?.lng, radiusM, spreadDeg, severityColor]);

  if (!coords) {
    return (
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>Location unavailable for this fire</Text>
      </View>
    );
  }

  if (err) {
    return (
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>Map error: {err}</Text>
      </View>
    );
  }

  return (
    <View style={styles.mapViewport}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 20,
          zIndex: 1,
        }}
      />
    </View>
  );
}

function NativeIncidentMap({ coords, radiusM, severityColor }) {
  let MapView;
  let Circle;
  let Marker;

  try {
    const m = require('react-native-maps');
    MapView = m.default;
    Circle = m.Circle;
    Marker = m.Marker;
  } catch { }

  if (!coords) {
    return (
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>Location unavailable</Text>
      </View>
    );
  }

  if (!MapView) {
    return (
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapPlaceholderText}>
          {coords.lat.toFixed(4)} N, {coords.lng.toFixed(4)} E
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.mapViewport}>
      <MapView
        style={{ flex: 1, borderRadius: 20 }}
        initialRegion={{
          latitude: coords.lat,
          longitude: coords.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Circle
          center={{
            latitude: coords.lat,
            longitude: coords.lng,
          }}
          radius={radiusM}
          strokeColor={severityColor}
          fillColor={`${severityColor}28`}
          strokeWidth={2}
        />
        <Marker
          coordinate={{
            latitude: coords.lat,
            longitude: coords.lng,
          }}
        />
      </MapView>
    </View>
  );
}

function IncidentMap(props) {
  if (Platform.OS === 'web') return <WebIncidentMap {...props} />;
  return <NativeIncidentMap {...props} />;
}

// ---------------------------------------------------------------------------
// Carousel
// ---------------------------------------------------------------------------
function MetricCard({ label, value, sub, tone }) {
  const theme = toneStyles(tone);

  if (!value) return null;

  return (
    <View
      style={[
        styles.metricCard,
        {
          backgroundColor: theme.bg,
          borderColor: theme.border,
        },
      ]}
    >
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.accent }]}>{value}</Text>
      {sub ? <Text style={styles.metricSub}>{sub}</Text> : null}
    </View>
  );
}

function CarouselSection({ title, badge, badgeTone, items, loading }) {
  const validItems = (items || []).filter(i => i.value && i.value !== 'N/A');
  const bt = toneStyles(badgeTone || 'slate');

  return (
    <View style={styles.carouselCard}>
      <View style={styles.carouselHeader}>
        <Text style={styles.carouselTitle}>{title}</Text>

        {badge ? (
          <View
            style={[
              styles.carouselBadge,
              {
                backgroundColor: bt.bg,
                borderColor: bt.border,
              },
            ]}
          >
            <Text style={[styles.carouselBadgeText, { color: bt.accent }]}>{badge}</Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.carouselState}>
          <ActivityIndicator size="small" color={C.tangerine} />
          <Text style={styles.carouselStateText}>Loading live data...</Text>
        </View>
      ) : validItems.length === 0 ? (
        <View style={styles.carouselState}>
          <Text style={styles.carouselStateText}>No data loaded yet</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselTrack}
        >
          {validItems.map((item, i) => (
            <MetricCard
              key={`${title}-${i}`}
              label={item.label}
              value={item.value}
              sub={item.sub}
              tone={item.tone}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function DataChip({ label, value, tone }) {
  const theme = toneStyles(tone);

  return (
    <View
      style={[
        styles.infoMiniCard,
        {
          backgroundColor: theme.bg,
          borderColor: theme.border,
        },
      ]}
    >
      <Text style={styles.infoMiniCardLabel}>{label}</Text>
      <Text style={[styles.infoMiniCardValue, { color: theme.accent }]}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// FireLab widget
// ---------------------------------------------------------------------------
function FireLabWidget({ coords }) {
  const inferredGov = useMemo(() => guessGovernoratFromCoords(coords), [coords]);
  const [selectedGov, setSelectedGov] = useState(inferredGov);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setSelectedGov(inferredGov);
  }, [inferredGov]);

  const fetchFirelab = useCallback(async gov => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const colabRes = await fetch(
        `${COLAB_BASE_URL}/firelab_status?governorate=${encodeURIComponent(
          gov
        )}&date=${todayStr()}`,
        { method: 'GET' }
      );

      const json = await colabRes.json().catch(() => null);

      if (colabRes.ok && json) {
        setData({ ...json, _source: 'colab', governorate: gov });
        return;
      }

      setData({
        _unavailable: true,
        governorate: gov,
        message:
          json?.message ||
          json?.error ||
          'No FireLab forecast data is available from Colab right now.',
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFirelab(selectedGov);
  }, [selectedGov, fetchFirelab]);

  const rl = code => FIRELAB_RISK_LABELS[code] || code || 'N/A';
  const rc = code => FIRELAB_RISK_COLORS[code] || '#94a3b8';

  return (
    <View style={styles.firelabCard}>
      <View style={styles.firelabHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.firelabTitle}>FireLab Forecast</Text>
          <Text style={styles.firelabSub}>
            {data?.report_date
              ? `Latest report — ${String(data.report_date).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}`
              : `UOB — ${todayStr().replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}`}
          </Text>
        </View>

        <View style={styles.firelabBadge}>
          <Text style={styles.firelabBadgeText}>UOB FireLab</Text>
        </View>
      </View>

      {data?.is_latest_fallback ? (
        <View style={styles.firelabNotice}>
          <Text style={styles.firelabNoticeText}>
            Today's report was not available, showing the latest available FireLab forecast.
          </Text>
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.govTabsTrack}
      >
        {Object.keys(GOVERNORATE_CENTROIDS).map(gov => {
          const active = gov === selectedGov;

          return (
            <TouchableOpacity
              key={gov}
              style={[styles.govTab, active && styles.govTabActive]}
              onPress={() => setSelectedGov(gov)}
            >
              <Text style={[styles.govTabText, active && styles.govTabTextActive]}>{gov}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.firelabLoading}>
          <ActivityIndicator size="small" color={C.tangerine} />
          <Text style={styles.firelabLoadingText}>Loading FireLab data...</Text>
        </View>
      ) : error ? (
        <View style={styles.firelabEmpty}>
          <Text style={styles.firelabEmptyText}>{error}</Text>
          <TouchableOpacity style={styles.firelabRetryBtn} onPress={() => fetchFirelab(selectedGov)}>
            <Text style={styles.firelabRetryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : data?._unavailable ? (
        <View style={styles.firelabEmpty}>
          <Text style={styles.firelabEmptyTitle}>FireLab Forecast Unavailable</Text>
          <Text style={styles.firelabEmptyText}>
            {data.message || `No FireLab report was found for ${data.governorate}.`}
          </Text>
          <TouchableOpacity style={styles.firelabRetryBtn} onPress={() => fetchFirelab(selectedGov)}>
            <Text style={styles.firelabRetryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : data?._pdfOnly ? (
        <View style={styles.firelabEmpty}>
          <Text style={styles.firelabEmptyText}>PDF available for {data.governorate} today.</Text>
          <TouchableOpacity
            style={styles.firelabRetryBtn}
            onPress={() => Platform.OS === 'web' && window.open(data.pdfUrl, '_blank')}
          >
            <Text style={styles.firelabRetryBtnText}>Open PDF</Text>
          </TouchableOpacity>
        </View>
      ) : data ? (
        <View>
          <View style={styles.firelabDaysGrid}>
            {[1, 2, 3].map(day => {
              const code = data[`day${day}_code`] || data[`day${day}`];
              const label = data[`day${day}_label`] || rl(code);
              const dateStr = data[`day${day}_date`] || `Day ${day}`;

              if (!code) return null;

              const color = rc(code);

              return (
                <View
                  key={day}
                  style={[
                    styles.firelabDayCard,
                    {
                      borderColor: `${color}55`,
                      backgroundColor: `${color}10`,
                    },
                  ]}
                >
                  <Text style={styles.firelabDayLabel}>{dateStr}</Text>
                  <Text style={[styles.firelabRiskCode, { color }]}>{code}</Text>
                  <Text style={[styles.firelabRiskLabel, { color }]}>{label}</Text>
                  <Text style={styles.firelabDaySub}>{data.governorate || selectedGov}</Text>
                </View>
              );
            })}
          </View>

          {Array.isArray(data.areas) && data.areas.length > 0 ? (
            <View style={styles.firelabAreaList}>
              <Text style={styles.firelabAreaListTitle}>Area Breakdown — {selectedGov}</Text>

              <ScrollView
                style={styles.firelabAreaScroll}
                contentContainerStyle={styles.firelabAreaScrollContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                {data.areas.map((area, i) => (
                  <View key={i} style={styles.firelabAreaRow}>
                    <Text style={styles.firelabAreaName}>{area.area || area.caza || '—'}</Text>

                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {[area.day1_code, area.day2_code, area.day3_code].map((code, j) => {
                        if (!code) return null;

                        const c = rc(code);

                        return (
                          <View
                            key={j}
                            style={[
                              styles.firelabAreaChip,
                              {
                                backgroundColor: `${c}18`,
                                borderColor: `${c}55`,
                              },
                            ]}
                          >
                            <Text style={[styles.firelabAreaCode, { color: c }]}>{code}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Data hook
// ---------------------------------------------------------------------------
function useIncidentData(fireId, initialFire = null) {
  const [fire, setFire] = useState(initialFire);
  const [assignments, setAssignments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!fireId) {
      setLoading(false);
      return;
    }

    try {
      const [fireData, assignData, alertData] = await Promise.all([
        gqlFetch(GET_FIRE, { fire_id: fireId }),
        gqlFetch(GET_ASSIGNMENTS_BY_FIRE, { fire_id: fireId }),
        gqlFetch(GET_ALERTS_BY_FIRE, { fire_id: fireId }),
      ]);

      setFire(fireData?.getFireById || initialFire || null);
      setAssignments(assignData?.getAssignmentsByFireId || []);
      setAlerts(alertData?.getAlertsByFireId || []);
    } catch (e) {
      console.error('Incident fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFire(initialFire || null);
  }, [initialFire]);

  useEffect(() => {
    refresh();
  }, [fireId]);

  return { fire, assignments, alerts, loading, refresh };
}

// ---------------------------------------------------------------------------
// Colab context fetch
// ---------------------------------------------------------------------------
async function fetchColabLiveData(coords, severity, fireId) {
  const res = await fetch(`${COLAB_BASE_URL}/incident_context`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fire_id: fireId,
      fire_location: coords,
      fire_severitylevel: severity,
    }),
  });

  if (!res.ok) {
    throw new Error(`Colab server returned HTTP ${res.status}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function IncidentDetailsScreen({ navigation, route }) {
  let nav = navigation;
  let routeParams = route?.params || {};

  if (Platform.OS !== 'web') {
    try {
      const { useNavigation, useRoute } = require('@react-navigation/native');
      nav = useNavigation();
      routeParams = useRoute().params || {};
    } catch { }
  }

  const fireId =
    routeParams?.fireId ??
    routeParams?.fire_id ??
    routeParams?.alert?.fire_id ??
    routeParams?.fire?.fire_id ??
    null;

  const initialFire = routeParams?.fire || null;

  const { fire, assignments, alerts, loading } = useIncidentData(fireId, initialFire);

  const [colabData, setColabData] = useState(null);
  const [colabLoading, setColabLoading] = useState(false);
  const [colabError, setColabError] = useState(null);
  const [respondersOpen, setRespondersOpen] = useState(true);

  const severityColor = getSeverityColor(fire?.fire_severitylevel);
  const severityLabel = getSeverityLabel(fire?.fire_severitylevel);
  const fireCreatedAt = getFireCreatedAt(fire);
  const fireUpdatedAt = getFireUpdatedAt(fire);

  const aiPayload = useMemo(() => colabData || extractAiPayload(fire), [fire, colabData]);
  const weather = useMemo(() => extractWeather(aiPayload, fire), [aiPayload, fire]);
  const thermal = useMemo(() => extractThermal(aiPayload, fire), [aiPayload, fire]);
  const behavior = useMemo(() => extractBehavior(aiPayload, fire), [aiPayload, fire]);
  const coords = useMemo(() => parsePoint(fire?.fire_location), [fire]);
  const radiusM = useMemo(() => extractFireRadius(fire, thermal), [fire, thermal]);
  const spreadDeg = useMemo(() => extractSpreadDeg(behavior, weather), [behavior, weather]);

  const confidence = useMemo(() => {
    if (aiPayload.final_probability != null) {
      return Math.round(Number(aiPayload.final_probability) * 100);
    }

    if (aiPayload.prediction_confidence != null) {
      return Math.round(Number(aiPayload.prediction_confidence));
    }

    if (fire?.prediction_confidence != null) {
      return Math.round(Number(fire.prediction_confidence));
    }

    return null;
  }, [aiPayload, fire]);

  const handleFetchColab = useCallback(async () => {
    if (!fire) return;

    setColabLoading(true);
    setColabError(null);

    try {
      const result = await fetchColabLiveData(coords, fire?.fire_severitylevel, fire?.fire_id);

      setColabData({
        weather_data: result.weather_data,
        predicted_behavior: result.predicted_behavior,

        final_probability: result.final_probability,
        nn_probability: result.nn_probability,
        runtime_threshold: result.runtime_threshold,
        model_name: result.model_name,

        alert_level: result.alert_level,
        thermal_override: result.thermal_override,

        fwi_score: result.fwi_score,
        fwi_class: result.fwi_class,
        compound_weather_flag: result.compound_weather_flag,
        weather_contributions: result.weather_contributions,
        weather_source: result.weather_source || 'WeatherLink',

        mode: result.mode,
        note: result.note,
      });
    } catch (e) {
      setColabError(e.message);
    } finally {
      setColabLoading(false);
    }
  }, [fire, coords]);

  useEffect(() => {
    if (!fire || colabData || colabLoading) return;
    handleFetchColab();
  }, [fire?.fire_id, coords?.lat, coords?.lng, colabData, colabLoading, handleFetchColab]);

  const weatherItems = useMemo(
    () => [
      {
        label: 'Temperature',
        value: fmt(weather.temperature, '°C'),
        sub: 'Ambient heat',
        tone: 'orange',
      },
      {
        label: 'Wind Speed',
        value: fmt(weather.wind_speed, ' km/h'),
        sub: 'Forcing spread',
        tone: 'blue',
      },
      {
        label: 'Humidity',
        value: fmt(weather.humidity, '%'),
        sub: 'Air moisture',
        tone: 'green',
      },
      {
        label: 'Wind Dir.',
        value: fmt(weather.wind_dir, '°'),
        sub: 'Dominant flow',
        tone: 'purple',
      },
      {
        label: 'Pressure',
        value: fmt(weather.pressure, ' hPa'),
        sub: 'Atmospheric',
        tone: 'slate',
      },
      {
        label: 'Rainfall',
        value: fmt(weather.rainfall, ' mm'),
        sub: 'Recent precip.',
        tone: 'teal',
      },
    ],
    [weather]
  );

  const aiModelItems = useMemo(
    () => [
      {
        label: 'Alert Level',
        value: fmt(aiPayload.alert_level),
        sub: 'AI status',
        tone:
          aiPayload.alert_level === 'CRITICAL'
            ? 'scarlet'
            : aiPayload.alert_level === 'HIGH'
              ? 'rose'
              : 'gold',
      },
      {
        label: 'Fire Probability',
        value: fmtPercent(aiPayload.final_probability),
        sub: 'Final score',
        tone: 'scarlet',
      },
      {
        label: 'NN Probability',
        value: fmtPercent(aiPayload.nn_probability),
        sub: 'Neural net',
        tone: 'orange',
      },
      {
        label: 'FWI Score',
        value: aiPayload.fwi_score != null ? Number(aiPayload.fwi_score).toFixed(1) : null,
        sub: aiPayload.fwi_class || 'Fire Weather Index',
        tone: 'gold',
      },
      {
        label: 'FWI Class',
        value: fmt(aiPayload.fwi_class),
        sub: 'Danger class',
        tone: 'amber',
      },
      {
        label: 'Threshold',
        value:
          aiPayload.runtime_threshold != null
            ? Number(aiPayload.runtime_threshold).toFixed(3)
            : null,
        sub: 'Decision cutoff',
        tone: 'blue',
      },
      {
        label: 'Model',
        value: fmt(aiPayload.model_name || fire?.model_name),
        sub: 'Detection model',
        tone: 'purple',
      },
      {
        label: 'Thermal Override',
        value:
          aiPayload.thermal_override != null
            ? aiPayload.thermal_override
              ? 'Active'
              : 'Clear'
            : null,
        sub: 'Override flag',
        tone: aiPayload.thermal_override ? 'scarlet' : 'green',
      },
      {
        label: 'Compound Flag',
        value:
          aiPayload.compound_weather_flag != null
            ? aiPayload.compound_weather_flag
              ? 'Active'
              : 'Clear'
            : null,
        sub: 'Hot + dry + no rain',
        tone: aiPayload.compound_weather_flag ? 'rose' : 'green',
      },
      {
        label: 'Weather Source',
        value: fmt(aiPayload.weather_source),
        sub: 'Data origin',
        tone: 'teal',
      },
      ...(confidence !== null
        ? [
          {
            label: 'Confidence',
            value: `${confidence}%`,
            sub: 'Prediction confidence',
            tone: 'purple',
          },
        ]
        : []),
    ],
    [aiPayload, fire, confidence]
  );

  const behaviorItems = useMemo(
    () => [
      {
        label: 'Spread Rate',
        value:
          behavior.rate_of_spread_m_per_min != null
            ? `${Number(behavior.rate_of_spread_m_per_min).toFixed(1)} m/min`
            : null,
        sub: 'Rate of spread',
        tone: 'scarlet',
      },
      {
        label: 'Direction',
        value: fmt(behavior.spread_direction),
        sub: 'Primary spread',
        tone: 'blue',
      },
      {
        label: 'Wind Bearing',
        value: fmt(behavior.wind_direction_deg, '°'),
        sub: 'Wind bearing',
        tone: 'purple',
      },
      {
        label: 'Flame Length',
        value: fmt(behavior.flame_length_m, ' m'),
        sub: 'Est. length',
        tone: 'orange',
      },
      {
        label: 'Crown Risk',
        value: fmt(behavior.crown_fire_risk),
        sub: 'Canopy ignition',
        tone:
          behavior.crown_fire_risk === 'High'
            ? 'scarlet'
            : behavior.crown_fire_risk === 'Moderate'
              ? 'gold'
              : 'green',
      },
      {
        label: 'Spotting Dist.',
        value: fmt(behavior.spotting_distance_km, ' km'),
        sub: 'Ember travel',
        tone: 'rose',
      },
      {
        label: 'Ember Risk',
        value: fmt(behavior.ember_transport_risk),
        sub: 'Ember transport',
        tone:
          behavior.ember_transport_risk === 'High'
            ? 'scarlet'
            : behavior.ember_transport_risk === 'Moderate'
              ? 'gold'
              : 'green',
      },
    ],
    [behavior]
  );

  const quickFacts = useMemo(
    () => [
      {
        label: 'Status',
        value: fire?.is_extinguished ? 'Extinguished' : 'Active',
        tone: fire?.is_extinguished ? 'slate' : 'scarlet',
      },
      {
        label: 'Verified',
        value: fire?.is_verified ? 'Yes' : 'Pending',
        tone: fire?.is_verified ? 'green' : 'gold',
      },
      {
        label: 'Severity',
        value: `${severityLabel}${fire?.fire_severitylevel ? ` (${fire.fire_severitylevel}/10)` : ''}`,
        tone: 'orange',
      },
      ...(confidence !== null
        ? [
          {
            label: 'Confidence',
            value: `${confidence}%`,
            tone: 'purple',
          },
        ]
        : []),
    ],
    [fire, severityLabel, confidence]
  );

  const detailRows = useMemo(
    () => [
      {
        label: 'Fire ID',
        value: fire?.fire_id || 'N/A',
      },
      {
        label: 'Detected',
        value: formatDateTime(fireCreatedAt),
      },
      {
        label: 'Last Updated',
        value: formatDateTime(fireUpdatedAt),
      },
      {
        label: 'Source',
        value: fire?.fire_source || 'N/A',
      },
      {
        label: 'Fire Radius',
        value: `${radiusM} m`,
      },
      {
        label: 'Responders Deployed',
        value: assignments.length,
      },
      {
        label: 'Alerts Triggered',
        value: alerts.length,
      },
    ],
    [
      fire,
      fireCreatedAt,
      fireUpdatedAt,
      behavior,
      radiusM,
      spreadDeg,
      assignments.length,
      alerts.length,
    ]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => nav?.goBack?.()} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Incident Details</Text>
            </View>
          </View>
        </View>

        <View style={styles.loader}>
          <ActivityIndicator size="large" color={C.scarlet} />
        </View>
      </SafeAreaView>
    );
  }

  if (!fire) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => nav?.goBack?.()} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back to Dashboard</Text>
            </TouchableOpacity>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Incident Details</Text>
            </View>
          </View>
        </View>

        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Fire incident not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => nav?.goBack?.()} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>

          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Incident Details</Text>
            <Text style={styles.subtitle}>{fire.fire_id || fire.fire_source || 'Live fire incident'}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.desktopLayout}>
          <View style={styles.leftColumn}>
            {colabError ? (
              <View style={styles.colabFetchBar}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.colabFetchLabel}>Could not load live AI context.</Text>
                  <Text style={styles.colabFetchError}>{colabError}</Text>
                </View>

                <TouchableOpacity style={styles.colabFetchBtn} onPress={handleFetchColab}>
                  <Text style={styles.colabFetchBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.mapCard}>
              <View style={styles.mapCardHeader}>
                <View>
                  <Text style={styles.mapCardTitle}>Fire Behavior Map</Text>
                  <Text style={styles.mapCardSub}>
                    {coords
                      ? `${coords.lat.toFixed(4)} N, ${coords.lng.toFixed(4)} E`
                      : 'Location unavailable'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.severityChip,
                    {
                      backgroundColor: `${severityColor}18`,
                      borderColor: `${severityColor}55`,
                    },
                  ]}
                >
                  <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
                  <Text style={[styles.severityChipText, { color: severityColor }]}>
                    {severityLabel}
                  </Text>
                </View>
              </View>

              <IncidentMap
                coords={coords}
                radiusM={radiusM}
                spreadDeg={spreadDeg}
                severityColor={severityColor}
              />

              {coords && spreadDeg !== null ? (
                <View style={styles.mapLegendRow}>
                  <View style={styles.mapLegendItem}>
                    <View
                      style={[
                        styles.mapLegendSwatch,
                        {
                          backgroundColor: `${severityColor}40`,
                          borderColor: severityColor,
                        },
                      ]}
                    />
                    <Text style={styles.mapLegendLabel}>Fire radius ({radiusM} m)</Text>
                  </View>

                  <View style={styles.mapLegendItem}>
                    <View
                      style={[
                        styles.mapLegendSwatch,
                        {
                          backgroundColor: 'rgba(249,115,22,0.35)',
                          borderColor: '#f97316',
                        },
                      ]}
                    />
                    <Text style={styles.mapLegendLabel}>Spread cone ({spreadDeg}°)</Text>
                  </View>
                </View>
              ) : null}
            </View>

            <FireLabWidget coords={coords} />
          </View>

          <View style={styles.rightColumn}>
            <View style={styles.sideCard}>
              <Text style={styles.sideCardTitle}>Live Snapshot</Text>

              <View style={styles.quickFactsGrid}>
                {quickFacts.map(item => (
                  <DataChip
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    tone={item.tone}
                  />
                ))}
              </View>

              <View style={styles.detailList}>
                {detailRows.map(row => (
                  <View key={row.label} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <Text style={styles.detailValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            <CarouselSection
              title="Weather Conditions"
              badge={fmt(aiPayload.weather_source) || 'WeatherLink'}
              badgeTone="blue"
              items={weatherItems}
              loading={colabLoading}
            />

            <CarouselSection
              title="Eshmagan AI Output"
              badge="EshMagan AI"
              badgeTone="purple"
              items={aiModelItems}
              loading={colabLoading}
            />

            <CarouselSection
              title="Fire Behavior"
              badge="AI Predicted"
              badgeTone="blue"
              items={behaviorItems}
              loading={colabLoading}
            />

            <View style={styles.sideCard}>
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => setRespondersOpen(prev => !prev)}
                activeOpacity={0.85}
              >
                <View style={styles.accordionHeaderLeft}>
                  <View style={[styles.accordionDot, { backgroundColor: C.tangerine }]} />
                  <Text style={styles.accordionTitle}>Assigned Responders</Text>
                </View>

                <View style={styles.accordionMeta}>
                  <View style={styles.accordionCount}>
                    <Text style={styles.accordionCountText}>{assignments.length}</Text>
                  </View>
                  <Text style={styles.accordionChevron}>{respondersOpen ? 'v' : '>'}</Text>
                </View>
              </TouchableOpacity>

              {respondersOpen ? (
                <View style={styles.accordionBodyWrapper}>
                  <ScrollView
                    nestedScrollEnabled
                    style={styles.accordionBodyScroll}
                    contentContainerStyle={styles.accordionBodyScrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {assignments.length === 0 ? (
                      <View style={styles.emptyAccordionState}>
                        <Text style={styles.emptyAccordionTitle}>No responders assigned yet</Text>
                        <Text style={styles.emptyAccordionDesc}>
                          Units dispatched from the dashboard will appear here.
                        </Text>
                      </View>
                    ) : (
                      assignments.map(item => {
                        const sc =
                          item.assignment_status === 'Completed'
                            ? '#16a34a'
                            : item.assignment_status === 'EnRoute'
                              ? '#2563eb'
                              : item.assignment_status === 'Assigned'
                                ? '#f59e0b'
                                : '#94a3b8';

                        return (
                          <View key={item.assignment_id} style={styles.entityItem}>
                            <View style={styles.entityItemTop}>
                              <Text style={styles.entityItemTitle}>
                                {item.unit_nb
                                  ? `${item.responder_id || 'Responder'} — ${item.unit_nb}`
                                  : item.responder_id || 'Responder'}
                              </Text>

                              <View
                                style={[
                                  styles.entityItemBadge,
                                  {
                                    backgroundColor: `${sc}18`,
                                    borderColor: `${sc}55`,
                                  },
                                ]}
                              >
                                <Text style={[styles.entityItemBadgeText, { color: sc }]}>
                                  {item.assignment_status || 'Unknown'}
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.entityItemSub}>
                              Assigned at {formatTime(item.assigned_at)}
                            </Text>
                          </View>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}