// src/services/api.js
import { Platform } from 'react-native';

// ─── Cross-platform Storage ───────────────────────────────────────────────────
const storage = {
  async getItem(key) {
    if (Platform.OS === 'web') return Promise.resolve(window.localStorage.getItem(key));
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage.getItem(key);
  },
  async setItem(key, value) {
    if (Platform.OS === 'web') { window.localStorage.setItem(key, value); return Promise.resolve(); }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage.setItem(key, value);
  },
  async removeItem(key) {
    if (Platform.OS === 'web') { window.localStorage.removeItem(key); return Promise.resolve(); }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage.removeItem(key);
  },
  async multiRemove(keys) {
    if (Platform.OS === 'web') { keys.forEach(k => window.localStorage.removeItem(k)); return Promise.resolve(); }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage.multiRemove(keys);
  },
};

// ─── API Base URL ─────────────────────────────────────────────────────────────
export const API_BASE = Platform.OS === 'android'
  ? 'http://10.0.2.2:5000'
  : 'http://localhost:5000';

// ─── Apollo Client (mobile only) ─────────────────────────────────────────────
let _apolloClient = null;

export function getApolloClient() {
  if (Platform.OS === 'web') return null;
  if (_apolloClient) return _apolloClient;
  const { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } = require('@apollo/client');
  const httpLink = createHttpLink({ uri: `${API_BASE}/eshmagan` });
  const authLink = new ApolloLink((operation, forward) => {
    return new Promise((resolve) => {
      storage.getItem('accessToken').then(token => {
        operation.setContext(({ headers = {} }) => ({
          headers: { ...headers, authorization: token ? `Bearer ${token}` : '' },
        }));
        resolve(forward(operation));
      });
    });
  });
  _apolloClient = new ApolloClient({ link: authLink.concat(httpLink), cache: new InMemoryCache() });
  return _apolloClient;
}

// Keep named export for App.js compatibility
export const apolloClient = Platform.OS !== 'web' ? (() => {
  try { return getApolloClient(); } catch { return null; }
})() : null;

// ─── Fetch-based GraphQL client (web/desktop) ────────────────────────────────
export async function gqlFetch(query, variables = {}) {
  const token = await storage.getItem('accessToken');
  const res = await fetch(`${API_BASE}/eshmagan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

// ─── REST Auth Service ────────────────────────────────────────────────────────
export const authService = {
  async login(email, password, role) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    await storage.setItem('accessToken', data.accessToken);
    await storage.setItem('refreshToken', data.refreshToken);
    await storage.setItem('userRole', role);
    return data;
  },
  async logout() {
    const refreshToken = await storage.getItem('refreshToken');
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    await storage.multiRemove(['accessToken', 'refreshToken', 'userRole']);
  },
  async getStoredRole() {
    return storage.getItem('userRole');
  },
};

// ─── GraphQL Query Strings ────────────────────────────────────────────────────
export const GET_FIRES = `query GetFires {
  fires { id fire_location fire_severitylevel fire_status fire_source created_at }
}`;

export const GET_ALERTS = `query GetAlerts {
  alerts { id alert_type alert_priority alert_message created_at fire { id fire_location } }
}`;

export const GET_EVACUATION_ROUTES = `query GetEvacuationRoutes {
  evacuations { id evacuation_route evacuation_status fire { id fire_location } }
}`;

export const GET_RESPONDERS = `query GetResponders {
  responders { id responder_name responder_type responder_status responder_location }
}`;

export const GET_FIRE = `query GetFire($id: ID!) {
  fire(id: $id) {
    id fire_location fire_severitylevel fire_status fire_source created_at
    alerts { id alert_type alert_priority alert_message created_at }
    fire_assignments { id assignment_status responder { id responder_name responder_type responder_status } }
  }
}`;

export const CREATE_FIRE = `mutation CreateFire($input: CreateFireInput!) {
  createFire(input: $input) { id fire_location fire_severitylevel fire_status }
}`;
