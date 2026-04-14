import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import styles, { C, RESPONDER_STATUS_COLORS } from '../../../styles/screens/ResponderCommandView.styles';
import { getFireZoneRadiusMeters, getFireZoneStyle } from '../utils/helpers';

export default function NativeUnitsMap({
  units,
  fires,
  selectedResponderId,
  selectedUnitId,
  selectedFireId,
}) {
  const [mapReady, setMapReady] = useState(false);
  const [showRecenter, setShowRecenter] = useState(false);
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body { margin:0; padding:0; height:100%; width:100%; overflow:hidden; }
        #map { height:100%; width:100%; }

        .fire-hover-tooltip {
          background: rgba(0,0,0,0.8);
          border: none;
          box-shadow: none;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 7px;
          border-radius: 6px;
        }

        .fire-hover-tooltip::before { display: none; }

        .leaflet-interactive {
          outline: none !important;
          -webkit-tap-highlight-color: transparent !important;
          tap-highlight-color: transparent !important;
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

        let markers = [];
        let fireZones = [];
        let focusMarkers = { responders: {}, units: {}, fires: {} };
        let hasFitted = false;

        function validPair(lat, lng) {
          return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
        }

        map.on('dragstart zoomstart', function() {
          window.ReactNativeWebView.postMessage('SHOW_RECENTER');
        });

        function fitEverythingOnce() {
          if (hasFitted) return;

          const allBounds = [];

          markers.forEach(m => {
            try { allBounds.push(m.getLatLng()); } catch {}
          });

          fireZones.forEach(z => {
            try { allBounds.push(z.getBounds()); } catch {}
          });

          if (allBounds.length === 0) return;

          let combinedBounds = null;

          allBounds.forEach(item => {
            if (item && typeof item.getSouthWest === 'function') {
              combinedBounds = combinedBounds ? combinedBounds.extend(item) : item;
            } else if (item) {
              combinedBounds = combinedBounds
                ? combinedBounds.extend(item)
                : L.latLngBounds([item, item]);
            }
          });

          if (combinedBounds) {
            map.fitBounds(combinedBounds, { padding: [40, 40] });
            hasFitted = true;
          }
        }

        window.updateUnits = function(units) {
          markers.forEach(m => {
            try { m.remove(); } catch {}
          });
          markers = [];
          focusMarkers.responders = {};
          focusMarkers.units = {};

          const validUnits = (units || []).filter(u => u.coords && validPair(u.coords.lat, u.coords.lng));

          validUnits.forEach(unit => {
            const color = unit.isMe ? '${C.tangerine}' : (unit.statusColor || '${C.slate}');

            const icon = L.divIcon({
              className: '',
              html: '<div style="width:18px;height:18px;background:' + color + ';border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>',
              iconSize: [18, 18],
              iconAnchor: [9, 9]
            });

            const marker = L.marker([unit.coords.lat, unit.coords.lng], { icon })
              .bindPopup(
                '<div style="min-width:140px">' +
                  '<div style="font-weight:700">' + (unit.displayName || (unit.responder_id + ' - ' + unit.unit_nb)) + '</div>' +
                  '<div style="font-size:12px;color:#475569;margin-top:4px">' + (unit.status || 'Unknown') + '</div>' +
                  '<div style="font-size:11px;color:#64748b;margin-top:4px">' +
                    unit.coords.lat.toFixed(5) + ', ' + unit.coords.lng.toFixed(5) +
                  '</div>' +
                  (unit.isMe ? '<div style="margin-top:6px;font-size:11px;color:#EC7742;font-weight:700">YOU</div>' : '') +
                '</div>'
              )
              .addTo(map);

            markers.push(marker);
            focusMarkers.responders[unit.responder_id] = marker;
          });

          const unitGroups = {};
          (units || []).forEach(unit => {
            if (!unit.unitId || !unit.unitCoords || !validPair(unit.unitCoords.lat, unit.unitCoords.lng)) return;
            if (!unitGroups[unit.unitId]) unitGroups[unit.unitId] = unit;
          });

          Object.values(unitGroups).forEach(unit => {
            const baseIcon = L.divIcon({
              className: '',
              html:
                '<div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;">' +
                  '<svg width="30" height="30" viewBox="0 0 24 24" fill="white" stroke="#EC7742" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M3 10L12 3l9 7"></path>' +
                    '<path d="M5 10v9h14v-9"></path>' +
                    '<rect x="9" y="14" width="6" height="5"></rect>' +
                  '</svg>' +
                '</div>',
              iconSize: [36, 36],
              iconAnchor: [18, 18]
            });

            const marker = L.marker([unit.unitCoords.lat, unit.unitCoords.lng], { icon: baseIcon })
              .bindPopup(
                '<div style="min-width:140px">' +
                  '<div style="font-weight:700">' + (unit.unit_nb || 'Unit') + '</div>' +
                  '<div style="font-size:12px;color:#475569;margin-top:4px">Unit location</div>' +
                  '<div style="font-size:11px;color:#64748b;margin-top:4px">' +
                    unit.unitCoords.lat.toFixed(5) + ', ' + unit.unitCoords.lng.toFixed(5) +
                  '</div>' +
                '</div>'
              )
              .addTo(map);

            markers.push(marker);
            focusMarkers.units[unit.unitId] = marker;
          });

          fitEverythingOnce();
        };

        window.updateFires = function(fires) {
          fireZones.forEach(z => {
            try { z.remove(); } catch {}
          });
          fireZones = [];
          focusMarkers.fires = {};

          const validFires = (fires || []).filter(f => f.coords && validPair(f.coords.lat, f.coords.lng));

          validFires.forEach(fire => {
            const severityLevel = Number(fire.fire_severitylevel || fire.severity || 0);
            const radius = severityLevel >= 8 ? 500 : severityLevel >= 6 ? 380 : severityLevel >= 3 ? 260 : 180;

            const fill = severityLevel >= 8
              ? '#DC2626'
              : severityLevel >= 6
                ? '#EA580C'
                : severityLevel >= 3
                  ? '#F59E0B'
                  : '#16A34A';

            const stroke = severityLevel >= 8
              ? '#991B1B'
              : severityLevel >= 6
                ? '#C2410C'
                : severityLevel >= 3
                  ? '#D97706'
                  : '#15803D';

            const circle = L.circle([fire.coords.lat, fire.coords.lng], {
              radius: radius,
              color: stroke,
              weight: 2.5,
              fillColor: fill,
              fillOpacity: 0.28,
            }).addTo(map);

            circle.bindTooltip(fire.displayName || ('Fire ' + String(fire.fire_id).slice(0, 8)), {
              permanent: false,
              direction: 'top',
              opacity: 1,
              className: 'fire-hover-tooltip',
              offset: [0, -2],
              sticky: true,
            });

            circle.bindPopup(
              '<div style="min-width:160px">' +
                '<div style="font-weight:700">' + (fire.displayName || ('Fire ' + String(fire.fire_id).slice(0, 8))) + '</div>' +
                '<div style="font-size:12px;color:#475569;margin-top:4px">' + (severityLevel >= 8 ? 'Critical' : severityLevel >= 6 ? 'High' : severityLevel >= 3 ? 'Moderate' : 'Low') + '</div>' +
                '<div style="font-size:11px;color:#64748b;margin-top:4px">' +
                  fire.coords.lat.toFixed(5) + ', ' + fire.coords.lng.toFixed(5) +
                '</div>' +
              '</div>'
            );

            fireZones.push(circle);
            focusMarkers.fires[fire.fire_id] = circle;
          });

          fitEverythingOnce();
        };

        window.focusResponder = function(responderId) {
          const marker = focusMarkers.responders[responderId];
          if (!marker) return;
          const ll = marker.getLatLng();
          map.flyTo([ll.lat, ll.lng], Math.max(map.getZoom(), 14), { duration: 0.8 });
          marker.openPopup();
        };

        window.focusUnit = function(unitId) {
          const marker = focusMarkers.units[unitId];
          if (!marker) return;
          const ll = marker.getLatLng();
          map.flyTo([ll.lat, ll.lng], Math.max(map.getZoom(), 15), { duration: 0.8 });
          marker.openPopup();
        };

        window.focusFire = function(fireId) {
          const circle = focusMarkers.fires[fireId];
          if (!circle) return;
          map.flyToBounds(circle.getBounds(), { padding: [40, 40], duration: 0.8 });
          circle.openPopup();
        };

        window.resetMap = function() {
          hasFitted = false;
          fitEverythingOnce();
        };

        window.ReactNativeWebView.postMessage('MAP_READY');
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    if (!mapReady || !webViewRef.current) return;

    const payload = (units || []).map(unit => ({
      ...unit,
      statusColor: unit.isMe ? C.tangerine : (RESPONDER_STATUS_COLORS[unit.status] || C.slate),
    }));

    webViewRef.current.injectJavaScript(`
      window.updateUnits(${JSON.stringify(payload)});
      true;
    `);
  }, [mapReady, units]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current) return;

    webViewRef.current.injectJavaScript(`
      window.updateFires(${JSON.stringify(fires || [])});
      true;
    `);
  }, [mapReady, fires]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current || !selectedResponderId) return;
    webViewRef.current.injectJavaScript(`
      window.focusResponder(${JSON.stringify(selectedResponderId)});
      true;
    `);
    setShowRecenter(true);
  }, [mapReady, selectedResponderId]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current || !selectedUnitId) return;
    webViewRef.current.injectJavaScript(`
      window.focusUnit(${JSON.stringify(selectedUnitId)});
      true;
    `);
    setShowRecenter(true);
  }, [mapReady, selectedUnitId]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current || !selectedFireId) return;
    webViewRef.current.injectJavaScript(`
      window.focusFire(${JSON.stringify(selectedFireId)});
      true;
    `);
    setShowRecenter(true);
  }, [mapReady, selectedFireId]);

  const handleRecenter = () => {
    if (!webViewRef.current) return;
    webViewRef.current.injectJavaScript(`
      window.resetMap();
      true;
    `);
    setShowRecenter(false);
  };

  if (!WebViewComponent) {
    return (
      <View style={styles.mapFallbackContainer}>
        <Text style={styles.mapFallbackText}>Map unavailable on this device</Text>
      </View>
    );
  }

  return (
    <View style={styles.mapPlaceholder}>
      <WebViewComponent
        ref={webViewRef}
        source={{ html: mapHTML }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        onMessage={event => {
          const msg = event.nativeEvent.data;
          if (msg === 'MAP_READY') setMapReady(true);
          if (msg === 'SHOW_RECENTER') setShowRecenter(true);
        }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />

      {!mapReady ? (
        <View style={styles.mapLoadingOverlay}>
          <ActivityIndicator color={C.tangerine} />
          <Text style={styles.mapLoadingText}>Loading map...</Text>
        </View>
      ) : null}

      {showRecenter ? (
        <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
          <Text style={styles.recenterButtonText}>Recenter</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
