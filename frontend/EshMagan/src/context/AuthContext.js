// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
  authService,
  gqlFetch,
  UPDATE_RESPONDER_LOCATION,
  UPDATE_RESIDENT,
  GET_ALERTS_BY_ROLE,
  GET_ALL_FIRES,
  SAVE_FCM_TOKEN,
  CLEAR_FCM_TOKEN,
  GET_MUNICIPALITY_BY_ID,
  GET_NOTIFICATIONS_BY_USER,
} from '../services/api';
import {
  startResidentLocationTracking,
  startResponderLocationTracking,
  stopLocationTracking,
  getTrackingState,
} from '../services/location.service';
import {
  requestAppNotificationPermission,
  notifyAlert,
  notifyInfo,
  preloadAlertSound,
} from '../services/notifications';
import {
  requestNativePushPermission,
  getNativePushToken,
  onForegroundNativeMessage,
} from '../services/push';
import { createNotificationChannel } from '../services/notification.channel';
import { getDistanceMeters } from '../screens/responder/utils/helpers';

const getStorage = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (key) => Promise.resolve(window.localStorage.getItem(key)),
      removeItem: (key) => {
        window.localStorage.removeItem(key);
        return Promise.resolve();
      },
    };
  }
  return require('@react-native-async-storage/async-storage').default;
};

