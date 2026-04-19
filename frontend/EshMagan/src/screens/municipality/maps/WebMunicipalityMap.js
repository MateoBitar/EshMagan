import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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

export default function WebMunicipalityMap({
  fires,
  responders,
  municipalityCoords,
  selectedFireId,
  selectedResponderId,
}) {
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef([]);
  const fireLayerRef = useRef([]);
  const markerMapRef = useRef({ fires: {}, responders: {}, municipality: null });
  const hasFittedRef = useRef(false);
  const [showRecenter, setShowRecenter] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !divRef.current) return;

    if (!document.getElementById('leaflet-css')) {
      const lnk = document.createElement('link');
      lnk.id = 'leaflet-css';
      lnk.rel = 'stylesheet';
      lnk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(lnk);
    }

    if (!document.getElementById('fire-tooltip-style')) {
      const styleTag = document.createElement('style');
      styleTag.id = 'fire-tooltip-style';
      styleTag.innerHTML = `
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

        .fire-hover-tooltip:before {
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
      `;
      document.head.appendChild(styleTag);
    }

    const doInit = () => {
      if (mapRef.current) return;
      const L = window.L;
      if (!L) return;

      const map = L.map(divRef.current, { zoomControl: true }).setView([33.8938, 35.5018], 9);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20,
        detectRetina: true,
      }).addTo(map);

      map.on('dragstart zoomstart', () => {
        setShowRecenter(true);
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
    if (!map || !L) return;

    markerLayerRef.current.forEach(layer => {
      try { layer.remove(); } catch {}
    });
    markerLayerRef.current = [];

    fireLayerRef.current.forEach(layer => {
      try { layer.remove(); } catch {}
    });
    fireLayerRef.current = [];

    markerMapRef.current = { fires: {}, responders: {}, municipality: null };

    const validResponders = (responders || []).filter(r => r.coords && isValidCoordPair(r.coords.lat, r.coords.lng));
    const validFires = (fires || []).filter(f => f.coords && isValidCoordPair(f.coords.lat, f.coords.lng));

    let combinedBounds = null;

    const extendBoundsWithLatLng = (lat, lng) => {
      if (!isValidCoordPair(lat, lng)) return;
      const ll = L.latLng(Number(lat), Number(lng));
      combinedBounds = combinedBounds ? combinedBounds.extend(ll) : L.latLngBounds([ll, ll]);
    };

    const extendBoundsWithBounds = bounds => {
      if (!bounds) return;
      combinedBounds = combinedBounds ? combinedBounds.extend(bounds) : bounds;
    };

    if (municipalityCoords && isValidCoordPair(municipalityCoords.lat, municipalityCoords.lng)) {
      const muniIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            width:26px;
            height:26px;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#EC7742;
            border:3px solid #fff;
            border-radius:999px;
            box-shadow:0 2px 8px rgba(0,0,0,0.25);
            color:#fff;
            font-size:14px;
            font-weight:800;
          ">M</div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const muniMarker = L.marker([municipalityCoords.lat, municipalityCoords.lng], { icon: muniIcon })
        .bindPopup(`
          <div style="min-width:140px">
            <div style="font-weight:700">Municipality</div>
            <div style="font-size:11px;color:#64748b;margin-top:4px">
              ${municipalityCoords.lat.toFixed(5)}, ${municipalityCoords.lng.toFixed(5)}
            </div>
          </div>
        `)
        .addTo(map);

      markerLayerRef.current.push(muniMarker);
      markerMapRef.current.municipality = muniMarker;
      extendBoundsWithLatLng(municipalityCoords.lat, municipalityCoords.lng);
    }

    validResponders.forEach(responder => {
      const color = RESPONDER_STATUS_COLORS[responder.responder_status] || C.slate;

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            width:18px;
            height:18px;
            background:${color};
            border:3px solid #fff;
            border-radius:50%;
            box-shadow:0 2px 8px rgba(0,0,0,0.35)
          "></div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([responder.coords.lat, responder.coords.lng], { icon })
        .bindPopup(`
          <div style="min-width:140px">
            <div style="font-weight:700">${responder.displayName || responder.unit_nb || 'Responder'}</div>
            <div style="font-size:12px;color:#475569;margin-top:4px">${responder.responder_status || 'Unknown'}</div>
            <div style="font-size:11px;color:#64748b;margin-top:4px">
              ${responder.coords.lat.toFixed(5)}, ${responder.coords.lng.toFixed(5)}
            </div>
          </div>
        `)
        .addTo(map);

      markerLayerRef.current.push(marker);
      markerMapRef.current.responders[responder.responder_id] = marker;
      extendBoundsWithLatLng(responder.coords.lat, responder.coords.lng);
    });

    const responderGroups = {};
    validResponders.forEach(responder => {
      if (!responder.unit_nb || !responder.unitCoords || !isValidCoordPair(responder.unitCoords.lat, responder.unitCoords.lng)) return;
      if (!responderGroups[responder.unit_nb]) responderGroups[responder.unit_nb] = responder;
    });

    Object.values(responderGroups).forEach(responder => {
      const baseIcon = L.divIcon({
        className: '',
        html: `
          <div style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white" stroke="#EC7742" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 10L12 3l9 7"></path>
              <path d="M5 10v9h14v-9"></path>
              <rect x="9" y="14" width="6" height="5"></rect>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([responder.unitCoords.lat, responder.unitCoords.lng], { icon: baseIcon })
        .bindPopup(`
          <div style="min-width:140px">
            <div style="font-weight:700">${responder.unit_nb}</div>
            <div style="font-size:12px;color:#475569;margin-top:4px">Unit location</div>
            <div style="font-size:11px;color:#64748b;margin-top:4px">
              ${responder.unitCoords.lat.toFixed(5)}, ${responder.unitCoords.lng.toFixed(5)}
            </div>
          </div>
        `)
        .addTo(map);

      markerLayerRef.current.push(marker);
      extendBoundsWithLatLng(responder.unitCoords.lat, responder.unitCoords.lng);
    });

    validFires.forEach(fire => {
      const severityLevel = Number(fire.fire_severitylevel ?? fire.severity ?? 0);
      const style = getFireZoneStyle(severityLevel);
      const radius = getFireZoneRadiusMeters(severityLevel);

      const circle = L.circle([fire.coords.lat, fire.coords.lng], {
        radius,
        color: style.stroke,
        weight: 2.5,
        fillColor: style.fill,
        fillOpacity: style.fillOpacity,
      }).addTo(map);

      circle.bindTooltip(fire.displayName || `Fire ${String(fire.fire_id).slice(0, 8)}`, {
        permanent: false,
        direction: 'top',
        opacity: 1,
        className: 'fire-hover-tooltip',
        offset: [0, -2],
        sticky: true,
      });

      circle.bindPopup(`
        <div style="min-width:140px">
          <div style="font-weight:700">${fire.displayName || 'Fire'}</div>
          <div style="font-size:12px;color:#475569;margin-top:4px">${getSeverityLabel(severityLevel)} · ${severityLevel || 'N/A'}</div>
          <div style="font-size:11px;color:#64748b;margin-top:4px">${fire.fire_source || 'Unknown source'}</div>
        </div>
      `);

      if (circle._path) {
        const stopEverything = e => {
          L.DomEvent.stopPropagation(e);
          L.DomEvent.preventDefault(e);
          L.DomEvent.stop(e);
        };

        L.DomEvent.on(circle._path, 'mousedown', stopEverything);
        L.DomEvent.on(circle._path, 'mouseup', stopEverything);
        L.DomEvent.on(circle._path, 'click', stopEverything);
        L.DomEvent.on(circle._path, 'dblclick', stopEverything);
        L.DomEvent.on(circle._path, 'contextmenu', stopEverything);

        circle.on('mouseover', function () {
          this.openTooltip();
        });

        circle.on('mouseout', function () {
          this.closeTooltip();
        });
      }

      markerMapRef.current.fires[fire.fire_id] = circle;
      fireLayerRef.current.push(circle);
      extendBoundsWithBounds(circle.getBounds());
    });

    if (!hasFittedRef.current && combinedBounds) {
      if (municipalityCoords && isValidCoordPair(municipalityCoords.lat, municipalityCoords.lng)) {
        map.setView(
          [Number(municipalityCoords.lat), Number(municipalityCoords.lng)],
          15
        );
        hasFittedRef.current = true;
      } else {
        map.fitBounds(combinedBounds, { padding: [40, 40] });
        hasFittedRef.current = true;
      }
    }
  }, [fires, responders, municipalityCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const fireTarget = selectedFireId ? markerMapRef.current.fires[selectedFireId] : null;
    const responderTarget = selectedResponderId ? markerMapRef.current.responders[selectedResponderId] : null;
    const target = fireTarget || responderTarget;
    if (!target) return;

    try {
      let latlng = null;
      let zoom = 15;

      if (typeof target.getLatLng === 'function') {
        latlng = target.getLatLng();
      } else if (typeof target.getBounds === 'function') {
        latlng = target.getBounds().getCenter();
        zoom = Math.max(map.getZoom(), 14);
      }

      if (!latlng || !isValidCoordPair(latlng.lat, latlng.lng)) return;

      map.flyTo(latlng, zoom, { animate: true, duration: 0.8 });
      if (typeof target.openPopup === 'function') target.openPopup();
      setShowRecenter(false);
    } catch {}
  }, [selectedFireId, selectedResponderId]);

  const handleRecenter = () => {
    try {
      const map = mapRef.current;
      if (!map) return;

      if (municipalityCoords && isValidCoordPair(municipalityCoords.lat, municipalityCoords.lng)) {
        map.flyTo(
          [Number(municipalityCoords.lat), Number(municipalityCoords.lng)],
          15,
          { animate: true, duration: 0.8 }
        );
        setShowRecenter(false);
        return;
      }

      const L = window.L;
      if (!L) return;

      let combinedBounds = null;

      const extendWithLatLng = (lat, lng) => {
        if (!isValidCoordPair(lat, lng)) return;
        const ll = L.latLng(Number(lat), Number(lng));
        combinedBounds = combinedBounds ? combinedBounds.extend(ll) : L.latLngBounds([ll, ll]);
      };

      const extendWithBounds = bounds => {
        if (!bounds) return;
        combinedBounds = combinedBounds ? combinedBounds.extend(bounds) : bounds;
      };

      markerLayerRef.current.forEach(layer => {
        try {
          if (typeof layer.getLatLng === 'function') {
            const ll = layer.getLatLng();
            extendWithLatLng(ll.lat, ll.lng);
          }
        } catch {}
      });

      fireLayerRef.current.forEach(layer => {
        try {
          if (typeof layer.getBounds === 'function') {
            extendWithBounds(layer.getBounds());
          } else if (typeof layer.getLatLng === 'function') {
            const ll = layer.getLatLng();
            extendWithLatLng(ll.lat, ll.lng);
          }
        } catch {}
      });

      if (combinedBounds && typeof combinedBounds.isValid === 'function' && combinedBounds.isValid()) {
        map.fitBounds(combinedBounds, { padding: [40, 40] });
      }

      setShowRecenter(false);
    } catch (error) {
      console.error('WebMunicipalityMap recenter failed:', error);
    }
  };

  return (
    <View style={styles.mapPlaceholder}>
      <View ref={divRef} style={{ width: '100%', height: '100%' }} />
      {showRecenter ? (
        <TouchableOpacity onPress={handleRecenter} style={styles.recenterButton}>
          <Text style={styles.recenterButtonText}>📍Recenter</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}