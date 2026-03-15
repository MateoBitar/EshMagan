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
  ? 'http://192.168.1.13:5000'
  : 'http://localhost:5000';

// ─── Apollo Client (native only) ─────────────────────────────────────────────
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
  async login(email, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: email, user_password: password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    await storage.setItem('accessToken', data.accessToken);
    await storage.setItem('refreshToken', data.refreshToken);
    if (data.user?.user_role) {
      await storage.setItem('userRole', data.user.user_role);
    }
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

  async refreshAccessToken() {
    const refreshToken = await storage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error('Session expired — please log in again');
    const data = await res.json();
    await storage.setItem('accessToken', data.accessToken);
    await storage.setItem('refreshToken', data.refreshToken);
    return data;
  },

  async getStoredRole() {
    return storage.getItem('userRole');
  },
};

// ─── GraphQL Queries (matching actual backend schema) ────────────────────────

export const GET_FIRES = `query GetAllFires {
  getAllFires {
    fire_id
    fire_source
    fire_location
    fire_severitylevel
    is_extinguished
    is_verified
    created_at
  }
}`;

export const GET_ACTIVE_FIRES = `query GetActiveFires {
  getActiveFires {
    fire_id
    fire_source
    fire_location
    fire_severitylevel
    is_extinguished
    is_verified
    created_at
  }
}`;

export const GET_FIRE = `query GetFireById($fire_id: ID!) {
  getFireById(fire_id: $fire_id) {
    fire_id
    fire_source
    fire_location
    fire_severitylevel
    is_extinguished
    is_verified
    spread_prediction
    created_at
    updated_at
  }
}`;

export const GET_ALERTS = `query GetAllAlerts {
  getAllAlerts {
    alert_id
    alert_type
    target_role
    alert_message
    expires_at
    created_at
    fire_id
  }
}`;

export const GET_ALERTS_BY_ROLE = `query GetAlertsByTargetRole($target_role: AlertTargetRole!) {
  getAlertsByTargetRole(target_role: $target_role) {
    alert_id
    alert_type
    target_role
    alert_message
    expires_at
    created_at
    fire_id
  }
}`;

export const GET_EVACUATION_ROUTES = `query GetAllEvacuations {
  getAllEvacuations {
    route_id
    route_status
    route_priority
    route_path
    safe_zone
    distance_km
    estimated_time
    fire_id
  }
}`;

export const GET_EVACUATIONS_BY_FIRE = `query GetEvacuationsByFireId($fire_id: ID!) {
  getEvacuationsByFireId(fire_id: $fire_id) {
    route_id
    route_status
    route_priority
    route_path
    safe_zone
    distance_km
    estimated_time
    fire_id
  }
}`;

export const GET_RESPONDERS = `query GetAllResponders {
  getAllResponders {
    responder_id
    unit_nb
    unit_location
    assigned_region
    responder_status
    last_known_location
  }
}`;

export const GET_ASSIGNMENTS_BY_FIRE = `query GetAssignmentsByFireId($fire_id: ID!) {
  getAssignmentsByFireId(fire_id: $fire_id) {
    assignment_id
    assignment_status
    fire_id
    responder_id
    assigned_at
  }
}`;

export const GET_NOTIFICATIONS_BY_USER = `query GetNotificationsByUserId($user_id: ID!) {
  getNotificationsByUserId(user_id: $user_id) {
    notification_id
    target_role
    notification_message
    notification_status
    expires_at
    created_at
    fire_id
  }
}`;

export const GET_RECENT_FIRES = `query GetRecentFires($limit: Int!) {
  getRecentFires(limit: $limit) {
    fire_id
    fire_source
    fire_location
    fire_severitylevel
    is_extinguished
    is_verified
    created_at
  }
}`;

export const CREATE_FIRE = `mutation CreateFire($input: CreateFireInput!) {
  createFire(input: $input) {
    fire_id
    fire_source
    fire_location
    fire_severitylevel
    is_extinguished
    is_verified
  }
}`;

export const CREATE_FIRE_AND_TRIGGER = `mutation CreateFireAndTriggerSystem($input: CreateFireInput!) {
  createFireAndTriggerSystem(input: $input) {
    fire_id
    fire_source
    fire_location
    fire_severitylevel
    is_extinguished
    is_verified
  }
}`;

export const UPDATE_ASSIGNMENT_STATUS = `mutation UpdateAssignmentStatus($input: UpdateFireAssignmentStatusInput!) {
  updateAssignmentStatus(input: $input) {
    assignment_id
    assignment_status
  }
}`;

export const DISPATCH_CLOSEST_RESPONDER = `mutation DispatchClosestResponder($fire_id: ID!) {
  dispatchClosestResponder(fire_id: $fire_id) {
    assignment_id
    assignment_status
    fire_id
    responder_id
  }
}`;
