import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles, { C, RESPONDER_STATUS_COLORS } from '../../../styles/screens/ResponderCommandView.styles';
import { getFireZoneRadiusMeters, getFireZoneStyle } from '../utils/helpers';

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

export default function WebUnitsMap({
  units,
  fires,
  selectedResponderId,
  selectedUnitId,
  selectedFireId,
}) {
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef([]);
  const fireLayerRef = useRef([]);
  const markerMapRef = useRef({ responders: {}, units: {}, fires: {} });
  const hasFittedRef = useRef(false);
  const [showRecenter, setShowRecenter] = useState(false);
  const followUserRef = useRef(true);
  const hasCenteredInitiallyRef = useRef(false);

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
        followUserRef.current = false;
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
      try { m.remove(); } catch { }
    });
    markerLayerRef.current = [];

    fireLayerRef.current.forEach(f => {
      try { f.remove(); } catch { }
    });
    fireLayerRef.current = [];

    markerMapRef.current = { responders: {}, units: {}, fires: {} };

    const validUnits = (units || []).filter(u => u.coords && isValidCoordPair(u.coords.lat, u.coords.lng));
    const validFires = (fires || []).filter(f => f.coords && isValidCoordPair(f.coords.lat, f.coords.lng));
    const me = (units || []).find(u => u.isMe);

    if (me?.coords && isValidCoordPair(me.coords.lat, me.coords.lng)) {
      const lat = Number(me.coords.lat);
      const lng = Number(me.coords.lng);

      if (!hasCenteredInitiallyRef.current) {
        map.flyTo([lat, lng], 15, { animate: true, duration: 0.8 });
        hasCenteredInitiallyRef.current = true;
      } else if (followUserRef.current) {
        map.panTo([userCoords.lat, userCoords.lng], {
          animate: true,
          duration: 0.5,
        });
      }
    }

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

    validUnits.forEach(unit => {
      const color = unit.isMe ? C.tangerine : (RESPONDER_STATUS_COLORS[unit.status] || C.slate);

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

      const marker = L.marker([unit.coords.lat, unit.coords.lng], { icon })
        .bindPopup(`
          <div style="min-width:140px">
            <div style="font-weight:700">${unit.displayName || `${unit.responder_id} - ${unit.unit_nb}`}</div>
            <div style="font-size:12px;color:#475569;margin-top:4px">${unit.status || 'Unknown'}</div>
            <div style="font-size:11px;color:#64748b;margin-top:4px">
              ${unit.coords.lat.toFixed(5)}, ${unit.coords.lng.toFixed(5)}
            </div>
            ${unit.isMe ? '<div style="margin-top:6px;font-size:11px;color:#EC7742;font-weight:700">YOU</div>' : ''}
          </div>
        `)
        .addTo(map);

      markerLayerRef.current.push(marker);
      markerMapRef.current.responders[unit.responder_id] = marker;
      extendBoundsWithLatLng(unit.coords.lat, unit.coords.lng);
    });

    const unitGroups = {};
    validUnits.forEach(unit => {
      if (!unit.unitId || !unit.unitCoords || !isValidCoordPair(unit.unitCoords.lat, unit.unitCoords.lng)) return;
      if (!unitGroups[unit.unitId]) unitGroups[unit.unitId] = unit;
    });

    Object.values(unitGroups).forEach(unit => {
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

      const marker = L.marker([unit.unitCoords.lat, unit.unitCoords.lng], { icon: baseIcon })
        .bindPopup(`
          <div style="min-width:140px">
            <div style="font-weight:700">${unit.unit_nb || 'Unit'}</div>
            <div style="font-size:12px;color:#475569;margin-top:4px">Unit location</div>
            <div style="font-size:11px;color:#64748b;margin-top:4px">
              ${unit.unitCoords.lat.toFixed(5)}, ${unit.unitCoords.lng.toFixed(5)}
            </div>
          </div>
        `)
        .addTo(map);

      markerLayerRef.current.push(marker);
      markerMapRef.current.units[unit.unitId] = marker;
      extendBoundsWithLatLng(unit.unitCoords.lat, unit.unitCoords.lng);
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

      fireLayerRef.current.push(circle);
      markerMapRef.current.fires[fire.fire_id] = circle;
      extendBoundsWithBounds(circle.getBounds());
    });

    if (!hasFittedRef.current && combinedBounds) {
      map.fitBounds(combinedBounds, { padding: [40, 40] });
      hasFittedRef.current = true;
    }
  }, [units, fires]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const fireTarget = selectedFireId ? markerMapRef.current.fires[selectedFireId] : null;
    const unitTarget = selectedUnitId ? markerMapRef.current.units[selectedUnitId] : null;
    const responderTarget = selectedResponderId ? markerMapRef.current.responders[selectedResponderId] : null;
    const target = fireTarget || unitTarget || responderTarget;
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
    } catch { }
  }, [selectedFireId, selectedUnitId, selectedResponderId]);

  const handleRecenter = () => {
    followUserRef.current = true;
    try {
      const map = mapRef.current;
      if (!map) return;

      const me = (units || []).find(unit => unit.isMe);

      if (me?.coords && isValidCoordPair(me.coords.lat, me.coords.lng)) {
        map.flyTo(
          [Number(me.coords.lat), Number(me.coords.lng)],
          15,
          { animate: true, duration: 0.8 }
        );
        setShowRecenter(false);
        return;
      }

      if (me?.unitCoords && isValidCoordPair(me.unitCoords.lat, me.unitCoords.lng)) {
        map.flyTo(
          [Number(me.unitCoords.lat), Number(me.unitCoords.lng)],
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
        } catch { }
      });

      fireLayerRef.current.forEach(layer => {
        try {
          if (typeof layer.getBounds === 'function') {
            extendWithBounds(layer.getBounds());
          } else if (typeof layer.getLatLng === 'function') {
            const ll = layer.getLatLng();
            extendWithLatLng(ll.lat, ll.lng);
          }
        } catch { }
      });

      if (combinedBounds && typeof combinedBounds.isValid === 'function' && combinedBounds.isValid()) {
        map.fitBounds(combinedBounds, { padding: [40, 40] });
      }

      setShowRecenter(false);
    } catch (error) {
      console.error('WebUnitsMap recenter failed:', error);
    }
  };

  return (
    <View style={styles.mapPlaceholder}>
      <View ref={divRef} style={{ width: '100%', height: '100%' }} />
      {showRecenter ? (
        <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
          <Text style={styles.recenterButtonText}>📍Recenter</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
