// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
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
} from '../services/api';
import {
  startResidentLocationTracking,
  startResponderLocationTracking,
  stopLocationTracking,
  getCurrentLocation,
} from '../services/location.service';
import {
  requestAppNotificationPermission,
  notifyAlert,
  preloadAlertSound,
} from '../services/notifications';
import {
  requestNativePushPermission,
  getNativePushToken,
  onForegroundNativeMessage,
} from '../services/push';
import { createNotificationChannel } from '../services/notification.channel';
import { getDistanceMeters } from '../screens/responder/utils/helpers';

const notifiedGlobalAlertIds = new Set();
let hasInitializedGlobalAlerts = false;

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

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  const setupPushNotifications = async (userId) => {
    try {
      if (Platform.OS === 'web') return;

      if (!userId) {
        console.warn('Push setup skipped: missing userId');
        return;
      }

      console.log('Push setup starting...');

      const granted = await requestNativePushPermission();
      console.log('Permission granted:', granted);

      if (!granted) {
        console.warn('Native push permission not granted');
        return;
      }

      const fcmToken = await getNativePushToken();
      console.log('FCM token:', fcmToken);

      if (!fcmToken) {
        console.warn('No FCM token received');
        return;
      }

      await gqlFetch(SAVE_FCM_TOKEN, {
        user_id: userId,
        fcm_token: fcmToken,
      });

      console.log('FCM token saved to backend');
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

            try {
              const loc = await getCurrentLocation();
              if (loc) {
                setUserLocation({ lat: loc.latitude, lng: loc.longitude });
              }

              if (role === 'Resident') {
                if (loc) {
                  await gqlFetch(UPDATE_RESIDENT, {
                    resident_id: userId,
                    input: {
                      last_known_location: {
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                      },
                    },
                  });
                }
                startResidentLocationTracking(userId);
              } else if (role === 'Responder') {
                if (loc) {
                  await gqlFetch(UPDATE_RESPONDER_LOCATION, {
                    responder_id: userId,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                  });
                }
                startResponderLocationTracking(userId);
              }
            } catch (e) {
              console.warn('Initial restored-session location push failed', e);
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
        'EshMagan Alert';

      const body =
        remoteMessage?.notification?.body ||
        remoteMessage?.data?.body ||
        'You received a new alert.';

      notifyAlert(title, body);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!user?.role) return;

    let interval;

    const fetchAndNotifyAlerts = async () => {
      try {
        const [alertData, fireData] = await Promise.all([
          gqlFetch(GET_ALERTS_BY_ROLE, {
            target_role:
              user.role?.charAt(0).toUpperCase() +
              user.role?.slice(1).toLowerCase(),
          }),
          gqlFetch(GET_ALL_FIRES),
        ]);

        const alerts = alertData?.getAlertsByTargetRole || [];
        const fires = fireData?.getAllFires || [];
        const radius = ALERT_RADIUS_BY_ROLE[user.role] || 10000;

        const validAlerts = alerts.filter(a => {
          if (!a.alert_id) return false;
          if (!a.fire_id) return false;
          if (new Date(a.expires_at) <= new Date()) return false;

          // 🚨 NO LOCATION → DON'T NOTIFY
          const fire = fires.find(f => f.fire_id === a.fire_id);
          if (!fire) return false;

          let fireCoords = null;

          let geo = null;

          try {
            geo = typeof fire.fire_location === 'string'
              ? JSON.parse(fire.fire_location)
              : fire.fire_location;
          } catch { }

          if (geo?.coordinates) {
            fireCoords = {
              lat: geo.coordinates[1],
              lng: geo.coordinates[0],
            };
          }

          if (!fireCoords) return false;

          const distance = getDistanceMeters(
            userLocation.lat,
            userLocation.lng,
            fireCoords.lat,
            fireCoords.lng
          );

          return distance <= radius;
        });

        const currentIds = validAlerts.map(a => a.alert_id);

        // 🚫 FIRST LOAD → DO NOT NOTIFY (prevent spam)
        if (!hasInitializedGlobalAlerts) {
          currentIds.forEach(id => notifiedGlobalAlertIds.add(id));
          hasInitializedGlobalAlerts = true;
          console.log('✅ Alerts initialized (no spam)');
          return;
        }

        // 🔥 ONLY NEW ALERTS
        for (const alert of validAlerts) {
          if (!notifiedGlobalAlertIds.has(alert.alert_id)) {
            console.log('🚨 GLOBAL NEW ALERT:', alert.alert_id);

            notifyAlert(
              alert.alert_type || 'EshMagan Alert',
              alert.alert_message || 'New alert detected'
            );

            notifiedGlobalAlertIds.add(alert.alert_id);
          }
        }

      } catch (e) {
        console.warn('Global alert listener error:', e.message);
      }
    };

    if (!userLocation) return;

    fetchAndNotifyAlerts();
    interval = setInterval(fetchAndNotifyAlerts, 10000);

    return () => {
      clearInterval(interval);
    };

  }, [user?.role, userLocation]);

  useEffect(() => {
    let mounted = true;

    const initLocation = async () => {
      try {
        const loc = await getCurrentLocation();
        if (mounted && loc) {
          setUserLocation({ lat: loc.latitude, lng: loc.longitude });
        }
      } catch { }
    };

    initLocation();

    return () => { mounted = false };
  }, []);

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

      try {
        const loc = await getCurrentLocation();
        if (loc) {
          setUserLocation({ lat: loc.latitude, lng: loc.longitude });
        }

        if (userRole === 'Resident') {
          if (loc) {
            await gqlFetch(UPDATE_RESIDENT, {
              resident_id: userId,
              input: {
                last_known_location: {
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                },
              },
            });
          }
          startResidentLocationTracking(userId);
        } else if (userRole === 'Responder') {
          if (loc) {
            await gqlFetch(UPDATE_RESPONDER_LOCATION, {
              responder_id: userId,
              latitude: loc.latitude,
              longitude: loc.longitude,
            });
          }
          startResponderLocationTracking(userId);
        }
      } catch (e) {
        console.warn('Initial location push failed', e);
      }
    }

    return data;
  };

  const logout = async () => {
    try {
      if (user?.id) {
        try {
          await gqlFetch(CLEAR_FCM_TOKEN, { user_id: user.id });
          console.log('FCM token cleared from backend');
        } catch (e) {
          console.warn('Failed to clear FCM token on logout', e);
        }
      }

      stopLocationTracking();
      await authService.logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      notifiedGlobalAlertIds.clear();
      hasInitializedGlobalAlerts = false;
      setUserLocation(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
