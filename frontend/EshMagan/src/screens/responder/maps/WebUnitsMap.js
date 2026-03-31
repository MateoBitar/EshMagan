import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles, { C, RESPONDER_STATUS_COLORS } from '../../../styles/screens/ResponderCommandView.styles';
import { getFireZoneRadiusMeters, getFireZoneStyle } from '../utils/helpers';

export default function WebUnitsMap({ units, fires }) {
  const divRef = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef([]);
  const fireLayerRef = useRef([]);
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

    markerLayerRef.current.forEach(m => m.remove());
    markerLayerRef.current = [];

    fireLayerRef.current.forEach(f => f.remove());
    fireLayerRef.current = [];

    const validUnits = units.filter(u => u.coords);
    const validFires = fires.filter(f => f.coords);

    let combinedBounds = null;

    const extendBoundsWithLatLng = (lat, lng) => {
      const ll = L.latLng(lat, lng);
      combinedBounds = combinedBounds ? combinedBounds.extend(ll) : L.latLngBounds([ll, ll]);
    };

    const extendBoundsWithBounds = bounds => {
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
            <div style="font-weight:700">${unit.responder_id} - ${unit.unit_nb}</div>
            <div style="font-size:12px;color:#475569;margin-top:4px">${unit.status}</div>
            <div style="font-size:11px;color:#64748b;margin-top:4px">
              ${unit.coords.lat.toFixed(5)}, ${unit.coords.lng.toFixed(5)}
            </div>
            ${unit.isMe ? '<div style="margin-top:6px;font-size:11px;color:#EC7742;font-weight:700">YOU</div>' : ''}
          </div>
        `)
        .addTo(map);

      markerLayerRef.current.push(marker);
      extendBoundsWithLatLng(unit.coords.lat, unit.coords.lng);
    });

    // ===== UNIT SQUARE MARKERS =====
    const unitGroups = {};
    validUnits.forEach(u => {
      if (!u.unit_nb || !u.unitCoords) return;
      if (!unitGroups[u.unit_nb]) {
        unitGroups[u.unit_nb] = u;
      }
    });

    Object.values(unitGroups).forEach(unit => {
      const baseIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            width:36px;
            height:36px;
            display:flex;
            align-items:center;
            justify-content:center;
          ">
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
            <div style="font-weight:700">${unit.unit_nb}</div>
            <div style="font-size:12px;color:#475569;margin-top:4px">Unit location</div>
            <div style="font-size:11px;color:#64748b;margin-top:4px">
              ${unit.unitCoords.lat.toFixed(5)}, ${unit.unitCoords.lng.toFixed(5)}
            </div>
          </div>
        `)
        .addTo(map);

      markerLayerRef.current.push(marker);
      extendBoundsWithLatLng(unit.unitCoords.lat, unit.unitCoords.lng);
    });

    validFires.forEach(fire => {
      const style = getFireZoneStyle(fire.severity);
      const radius = getFireZoneRadiusMeters(fire.severity);

      const circle = L.circle([fire.coords.lat, fire.coords.lng], {
        radius,
        color: style.stroke,
        weight: 2.5,
        fillColor: style.fill,
        fillOpacity: style.fillOpacity,
      }).addTo(map);

      circle.bindTooltip(`Fire ${String(fire.fire_id).slice(0, 8)}`, {
        permanent: false,
        direction: 'top',
        opacity: 1,
        className: 'fire-hover-tooltip',
        offset: [0, -2],
        sticky: true,
      });

      if (circle._path) {
        circle._path.setAttribute('tabindex', '-1');
        circle._path.setAttribute('focusable', 'false');
        circle._path.style.outline = 'none';

        L.DomEvent.disableClickPropagation(circle._path);

        const stopEverything = e => {
          L.DomEvent.preventDefault(e);
          L.DomEvent.stopPropagation(e);
          L.DomEvent.stop(e);
        };

        L.DomEvent.on(circle._path, 'mousedown', stopEverything);
        L.DomEvent.on(circle._path, 'mouseup', stopEverything);
        L.DomEvent.on(circle._path, 'click', stopEverything);
        L.DomEvent.on(circle._path, 'dblclick', stopEverything);
        L.DomEvent.on(circle._path, 'contextmenu', stopEverything);
      }

      circle.on('mouseover', function () {
        this.openTooltip();
      });

      circle.on('mouseout', function () {
        this.closeTooltip();
      });

      fireLayerRef.current.push(circle);
      extendBoundsWithBounds(circle.getBounds());
    });

    if (!hasFittedRef.current && combinedBounds) {
      map.fitBounds(combinedBounds, { padding: [40, 40] });
      hasFittedRef.current = true;
    }
  }, [units, fires]);

  const handleRecenter = () => {
    const map = mapRef.current;
    const L = window.L;
    if (!map || !L) return;

    const myUnit = units.find(u => u.isMe && u.coords);
    if (myUnit) {
      map.flyTo([myUnit.coords.lat, myUnit.coords.lng], 15, {
        animate: true,
        duration: 0.8,
      });
      setShowRecenter(false);
      return;
    }

    const validUnits = units.filter(u => u.coords);
    const validFires = fires.filter(f => f.coords);

    let combinedBounds = null;

    validUnits.forEach(u => {
      const ll = L.latLng(u.coords.lat, u.coords.lng);
      combinedBounds = combinedBounds ? combinedBounds.extend(ll) : L.latLngBounds([ll, ll]);
    });

    validFires.forEach(f => {
      const radius = getFireZoneRadiusMeters(f.severity);
      const circleBounds = L.circle([f.coords.lat, f.coords.lng], { radius }).getBounds();
      combinedBounds = combinedBounds ? combinedBounds.extend(circleBounds) : circleBounds;
    });

    if (combinedBounds) {
      map.fitBounds(combinedBounds, { padding: [40, 40] });
    }

    setShowRecenter(false);
  };

  return (
    <View style={styles.mapPlaceholder}>
      <View ref={divRef} style={{ width: '100%', height: '100%' }} />
      {showRecenter && (
        <TouchableOpacity onPress={handleRecenter} style={styles.recenterButton}>
          <Text style={styles.recenterButtonText}>📍 Recenter</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
