import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import styles, { C, RESPONDER_STATUS_COLORS } from '../../../styles/screens/ResponderCommandView.styles';
import { getFireZoneRadiusMeters, getFireZoneStyle } from '../../responder/utils/helpers';

function isValidCoordPair(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function getSeverityLabel(level) {
  if (!level) return 'Unknown';
  if (level >= 8) return 'Critical';
  if (level >= 6) return 'High';
  if (level >= 3) return 'Moderate';
  return 'Low';
}

export default function NativeResidentMap({
  fires,
  responders,
  userCoords,
  selectedFireId,
  selectedResponderId,
}) {
  const [mapReady, setMapReady] = useState(false);
  const [showRecenter, setShowRecenter] = useState(false);
  const webViewRef = useRef(null);

  const safeResponders = useMemo(
    () =>
      (responders || []).map(responder => ({
        ...responder,
        statusColor: RESPONDER_STATUS_COLORS[responder.responder_status] || C.slate,
      })),
    [responders]
  );

  const safeFires = useMemo(
    () =>
      (fires || []).map(fire => {
        const severityLevel = Number(fire.fire_severitylevel ?? fire.severity ?? 0);
        const style = getFireZoneStyle(severityLevel);
        return {
          ...fire,
          radius: getFireZoneRadiusMeters(severityLevel),
          stroke: style.stroke,
          fill: style.fill,
          fillOpacity: style.fillOpacity,
          severityLabel: getSeverityLabel(severityLevel),
        };
      }),
    [fires]
  );

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body { margin:0; padding:0; height:100%; width:100%; overflow:hidden; background:#ddd; }
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
        let userMarker = null;
        let focusMarkers = { fires: {}, responders: {}, user: null };
        let hasCenteredInitially = false;

        function validPair(lat, lng) {
          return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
        }

        map.on('dragstart zoomstart', function() {
          window.ReactNativeWebView.postMessage('SHOW_RECENTER');
        });

        window.setUser = function(user) {
          if (userMarker) {
            try { userMarker.remove(); } catch {}
            userMarker = null;
          }

          focusMarkers.user = null;

          if (!user || !validPair(user.lat, user.lng)) return;

          const lat = Number(user.lat);
          const lng = Number(user.lng);

          const icon = L.divIcon({
            className: '',
            html:
              '<div style="width:14px;height:14px;border-radius:999px;background:#3b82f6;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.45);"></div>',
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          });

          userMarker = L.marker([lat, lng], { icon })
            .bindPopup(
              '<div style="min-width:140px">' +
                '<div style="font-weight:700">Your location</div>' +
                '<div style="font-size:11px;color:#64748b;margin-top:4px">' +
                  lat.toFixed(5) + ', ' + lng.toFixed(5) +
                '</div>' +
              '</div>'
            )
            .addTo(map);

          focusMarkers.user = userMarker;

          if (!hasCenteredInitially) {
            map.flyTo([lat, lng], 15, { animate: true, duration: 0.8 });
            hasCenteredInitially = true;
          }
        };

        window.updateResponders = function(responders) {
          markers.forEach(m => {
            try { m.remove(); } catch {}
          });
          markers = [];
          focusMarkers.responders = {};

          const validResponders = (responders || []).filter(r => r.coords && validPair(r.coords.lat, r.coords.lng));

          validResponders.forEach(responder => {
            const color = responder.statusColor || '${C.slate}';

            const icon = L.divIcon({
              className: '',
              html: '<div style="width:18px;height:18px;background:' + color + ';border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>',
              iconSize: [18, 18],
              iconAnchor: [9, 9]
            });

            const marker = L.marker([responder.coords.lat, responder.coords.lng], { icon })
              .bindPopup(
                '<div style="min-width:140px">' +
                  '<div style="font-weight:700">' + (responder.displayName || responder.unit_nb || 'Responder') + '</div>' +
                  '<div style="font-size:12px;color:#475569;margin-top:4px">' + (responder.responder_status || 'Unknown') + '</div>' +
                  '<div style="font-size:11px;color:#64748b;margin-top:4px">' +
                    responder.coords.lat.toFixed(5) + ', ' + responder.coords.lng.toFixed(5) +
                  '</div>' +
                '</div>'
              )
              .addTo(map);

            markers.push(marker);
            focusMarkers.responders[responder.responder_id] = marker;
          });
        };

        window.updateFires = function(fires) {
          fireZones.forEach(f => {
            try { f.remove(); } catch {}
          });
          fireZones = [];
          focusMarkers.fires = {};

          (fires || []).forEach(fire => {
            if (!fire.coords || !validPair(fire.coords.lat, fire.coords.lng)) return;

            const severityLevel = Number(fire.fire_severitylevel ?? fire.severity ?? 0);

            const zone = L.circle([fire.coords.lat, fire.coords.lng], {
              radius: fire.radius,
              color: fire.stroke,
              weight: 2.5,
              fillColor: fire.fill,
              fillOpacity: fire.fillOpacity
            }).addTo(map);

            zone.bindPopup(
              '<div style="min-width:140px">' +
                '<div style="font-weight:700">' + (fire.displayName || 'Fire') + '</div>' +
                '<div style="font-size:12px;color:#475569;margin-top:4px">' + (fire.severityLabel || 'Unknown') + ' · ' + (severityLevel || 'N/A') + '</div>' +
                '<div style="font-size:11px;color:#64748b;margin-top:4px">' + (fire.fire_source || 'Unknown source') + '</div>' +
              '</div>'
            );

            focusMarkers.fires[fire.fire_id] = zone;

            const tooltip = L.tooltip({
              permanent: false,
              direction: 'top',
              opacity: 1,
              className: 'fire-hover-tooltip',
              offset: [0, -2],
              sticky: true
            }).setContent(fire.displayName || ('Fire ' + String(fire.fire_id).slice(0, 8)));

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
        };

        window.focusEntity = function(fireId, responderId) {
          const fireTarget = fireId ? focusMarkers.fires[fireId] : null;
          const responderTarget = responderId ? focusMarkers.responders[responderId] : null;
          const target = fireTarget || responderTarget;
          if (!target) return;

          let center = null;

          try {
            if (typeof target.getLatLng === 'function') {
              center = target.getLatLng();
            } else if (typeof target.getBounds === 'function') {
              center = target.getBounds().getCenter();
            }
          } catch {}

          if (!center || !validPair(center.lat, center.lng)) return;

          map.flyTo([center.lat, center.lng], 15, { animate: true, duration: 0.8 });

          try {
            if (typeof target.openPopup === 'function') target.openPopup();
          } catch {}

          try {
            if (fireTarget && typeof target.openTooltip === 'function') target.openTooltip();
          } catch {}

          window.ReactNativeWebView.postMessage('HIDE_RECENTER');
        };

        window.recenterToUser = function(user) {
          if (!user || !validPair(user.lat, user.lng)) return;
          map.flyTo([Number(user.lat), Number(user.lng)], 15, { animate: true, duration: 0.8 });
          window.ReactNativeWebView.postMessage('HIDE_RECENTER');
        };

        window.ReactNativeWebView.postMessage('MAP_READY');
      </script>
    </body>
    </html>
  `;

  const injectAll = () => {
    if (!webViewRef.current || !mapReady) return;

    const script = `
      (function() {
        if (window.setUser) {
          window.setUser(${JSON.stringify(userCoords || null)});
        }
        if (window.updateResponders) {
          window.updateResponders(${JSON.stringify(safeResponders)});
        }
        if (window.updateFires) {
          window.updateFires(${JSON.stringify(safeFires)});
        }
        if (window.focusEntity) {
          window.focusEntity(${JSON.stringify(selectedFireId || null)}, ${JSON.stringify(selectedResponderId || null)});
        }
      })();
      true;
    `;

    webViewRef.current.injectJavaScript(script);
  };

  useEffect(() => {
    injectAll();
  }, [mapReady, safeResponders, safeFires, userCoords, selectedFireId, selectedResponderId]);

  const handleRecenter = () => {
    if (!webViewRef.current || !userCoords || !isValidCoordPair(userCoords.lat, userCoords.lng)) return;

    const script = `
      (function() {
        if (window.recenterToUser) {
          window.recenterToUser(${JSON.stringify(userCoords)});
        }
      })();
      true;
    `;

    webViewRef.current.injectJavaScript(script);
    setShowRecenter(false);
  };

  const handleMessage = event => {
    const msg = event?.nativeEvent?.data;

    if (msg === 'MAP_READY') {
      setMapReady(true);
      return;
    }

    if (msg === 'SHOW_RECENTER') {
      setShowRecenter(true);
      return;
    }

    if (msg === 'HIDE_RECENTER') {
      setShowRecenter(false);
    }
  };

  return (
    <View style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#ddd' }}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHTML }}
        onMessage={handleMessage}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        style={{ flex: 1, backgroundColor: 'transparent' }}
      />

      {!mapReady ? (
        <View style={styles.mapLoadingBadge}>
          <ActivityIndicator size="small" color="#EC7742" />
          <Text style={styles.mapLoadingText}>Loading.</Text>
        </View>
      ) : null}

      {showRecenter ? (
        <TouchableOpacity onPress={handleRecenter} style={styles.recenterButton}>
          <Text style={styles.recenterButtonText}>📍 Recenter</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}