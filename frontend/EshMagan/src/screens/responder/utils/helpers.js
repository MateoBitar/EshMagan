import React from 'react';

export function fmtDate(val) {
  if (!val) return 'N/A';
  let d = new Date(val);
  if (isNaN(d.getTime())) d = new Date(Number(val));
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function parsePoint(str) {
  if (!str) return null;

  try {
    const geo = JSON.parse(str);
    if (geo?.type === 'Point' && geo.coordinates?.length === 2) {
      return { lng: geo.coordinates[0], lat: geo.coordinates[1] };
    }
  } catch {}

  const match = String(str).match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
  if (match) return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };

  return null;
}

export function getResponderCoords(responder) {
  if (responder?.last_known_location?.latitude && responder?.last_known_location?.longitude) {
    return {
      lat: responder.last_known_location.latitude,
      lng: responder.last_known_location.longitude,
    };
  }

  if (responder?.unit_location?.latitude && responder?.unit_location?.longitude) {
    return {
      lat: responder.unit_location.latitude,
      lng: responder.unit_location.longitude,
    };
  }

  return null;
}

export function getFireCoords(fire) {
  return parsePoint(fire?.fire_location);
}

export function getFireZoneRadiusMeters(level) {
  if (level >= 8) return 1000;
  if (level >= 6) return 800;
  if (level >= 3) return 500;
  return 400;
}

export function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = d => (d * Math.PI) / 180;
  const R = 6371000;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getFireZoneStyle(level) {
  if (level >= 8) {
    return {
      stroke: '#DC2626',
      fill: '#f97316',
      fillOpacity: 0.14,
    };
  }
  if (level >= 6) {
    return {
      stroke: '#EA580C',
      fill: '#fb923c',
      fillOpacity: 0.12,
    };
  }
  if (level >= 3) {
    return {
      stroke: '#F59E0B',
      fill: '#fbbf24',
      fillOpacity: 0.10,
    };
  }
  return {
    stroke: '#F59E0B',
    fill: '#fde68a',
    fillOpacity: 0.08,
  };
}
