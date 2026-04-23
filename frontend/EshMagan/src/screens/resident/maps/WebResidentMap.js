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

export default function WebResidentMap({
  fires,
  responders,
  userCoords,
  selectedFireId,
  selectedResponderId,
}) {
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef([]);
  const fireLayerRef = useRef([]);
  const markerMapRef = useRef({ fires: {}, responders: {}, user: null });
  const hasCenteredInitiallyRef = useRef(false);
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

    markerLayerRef.current.forEach(m => {
      try { m.remove(); } catch {}
    });
    markerLayerRef.current = [];

    fireLayerRef.current.forEach(f => {
      try { f.remove(); } catch {}
    });
    fireLayerRef.current = [];

    markerMapRef.current = { fires: {}, responders: {}, user: null };

    const validResponders = (responders || []).filter(
      r => r.coords && isValidCoordPair(r.coords.lat, r.coords.lng)
    );
    const validFires = (fires || []).filter(
      f => f.coords && isValidCoordPair(f.coords.lat, f.coords.lng)
    );

    if (userCoords && isValidCoordPair(userCoords.lat, userCoords.lng)) {
      const blueDotIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            width:14px;
            height:14px;
            border-radius:999px;
            background:#3b82f6;
            border:3px solid #ffffff;
            box-shadow:0 2px 6px rgba(0,0,0,0.45);
          "></div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const userMarker = L.marker([userCoords.lat, userCoords.lng], { icon: blueDotIcon })
        .bindPopup(`
          <div style="min-width:140px">
            <div style="font-weight:700">Your location</div>
            <div style="font-size:11px;color:#64748b;margin-top:4px">
              ${userCoords.lat.toFixed(5)}, ${userCoords.lng.toFixed(5)}
            </div>
          </div>
        `)
        .addTo(map);

      markerLayerRef.current.push(userMarker);
      markerMapRef.current.user = userMarker;
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
        <div style="min-width:160px">
          <div style="font-weight:700">${fire.displayName || `Fire ${String(fire.fire_id).slice(0, 8)}`}</div>
          <div style="font-size:12px;color:#475569;margin-top:4px">${getSeverityLabel(severityLevel)}</div>
          <div style="font-size:11px;color:#64748b;margin-top:4px">
            ${fire.coords.lat.toFixed(5)}, ${fire.coords.lng.toFixed(5)}
          </div>
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
    });
  }, [fires, responders, userCoords]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!userCoords || !isValidCoordPair(userCoords.lat, userCoords.lng)) return;
    if (hasCenteredInitiallyRef.current) return;

    map.flyTo(
      [Number(userCoords.lat), Number(userCoords.lng)],
      15,
      { animate: true, duration: 0.8 }
    );

    hasCenteredInitiallyRef.current = true;
  }, [userCoords]);

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

      if (userCoords && isValidCoordPair(userCoords.lat, userCoords.lng)) {
        map.flyTo(
          [Number(userCoords.lat), Number(userCoords.lng)],
          15,
          { animate: true, duration: 0.8 }
        );
        setShowRecenter(false);
      }
    } catch (error) {
      console.error('WebResidentMap recenter failed:', error);
    }
  };

  return (
    <View style={styles.mapPlaceholder}>
      <View ref={divRef} style={{ width: '100%', height: '100%' }} />
      {showRecenter ? (
        <TouchableOpacity onPress={handleRecenter} style={styles.recenterButton}>
          <Text style={styles.recenterButtonText}>📍 Recenter</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}