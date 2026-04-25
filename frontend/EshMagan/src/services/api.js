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
    if (Platform.OS === 'web') {
      window.localStorage.setItem(key, value);
      return Promise.resolve();
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage.setItem(key, value);
  },
  async removeItem(key) {
    if (Platform.OS === 'web') {
      window.localStorage.removeItem(key);
      return Promise.resolve();
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage.removeItem(key);
  },
  async multiRemove(keys) {
    if (Platform.OS === 'web') {
      keys.forEach((k) => window.localStorage.removeItem(k));
      return Promise.resolve();
    }
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage.multiRemove(keys);
  },
};

// ─── API Base URL ─────────────────────────────────────────────────────────────
export const API_BASE =
  Platform.OS === 'android'
    ? 'http://192.168.1.12:5000'
    : 'http://localhost:5000';

// ─── GraphQL Client (gqlFetch only) ──────────────────────────────────────────
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
    if (data.user?.user_role) await storage.setItem('userRole', data.user.user_role);
    if (data.user?.user_id) await storage.setItem('userId', data.user.user_id);
    return data;
  },

  async logout() {
    const refreshToken = await storage.getItem('refreshToken');
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    await storage.multiRemove(['accessToken', 'refreshToken', 'userRole', 'userId']);
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

  async getStoredUserId() {
    return storage.getItem('userId');
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// GRAPHQL QUERIES & MUTATIONS — Full backend mapping
// ═══════════════════════════════════════════════════════════════════════════════

// ─── FIRE QUERIES ─────────────────────────────────────────────────────────────
export const GET_ALL_FIRES = `query GetAllFires {
  getAllFires {
    fire_id
    fire_source
    fire_location
    fire_severitylevel
    is_extinguished
    is_verified
    created_at
    updated_at
  }
}`;

export const GET_FIRES = GET_ALL_FIRES;

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
    created_at
    updated_at
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

export const GET_FIRES_RADIUS = `query GetFiresRadius($lat: Float!, $lng: Float!, $radiusMeters: Int!) {
  getFiresRadius(lat: $lat, lng: $lng, radiusMeters: $radiusMeters) {
    fire_id
    fire_source
    fire_location
    fire_severitylevel
    is_extinguished
    is_verified
    created_at
  }
}`;

export const GET_FIRES_BY_DATE = `query GetFiresByDate($startDate: String!, $endDate: String!) {
  getFiresByDate(startDate: $startDate, endDate: $endDate) {
    fire_id
    fire_source
    fire_location
    fire_severitylevel
    is_extinguished
    is_verified
    created_at
  }
}`;

export const GET_FIRE_STATISTICS = `query GetFireStatistics($startDate: String!, $endDate: String!) {
  getFireStatistics(startDate: $startDate, endDate: $endDate) {
    total_fires
    extinguished_fires
    active_fires
  }
}`;

export const COUNT_FIRES = `query CountFires($filters: FireFilterInput) {
  countFires(filters: $filters)
}`;

export const FIND_RESIDENTS_NEAR_FIRE = `query FindResidentsNearFire($fire_id: ID!, $radiusMeters: Int) {
  findResidentsNearFire(fire_id: $fire_id, radiusMeters: $radiusMeters) {
    resident_id
    resident_fname
    resident_lname
    last_known_location {
      longitude
      latitude
    }
  }
}`;

export const GET_NEARBY_FIRES = `query GetNearbyFires($latitude: Float!, $longitude: Float!) {
  getNearbyFires(latitude: $latitude, longitude: $longitude) {
    fire_id
    fire_source
    fire_location
    fire_severitylevel
    is_extinguished
    is_verified
    created_at
  }
}`;

// ─── FIRE MUTATIONS ───────────────────────────────────────────────────────────
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

export const UPDATE_FIRE = `mutation UpdateFire($fire_id: ID!, $input: UpdateFireInput!) {
  updateFire(fire_id: $fire_id, input: $input) {
    fire_id
    fire_severitylevel
    is_extinguished
    is_verified
  }
}`;

export const UPDATE_FIRE_STATUS = `mutation UpdateFireStatus($fire_id: ID!, $fire_status: Boolean!) {
  updateFireStatus(fire_id: $fire_id, fire_status: $fire_status) {
    fire_id
    is_extinguished
  }
}`;

export const UPDATE_FIRE_SEVERITY = `mutation UpdateFireSeverity($fire_id: ID!, $severityLevel: Int!) {
  updateFireSeverity(fire_id: $fire_id, severityLevel: $severityLevel) {
    fire_id
    fire_severitylevel
  }
}`;

export const VERIFY_FIRE = `mutation VerifyFire($fire_id: ID!) {
  verifyFire(fire_id: $fire_id) {
    fire_id
    is_verified
  }
}`;

export const EXTINGUISH_FIRE = `mutation ExtinguishFire($fire_id: ID!) {
  extinguishFire(fire_id: $fire_id) {
    fire_id
    is_extinguished
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

export const DELETE_FIRE = `mutation DeleteFire($fire_id: ID!) {
  deleteFire(fire_id: $fire_id)
}`;

// ─── ALERT QUERIES ────────────────────────────────────────────────────────────
export const GET_ALL_ALERTS = `query GetAllAlerts {
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

export const GET_ALERTS = GET_ALL_ALERTS;

export const GET_ALERT_BY_ID = `query GetAlertById($alert_id: ID!) {
  getAlertById(alert_id: $alert_id) {
    alert_id
    alert_type
    target_role
    alert_message
    expires_at
    created_at
    fire_id
  }
}`;

export const GET_ALERTS_BY_TYPE = `query GetAlertsByAlertType($alert_type: AlertType!) {
  getAlertsByAlertType(alert_type: $alert_type) {
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
    alert_message
    expires_at
    created_at
    fire_id
  }
}`;

export const GET_ALERTS_BY_FIRE = `query GetAlertsByFireId($fire_id: ID!) {
  getAlertsByFireId(fire_id: $fire_id) {
    alert_id
    alert_type
    target_role
    alert_message
    expires_at
    created_at
    fire_id
  }
}`;

// ─── EVACUATION QUERIES ───────────────────────────────────────────────────────
export const GET_ALL_EVACUATIONS = `query GetAllEvacuations {
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

export const GET_EVACUATION_ROUTES = GET_ALL_EVACUATIONS;

export const GET_EVACUATION_BY_ID = `query GetEvacuationById($route_id: ID!) {
  getEvacuationById(route_id: $route_id) {
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

export const GET_NEAREST_EVACUATION = `query GetNearestEvacuation($latitude: Float!, $longitude: Float!) {
  getNearestEvacuation(latitude: $latitude, longitude: $longitude) {
    route_id
    route_status
    route_priority
    safe_zone
    distance_km
    estimated_time
    fire_id
  }
}`;

// ─── EVACUATION MUTATIONS ─────────────────────────────────────────────────────
export const CREATE_EVACUATION = `mutation CreateEvacuation($input: CreateEvacuationInput!) {
  createEvacuation(input: $input) {
    route_id
    route_status
    route_priority
    distance_km
    estimated_time
    fire_id
  }
}`;

export const UPDATE_EVACUATION_STATUS = `mutation UpdateEvacuationStatus($route_id: ID!, $input: UpdateEvacuationStatusInput!) {
  updateEvacuationStatus(route_id: $route_id, input: $input) {
    route_id
    route_status
  }
}`;

// ─── RESPONDER QUERIES ────────────────────────────────────────────────────────
export const GET_ALL_RESPONDERS = `query GetAllResponders {
  getAllResponders {
    responder_id
    unit_nb
    assigned_region
    responder_status
    unit_location {
      latitude
      longitude
    }
    last_known_location {
      latitude
      longitude
    }
    updated_at
    user {
      user_id
      user_email
      user_phone
      user_role
      isactive
    }
  }
}`;

export const GET_RESPONDERS = GET_ALL_RESPONDERS;

export const GET_RESPONDER_BY_ID = `query GetResponderById($responder_id: ID!) {
  getResponderById(responder_id: $responder_id) {
    responder_id
    unit_nb
    assigned_region
    responder_status
    unit_location {
      latitude
      longitude
    }
    last_known_location {
      latitude
      longitude
    }
    updated_at
    user {
      user_id
      user_email
      user_phone
      user_role
      isactive
    }
  }
}`;

export const GET_RESPONDERS_BY_STATUS = `query GetRespondersByResponderStatus($responder_status: String!) {
  getRespondersByResponderStatus(responder_status: $responder_status) {
    responder_id
    unit_nb
    assigned_region
    responder_status
    unit_location {
      latitude
      longitude
    }
    last_known_location {
      latitude
      longitude
    }
    updated_at
  }
}`;

export const GET_NEAREST_RESPONDER = `query GetNearestResponder($fire_location: LocationInput!) {
  getNearestResponder(fire_location: $fire_location) {
    responder_id
    unit_nb
    assigned_region
    responder_status
    unit_location {
      latitude
      longitude
    }
    last_known_location {
      latitude
      longitude
    }
    updated_at
  }
}`;

// ─── RESPONDER MUTATIONS ──────────────────────────────────────────────────────
export const CREATE_RESPONDER = `mutation CreateResponder($input: CreateResponderInput!) {
  createResponder(input: $input) {
    responder_id
    unit_nb
    assigned_region
    responder_status
    unit_location {
      latitude
      longitude
    }
    last_known_location {
      latitude
      longitude
    }
    updated_at
    user {
      user_id
      user_email
      user_phone
      user_role
      isactive
    }
  }
}`;

export const UPDATE_RESPONDER = `mutation UpdateResponder($responder_id: ID!, $input: UpdateResponderInput!) {
  updateResponder(responder_id: $responder_id, input: $input) {
    responder_id
    unit_nb
    assigned_region
    responder_status
    unit_location {
      latitude
      longitude
    }
    last_known_location {
      latitude
      longitude
    }
    updated_at
    user {
      user_id
      user_email
      user_phone
      user_role
      isactive
    }
  }
}`;

export const DEACTIVATE_RESPONDER = `mutation DeactivateResponder($responder_id: ID!) {
  deactivateResponder(responder_id: $responder_id)
}`;

export const UPDATE_RESPONDER_STATUS = `mutation UpdateResponderStatus($responder_id: ID!, $responder_status: String!) {
  updateResponderStatus(responder_id: $responder_id, responder_status: $responder_status) {
    responder_id
    responder_status
  }
}`;

export const UPDATE_RESPONDER_LOCATION = `mutation UpdateResponderLocation($responder_id: ID!, $latitude: Float!, $longitude: Float!) {
  updateResponderLocation(
    responder_id: $responder_id,
    latitude: $latitude,
    longitude: $longitude
  ) {
    responder_id
    last_known_location {
      latitude
      longitude
    }
    updated_at
  }
}`;

// ─── FIRE ASSIGNMENT QUERIES ──────────────────────────────────────────────────
export const GET_ALL_ASSIGNMENTS = `query GetAllAssignments {
  getAllAssignments {
    assignment_id
    assignment_status
    fire_id
    responder_id
    assigned_at
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

export const GET_ASSIGNMENTS_BY_RESPONDER = `query GetAssignmentsByResponderId($responder_id: ID!) {
  getAssignmentsByResponderId(responder_id: $responder_id) {
    assignment_id
    assignment_status
    fire_id
    responder_id
    assigned_at
  }
}`;

export const GET_ACTIVE_ASSIGNMENTS = `query GetActiveAssignments {
  getActiveAssignments {
    assignment_id
    assignment_status
    fire_id
    responder_id
    assigned_at
  }
}`;

// ─── FIRE ASSIGNMENT MUTATIONS ────────────────────────────────────────────────
export const CREATE_ASSIGNMENT = `mutation CreateAssignment($input: CreateFireAssignmentInput!) {
  createAssignment(input: $input) {
    assignment_id
    assignment_status
    fire_id
    responder_id
    assigned_at
  }
}`;

export const UPDATE_ASSIGNMENT_STATUS = `mutation UpdateAssignmentStatus($input: UpdateFireAssignmentStatusInput!) {
  updateAssignmentStatus(input: $input) {
    assignment_id
    assignment_status
  }
}`;

export const DELETE_ASSIGNMENT = `mutation DeleteAssignment($assignment_id: ID!) {
  deleteAssignment(assignment_id: $assignment_id)
}`;

// ─── NOTIFICATION QUERIES ─────────────────────────────────────────────────────
export const GET_ALL_NOTIFICATIONS = `query GetAllNotifications {
  getAllNotifications {
    notification_id
    target_role
    notification_message
    notification_status
    expires_at
    created_at
    fire_id
    user_id
  }
}`;

export const GET_NOTIFICATIONS_BY_USER = `query GetNotificationsByUserId($user_id: ID!) {
  getNotificationsByUserId(user_id: $user_id) {
    notification_id
    notification_message
    notification_status
    expires_at
    fire_id
  }
}`;

export const GET_NOTIFICATIONS_BY_ROLE = `query GetNotificationsByTargetRole($target_role: NotificationTargetRole!) {
  getNotificationsByTargetRole(target_role: $target_role) {
    notification_id
    target_role
    notification_message
    notification_status
    expires_at
    created_at
    fire_id
    user_id
  }
}`;

export const GET_NOTIFICATIONS_BY_FIRE = `query GetNotificationsByFireId($fire_id: ID!) {
  getNotificationsByFireId(fire_id: $fire_id) {
    notification_id
    target_role
    notification_message
    notification_status
    expires_at
    created_at
    fire_id
    user_id
  }
}`;

// ─── NOTIFICATION MUTATIONS ───────────────────────────────────────────────────
export const UPDATE_NOTIFICATION_STATUS = `mutation UpdateNotificationStatus($notification_id: ID!, $notification_status: NotificationStatus!) {
  updateNotificationStatus(notification_id: $notification_id, notification_status: $notification_status) {
    notification_id
    notification_status
  }
}`;

// ─── RESIDENT QUERIES ─────────────────────────────────────────────────────────
export const GET_RESIDENT_BY_ID = `query GetResidentById($resident_id: ID!) {
  getResidentById(resident_id: $resident_id) {
    resident_id
    resident_fname
    resident_lname
    resident_dob
    resident_idnb
    home_location {
      longitude
      latitude
    }
    work_location {
      longitude
      latitude
    }
    last_known_location {
      longitude
      latitude
    }
  }
}`;

export const GET_RESIDENT_BY_EMAIL = `query GetResidentByEmail($user_email: String!) {
  getResidentByEmail(user_email: $user_email) {
    resident_id
    resident_fname
    resident_lname
    home_location {
      longitude
      latitude
    }
    last_known_location {
      longitude
      latitude
    }
  }
}`;

// ─── RESIDENT MUTATIONS ───────────────────────────────────────────────────────
export const UPDATE_RESIDENT = `mutation UpdateResident($resident_id: ID!, $input: UpdateResidentInput!) {
  updateResident(resident_id: $resident_id, input: $input) {
    resident_id
    resident_fname
    resident_lname
  }
}`;

// ─── MUNICIPALITY QUERIES ─────────────────────────────────────────────────────
export const GET_ALL_MUNICIPALITIES = `query GetAllMunicipalities {
  getAllMunicipalities {
    municipality_id
    municipality_name
    region_name
    municipality_code
    municipality_location {
      latitude
      longitude
    }
    created_at
    updated_at
    user {
      user_id
      user_email
      user_phone
      user_role
      isactive
    }
  }
}`;

export const GET_MUNICIPALITY_BY_ID = `query GetMunicipalityById($municipality_id: ID!) {
  getMunicipalityById(municipality_id: $municipality_id) {
    municipality_id
    municipality_name
    region_name
    municipality_code
    municipality_location {
      latitude
      longitude
    }
    created_at
    updated_at
    user {
      user_id
      user_email
      user_phone
      user_role
      isactive
    }
  }
}`;

// ─── MUNICIPALITY MUTATIONS ───────────────────────────────────────────────────
export const CREATE_MUNICIPALITY = `mutation CreateMunicipality($input: CreateMunicipalityInput!) {
  createMunicipality(input: $input) {
    municipality_id
    municipality_name
    region_name
    municipality_code
    municipality_location {
      latitude
      longitude
    }
    created_at
    updated_at
    user {
      user_id
      user_email
      user_phone
      user_role
      isactive
    }
  }
}`;

export const UPDATE_MUNICIPALITY = `mutation UpdateMunicipality($municipality_id: ID!, $input: UpdateMunicipalityInput!) {
  updateMunicipality(municipality_id: $municipality_id, input: $input) {
    municipality_id
    municipality_name
    region_name
    municipality_code
    municipality_location {
      latitude
      longitude
    }
    updated_at
    user {
      user_id
      user_email
      user_phone
      user_role
      isactive
    }
  }
}`;

export const DEACTIVATE_MUNICIPALITY = `mutation DeactivateMunicipality($municipality_id: ID!) {
  deactivateMunicipality(municipality_id: $municipality_id)
}`;

// ─── USER QUERIES ─────────────────────────────────────────────────────────────
export const GET_ALL_USERS = `query GetAllUsers {
  getAllUsers {
    user_id
    user_email
    user_phone
    user_role
    isactive
    created_at
    updated_at
    last_login
  }
}`;

export const GET_USER_BY_ID = `query GetUserById($user_id: ID!) {
  getUserById(user_id: $user_id) {
    user_id
    user_email
    user_phone
    user_role
    isactive
    created_at
    updated_at
    last_login
  }
}`;

export const GET_USERS_BY_ROLE = `query GetUsersByRole($user_role: String!) {
  getUsersByRole(user_role: $user_role) {
    user_id
    user_email
    user_phone
    user_role
    isactive
  }
}`;

export const COUNT_USERS = `query CountUsers($filters: UserFilterInput) {
  countUsers(filters: $filters)
}`;

// ─── USER MUTATIONS ───────────────────────────────────────────────────────────
export const CREATE_USER = `mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    user_id
    user_email
    user_phone
    user_role
    isactive
    created_at
    updated_at
    last_login
  }
}`;

export const UPDATE_USER = `mutation UpdateUser($user_id: ID!, $input: UpdateUserInput!) {
  updateUser(user_id: $user_id, input: $input) {
    user_id
    user_email
    user_phone
    user_role
    isactive
  }
}`;

export const DEACTIVATE_USER = `mutation DeactivateUser($user_id: ID!) {
  deactivateUser(user_id: $user_id)
}`;

export const SAVE_FCM_TOKEN = `mutation SaveFcmToken($user_id: String!, $fcm_token: String!) {
  saveFcmToken(user_id: $user_id, fcm_token: $fcm_token) {
    user_id
  }
}`;

export const CLEAR_FCM_TOKEN = `mutation ClearFcmToken($user_id: String!) {
  clearFcmToken(user_id: $user_id)
}`;

// ─── ADMIN QUERIES ────────────────────────────────────────────────────────────
export const GET_ADMINS = `query GetAllAdmins {
  getAllAdmins {
    admin_id
    admin_fname
    admin_lname
    user {
      user_id
      user_email
      user_phone
      user_role
      isactive
      created_at
    }
  }
}`;

// ─── ADMIN MUTATIONS ──────────────────────────────────────────────────────────
export const CREATE_ADMIN = `mutation CreateAdmin($input: CreateAdminInput!) {
  createAdmin(input: $input) {
    admin_id
    admin_fname
    admin_lname
    user {
      user_id
      user_email
      user_phone
      user_role
      isactive
    }
  }
}`;

export const DEACTIVATE_ADMIN = `mutation DeactivateAdmin($admin_id: ID!) {
  deactivateAdmin(admin_id: $admin_id)
}`;
