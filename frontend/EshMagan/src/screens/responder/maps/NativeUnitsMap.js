import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import styles, { C, RESPONDER_STATUS_COLORS } from '../../../styles/screens/ResponderCommandView.styles';
import { getFireZoneRadiusMeters, getFireZoneStyle } from '../utils/helpers';

const ASSETS = {
  pin: Platform.select({
    web: { uri: '/pin.png' },
    android: { uri: 'pin' },
    ios: { uri: 'pin' },
    default: { uri: 'pin' },
  }),
};

function isValidCoordPair(lat, lng) {
  return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
}

function getSeverityLabel(level) {
  if (!level) return 'Unknown';
  if (level >= 8) return 'Critical';
  if (level >= 6) return 'High';
  if (level >= 3) return 'Moderate';
  return 'Low';
}

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

  const unitsPayload = (units || []).map(unit => ({
    ...unit,
    statusColor: unit.isMe ? C.tangerine : (RESPONDER_STATUS_COLORS[unit.status] || C.slate),
  }));

  const firesPayload = (fires || []).map(fire => {
    const severityLevel = Number(fire.fire_severitylevel ?? fire.severity ?? 0);
    const style = getFireZoneStyle(severityLevel);

    return {
      ...fire,
      severityLevel,
      radius: getFireZoneRadiusMeters(severityLevel),
      fillColor: style.fill,
      strokeColor: style.stroke,
      fillOpacity: style.fillOpacity,
      severityLabel: getSeverityLabel(severityLevel),
    };
  });

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
          background: #000 !important;
          color: #fff !important;
          border: none !important;
          border-radius: 6px !important;
          padding: 4px 8px !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25) !important;
        }

        .fire-hover-tooltip:before,
        .fire-hover-tooltip::before {
          display: none !important;
        }

        .leaflet-interactive {
          outline: none !important;
          -webkit-tap-highlight-color: transparent !important;
          tap-highlight-color: transparent !important;
        }

        .leaflet-interactive:focus,
        .leaflet-interactive:active {
          outline: none !important;
          box-shadow: none !important;
        }

        svg path:focus,
        svg path:active {
          outline: none !important;
          box-shadow: none !important;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { zoomControl: true }).setView([33.8938, 35.5018], 9);

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
        let followUser = true;
        let hasCenteredInitially = false;
        let latestMeResponder = null;
        let latestUnits = [];
        let activeFireSidePopup = null;
        let activeFireTapTooltip = null;
        let suppressNextMapClick = false;

        function validPair(lat, lng) {
          return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
        }

        function hideRecenter() {
          window.ReactNativeWebView.postMessage('HIDE_RECENTER');
        }

        function closeFireSidePopup() {
          if (activeFireSidePopup) {
            try { map.closePopup(activeFireSidePopup); } catch {}
            activeFireSidePopup = null;
          }
        }

        function closeFireTapTooltip() {
          if (activeFireTapTooltip) {
            try { map.removeLayer(activeFireTapTooltip); } catch {}
            activeFireTapTooltip = null;
          }
        }

        function closeAllLayerPopups() {
          markers.forEach(layer => {
            try { layer.closePopup(); } catch {}
          });
        }

        function closeAllFireTooltips() {
          closeFireTapTooltip();
        }

        function buildFirePopupHtml(fire) {
          return (
            '<div style="min-width:160px">' +
              '<div style="font-weight:700">' + (fire.displayName || ('Fire ' + String(fire.fire_id).slice(0, 8))) + '</div>' +
              '<div style="font-size:12px;color:#475569;margin-top:4px">' + (fire.severityLabel || 'Unknown') + '</div>' +
              '<div style="font-size:11px;color:#64748b;margin-top:4px">' +
                Number(fire.coords.lat).toFixed(5) + ', ' + Number(fire.coords.lng).toFixed(5) +
              '</div>' +
            '</div>'
          );
        }

        map.on('dragstart zoomstart', function() {
          followUser = false;
          window.ReactNativeWebView.postMessage('SHOW_RECENTER');
        });

        map.on('click', function() {
          if (suppressNextMapClick) {
            suppressNextMapClick = false;
            return;
          }
          closeAllFireTooltips();
        });

        function fitEverythingOnce() {
          if (hasFitted) return;

          let combinedBounds = null;

          markers.forEach(m => {
            try {
              const ll = m.getLatLng();
              combinedBounds = combinedBounds ? combinedBounds.extend(ll) : L.latLngBounds([ll, ll]);
            } catch {}
          });

          fireZones.forEach(z => {
            try {
              const bounds = z.getBounds();
              combinedBounds = combinedBounds ? combinedBounds.extend(bounds) : bounds;
            } catch {}
          });

          if (combinedBounds) {
            map.fitBounds(combinedBounds, { padding: [40, 40] });
            hasFitted = true;
          }
        }

        window.updateUnits = function(units) {
          latestMeResponder = (units || []).find(u => u && u.isMe) || null;
          latestUnits = units || [];

          markers.forEach(m => {
            try { m.remove(); } catch {}
          });
          markers = [];
          focusMarkers.responders = {};
          focusMarkers.units = {};

          const validUnits = latestUnits.filter(u => u.coords && validPair(u.coords.lat, u.coords.lng));

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
                    Number(unit.coords.lat).toFixed(5) + ', ' + Number(unit.coords.lng).toFixed(5) +
                  '</div>' +
                  (unit.isMe ? '<div style="margin-top:6px;font-size:11px;color:#EC7742;font-weight:700">YOU</div>' : '') +
                '</div>'
              )
              .addTo(map);

            markers.push(marker);
            focusMarkers.responders[unit.responder_id] = marker;
          });

          const unitGroups = {};
          latestUnits.forEach(unit => {
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
                    Number(unit.unitCoords.lat).toFixed(5) + ', ' + Number(unit.unitCoords.lng).toFixed(5) +
                  '</div>' +
                '</div>'
              )
              .addTo(map);

            markers.push(marker);
            focusMarkers.units[unit.unitId] = marker;
          });

          fitEverythingOnce();
          if (
            latestMeResponder &&
            latestMeResponder.coords &&
            validPair(latestMeResponder.coords.lat, latestMeResponder.coords.lng)
          ) {
            const lat = Number(latestMeResponder.coords.lat);
            const lng = Number(latestMeResponder.coords.lng);

            if (!hasCenteredInitially) {
              map.flyTo([lat, lng], 15, { animate: true, duration: 0.8 });
              hasCenteredInitially = true;
            } else if (followUser) {
              map.panTo([userCoords.lat, userCoords.lng], {
                animate: true,
                duration: 0.5,
              });
            }
          }
        };

        window.updateFires = function(fires) {
          closeFireSidePopup();
          closeAllFireTooltips();

          fireZones.forEach(z => {
            try { z.remove(); } catch {}
          });
          fireZones = [];
          focusMarkers.fires = {};

          const validFires = (fires || []).filter(f => f.coords && validPair(f.coords.lat, f.coords.lng));

          validFires.forEach(fire => {
            const circle = L.circle([fire.coords.lat, fire.coords.lng], {
              radius: Number(fire.radius || 0),
              color: fire.strokeColor,
              weight: 2.5,
              fillColor: fire.fillColor,
              fillOpacity: Number(fire.fillOpacity ?? 0.28),
            }).addTo(map);

            circle.fireData = fire;

            circle.on('click', function(e) {
              suppressNextMapClick = true;
              closeFireSidePopup();
              closeAllLayerPopups();
              closeAllFireTooltips();

              activeFireTapTooltip = L.tooltip({
                permanent: false,
                direction: 'top',
                opacity: 1,
                className: 'fire-hover-tooltip',
                offset: [0, -2],
              })
                .setLatLng(e.latlng)
                .setContent(fire.displayName || ('Fire ' + String(fire.fire_id).slice(0, 8)))
                .addTo(map);

              if (e && e.originalEvent) {
                if (typeof e.originalEvent.preventDefault === 'function') e.originalEvent.preventDefault();
                if (typeof e.originalEvent.stopPropagation === 'function') e.originalEvent.stopPropagation();
              }
            });

            fireZones.push(circle);
            focusMarkers.fires[fire.fire_id] = circle;
          });

          fitEverythingOnce();
        };

        window.focusResponder = function(responderId) {
          closeFireSidePopup();
          closeAllFireTooltips();

          const marker = focusMarkers.responders[responderId];
          if (!marker) return;

          const ll = marker.getLatLng();
          try { marker.openPopup(); } catch {}

          map.flyTo([ll.lat, ll.lng], 15, { animate: true, duration: 0.8 });
          map.once('moveend', function() { hideRecenter(); });
        };

        window.focusUnit = function(unitId) {
          closeFireSidePopup();
          closeAllFireTooltips();

          const marker = focusMarkers.units[unitId];
          if (!marker) return;

          const ll = marker.getLatLng();
          try { marker.openPopup(); } catch {}

          map.flyTo([ll.lat, ll.lng], 15, { animate: true, duration: 0.8 });
          map.once('moveend', function() { hideRecenter(); });
        };

        window.focusFire = function(fireId) {
          closeFireSidePopup();
          closeAllFireTooltips();
          closeAllLayerPopups();

          const circle = focusMarkers.fires[fireId];
          if (!circle || !circle.fireData) return;

          const fire = circle.fireData;
          const center = circle.getBounds().getCenter();

          activeFireSidePopup = L.popup({
            closeButton: true,
            autoClose: false,
            closeOnClick: true,
            offset: [0, -8],
          })
            .setLatLng(center)
            .setContent(buildFirePopupHtml(fire))
            .openOn(map);

          map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 14), { animate: true, duration: 0.8 });
          map.once('moveend', function() { hideRecenter(); });
        };

        window.resetMap = function() {
          followUser = true;
          closeFireSidePopup();
          closeAllFireTooltips();

          const me = latestUnits.find(unit => unit && unit.isMe);

          if (me && me.coords && validPair(me.coords.lat, me.coords.lng)) {
            map.flyTo([Number(me.coords.lat), Number(me.coords.lng)], 15, { animate: true, duration: 0.8 });
            map.once('moveend', function() { hideRecenter(); });
            return;
          }

          if (me && me.unitCoords && validPair(me.unitCoords.lat, me.unitCoords.lng)) {
            map.flyTo([Number(me.unitCoords.lat), Number(me.unitCoords.lng)], 15, { animate: true, duration: 0.8 });
            map.once('moveend', function() { hideRecenter(); });
            return;
          }

          hasFitted = false;
          fitEverythingOnce();
          setTimeout(() => { hideRecenter(); }, 50);
        };

        window.ReactNativeWebView.postMessage('MAP_READY');
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    if (!mapReady || !webViewRef.current) return;
    webViewRef.current.injectJavaScript(`
      window.updateUnits(${JSON.stringify(unitsPayload)});
      true;
    `);
  }, [mapReady, unitsPayload]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current || !selectedResponderId) return;
    webViewRef.current.injectJavaScript(`
      window.focusResponder(${JSON.stringify(selectedResponderId)});
      true;
    `);
    setShowRecenter(false);
  }, [mapReady, selectedResponderId]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current || !selectedUnitId) return;
    webViewRef.current.injectJavaScript(`
      window.focusUnit(${JSON.stringify(selectedUnitId)});
      true;
    `);
    setShowRecenter(false);
  }, [mapReady, selectedUnitId]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current || !selectedFireId) return;
    webViewRef.current.injectJavaScript(`
      window.focusFire(${JSON.stringify(selectedFireId)});
      true;
    `);
    setShowRecenter(false);
  }, [mapReady, selectedFireId]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current) return;
    webViewRef.current.injectJavaScript(`
      window.updateFires(${JSON.stringify(firesPayload)});
      true;
    `);
  }, [mapReady, firesPayload]);

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
          if (msg === 'HIDE_RECENTER') setShowRecenter(false);
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
          <View style={styles.recenterContent}>
            <Image source={ASSETS.pin} style={styles.recenterIcon} resizeMode="contain" />
            <Text style={styles.recenterButtonText}>Recenter</Text>
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}