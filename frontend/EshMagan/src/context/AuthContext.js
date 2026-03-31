// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { authService, gqlFetch, UPDATE_RESPONDER_LOCATION, UPDATE_RESIDENT } from '../services/api';
import {
  startResidentLocationTracking,
  startResponderLocationTracking,
  stopLocationTracking,
  getCurrentLocation,
} from '../services/location.service';

const getStorage = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: key => Promise.resolve(window.localStorage.getItem(key)),
      removeItem: key => {
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

  useEffect(() => {
    (async () => {
      try {
        const storage = getStorage();
        const token = await storage.getItem('accessToken');
        const role = await storage.getItem('userRole');
        const userId = await storage.getItem('userId');

        if (token && role) {
          const restoredUser = { role, token, id: userId };
          setUser(restoredUser);

          if (userId) {
            try {
              const loc = await getCurrentLocation();
              if (!loc) return;
              if (role === 'Resident' || role === 'Admin') {
                await gqlFetch(UPDATE_RESIDENT, {
                  resident_id: userId,
                  input: {
                    last_known_location: {
                      latitude: loc.latitude,
                      longitude: loc.longitude,
                    },
                  },
                });
                startResidentLocationTracking(userId);
              } else if (role === 'Responder') {
                await gqlFetch(UPDATE_RESPONDER_LOCATION, {
                  responder_id: userId,
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                });
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

    if (userId) {
      try {
        const loc = await getCurrentLocation();
        if (!loc) return data;
        if (userRole === 'Resident' || userRole === 'Admin') {
          await gqlFetch(UPDATE_RESIDENT, {
            resident_id: userId,
            input: {
              last_known_location: {
                latitude: loc.latitude,
                longitude: loc.longitude,
              },
            },
          });
          startResidentLocationTracking(userId);
        } else if (userRole === 'Responder') {
          await gqlFetch(UPDATE_RESPONDER_LOCATION, {
            responder_id: userId,
            latitude: loc.latitude,
            longitude: loc.longitude,
          });
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
      stopLocationTracking();
      await authService.logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
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