function isValidCoordPair(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function parsePoint(value) {
  if (!value) return null;

  if (typeof value === 'object') {
    const lat = Number(
      value.latitude ?? value.lat ?? value.y ?? value?.coordinates?.[1]
    );
    const lng = Number(
      value.longitude ?? value.lng ?? value.lon ?? value.x ?? value?.coordinates?.[0]
    );

    if (isValidCoordPair(lat, lng)) return { lat, lng };

    if (value?.type === 'Point' && Array.isArray(value.coordinates) && value.coordinates.length === 2) {
      const geoLat = Number(value.coordinates[1]);
      const geoLng = Number(value.coordinates[0]);
      if (isValidCoordPair(geoLat, geoLng)) return { lat: geoLat, lng: geoLng };
    }
  }

  try {
    const geo = typeof value === 'string' ? JSON.parse(value) : value;
    if (geo?.type === 'Point' && Array.isArray(geo.coordinates) && geo.coordinates.length === 2) {
      const lat = Number(geo.coordinates[1]);
      const lng = Number(geo.coordinates[0]);
      if (isValidCoordPair(lat, lng)) return { lat, lng };
    }
  } catch { }

  const match = String(value).match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (match) {
    const lng = Number(match[1]);
    const lat = Number(match[2]);
    if (isValidCoordPair(lat, lng)) return { lat, lng };
  }

  return null;
}

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const seenWebAlertIdsRef = useRef(new Set());
  const hasInitializedWebAlertsRef = useRef(false);
  const seenWebNotificationIdsRef = useRef(new Set());
  const hasInitializedWebNotificationsRef = useRef(false);

  const getAlertAnchorByRole = async (role, userId, currentUserLocation) => {
    if (role === 'Municipality') {
      const municipalityData = await gqlFetch(GET_MUNICIPALITY_BY_ID, {
        municipality_id: userId,
      });

      return parsePoint(
        municipalityData?.getMunicipalityById?.municipality_location ||
        municipalityData?.getMunicipalityById?.location
      );
    }

    if (currentUserLocation?.lat != null && currentUserLocation?.lng != null) {
      return currentUserLocation;
    }

    return null;
  };

  const setupPushNotifications = async (userId) => {
    try {
      if (Platform.OS === 'web') return;

      if (!userId) {
        console.warn('Push setup skipped: missing userId');
        return;
      }

      const granted = await requestNativePushPermission();

      if (!granted) {
        console.warn('Native push permission not granted');
        return;
      }

      const fcmToken = await getNativePushToken();

      if (!fcmToken) {
        console.warn('No FCM token received');
        return;
      }

      await gqlFetch(SAVE_FCM_TOKEN, {
        user_id: userId,
        fcm_token: fcmToken,
      });

    } catch (e) {
      console.warn('Push setup failed', e);
    }
  };

  const ALERT_RADIUS_BY_ROLE = {
    Resident: 10000,
    Responder: 25000,
    Municipality: 10000,
  };

  useEffect(() => {
    preloadAlertSound();
  }, []);

  useEffect(() => {
    createNotificationChannel();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const storage = getStorage();
        const token = await storage.getItem('accessToken');
        const role = await storage.getItem('userRole');
        const userId = await storage.getItem('userId');

        if (token && role) {
          const restoredUser = {
            role,
            token,
            id: userId,
          };

          setUser(restoredUser);

          try {
            await requestAppNotificationPermission();
          } catch (e) {
            console.warn('App notification permission request failed', e);
          }

          if (userId) {
            try {
              await setupPushNotifications(userId);
            } catch (e) {
              console.warn('Restored-session push setup failed', e);
            }

            const tracking = getTrackingState();

            if (role === 'Resident') {
              if (!(tracking.active && tracking.type === 'resident' && tracking.entityId === userId)) {
                startResidentLocationTracking(userId, setUserLocation);
              }
            } else if (role === 'Responder') {
              if (!(tracking.active && tracking.type === 'responder' && tracking.entityId === userId)) {
                startResponderLocationTracking(userId, setUserLocation);
              }
            }
          }
        }
      } catch (e) {
        console.error('Session restore error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = onForegroundNativeMessage((remoteMessage) => {
      const title =
        remoteMessage?.notification?.title ||
        remoteMessage?.data?.title ||
        'EshMagan';

      const body =
        remoteMessage?.notification?.body ||
        remoteMessage?.data?.body ||
        'You received a new update.';

      const type = remoteMessage?.data?.type || '';

      if (type === 'FireAlert') {
        notifyAlert(title, body);
      } else {
        notifyInfo(title, body);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!user?.role || !user?.id) return;

    let interval;

    const fetchAndNotifyAlerts = async () => {
      try {
        const normalizedRole =
          user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();

        const [alertData, fireData] = await Promise.all([
          gqlFetch(GET_ALERTS_BY_ROLE, { target_role: normalizedRole }),
          gqlFetch(GET_ALL_FIRES),
        ]);

        const alerts = alertData?.getAlertsByTargetRole || [];
        const fires = fireData?.getAllFires || [];
        const radius = ALERT_RADIUS_BY_ROLE[user.role] || 10000;

        const anchor = await getAlertAnchorByRole(user.role, user.id, userLocation);
        if (!anchor) return;

        const validAlerts = alerts.filter(alert => {
          if (!alert.alert_id) return false;
          if (!alert.fire_id) return false;
          if (alert.expires_at && new Date(alert.expires_at) <= new Date()) return false;

          const fire = fires.find(f => f.fire_id === alert.fire_id);
          if (!fire || fire.is_extinguished) return false;

          const fireCoords = parsePoint(fire.fire_location);
          if (!fireCoords) return false;

          const distance = getDistanceMeters(
            anchor.lat,
            anchor.lng,
            fireCoords.lat,
            fireCoords.lng
          );

          return distance <= radius;
        });


        const nextAlertIds = new Set(validAlerts.map(alert => alert.alert_id));

        if (!hasInitializedWebAlertsRef.current) {
          seenWebAlertIdsRef.current = nextAlertIds;
          hasInitializedWebAlertsRef.current = true;
          return;
        }

        for (const alert of validAlerts) {
          if (!seenWebAlertIdsRef.current.has(alert.alert_id)) {
            notifyAlert(
              alert.alert_type || 'EshMagan Alert',
              alert.alert_message || 'New alert detected'
            );
          }
        }

        seenWebAlertIdsRef.current = nextAlertIds;
      } catch (e) {
        console.warn('Unified web alert listener error:', e.message);
      }
    };

    fetchAndNotifyAlerts();
    interval = setInterval(fetchAndNotifyAlerts, 10000);

    return () => clearInterval(interval);
  }, [user?.role, user?.id, userLocation]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!user?.id) return;

    let interval;

    const fetchAndNotifyNotifications = async () => {
      try {
        const notifData = await gqlFetch(GET_NOTIFICATIONS_BY_USER, {
          user_id: user.id,
        });

        const notifications = notifData?.getNotificationsByUserId || [];

        const validNotifications = notifications.filter(n => {
          if (!n.notification_id) return false;
          if (n.notification_status === 'Delivered') return false;
          if (n.expires_at && new Date(n.expires_at) <= new Date()) return false;
          return true;
        });

        const nextIds = new Set(validNotifications.map(n => n.notification_id));

        if (!hasInitializedWebNotificationsRef.current) {
          seenWebNotificationIdsRef.current = nextIds;
          hasInitializedWebNotificationsRef.current = true;
          return;
        }

        for (const notif of validNotifications) {
          if (!seenWebNotificationIdsRef.current.has(notif.notification_id)) {
            notifyInfo(
              'New Notification',
              notif.notification_message || 'You received a new notification.'
            );
          }
        }

        seenWebNotificationIdsRef.current = nextIds;
      } catch (e) {
        console.warn('Unified web notification listener error:', e.message);
      }
    };

    fetchAndNotifyNotifications();
    interval = setInterval(fetchAndNotifyNotifications, 10000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    const userRole = data.user?.user_role;
    const userId = data.user?.user_id;

    const loggedInUser = {
      id: userId || '',
      email: data.user?.user_email || email,
      role: userRole,
      token: data.accessToken,
      refreshToken: data.refreshToken,
    };

    setUser(loggedInUser);

    try {
      await requestAppNotificationPermission();
    } catch (e) {
      console.warn('App notification permission request failed', e);
    }

    if (userId) {
      try {
        await setupPushNotifications(userId);
      } catch (e) {
        console.warn('Login push setup failed', e);
      }

      const tracking = getTrackingState();

      if (userRole === 'Resident') {
        if (!(tracking.active && tracking.type === 'resident' && tracking.entityId === userId)) {
          startResidentLocationTracking(userId, setUserLocation);
        }
      } else if (userRole === 'Responder') {
        if (!(tracking.active && tracking.type === 'responder' && tracking.entityId === userId)) {
          startResponderLocationTracking(userId, setUserLocation);
        }
      }
    }

    return data;
  };

  const logout = async () => {
    try {
      if (user?.id && Platform.OS !== 'web') {
        try {
          await gqlFetch(CLEAR_FCM_TOKEN, { user_id: user.id });
        } catch (e) {
          console.warn('Failed to clear FCM token on logout', e);
        }
      }

      stopLocationTracking();
      await authService.logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      seenWebAlertIdsRef.current.clear();
      hasInitializedWebAlertsRef.current = false;
      seenWebNotificationIdsRef.current.clear();
      hasInitializedWebNotificationsRef.current = false;
      setUserLocation(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, userLocation, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
