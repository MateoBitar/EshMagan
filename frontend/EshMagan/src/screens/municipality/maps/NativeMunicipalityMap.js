import React, { useEffect, useRef, useState } from 'react';
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

export default function NativeMunicipalityMap({
  fires,
  responders,
  municipalityCoords,
  selectedFireId,
  selectedResponderId,
}) {
  const [mapReady, setMapReady] = useState(false);
  const [showRecenter, setShowRecenter] = useState(false);
  const webViewRef = useRef(null);

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
        .fire-hover-tooltip::before { display: none !important; }

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
        let municipalityMarker = null;
        let focusMarkers = { fires: {}, responders: {}, municipality: null };
        let hasFitted = false;
        let latestResponders = [];
        let latestFires = [];
        let latestMunicipality = null;
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
          if (municipalityMarker) {
            try { municipalityMarker.closePopup(); } catch {}
          }
        }

        function closeAllFireTooltips() {
          closeFireTapTooltip();
        }

        function buildFirePopupHtml(fire) {
          return (
            '<div style="min-width:140px">' +
              '<div style="font-weight:700">' + (fire.displayName || 'Fire') + '</div>' +
              '<div style="font-size:12px;color:#475569;margin-top:4px">' +
                (fire.severityLabel || 'Unknown') + ' · ' + (fire.fire_severitylevel || fire.severity || 'N/A') +
              '</div>' +
              '<div style="font-size:11px;color:#64748b;margin-top:4px">' + (fire.fire_source || 'Unknown source') + '</div>' +
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

        function fitEverythingOnce() {
          if (hasFitted) return;

          if (municipalityMarker) {
            try {
              const ll = municipalityMarker.getLatLng();
              if (ll && validPair(ll.lat, ll.lng)) {
                map.setView([Number(ll.lat), Number(ll.lng)], 15);
                hasFitted = true;
                return;
              }
            } catch {}
          }

          let combinedBounds = null;

          markers.forEach(layer => {
            try {
              const ll = layer.getLatLng();
              combinedBounds = combinedBounds ? combinedBounds.extend(ll) : L.latLngBounds([ll, ll]);
            } catch {}
          });

          fireZones.forEach(layer => {
            try {
              const bounds = layer.getBounds();
              combinedBounds = combinedBounds ? combinedBounds.extend(bounds) : bounds;
            } catch {}
          });

          if (combinedBounds) {
            map.fitBounds(combinedBounds, { padding: [40, 40] });
            hasFitted = true;
          }
        }

        window.setMunicipality = function(muni) {
          latestMunicipality = muni || null;

          if (municipalityMarker) {
            try { municipalityMarker.remove(); } catch {}
            municipalityMarker = null;
          }

          focusMarkers.municipality = null;

          if (!muni || !validPair(muni.lat, muni.lng)) return;

          const lat = Number(muni.lat);
          const lng = Number(muni.lng);

          const icon = L.divIcon({
            className: '',
            html:
              '<div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;background:#EC7742;border:3px solid #fff;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,0.25);color:#fff;font-size:14px;font-weight:800;">M</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          municipalityMarker = L.marker([lat, lng], { icon })
            .bindPopup(
              '<div style="min-width:140px">' +
                '<div style="font-weight:700">Municipality</div>' +
                '<div style="font-size:11px;color:#64748b;margin-top:4px">' +
                  lat.toFixed(5) + ', ' + lng.toFixed(5) +
                '</div>' +
              '</div>'
            )
            .addTo(map);

          focusMarkers.municipality = municipalityMarker;
          fitEverythingOnce();
        };

        window.updateResponders = function(responders) {
          latestResponders = responders || [];

          markers.forEach(m => {
            try { m.remove(); } catch {}
          });
          markers = [];
          focusMarkers.responders = {};

          const validResponders = latestResponders.filter(
            r => r.coords && validPair(r.coords.lat, r.coords.lng)
          );

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

          const responderGroups = {};
          latestResponders.forEach(responder => {
            if (!responder.unit_nb || !responder.unitCoords || !validPair(responder.unitCoords.lat, responder.unitCoords.lng)) return;
            if (!responderGroups[responder.unit_nb]) {
              responderGroups[responder.unit_nb] = responder;
            }
          });

          Object.values(responderGroups).forEach(responder => {
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

            const marker = L.marker([responder.unitCoords.lat, responder.unitCoords.lng], { icon: baseIcon })
              .bindPopup(
                '<div style="min-width:140px">' +
                  '<div style="font-weight:700">' + responder.unit_nb + '</div>' +
                  '<div style="font-size:12px;color:#475569;margin-top:4px">Unit location</div>' +
                  '<div style="font-size:11px;color:#64748b;margin-top:4px">' +
                    Number(responder.unitCoords.lat).toFixed(5) + ', ' + Number(responder.unitCoords.lng).toFixed(5) +
                  '</div>' +
                '</div>'
              )
              .addTo(map);

            markers.push(marker);
          });

          fitEverythingOnce();
        };

        window.updateFires = function(fires) {
          latestFires = fires || [];

          closeFireSidePopup();
          closeAllFireTooltips();

          fireZones.forEach(f => {
            try { f.remove(); } catch {}
          });
          fireZones = [];
          focusMarkers.fires = {};

          latestFires.forEach(fire => {
            if (!fire.coords || !validPair(fire.coords.lat, fire.coords.lng)) return;

            const zone = L.circle([fire.coords.lat, fire.coords.lng], {
              radius: fire.radius,
              color: fire.stroke,
              weight: 2.5,
              fillColor: fire.fill,
              fillOpacity: fire.fillOpacity
            }).addTo(map);

            zone.fireData = fire;

            zone.on('click', function(e) {
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

            focusMarkers.fires[fire.fire_id] = zone;
            fireZones.push(zone);
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

          if (latestMunicipality && validPair(latestMunicipality.lat, latestMunicipality.lng)) {
            map.flyTo(
              [Number(latestMunicipality.lat), Number(latestMunicipality.lng)],
              15,
              { animate: true, duration: 0.8 }
            );
            map.once('moveend', function() { hideRecenter(); });
            return;
          }

          let combinedBounds = null;

          markers.forEach(layer => {
            try {
              const ll = layer.getLatLng();
              combinedBounds = combinedBounds ? combinedBounds.extend(ll) : L.latLngBounds([ll, ll]);
            } catch {}
          });

          fireZones.forEach(layer => {
            try {
              const bounds = layer.getBounds();
              combinedBounds = combinedBounds ? combinedBounds.extend(bounds) : bounds;
            } catch {}
          });

          if (combinedBounds && typeof combinedBounds.isValid === 'function' && combinedBounds.isValid()) {
            map.fitBounds(combinedBounds, { padding: [40, 40] });
          }

          setTimeout(() => { hideRecenter(); }, 50);
        };

        window.ReactNativeWebView.postMessage('MAP_READY');
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    if (!mapReady || !webViewRef.current) return;

    const payload = JSON.stringify(
      responders.map(r => ({
        ...r,
        statusColor: RESPONDER_STATUS_COLORS[r.responder_status] || C.slate,
      }))
    );

    webViewRef.current.injectJavaScript(`
      window.updateResponders(${payload});
      true;
    `);
  }, [responders, mapReady]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current) return;

    const payload = JSON.stringify(
      fires.map(fire => {
        const severityLevel = Number(fire.fire_severitylevel ?? fire.severity ?? 0);
        const style = getFireZoneStyle(severityLevel);

        return {
          ...fire,
          fire_severitylevel: severityLevel,
          radius: getFireZoneRadiusMeters(severityLevel),
          stroke: style.stroke,
          fill: style.fill,
          fillOpacity: style.fillOpacity,
          severityLabel: getSeverityLabel(severityLevel),
        };
      })
    );

    webViewRef.current.injectJavaScript(`
      window.updateFires(${payload});
      true;
    `);
  }, [fires, mapReady]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current) return;

    webViewRef.current.injectJavaScript(`
      window.setMunicipality(${JSON.stringify(municipalityCoords || null)});
      true;
    `);
  }, [municipalityCoords, mapReady]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current || !selectedResponderId) return;

    webViewRef.current.injectJavaScript(`
      window.focusResponder(${JSON.stringify(selectedResponderId)});
      true;
    `);
    setShowRecenter(false);
  }, [selectedResponderId, mapReady]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current || !selectedFireId) return;

    webViewRef.current.injectJavaScript(`
      window.focusFire(${JSON.stringify(selectedFireId)});
      true;
    `);
    setShowRecenter(false);
  }, [selectedFireId, mapReady]);

  const handleRecenter = () => {
    if (!mapReady || !webViewRef.current) return;

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