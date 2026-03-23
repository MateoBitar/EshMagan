// src/screens/resident/EvacuationScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, Animated, Platform, ActivityIndicator,
} from 'react-native';
import { gqlFetch, GET_EVACUATION_ROUTES, GET_EVACUATIONS_BY_FIRE } from '../../services/api';
import styles from '../../styles/screens/EvacuationScreen.styles';

// ─── Coordinate helpers ───────────────────────────────────────────────────────

function parseGeoJSON(raw) {
  if (!raw) return null;
  try {
    const g = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (g.type === 'Point') return { lat: g.coordinates[1], lng: g.coordinates[0] };
    if (g.type === 'LineString' && g.coordinates?.length) {
      const mid = Math.floor(g.coordinates.length / 2);
      return { lat: g.coordinates[mid][1], lng: g.coordinates[mid][0] };
    }
    return null;
  } catch {
    const m = typeof raw === 'string' && raw.match(/POINT\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    return m ? { lat: parseFloat(m[2]), lng: parseFloat(m[1]) } : null;
  }
}

// ─── OSRM free routing ────────────────────────────────────────────────────────

async function fetchOSRMRoute(fromLat, fromLng, toLat, toLng) {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${fromLng},${fromLat};${toLng},${toLat}` +
      `?overview=full&geometries=geojson&steps=true&annotations=false`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;

    const route = data.routes[0];
    const steps = (route.legs[0]?.steps || []).map(s => {
      const type = s.maneuver?.type || '';
      const modifier = s.maneuver?.modifier ? ` ${s.maneuver.modifier}` : '';
      const name = s.name ? ` onto ${s.name}` : '';
      let instruction;
      if (type === 'depart') instruction = `Head${modifier}${name}`;
      else if (type === 'arrive') instruction = 'Arrive at destination';
      else if (type === 'turn') instruction = `Turn${modifier}${name}`;
      else if (type === 'new name') instruction = `Continue${name}`;
      else if (type === 'roundabout' || type === 'rotary') instruction = `Take the roundabout${name}`;
      else if (type === 'fork') instruction = `Keep${modifier}${name}`;
      else if (type === 'merge') instruction = `Merge${modifier}${name}`;
      else if (type.includes('ramp')) instruction = `Take the ramp${modifier}${name}`;
      else if (type === 'end of road') instruction = `Turn${modifier}${name}`;
      else instruction = `Continue${modifier}${name}`;

      return {
        instruction: instruction.trim().replace(/\s+/g, ' '),
        distance: s.distance < 1000
          ? `${Math.round(s.distance)} m`
          : `${(s.distance / 1000).toFixed(1)} km`,
        time: s.duration < 60
          ? `${Math.round(s.duration)} sec`
          : `${Math.round(s.duration / 60)} min`,
        type,
      };
    });

    return {
      steps,
      polyline: (route.geometry?.coordinates || []).map(c => [c[1], c[0]]),
      totalKm: (route.distance / 1000).toFixed(1),
      totalTime: `${Math.round(route.duration / 60)} min`,
    };
  } catch (e) {
    console.warn('[OSRM]', e.message);
    return null;
  }
}

function turnIcon(type) {
  if (!type || type === 'continue' || type === 'new name') return '→';
  if (type === 'depart') return '📍';
  if (type === 'arrive') return '🏁';
  if (type === 'turn') return '↪';
  if (type === 'roundabout' || type === 'rotary') return '🔄';
  if (type === 'fork' || type === 'merge') return '↗';
  if (type.includes('ramp')) return '↗';
  return '→';
}

// ─── Leaflet Web Map ──────────────────────────────────────────────────────────

function WebMap({ safeCoords, userCoords, polyline }) {
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const polylineRef = useRef(null);
  const userMarkerRef = useRef(null);

  // ── init once ──
  useEffect(() => {
    if (typeof window === 'undefined' || !divRef.current) return;

    if (!document.getElementById('leaflet-css')) {
      const lnk = document.createElement('link');
      lnk.id = 'leaflet-css';
      lnk.rel = 'stylesheet';
      lnk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(lnk);
    }

    const doInit = () => {
      if (mapRef.current) return;
      const L = window.L;
      if (!L) return;
      const map = L.map(divRef.current, { zoomControl: true })
        .setView([33.8938, 35.5018], 9);   // Lebanon center — replaced when coords arrive
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
    };

    if (window.L) { doInit(); }
    else {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.onload = doInit;
      document.head.appendChild(s);
    }

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // ── user marker — updates every time coords change ──
  useEffect(() => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L || !userCoords) return;

    if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null; }

    const icon = L.divIcon({
      className: '',
      html: `<div style="width:14px;height:14px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.45)"></div>`,
      iconSize: [14, 14], iconAnchor: [7, 7],
    });
    userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon })
      .bindPopup('Your Location')
      .addTo(map);

    // Pan to user only if no route polyline is drawn yet
    if (!polylineRef.current) {
      map.setView([userCoords.lat, userCoords.lng], 13);
    }
  }, [userCoords?.lat, userCoords?.lng]);   // only re-run when coords actually change

  // ── safe zone marker ──
  useEffect(() => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L || !safeCoords) return;
    const icon = L.divIcon({
      className: '',
      html: `<div style="background:#DC2626;color:#fff;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">⛺ Safe Zone</div>`,
      iconSize: [100, 28], iconAnchor: [50, 28],
    });
    L.marker([safeCoords.lat, safeCoords.lng], { icon }).bindPopup('Safe Zone').addTo(map);
  }, [safeCoords?.lat, safeCoords?.lng]);

  // ── route polyline ──
  useEffect(() => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L) return;

    if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null; }
    if (!polyline?.length) return;

    const pl = L.polyline(polyline, { color: '#DC2626', weight: 5, opacity: 0.88 }).addTo(map);
    polylineRef.current = pl;
    map.fitBounds(pl.getBounds(), { padding: [52, 52] });
  }, [polyline]);

  return <div ref={divRef} style={{ width: '100%', height: '100%', background: '#ddd' }} />;
}

// ─── Native Map ───────────────────────────────────────────────────────────────

function NativeMap({ safeCoords, polylineCoords }) {
  try {
    const MapView = require('react-native-maps').default;
    const { Marker, Polyline } = require('react-native-maps');
    const center = safeCoords || { lat: 33.8938, lng: 35.5018 };
    return (
      <MapView
        style={{ width: '100%', height: '100%' }}
        showsUserLocation
        followsUserLocation
        initialRegion={{ latitude: center.lat, longitude: center.lng, latitudeDelta: 0.09, longitudeDelta: 0.09 }}
      >
        {safeCoords && (
          <Marker coordinate={{ latitude: safeCoords.lat, longitude: safeCoords.lng }} title="Safe Zone" pinColor="#DC2626" />
        )}
        {polylineCoords?.length > 0 && (
          <Polyline
            coordinates={polylineCoords.map(p => ({ latitude: p[0], longitude: p[1] }))}
            strokeColor="#DC2626" strokeWidth={5}
          />
        )}
      </MapView>
    );
  } catch {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8e0d8' }}>
        <Text style={{ color: '#94a3b8', fontSize: 13 }}>Map unavailable</Text>
      </View>
    );
  }
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function EvacuationScreen({ navigation, route }) {
  let nav = navigation;
  let routeParams = route?.params || {};
  if (Platform.OS !== 'web') {
    try {
      const { useNavigation, useRoute } = require('@react-navigation/native');
      nav = useNavigation();
      routeParams = useRoute().params || {};
    } catch { }
  }

  const { fireId } = routeParams;

  const [routes, setRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [voiceOn, setVoiceOn] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [directions, setDirections] = useState([]);
  const [routingMeta, setRoutingMeta] = useState(null);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [routePolyline, setRoutePolyline] = useState([]);
  const dot = useRef(new Animated.Value(1)).current;

  // ── Fetch routes — runs on BOTH platforms ─────────────────────────────────
  // (Native still uses this; Apollo hook below only augments if Apollo is available)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = fireId
          ? await gqlFetch(GET_EVACUATIONS_BY_FIRE, { fire_id: fireId })
          : await gqlFetch(GET_EVACUATION_ROUTES);
        if (!cancelled) {
          const list = fireId
            ? data?.getEvacuationsByFireId
            : data?.getAllEvacuations;
          setRoutes(list || []);
        }
      } catch (e) {
        console.error('[Evacuation] fetch error:', e);
      } finally {
        if (!cancelled) setRoutesLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [fireId]);

  // ── User location (web only — native uses showsUserLocation) ──────────────
  useEffect(() => {
    if (Platform.OS !== 'web' || !navigator.geolocation) return;

    // Get a fast rough position immediately (cached, low accuracy)
    navigator.geolocation.getCurrentPosition(
      pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 5000 }
    );

    // Then watch for a precise position in the background
    const wid = navigator.geolocation.watchPosition(
      pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => console.warn('[Geolocation]', err.message),
      { enableHighAccuracy: true, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(wid);
  }, []);

  // ── OSRM route ────────────────────────────────────────────────────────────
  const selectedRoute = routes[selectedIdx] || null;
  const safeCoords = selectedRoute ? parseGeoJSON(selectedRoute.safe_zone) : null;
  const routeCoords = selectedRoute ? parseGeoJSON(selectedRoute.route_path) : null;

  useEffect(() => {
    if (!selectedRoute) return;
    const from = userCoords || routeCoords;
    const to = safeCoords || routeCoords;
    if (!from || !to || (from.lat === to.lat && from.lng === to.lng)) {
      setDirections([]); setRoutingMeta(null); setRoutePolyline([]);
      return;
    }
    let cancelled = false;
    setRoutingLoading(true);
    fetchOSRMRoute(from.lat, from.lng, to.lat, to.lng).then(res => {
      if (cancelled) return;
      if (res) {
        setDirections(res.steps);
        setRoutingMeta({ totalKm: res.totalKm, totalTime: res.totalTime });
        setRoutePolyline(res.polyline);
      } else {
        setDirections([]); setRoutingMeta(null); setRoutePolyline([]);
      }
      setRoutingLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedIdx, userCoords?.lat, userCoords?.lng]);

  // ── Dot animation ─────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(dot, { toValue: 1.4, duration: 750, useNativeDriver: false }),
      Animated.timing(dot, { toValue: 1, duration: 750, useNativeDriver: false }),
    ])).start();
  }, []);

  const getStatusStyle = s =>
    (s === 'Active' || s === 'Open' || s === 'Clear')
      ? { view: styles.routeStatusClear, text: styles.routeStatusClearText }
      : { view: styles.routeStatusCaution, text: styles.routeStatusCautionText };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => nav?.goBack()}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>🧭 Live Navigation</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>Evacuation Route</Text>
        <Text style={styles.headerSub}>
          {routingMeta
            ? `${routingMeta.totalKm} km  •  ${routingMeta.totalTime} to safe zone`
            : userCoords ? 'Calculating route…' : 'Locating you…'}
        </Text>
      </View>

      {/* ── MAP ─────────────────────────────────────────────────────────── */}
      <View style={styles.mapArea}>
        {Platform.OS === 'web' ? (
          <WebMap
            safeCoords={safeCoords}
            userCoords={userCoords}
            polyline={routePolyline}
          />
        ) : (
          <NativeMap
            safeCoords={safeCoords}
            polylineCoords={routePolyline}
          />
        )}

        {/* km/time pill */}
        {routingMeta && (
          <View style={[styles.mapOverlay, { pointerEvents: 'none' }]}>
            <Text style={{ color: '#fff', fontSize: 12 }}>🧭</Text>
            <Text style={styles.mapOverlayText}>
              {routingMeta.totalKm} km  •  {routingMeta.totalTime}
            </Text>
          </View>
        )}

        {/* Locating badge */}
        {!userCoords && Platform.OS === 'web' && (
          <View style={[styles.mapLocating, { pointerEvents: 'none' }]}>
            <ActivityIndicator color="#DC2626" size="small" />
            <Text style={styles.mapLocatingText}>Locating…</Text>
          </View>
        )}
      </View>

      {/* ── ROUTE PILL SWITCHER ──────────────────────────────────────────── */}
      <View style={styles.routeSwitcherBar}>
        {routesLoading ? (
          <>
            <ActivityIndicator color="#DC2626" size="small" />
            <Text style={styles.routeSwitcherLoading}>Loading routes…</Text>
          </>
        ) : routes.length === 0 ? (
          <Text style={styles.routeSwitcherLoading}>No routes available</Text>
        ) : (
          <>
            <Text style={styles.routeSwitcherLabel}>Route:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.routeSwitcherScroll}
            >
              {routes.map((r, i) => {
                const active = i === selectedIdx;
                const ss = getStatusStyle(r.route_status);
                return (
                  <TouchableOpacity
                    key={r.route_id}
                    onPress={() => setSelectedIdx(i)}
                    style={[styles.routePill, active ? styles.routePillActive : styles.routePillInactive]}
                    activeOpacity={0.75}
                  >
                    {/* Priority number */}
                    <Text style={[styles.routePillPriority, active && styles.routePillPriorityActive]}>
                      P{r.route_priority ?? i + 1}
                    </Text>
                    {/* Distance */}
                    <Text style={[styles.routePillKm, active && styles.routePillKmActive]}>
                      {r.distance_km != null ? `${parseFloat(r.distance_km).toFixed(1)} km` : '—'}
                    </Text>
                    {/* Status badge */}
                    <View style={ss.view}>
                      <Text style={ss.text}>{r.route_status || '?'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* AR shortcut */}
        <TouchableOpacity style={styles.arModeBtn} onPress={() => nav?.navigate('ARMode')}>
          <Text style={styles.arModeBtnText}>⚡ AR</Text>
        </TouchableOpacity>
      </View>

      {/* ── SCROLLABLE DIRECTIONS ───────────────────────────────────────── */}
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={styles.directionsSection}>

          <View style={styles.directionsHeaderRow}>
            <Text style={styles.directionsTitle}>
              {routingMeta ? `Directions (${directions.length} steps)` : 'Turn-by-Turn Directions'}
            </Text>
            <TouchableOpacity
              onPress={() => setVoiceOn(v => !v)}
              style={[styles.voiceBtn, voiceOn ? styles.voiceBtnOn : styles.voiceBtnOff]}
            >
              <Text style={voiceOn ? styles.voiceBtnTextOn : styles.voiceBtnTextOff}>
                🔊 {voiceOn ? 'On' : 'Off'}
              </Text>
            </TouchableOpacity>
          </View>

          {routingLoading ? (
            <View style={styles.directionsLoading}>
              <ActivityIndicator color="#DC2626" />
              <Text style={styles.directionsLoadingText}>Calculating route…</Text>
            </View>
          ) : directions.length === 0 ? (
            <View style={styles.emptyDirections}>
              <Text style={styles.emptyDirectionsText}>
                {!selectedRoute
                  ? 'No routes available.'
                  : !userCoords
                    ? 'Waiting for your location…'
                    : 'Could not calculate route — check your connection.'}
              </Text>
            </View>
          ) : (
            directions.map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepCol}>
                  <View style={[styles.stepNum, i === 0 ? styles.stepNumActive : styles.stepNumInactive]}>
                    <Text style={{ fontSize: 13 }}>{turnIcon(step.type)}</Text>
                  </View>
                  {i < directions.length - 1 && <View style={styles.stepLine} />}
                </View>
                <View style={styles.stepCard}>
                  <Text style={styles.stepInstruction}>{step.instruction}</Text>
                  <Text style={styles.stepMeta}>{step.distance}  •  {step.time}</Text>
                </View>
              </View>
            ))
          )}

          {selectedRoute && (
            <View style={styles.safeZoneBox}>
              <View style={styles.safeZoneRow}>
                <Text style={{ fontSize: 22 }}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.safeZoneTitle}>Safe Zone</Text>
                  <Text style={styles.safeZoneName}>{selectedRoute.safe_zone || 'Assembly Point'}</Text>
                  <Text style={styles.safeZoneSub}>Emergency services and shelter available</Text>
                </View>
              </View>
            </View>
          )}

          <Text style={styles.attribution}>
            Map © OpenStreetMap contributors  •  Routing by OSRM
          </Text>
        </View>
      </ScrollView>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startBtn} onPress={() => nav?.navigate('ARMode')}>
          <Text style={{ fontSize: 18 }}>🧭</Text>
          <Text style={styles.startBtnText}>Start AR Navigation</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}