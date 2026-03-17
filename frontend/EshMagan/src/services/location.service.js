// src/services/location.service.js
// Handles device location permission, tracking, and updating backend via GraphQL

import { Platform } from 'react-native';
import { gqlFetch, UPDATE_RESIDENT } from './api';

let _watchId = null;
let _residentId = null;

// Request location permission and get current position
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
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
}

// Update resident location in backend via GraphQL updateResident mutation
// ResidentRepository expects last_known_location as { longitude, latitude } object
async function pushLocationToBackend(residentId, latitude, longitude) {
  try {
    await gqlFetch(UPDATE_RESIDENT, {
      resident_id: residentId,
      input: {
        last_known_location: { latitude, longitude },
      },
    });
  } catch (e) {
    console.warn('[Location] Failed to push location to backend:', e.message);
  }
}

// Start continuous location tracking (every 30 seconds)
export function startLocationTracking(residentId) {
  if (_watchId !== null) stopLocationTracking(); // clear any existing watch
  _residentId = residentId;

  if (Platform.OS === 'web') {
    if (!navigator.geolocation) return;
    _watchId = navigator.geolocation.watchPosition(
      pos => pushLocationToBackend(residentId, pos.coords.latitude, pos.coords.longitude),
      err => console.warn('[Location] Web watch error:', err),
      { enableHighAccuracy: true, maximumAge: 30000 }
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
    {
      enableHighAccuracy: true,
      distanceFilter: 20,
      interval: 30000,
      fastestInterval: 15000,
    }
  );

  console.log('[Location] Tracking started for resident:', residentId);
}

// Stop location tracking
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
  console.log('[Location] Tracking stopped');
}

// Get current location once (no continuous tracking)
export async function getCurrentLocation() {
  return requestLocationPermission();
}
