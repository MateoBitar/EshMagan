// src/services/location.service.js
import { Platform } from 'react-native';
import {
  gqlFetch,
  UPDATE_RESIDENT,
  UPDATE_RESPONDER_LOCATION,
  API_BASE,
} from './api';

let _watchId = null;
let _trackingType = null;
let _entityId = null;

export function getTrackingState() {
  return {
    active: _watchId !== null,
    type: _trackingType,
    entityId: _entityId,
  };
}

export async function getPlaceName(latitude, longitude) {
  try {
    const res = await fetch(`${API_BASE}/api/geo/reverse?lat=${latitude}&lon=${longitude}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const a = data.address || {};

    const place =
      a.village ||
      a.hamlet ||
      a.suburb ||
      a.neighbourhood ||
      a.city_district ||
      a.town ||
      a.municipality ||
      a.city ||
      null;

    let resolvedPlace = place;
    if (!resolvedPlace) {
      const SKIP = new Set([
        'lebanon',
        'north lebanon',
        'south lebanon',
        'mount lebanon',
        'bekaa',
        'nabatieh',
        'akkar',
        'baalbek-hermel',
      ]);

      const tokens = (data.display_name || '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      for (const token of tokens) {
        if (!SKIP.has(token.toLowerCase())) {
          resolvedPlace = token;
          break;
        }
      }
    }

    const district = a.county || a.state_district || null;
    const country = a.country || null;
    const parts = [resolvedPlace, district, country].filter(Boolean);

    if (parts.length > 0) return parts.join(', ');
  } catch { }

  return `${Math.abs(latitude).toFixed(4)}°${latitude >= 0 ? 'N' : 'S'}, ${Math.abs(longitude).toFixed(4)}°${longitude >= 0 ? 'E' : 'W'}`;
}

export async function requestLocationPermission() {
  const getPosition = (options) =>
    new Promise((resolve, reject) => {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          pos => resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp,
          }),
          err => reject(new Error(err.message || 'Failed to get web location')),
          options
        );

        return;
      }

      const Geolocation = require('@react-native-community/geolocation').default;

      Geolocation.getCurrentPosition(
        pos => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        }),
        err => reject(new Error(err.message || 'Failed to get native location')),
        options
      );
    });

  if (Platform.OS === 'android') {
    const { PermissionsAndroid } = require('react-native');
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'EshMagan Location Permission',
        message: 'EshMagan needs your location to send fire alerts and evacuation guidance.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'Allow',
      }
    );

    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error('Location permission denied');
    }
  }

  return getPosition({
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 5000,
  });
}

async function pushResidentLocationToBackend(residentId, latitude, longitude) {
  try {
    await gqlFetch(UPDATE_RESIDENT, {
      resident_id: residentId,
      input: {
        last_known_location: { latitude, longitude },
      },
    });
  } catch (e) {
    console.warn('[Resident Location] Failed to push location:', e.message);
  }
}

async function pushResponderLocationToBackend(responderId, latitude, longitude) {
  try {
    await gqlFetch(UPDATE_RESPONDER_LOCATION, {
      responder_id: responderId,
      latitude,
      longitude,
    });
  } catch (e) {
    console.warn('[Responder Location] Failed to push location:', e.message);
  }
}

export function startResidentLocationTracking(residentId, onLocationUpdate) {
  if (!residentId) return;

  if (_watchId !== null && _trackingType === 'resident' && _entityId === residentId) {
    return;
  }

  if (_watchId !== null) stopLocationTracking();

  _trackingType = 'resident';
  _entityId = residentId;

  if (Platform.OS === 'web') {
    if (!navigator.geolocation) return;

    _watchId = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        onLocationUpdate?.({ lat: latitude, lng: longitude, accuracy });
        pushResidentLocationToBackend(residentId, latitude, longitude);
      },
      err => {
        console.warn('[Resident Location]', err?.message || err);

        if (err.code === 3) {
          console.warn('[Resident Location] Timeout — keeping last known position');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
      }
    );

    return;
  }

  const Geolocation = require('@react-native-community/geolocation').default;

  _watchId = Geolocation.watchPosition(
    pos => {
      const { latitude, longitude, accuracy } = pos.coords;
      onLocationUpdate?.({ lat: latitude, lng: longitude, accuracy });
      pushResidentLocationToBackend(residentId, latitude, longitude);
    },
    err => {
      console.warn('[Resident Location]', err?.message || err);

      if (err.code === 3) {
        console.warn('[Resident Location] Timeout — keeping last known position');
      }
    },
    {
    enableHighAccuracy: true,
    distanceFilter: 3,
    interval: 5000,
    fastestInterval: 2000,
    maximumAge: 5000,
  }
  );
}

export function startResponderLocationTracking(responderId, onLocationUpdate) {
  if (!responderId) return;

  if (_watchId !== null && _trackingType === 'responder' && _entityId === responderId) {
    return;
  }

  if (_watchId !== null) stopLocationTracking();

  _trackingType = 'responder';
  _entityId = responderId;

  if (Platform.OS === 'web') {
    if (!navigator.geolocation) return;

    _watchId = navigator.geolocation.watchPosition(
      pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        onLocationUpdate?.({ lat: latitude, lng: longitude, accuracy });
        pushResponderLocationToBackend(responderId, latitude, longitude);
      },
      err => {
        console.warn('[Responder Location]', err?.message || err);

        if (err.code === 3) {
          console.warn('[Responder Location] Timeout — keeping last known position');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
      }
    );

    return;
  }

  const Geolocation = require('@react-native-community/geolocation').default;

  _watchId = Geolocation.watchPosition(
    pos => {
      const { latitude, longitude, accuracy } = pos.coords;
      onLocationUpdate?.({ lat: latitude, lng: longitude, accuracy });
      pushResponderLocationToBackend(responderId, latitude, longitude);
    },
    err => {
      console.warn('[Responder Location]', err?.message || err);

      if (err.code === 3) {
        console.warn('[Responder Location] Timeout — keeping last known position');
      }
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 3,
      interval: 5000,
      fastestInterval: 2000,
      maximumAge: 5000,
    }
  );
}

export function stopLocationTracking() {
  if (_watchId === null) return;

  if (Platform.OS === 'web') {
    navigator.geolocation?.clearWatch(_watchId);
  } else {
    const Geolocation = require('@react-native-community/geolocation').default;
    Geolocation.clearWatch(_watchId);
  }

  _watchId = null;
  _trackingType = null;
  _entityId = null;
}

export async function getCurrentLocation() {
  return requestLocationPermission();
}
