// src/services/location.service.js
import { Platform } from 'react-native';
import { gqlFetch, UPDATE_RESIDENT, API_BASE } from './api';

let _watchId = null;
let _residentId = null;

// ─── Reverse geocoding via backend proxy ──────────────────────────────────────
// Calls /api/geo/reverse on our own Express server which proxies to Nominatim.
// This avoids CORS issues and keeps the rate limit per-server not per-browser.
export async function getPlaceName(latitude, longitude) {
  try {
    const res = await fetch(
      `${API_BASE}/api/geo/reverse?lat=${latitude}&lon=${longitude}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const a = data.address || {};

    const place =
      a.village        ||
      a.hamlet         ||
      a.suburb         ||
      a.neighbourhood  ||
      a.city_district  ||
      a.town           ||
      a.municipality   ||
      a.city           ||
      null;

    let resolvedPlace = place;
    if (!resolvedPlace) {
      const SKIP = new Set(['lebanon', 'north lebanon', 'south lebanon', 'mount lebanon', 'bekaa', 'nabatieh', 'akkar', 'baalbek-hermel']);
      const tokens = (data.display_name || '').split(',').map(t => t.trim()).filter(Boolean);
      for (const token of tokens) {
        if (!SKIP.has(token.toLowerCase())) { resolvedPlace = token; break; }
      }
    }

    const district = a.county || a.state_district || null;
    const country  = a.country || null;
    const parts    = [resolvedPlace, district, country].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
  } catch {}

  return `${Math.abs(latitude).toFixed(4)}°${latitude >= 0 ? 'N' : 'S'}, ${Math.abs(longitude).toFixed(4)}°${longitude >= 0 ? 'E' : 'W'}`;
}

// ─── Request location permission and get current position ────────────────────
export async function requestLocationPermission() {
  if (Platform.OS === 'web') {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        err => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  const Geolocation = require('@react-native-community/geolocation').default;

  if (Platform.OS === 'android') {
    const { PermissionsAndroid } = require('react-native');
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'EshMagan Location Permission',
        message: 'EshMagan needs your location to send fire alerts and evacuation routes near you.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'Allow',
      }
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error('Location permission denied');
    }
  }

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      err => reject(new Error(err.message || 'Failed to get location')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

// ─── Push location to backend ─────────────────────────────────────────────────
async function pushLocationToBackend(residentId, latitude, longitude) {
  try {
    await gqlFetch(UPDATE_RESIDENT, {
      resident_id: residentId,
      input: { last_known_location: { latitude, longitude } },
    });
  } catch (e) {
    console.warn('[Location] Failed to push location to backend:', e.message);
  }
}

// ─── Start continuous location tracking (every 30 seconds) ───────────────────
export function startLocationTracking(residentId) {
  if (_watchId !== null) stopLocationTracking();
  _residentId = residentId;

  if (Platform.OS === 'web') {
    if (!navigator.geolocation) return;
    _watchId = navigator.geolocation.watchPosition(
      pos => pushLocationToBackend(residentId, pos.coords.latitude, pos.coords.longitude),
      err => console.warn('[Location] Web watch error:', err),
      { enableHighAccuracy: true, maximumAge: 0 }
    );
    return;
  }

  const Geolocation = require('@react-native-community/geolocation').default;
  _watchId = Geolocation.watchPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      pushLocationToBackend(residentId, latitude, longitude);
    },
    err => console.warn('[Location] Watch error:', err.message),
    { enableHighAccuracy: true, distanceFilter: 10, interval: 30000, fastestInterval: 15000 }
  );
}

// ─── Stop location tracking ───────────────────────────────────────────────────
export function stopLocationTracking() {
  if (_watchId === null) return;
  if (Platform.OS === 'web') {
    navigator.geolocation?.clearWatch(_watchId);
  } else {
    const Geolocation = require('@react-native-community/geolocation').default;
    Geolocation.clearWatch(_watchId);
  }
  _watchId = null;
  _residentId = null;
}

// ─── Get current location once (no continuous tracking) ──────────────────────
export async function getCurrentLocation() {
  return requestLocationPermission();
}