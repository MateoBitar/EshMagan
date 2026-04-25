import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import styles, { C, RESPONDER_STATUS_COLORS } from '../../../styles/screens/ResponderCommandView.styles';
import { getFireZoneRadiusMeters, getFireZoneStyle } from '../../responder/utils/helpers';

const ASSETS = {
  pin: Platform.select({
    web: { uri: '/pin.png' },
    android: { uri: 'pin' },
    ios: { uri: 'pin' },
    default: { uri: 'pin' },
  }),
};

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
          severityLevel,
          radius: getFireZoneRadiusMeters(severityLevel),
          fillColor: style.fill,
          strokeColor: style.stroke,
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
        .leaflet-interactive:active,
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
        let userMarker = null;
        let focusMarkers = { fires: {}, responders: {}, user: null };
        let hasCenteredInitially = false;
        let latestUser = null;
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
          if (userMarker) {
            try { userMarker.closePopup(); } catch {}
          }
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
          window.ReactNativeWebView.postMessage('SHOW_RECENTER');
        });

        map.on('click', function() {
          if (suppressNextMapClick) {
            suppressNextMapClick = false;
            return;
          }
          closeAllFireTooltips();
        });

        window.setUser = function(user) {
          latestUser = user || null;

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
                    Number(responder.coords.lat).toFixed(5) + ', ' + Number(responder.coords.lng).toFixed(5) +
                  '</div>' +
                '</div>'
              )
              .addTo(map);

            markers.push(marker);
            focusMarkers.responders[responder.responder_id] = marker;
          });
        };

        window.updateFires = function(fires) {
          closeFireSidePopup();
          closeAllFireTooltips();

          fireZones.forEach(f => {
            try { f.remove(); } catch {}
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
          closeFireSidePopup();
          closeAllFireTooltips();
          closeAllLayerPopups();

          if (latestUser && validPair(latestUser.lat, latestUser.lng)) {
            map.flyTo(
              [Number(latestUser.lat), Number(latestUser.lng)],
              15,
              { animate: true, duration: 0.8 }
            );
            map.once('moveend', function() { hideRecenter(); });
            return;
          }

          hideRecenter();
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
      })();
      true;
    `;

    webViewRef.current.injectJavaScript(script);
  };

  useEffect(() => {
    injectAll();
  }, [mapReady, userCoords, safeResponders, safeFires]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current || !selectedFireId) return;
    webViewRef.current.injectJavaScript(`
      window.focusFire(${JSON.stringify(selectedFireId)});
      true;
    `);
    setShowRecenter(false);
  }, [mapReady, selectedFireId]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current || !selectedResponderId) return;
    webViewRef.current.injectJavaScript(`
      window.focusResponder(${JSON.stringify(selectedResponderId)});
      true;
    `);
    setShowRecenter(false);
  }, [mapReady, selectedResponderId]);

  const handleRecenter = () => {
    if (!webViewRef.current) return;
    webViewRef.current.injectJavaScript(`
      window.resetMap();
      true;
    `);
    setShowRecenter(false);
  };

  return (
    <View style={styles.mapPlaceholder}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHTML }}
        style={styles.webView}
        onMessage={event => {
          const msg = event.nativeEvent.data;
          if (msg === 'MAP_READY') setMapReady(true);
          else if (msg === 'SHOW_RECENTER') setShowRecenter(true);
          else if (msg === 'HIDE_RECENTER') setShowRecenter(false);
        }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        allowFileAccess
        allowUniversalAccessFromFileURLs
      />

      {!mapReady ? (
        <View style={styles.mapLoadingOverlay}>
          <ActivityIndicator color={C.tangerine} />
          <Text style={styles.mapLoadingText}>Loading map...</Text>
        </View>
      ) : null}

      {showRecenter ? (
        <TouchableOpacity onPress={handleRecenter} style={styles.recenterButton}>
          <View style={styles.recenterContent}>
            <Image source={ASSETS.pin} style={styles.recenterIcon} resizeMode="contain" />
            <Text style={styles.recenterButtonText}>Recenter</Text>
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}