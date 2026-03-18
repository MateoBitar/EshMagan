// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { authService } from '../services/api';
import { startLocationTracking, stopLocationTracking } from '../services/location.service';

const getStorage = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (key) => Promise.resolve(window.localStorage.getItem(key)),
      removeItem: (key) => { window.localStorage.removeItem(key); return Promise.resolve(); },
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
          // Resume location tracking for residents on app restart
          if ((role === 'Resident' || role === 'Admin') && userId) {
            startLocationTracking(userId);
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

    // Start location tracking for residents after login
    if ((userRole === 'Resident' || userRole === 'Admin') && userId) {
      startLocationTracking(userId);
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
