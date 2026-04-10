import React, { useEffect, useRef, useState } from 'react';
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
        let municipalityMarker = null;
        let focusMarkers = { fires: {}, responders: {}, municipality: null };
        let hasFitted = false;

        function validPair(lat, lng) {
          return Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
        }

        map.on('dragstart zoomstart', function() {
          window.ReactNativeWebView.postMessage('SHOW_RECENTER');
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

        window.setMunicipality = function(muni) {
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
          markers.forEach(m => {
            try { m.remove(); } catch {}
          });
          markers = [];
          focusMarkers.responders = {};

          const validResponders = (responders || []).filter(
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
          (responders || []).forEach(responder => {
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

          fitEverythingOnce();
        };

        window.focusEntity = function(fireId, responderId) {
          const fireTarget = fireId ? focusMarkers.fires[fireId] : null;
          const responderTarget = responderId ? focusMarkers.responders[responderId] : null;
          const target = fireTarget || responderTarget;
          if (!target) return;

          let latlng = null;

          if (typeof target.getLatLng === 'function') {
            latlng = target.getLatLng();
          } else if (typeof target.getBounds === 'function') {
            latlng = target.getBounds().getCenter();
          }

          if (!latlng || !validPair(latlng.lat, latlng.lng)) return;

          map.flyTo(latlng, 15, { animate: true, duration: 0.8 });

          if (typeof target.openPopup === 'function') target.openPopup();
          if (typeof target.openTooltip === 'function' && fireTarget) target.openTooltip();
        };

        window.recenterToAll = function(muni, responders, fires) {
          if (muni && validPair(muni.lat, muni.lng)) {
            map.flyTo([Number(muni.lat), Number(muni.lng)], 15, {
              animate: true,
              duration: 0.8
            });
            return;
          }

          const validResponders = (responders || []).filter(
            r => r.coords && validPair(r.coords.lat, r.coords.lng)
          );

          const validFires = (fires || []).filter(
            f => f.coords && validPair(f.coords.lat, f.coords.lng)
          );

          let combinedBounds = null;

          validResponders.forEach(r => {
            const ll = L.latLng(Number(r.coords.lat), Number(r.coords.lng));
            combinedBounds = combinedBounds ? combinedBounds.extend(ll) : L.latLngBounds([ll, ll]);
          });

          (responders || []).forEach(r => {
            if (!r.unitCoords || !validPair(r.unitCoords.lat, r.unitCoords.lng)) return;
            const ll = L.latLng(Number(r.unitCoords.lat), Number(r.unitCoords.lng));
            combinedBounds = combinedBounds ? combinedBounds.extend(ll) : L.latLngBounds([ll, ll]);
          });

          validFires.forEach(f => {
            const circleBounds = L.circle(
              [Number(f.coords.lat), Number(f.coords.lng)],
              { radius: Number(f.radius) || 0 }
            ).getBounds();

            combinedBounds = combinedBounds ? combinedBounds.extend(circleBounds) : circleBounds;
          });

          if (combinedBounds && typeof combinedBounds.isValid === 'function' && combinedBounds.isValid()) {
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
    if (!mapReady || !webViewRef.current) return;

    webViewRef.current.injectJavaScript(`
      window.focusEntity(${JSON.stringify(selectedFireId || null)}, ${JSON.stringify(selectedResponderId || null)});
      true;
    `);
  }, [selectedFireId, selectedResponderId, mapReady]);

  const handleRecenter = () => {
    if (!mapReady || !webViewRef.current) return;

    const respondersPayload = JSON.stringify(
      responders.map(r => ({
        ...r,
        statusColor: RESPONDER_STATUS_COLORS[r.responder_status] || C.slate,
      }))
    );

    const firesPayload = JSON.stringify(
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
      window.recenterToAll(${JSON.stringify(municipalityCoords || null)}, ${respondersPayload}, ${firesPayload});
      true;
    `);

    setShowRecenter(false);
  };

  return (
    <View style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}>
      <WebView
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
            <Text style={styles.mapLoadingText}>Loading map.</Text>
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