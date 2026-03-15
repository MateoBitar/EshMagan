// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { authService } from '../services/api';

// Use platform-aware storage
const getStorage = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (key) => Promise.resolve(window.localStorage.getItem(key)),
      removeItem: (key) => { window.localStorage.removeItem(key); return Promise.resolve(); },
    };
  }
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return AsyncStorage;
};

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const storage = getStorage();
        const token = await storage.getItem('accessToken');
        const role = await storage.getItem('userRole');
        if (token && role) {
          setUser({ role, token });
        }
      } catch (e) {
        console.error('Session restore error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password, role) => {
    // role param from UI used only as a hint — real role comes from backend
    const data = await authService.login(email, password);

    // Backend returns: { accessToken, refreshToken, user: { user_id, user_email, user_role, ... } }
    const userRole = data.user?.user_role || role;

    setUser({
      id: data.user?.user_id || '',
      email: data.user?.user_email || email,
      role: userRole,
      token: data.accessToken,
      refreshToken: data.refreshToken,
    });

    return data;
  };

  const logout = async () => {
    try {
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
