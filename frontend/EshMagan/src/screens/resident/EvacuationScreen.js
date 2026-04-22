// src/screens/resident/EvacuationScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  SafeAreaView, Animated, Platform, ActivityIndicator,
} from 'react-native';
import { gqlFetch, GET_EVACUATIONS_BY_FIRE } from '../../services/api';
import { global } from '../../styles/global';
import styles from '../../styles/screens/EvacuationScreen.styles';
import { getCurrentLocation } from '../../services/location.service';

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

function parsePolygonCoords(raw) {
  if (!raw) return [];

  try {
    const g = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (g.type === 'Polygon' && g.coordinates?.[0]?.length) {
      return g.coordinates[0].map(([lng, lat]) => [lat, lng]);
    }
  } catch { }

  return [];
}

function distanceInMeters(a, b) {
  if (!a || !b) return Infinity;

  const toRad = deg => (deg * Math.PI) / 180;
  const R = 6371000;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * y;
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

function WebMap({ safeCoords, safePolygonCoords, userCoords, polyline }) {
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const polylineRef = useRef(null);
  const safePolygonRef = useRef(null);
  const userMarkerRef = useRef(null);
  const safeMarkerRef = useRef(null);
  const hasFittedRouteRef = useRef(false);
  const [followUser, setFollowUser] = useState(true);

  useEffect(() => {
    hasFittedRouteRef.current = false;
    setFollowUser(true);
  }, [safeCoords?.lat, safeCoords?.lng]);

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
        .setView([33.8938, 35.5018], 9);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
        detectRetina: true,
      }).addTo(map);

      map.on('dragstart', () => {
        setFollowUser(false);
      });

      map.on('zoomstart', e => {
        if (e.originalEvent) {
          setFollowUser(false);
        }
      });

      mapRef.current = map;
    };

    if (window.L) {
      doInit();
    } else {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.onload = doInit;
      document.head.appendChild(s);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L || !userCoords) return;

    if (!userMarkerRef.current) {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.45)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon })
        .bindPopup('Your Location')
        .addTo(map);
    } else {
      userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
    }

    if (followUser) {
      const focusZoom = 16;
      map.setView([userCoords.lat, userCoords.lng], focusZoom);
    }
  }, [userCoords?.lat, userCoords?.lng, followUser]);

  useEffect(() => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L || !safeCoords) return;

    const icon = L.divIcon({
      className: '',
      html: `<div style="background:#DC2626;color:#fff;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">⛺ Safe Zone</div>`,
      iconSize: [100, 28],
      iconAnchor: [50, 28],
    });

    if (!safeMarkerRef.current) {
      safeMarkerRef.current = L.marker([safeCoords.lat, safeCoords.lng], { icon })
        .bindPopup('Safe Zone')
        .addTo(map);
    } else {
      safeMarkerRef.current.setLatLng([safeCoords.lat, safeCoords.lng]);
    }
  }, [safeCoords?.lat, safeCoords?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L) return;

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (!polyline?.length) return;

    const pl = L.polyline(polyline, { color: '#DC2626', weight: 5, opacity: 0.88 }).addTo(map);
    polylineRef.current = pl;

    if (!hasFittedRouteRef.current) {
      map.fitBounds(pl.getBounds(), { padding: [52, 52] });
      hasFittedRouteRef.current = true;
    }
  }, [polyline]);

  useEffect(() => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L) return;

    if (safePolygonRef.current) {
      safePolygonRef.current.remove();
      safePolygonRef.current = null;
    }

    if (!safePolygonCoords?.length) return;

    safePolygonRef.current = L.polygon(safePolygonCoords, {
      color: '#16a34a',
      weight: 2,
      fillColor: '#22c55e',
      fillOpacity: 0.18,
    }).addTo(map);
  }, [safePolygonCoords]);

  const recenter = () => {
    const map = mapRef.current;
    if (!map || !userCoords) return;

    setFollowUser(true);

    const focusZoom = 16;
    map.flyTo([userCoords.lat, userCoords.lng], focusZoom, {
      animate: true,
      duration: 0.9,
    });
  };

  return (
    <View style={{ width: '100%', height: '100%', backgroundColor: '#ddd', position: 'relative' }}>
      <View ref={divRef} style={{ width: '100%', height: '100%' }} />
      {!followUser && userCoords && (
        <TouchableOpacity
          onPress={recenter}
          style={{
            position: 'absolute',
            left: 12,
            bottom: 12,
            backgroundColor: '#fff',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 999,
            elevation: 3,
          }}
        >
          <Text style={{ fontWeight: '700', color: '#0f172a' }}>📍 Recenter</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Native Map (WebView-based Leaflet) ──────────────────────────────────────

function NativeMap({ safeCoords, safePolygonCoords, userCoords, polylineCoords, selectedIdx }) {
  const [mapReady, setMapReady] = useState(false);
  const [followUser, setFollowUser] = useState(true);
  const webViewRef = useRef(null);

  let WebViewComponent = null;
  try {
    WebViewComponent = require('react-native-webview').WebView;
  } catch (e) {
    WebViewComponent = null;
  }

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #ddd;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map').setView([33.8938, 35.5018], 9);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 20,
          detectRetina: true
        }).addTo(map);

        let userMarker = null;
        let safeMarker = null;
        let routePolyline = null;
        let safePolygon = null;
        let hasFittedRoute = false;
        let followUser = true;

        map.on('dragstart', function() {
          followUser = false;
          window.ReactNativeWebView.postMessage('FOLLOW_OFF');
        });

        map.on('zoomstart', function(e) {
          if (e.originalEvent) {
            followUser = false;
            window.ReactNativeWebView.postMessage('FOLLOW_OFF');
          }
        });

        window.updateUserLocation = function(lat, lng) {
          if (userMarker) {
            userMarker.setLatLng([lat, lng]);
          } else {
            const icon = L.divIcon({
              className: '',
              html: '<div style="width:14px;height:14px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.45)"></div>',
              iconSize: [14, 14],
              iconAnchor: [7, 7]
            });
            userMarker = L.marker([lat, lng], { icon }).bindPopup('Your Location').addTo(map);
          }

          if (followUser) {
            const focusZoom = 16;
            map.setView([lat, lng], focusZoom);
          }
        };

        window.updateSafeZone = function(lat, lng) {
          if (safeMarker) {
            safeMarker.setLatLng([lat, lng]);
          } else {
            const icon = L.divIcon({
              className: '',
              html: '<div style="background:#DC2626;color:#fff;border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3)">⛺ Safe Zone</div>',
              iconSize: [100, 28],
              iconAnchor: [50, 28]
            });
            safeMarker = L.marker([lat, lng], { icon }).bindPopup('Safe Zone').addTo(map);
          }
        };

        window.updateRoute = function(coords) {
          if (routePolyline) {
            routePolyline.remove();
            routePolyline = null;
          }

          if (coords && coords.length > 0) {
            routePolyline = L.polyline(coords, {
              color: '#DC2626',
              weight: 5,
              opacity: 0.88
            }).addTo(map);

            if (!hasFittedRoute) {
              map.fitBounds(routePolyline.getBounds(), { padding: [52, 52] });
              hasFittedRoute = true;
            }
          }
        };

        window.updateSafePolygon = function(coords) {
          if (safePolygon) {
            safePolygon.remove();
            safePolygon = null;
          }

          if (coords && coords.length > 0) {
            safePolygon = L.polygon(coords, {
              color: '#16a34a',
              weight: 2,
              fillColor: '#22c55e',
              fillOpacity: 0.18
            }).addTo(map);
          }
        };

        window.resetRouteFit = function() {
          hasFittedRoute = false;
          followUser = true;
        };

        window.enableFollowUser = function(lat, lng) {
          followUser = true;

          const focusZoom = 16;
          map.flyTo([lat, lng], focusZoom, {
            animate: true,
            duration: 0.9
          });
        };

        window.ReactNativeWebView.postMessage('MAP_READY');
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    setFollowUser(true);
  }, [selectedIdx, safeCoords?.lat, safeCoords?.lng]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current || !userCoords) return;

    webViewRef.current.injectJavaScript(`
      window.updateUserLocation(${userCoords.lat}, ${userCoords.lng});
      true;
    `);
  }, [userCoords?.lat, userCoords?.lng, mapReady]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current || !safeCoords) return;

    webViewRef.current.injectJavaScript(`
      window.updateSafeZone(${safeCoords.lat}, ${safeCoords.lng});
      true;
    `);
  }, [safeCoords?.lat, safeCoords?.lng, mapReady]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current) return;

    const coordsString = JSON.stringify(polylineCoords || []);
    webViewRef.current.injectJavaScript(`
      window.updateRoute(${coordsString});
      true;
    `);
  }, [polylineCoords, mapReady]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current) return;

    const coordsString = JSON.stringify(safePolygonCoords || []);
    webViewRef.current.injectJavaScript(`
      window.updateSafePolygon(${coordsString});
      true;
    `);
  }, [safePolygonCoords, mapReady]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current) return;

    webViewRef.current.injectJavaScript(`
      window.resetRouteFit && window.resetRouteFit();
      true;
    `);
  }, [selectedIdx, mapReady]);

  const recenter = () => {
    if (!mapReady || !webViewRef.current || !userCoords) return;
    setFollowUser(true);
    webViewRef.current.injectJavaScript(`
      window.enableFollowUser && window.enableFollowUser(${userCoords.lat}, ${userCoords.lng});
      true;
    `);
  };

  if (!WebViewComponent) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8e0d8' }}>
        <Text style={{ color: '#64748b', fontSize: 13 }}>
          react-native-webview is not installed
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <WebViewComponent
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHTML }}
        style={{ flex: 1, backgroundColor: '#ddd' }}
        onMessage={(event) => {
          const msg = event.nativeEvent.data;
          if (msg === 'MAP_READY') {
            setMapReady(true);
          } else if (msg === 'FOLLOW_OFF') {
            setFollowUser(false);
          }
        }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        allowFileAccess
        allowUniversalAccessFromFileURLs
        startInLoadingState
        renderLoading={() => (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ddd' }}>
            <ActivityIndicator color="#DC2626" />
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>
              Loading map...
            </Text>
          </View>
        )}
      />

      {!followUser && userCoords && (
        <TouchableOpacity
          onPress={recenter}
          style={{
            position: 'absolute',
            left: 12,
            bottom: 12,
            backgroundColor: '#fff',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 999,
            elevation: 3,
          }}
        >
          <Text style={{ fontWeight: '700', color: '#0f172a' }}>📍 Recenter</Text>
        </TouchableOpacity>
      )}
    </View>
  );
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

  const { fireId, isUnsafe = false, nearbyFireIds = [] } = routeParams;

  const [routes, setRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState(isUnsafe ? 0 : null);
  const [voiceOn, setVoiceOn] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [directions, setDirections] = useState([]);
  const [routingMeta, setRoutingMeta] = useState(null);
  const [routingLoading, setRoutingLoading] = useState(false);
  const [routePolyline, setRoutePolyline] = useState([]);
  const dot = useRef(new Animated.Value(1)).current;

  const lastRerouteCoordsRef = useRef(null);
  const rerouteTimeoutRef = useRef(null);
  const activeRouteRequestRef = useRef(0);

  useEffect(() => {
    setSelectedIdx(isUnsafe ? 0 : null);
  }, [isUnsafe, fireId, nearbyFireIds.join(',')]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        let list = [];

        if (fireId) {
          const data = await gqlFetch(GET_EVACUATIONS_BY_FIRE, { fire_id: fireId });
          list = data?.getEvacuationsByFireId || [];
        } else if (nearbyFireIds.length > 0) {
          const results = await Promise.all(
            nearbyFireIds.map(id => gqlFetch(GET_EVACUATIONS_BY_FIRE, { fire_id: id }))
          );

          list = results
            .flatMap(data => data?.getEvacuationsByFireId || [])
            .sort((a, b) => (a.route_priority ?? 1) - (b.route_priority ?? 1));
        } else {
          list = [];
        }

        if (!cancelled) setRoutes(list);
      } catch (e) {
        console.error('[Evacuation] fetch error:', e);
        if (!cancelled) setRoutes([]);
      } finally {
        if (!cancelled) setRoutesLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [fireId, nearbyFireIds.join(',')]);

  useEffect(() => {
    let watchId = null;
    let Geolocation = null;
    let cancelled = false;

    const applyCoords = pos => {
      if (cancelled || !pos?.coords) return;
      setUserCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    };

    const init = async () => {
      try {
        const loc = await getCurrentLocation();
        if (!cancelled && loc) {
          setUserCoords({
            lat: loc.latitude,
            lng: loc.longitude,
          });
        }
      } catch (e) {
        console.warn('[Evacuation initial location]', e.message);
      }

      if (Platform.OS === 'web') {
        if (!navigator.geolocation) return;

        watchId = navigator.geolocation.watchPosition(
          applyCoords,
          err => console.warn('[Web Geolocation]', err.message),
          {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000,
          }
        );
        return;
      }

      try {
        Geolocation = require('@react-native-community/geolocation').default;
      } catch (e) {
        console.warn('[Native Geolocation] Package not installed');
        return;
      }

      watchId = Geolocation.watchPosition(
        applyCoords,
        err => console.warn('[Native Geolocation]', err.message),
        {
          enableHighAccuracy: true,
          distanceFilter: 3,
          interval: 2000,
          fastestInterval: 1500,
          timeout: 10000,
          maximumAge: 5000,
        }
      );
    };

    init();

    return () => {
      cancelled = true;

      if (Platform.OS === 'web') {
        if (watchId != null && navigator.geolocation) {
          navigator.geolocation.clearWatch(watchId);
        }
        return;
      }

      if (Geolocation && watchId != null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const selectedRoute = selectedIdx !== null ? (routes[selectedIdx] || null) : null;
  const safeCoords = selectedRoute ? parseGeoJSON(selectedRoute.safe_zone) : null;
  const safePolygonCoords = selectedRoute ? parsePolygonCoords(selectedRoute.safe_zone) : [];
  const routeCoords = selectedRoute ? parseGeoJSON(selectedRoute.route_path) : null;

  const hasSelectedRoute = selectedIdx !== null;
  const shouldShowEvacuationMapData = isUnsafe || hasSelectedRoute;
  const visibleSafeCoords = shouldShowEvacuationMapData ? safeCoords : null;
  const visibleRoutePolyline = shouldShowEvacuationMapData ? routePolyline : [];
  const visibleSafePolygonCoords = shouldShowEvacuationMapData ? safePolygonCoords : [];

  useEffect(() => {
    lastRerouteCoordsRef.current = null;

    if (rerouteTimeoutRef.current) {
      clearTimeout(rerouteTimeoutRef.current);
      rerouteTimeoutRef.current = null;
    }

    activeRouteRequestRef.current += 1;
  }, [selectedIdx]);

  useEffect(() => {
    if (!selectedRoute || (!isUnsafe && selectedIdx === null)) return;

    const from = userCoords || routeCoords;
    const to = safeCoords || routeCoords;

    if (!from || !to || (from.lat === to.lat && from.lng === to.lng)) {
      setDirections([]);
      setRoutingMeta(null);
      setRoutePolyline([]);
      lastRerouteCoordsRef.current = null;
      return;
    }

    const movedDistance = distanceInMeters(lastRerouteCoordsRef.current, from);
    const shouldReroute =
      !lastRerouteCoordsRef.current || movedDistance >= 20;

    if (!shouldReroute) return;

    if (rerouteTimeoutRef.current) {
      clearTimeout(rerouteTimeoutRef.current);
      rerouteTimeoutRef.current = null;
    }

    const requestId = activeRouteRequestRef.current + 1;
    activeRouteRequestRef.current = requestId;

    rerouteTimeoutRef.current = setTimeout(async () => {
      setRoutingLoading(true);

      try {
        const res = await fetchOSRMRoute(from.lat, from.lng, to.lat, to.lng);

        if (activeRouteRequestRef.current !== requestId) return;

        if (res) {
          setDirections(res.steps);
          setRoutingMeta({ totalKm: res.totalKm, totalTime: res.totalTime });
          setRoutePolyline(res.polyline);
          lastRerouteCoordsRef.current = from;
        } else {
          setDirections([]);
          setRoutingMeta(null);
          setRoutePolyline([]);
        }
      } finally {
        if (activeRouteRequestRef.current === requestId) {
          setRoutingLoading(false);
        }
      }
    }, 800);

    return () => {
      if (rerouteTimeoutRef.current) {
        clearTimeout(rerouteTimeoutRef.current);
        rerouteTimeoutRef.current = null;
      }
    };
  }, [selectedIdx, userCoords?.lat, userCoords?.lng, safeCoords?.lat, safeCoords?.lng, isUnsafe]);

  useEffect(() => {
    return () => {
      if (rerouteTimeoutRef.current) {
        clearTimeout(rerouteTimeoutRef.current);
      }
      activeRouteRequestRef.current += 1;
    };
  }, []);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(dot, { toValue: 1.4, duration: 750, useNativeDriver: false }),
      Animated.timing(dot, { toValue: 1, duration: 750, useNativeDriver: false }),
    ])).start();
  }, [dot]);

  const getStatusStyle = s =>
    (s === 'Active' || s === 'Open' || s === 'Clear')
      ? { view: styles.routeStatusClear, text: styles.routeStatusClearText }
      : { view: styles.routeStatusCaution, text: styles.routeStatusCautionText };

  if (routesLoading && routes.length === 0) {
    return (
      <SafeAreaView style={global.loaderScreen}>
        <ActivityIndicator size="large" color="#EC7742" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        Platform.OS === 'web' && { height: '100vh', overflow: 'hidden' },
      ]}
    >
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <View style={[styles.header, { flexShrink: 0 }]}>
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
            {!isUnsafe && selectedIdx === null
              ? 'You are safe right now'
              : routingMeta
                ? `${routingMeta.totalKm} km  •  ${routingMeta.totalTime} to safe zone`
                : userCoords
                  ? 'Calculating route…'
                  : 'Locating you…'}
          </Text>
        </View>

        <View
          style={[
            styles.mapArea,
            {
              flexShrink: 0,
              height: 445
            },
          ]}
        >
          {Platform.OS === 'web' ? (
            <WebMap
              safeCoords={visibleSafeCoords}
              safePolygonCoords={visibleSafePolygonCoords}
              userCoords={userCoords}
              polyline={visibleRoutePolyline}
            />
          ) : (
            <NativeMap
              safeCoords={visibleSafeCoords}
              safePolygonCoords={visibleSafePolygonCoords}
              userCoords={userCoords}
              polylineCoords={visibleRoutePolyline}
              selectedIdx={selectedIdx}
            />
          )}

          {shouldShowEvacuationMapData && routingMeta && (
            <View style={[styles.mapOverlay, { pointerEvents: 'none' }]}>
              <Text style={{ color: '#fff', fontSize: 12 }}>🧭</Text>
              <Text style={styles.mapOverlayText}>
                {routingMeta.totalKm} km  •  {routingMeta.totalTime}
              </Text>
            </View>
          )}

          {!userCoords && (
            <View style={[styles.mapLocating, { pointerEvents: 'none' }]}>
              <ActivityIndicator color="#DC2626" size="small" />
              <Text style={styles.mapLocatingText}>Locating…</Text>
            </View>
          )}
        </View>

        <View style={[styles.routeSwitcherBar, { flexShrink: 0 }]}>
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
                      onPress={() => {
                        if (!isUnsafe && selectedIdx === i) {
                          setSelectedIdx(null);
                        } else {
                          setSelectedIdx(i);
                        }
                      }}
                      style={[
                        styles.routePill,
                        active ? styles.routePillActive : styles.routePillInactive,
                      ]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.routePillPriority, active && styles.routePillPriorityActive]}>
                        P{r.route_priority ?? i + 1}
                      </Text>

                      <Text style={[styles.routePillKm, active && styles.routePillKmActive]}>
                        {r.distance_km != null ? `${parseFloat(r.distance_km).toFixed(1)} km` : '—'}
                      </Text>

                      <View style={ss.view}>
                        <Text style={ss.text}>{r.route_status || '?'}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          {(isUnsafe || selectedIdx !== null) && (
            <TouchableOpacity
              style={[styles.arModeBtn, !routePolyline?.length && { opacity: 0.5 }]}
              disabled={!selectedRoute || !routePolyline?.length}
              onPress={() =>
                selectedRoute &&
                routePolyline?.length &&
                nav?.navigate('ARMode', {
                  selectedRoute,
                  routePolyline,
                  directions,
                  routingMeta,
                  initialUserPos: userCoords,
                })
              }
            >
              <Text style={styles.arModeBtnText}>⚡ AR</Text>
            </TouchableOpacity>
          )}
        </View>

        <View
          style={{
            height: (isUnsafe || selectedIdx !== null) ? 225 : 290,
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <View
            style={[
              styles.directionsSection,
              {
                height: '100%',
                overflow: 'hidden',
              },
            ]}
          >
            <View style={styles.directionsHeaderRow}>
              <Text style={styles.directionsTitle}>
                {isUnsafe || selectedIdx !== null ? `Directions (${directions.length} steps)` : 'Turn-by-Turn Directions'}
              </Text>

              <View style={{ width: 74, height: 30, alignItems: 'flex-end', justifyContent: 'center' }}>
                {(isUnsafe || selectedIdx !== null) && (
                  <TouchableOpacity
                    onPress={() => setVoiceOn(v => !v)}
                    style={[styles.voiceBtn, voiceOn ? styles.voiceBtnOn : styles.voiceBtnOff]}
                  >
                    <Text style={voiceOn ? styles.voiceBtnTextOn : styles.voiceBtnTextOff}>
                      🔊 {voiceOn ? 'On' : 'Off'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 0 }}
            >
              {!isUnsafe && selectedIdx === null ? (
                <View style={styles.emptyDirections}>
                  <Text style={styles.emptyDirectionsText}>
                    You are outside the active fire danger zone. No evacuation route is currently needed.
                  </Text>
                </View>
              ) : routingLoading ? (
                <View style={styles.directionsLoading}>
                  <ActivityIndicator color="#DC2626" />
                  <Text style={styles.directionsLoadingText}>Calculating route…</Text>
                </View>
              ) : directions.length === 0 ? (
                <View style={styles.emptyDirections}>
                  <Text style={styles.emptyDirectionsText}>
                    {!selectedRoute
                      ? 'Select a route to preview it.'
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

              {(isUnsafe || selectedIdx !== null) && selectedRoute && (
                <View style={styles.safeZoneBox}>
                  <View style={styles.safeZoneRow}>
                    <Text style={{ fontSize: 22 }}>📍</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.safeZoneTitle}>Safe Zone</Text>
                      <Text style={styles.safeZoneName}>Assembly Point</Text>
                      <Text style={styles.safeZoneSub}>Emergency services and shelter available</Text>
                    </View>
                  </View>
                </View>
              )}

              <Text style={styles.attribution}>
                Map © OpenStreetMap contributors  •  Routing by OSRM
              </Text>
            </ScrollView>
          </View>
        </View>

        {(isUnsafe || selectedIdx !== null) && (
          <View style={[styles.footer, { flexShrink: 0 }]}>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() =>
                selectedRoute &&
                routePolyline?.length &&
                nav?.navigate('ARMode', {
                  selectedRoute,
                  routePolyline,
                  directions,
                  routingMeta,
                  initialUserPos: userCoords,
                })
              }
            >
              <Text style={{ fontSize: 18 }}>🧭</Text>
              <Text style={styles.startBtnText}>Start AR Navigation</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}