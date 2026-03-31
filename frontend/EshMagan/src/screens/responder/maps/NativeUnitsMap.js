import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import styles, { C, RESPONDER_STATUS_COLORS } from '../../../styles/screens/ResponderCommandView.styles';
import { getFireZoneRadiusMeters, getFireZoneStyle } from '../utils/helpers';

export default function NativeUnitsMap({ units, fires }) {
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
        html, body { margin:0; padding:0; height:100%; width:100%; }
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

        svg path:focus,
        svg path:active {
          outline: none !important;
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
        let hasFitted = false;

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
          markers.forEach(m => m.remove());
          markers = [];

          const validUnits = (units || []).filter(u => u.coords);

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
                  '<div style="font-weight:700">' + unit.responder_id + ' - ' + unit.unit_nb + '</div>' +
                  '<div style="font-size:12px;color:#475569;margin-top:4px">' + unit.status + '</div>' +
                  '<div style="font-size:11px;color:#64748b;margin-top:4px">' +
                    unit.coords.lat.toFixed(5) + ', ' + unit.coords.lng.toFixed(5) +
                  '</div>' +
                  (unit.isMe ? '<div style="margin-top:6px;font-size:11px;color:#EC7742;font-weight:700">YOU</div>' : '') +
                '</div>'
              )
              .addTo(map);

            markers.push(marker);
          });

          const unitGroups = {};
          validUnits.forEach(unit => {
            if (!unit.unit_nb || !unit.unitCoords) return;
            if (!unitGroups[unit.unit_nb]) {
              unitGroups[unit.unit_nb] = unit;
            }
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
                  '<div style="font-weight:700">' + unit.unit_nb + '</div>' +
                  '<div style="font-size:12px;color:#475569;margin-top:4px">Unit location</div>' +
                  '<div style="font-size:11px;color:#64748b;margin-top:4px">' +
                    unit.unitCoords.lat.toFixed(5) + ', ' + unit.unitCoords.lng.toFixed(5) +
                  '</div>' +
                '</div>'
              )
              .addTo(map);

            markers.push(marker);
          });

          fitEverythingOnce();
        };

        window.updateFires = function(fires) {
          fireZones.forEach(f => f.remove());
          fireZones = [];

          (fires || []).forEach(fire => {
            if (!fire.coords) return;

            const zone = L.circle([fire.coords.lat, fire.coords.lng], {
              radius: fire.radius,
              color: fire.stroke,
              weight: 2.5,
              fillColor: fire.fill,
              fillOpacity: fire.fillOpacity
            }).addTo(map);

            const tooltip = L.tooltip({
              permanent: false,
              direction: 'top',
              opacity: 1,
              className: 'fire-hover-tooltip',
              offset: [0, -2],
              sticky: true
            }).setContent('Fire ' + String(fire.fire_id).slice(0, 8));

            zone.bindTooltip(tooltip);

            let holdTimeout = null;
            let tooltipOpenedByHold = false;

            zone.on('touchstart', function(e) {
              L.DomEvent.stopPropagation(e);
              tooltipOpenedByHold = false;

              holdTimeout = setTimeout(function() {
                tooltipOpenedByHold = true;
                zone.openTooltip();
              }, 300);
            });

            zone.on('touchend touchcancel', function() {
              if (holdTimeout) {
                clearTimeout(holdTimeout);
                holdTimeout = null;
              }

              if (tooltipOpenedByHold) {
                zone.closeTooltip();
                tooltipOpenedByHold = false;
              }
            });

            zone.on('mouseover', function() {
              zone.openTooltip();
            });

            zone.on('mouseout', function() {
              zone.closeTooltip();
            });

            fireZones.push(zone);
          });

          fitEverythingOnce();
        };

        window.recenterToMe = function(lat, lng) {
          map.flyTo([lat, lng], 15, { animate: true, duration: 0.8 });
        };

        window.recenterToAll = function(units, fires) {
          const validUnits = (units || []).filter(u => u.coords);
          const validFires = (fires || []).filter(f => f.coords);

          let combinedBounds = null;

          validUnits.forEach(u => {
            const ll = L.latLng(u.coords.lat, u.coords.lng);
            combinedBounds = combinedBounds ? combinedBounds.extend(ll) : L.latLngBounds([ll, ll]);
          });

          validFires.forEach(f => {
            const circleBounds = L.circle([f.coords.lat, f.coords.lng], { radius: f.radius }).getBounds();
            combinedBounds = combinedBounds ? combinedBounds.extend(circleBounds) : circleBounds;
          });

          if (combinedBounds) {
            map.fitBounds(combinedBounds, { padding: [40, 40] });
          }
        };

        window.ReactNativeWebView.postMessage('MAP_READY');
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    if (!mapReady || !webViewRef.current) return;

    const payload = JSON.stringify(
      units.map(u => ({
        ...u,
        statusColor: RESPONDER_STATUS_COLORS[u.status] || C.slate,
      }))
    );

    webViewRef.current.injectJavaScript(`
      window.updateUnits(${payload});
      true;
    `);
  }, [units, mapReady]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current) return;

    const payload = JSON.stringify(
      fires.map(fire => {
        const style = getFireZoneStyle(fire.severity);
        return {
          ...fire,
          radius: getFireZoneRadiusMeters(fire.severity),
          stroke: style.stroke,
          fill: style.fill,
          fillOpacity: style.fillOpacity,
        };
      })
    );

    webViewRef.current.injectJavaScript(`
      window.updateFires(${payload});
      true;
    `);
  }, [fires, mapReady]);

  const handleRecenter = () => {
    if (!mapReady || !webViewRef.current) return;

    const myUnit = units.find(u => u.isMe && u.coords);

    if (myUnit) {
      webViewRef.current.injectJavaScript(`
        window.recenterToMe(${myUnit.coords.lat}, ${myUnit.coords.lng});
        true;
      `);
    } else {
      const unitsPayload = JSON.stringify(
        units.map(u => ({
          ...u,
          statusColor: RESPONDER_STATUS_COLORS[u.status] || C.slate,
        }))
      );

      const firesPayload = JSON.stringify(
        fires.map(fire => {
          const style = getFireZoneStyle(fire.severity);
          return {
            ...fire,
            radius: getFireZoneRadiusMeters(fire.severity),
            stroke: style.stroke,
            fill: style.fill,
            fillOpacity: style.fillOpacity,
          };
        })
      );

      webViewRef.current.injectJavaScript(`
        window.recenterToAll(${unitsPayload}, ${firesPayload});
        true;
      `);
    }

    setShowRecenter(false);
  };

  if (!WebViewComponent) {
    return (
      <View style={styles.mapFallbackContainer}>
        <Text style={styles.mapFallbackText}>react-native-webview is not installed</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}>
      <WebViewComponent
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHTML }}
        style={{ flex: 1, backgroundColor: '#ddd' }}
        onMessage={event => {
          const msg = event.nativeEvent.data;
          if (msg === 'MAP_READY') setMapReady(true);
          else if (msg === 'SHOW_RECENTER') setShowRecenter(true);
        }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        allowFileAccess
        allowUniversalAccessFromFileURLs
        startInLoadingState
        renderLoading={() => (
          <View style={styles.mapLoadingOverlay}>
            <ActivityIndicator color={C.tangerine} />
            <Text style={styles.mapLoadingText}>Loading map...</Text>
          </View>
        )}
      />

      {showRecenter && (
        <TouchableOpacity onPress={handleRecenter} style={styles.recenterButton}>
          <Text style={styles.recenterButtonText}>📍 Recenter</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
