// src/screens/municipality/IncidentDetailsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { gqlFetch, GET_FIRE, GET_ASSIGNMENTS_BY_FIRE, GET_ALERTS_BY_FIRE, VERIFY_FIRE, EXTINGUISH_FIRE, DISPATCH_CLOSEST_RESPONDER, UPDATE_ASSIGNMENT_STATUS } from '../../services/api';

function getSeverityColor(level) {
  if (!level) return '#94a3b8';
  if (level >= 8) return '#dc2626';
  if (level >= 6) return '#ea580c';
  if (level >= 3) return '#d97706';
  return '#16a34a';
}

function getSeverityLabel(level) {
  if (!level) return 'Unknown';
  if (level >= 8) return 'Critical';
  if (level >= 6) return 'High';
  if (level >= 3) return 'Moderate';
  return 'Low';
}

function useIncidentData(fireId) {
  const [fire, setFire] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!fireId) { setLoading(false); return; }
    try {
      const [fireData, assignData, alertData] = await Promise.all([
        gqlFetch(GET_FIRE, { fire_id: fireId }),
        gqlFetch(GET_ASSIGNMENTS_BY_FIRE, { fire_id: fireId }),
        gqlFetch(GET_ALERTS_BY_FIRE, { fire_id: fireId }),
      ]);
      setFire(fireData?.getFireById || null);
      setAssignments(assignData?.getAssignmentsByFireId || []);
      setAlerts(alertData?.getAlertsByFireId || []);
    } catch (e) { console.error('Failed to fetch incident details:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [fireId]);
  return { fire, assignments, alerts, loading, refresh };
}

export default function IncidentDetailsScreen({ navigation, route }) {
  let nav = navigation;
  let routeParams = route?.params || {};
  if (Platform.OS !== 'web') {
    try {
      const { useNavigation, useRoute } = require('@react-navigation/native');
      nav = useNavigation();
      routeParams = useRoute().params || {};
    } catch {}
  }

  const { fireId } = routeParams;
  const [actionLoading, setActionLoading] = useState(false);

  // Web: use hook. Native: use Apollo
  const webData = useIncidentData(Platform.OS === 'web' ? fireId : null);

  let fire = null, assignments = [], alerts = [], loading = false;
  let refresh = webData.refresh;

  if (Platform.OS !== 'web') {
    try {
      const { useQuery, gql } = require('@apollo/client');
      const FIRE_Q = gql`query GetFireById($fire_id: ID!) { getFireById(fire_id: $fire_id) { fire_id fire_source fire_location fire_severitylevel is_extinguished is_verified spread_prediction created_at updated_at } }`;
      const ASSIGN_Q = gql`query GetAssignmentsByFireId($fire_id: ID!) { getAssignmentsByFireId(fire_id: $fire_id) { assignment_id assignment_status fire_id responder_id assigned_at } }`;
      const ALERTS_Q = gql`query GetAlertsByFireId($fire_id: ID!) { getAlertsByFireId(fire_id: $fire_id) { alert_id alert_type target_role alert_message created_at } }`;
      const fr = useQuery(FIRE_Q, { variables: { fire_id: fireId }, skip: !fireId });
      const ar = useQuery(ASSIGN_Q, { variables: { fire_id: fireId }, skip: !fireId });
      const alr = useQuery(ALERTS_Q, { variables: { fire_id: fireId }, skip: !fireId });
      fire = fr.data?.getFireById;
      assignments = ar.data?.getAssignmentsByFireId || [];
      alerts = alr.data?.getAlertsByFireId || [];
      loading = fr.loading;
      refresh = () => { fr.refetch(); ar.refetch(); alr.refetch(); };
    } catch {}
  } else {
    fire = webData.fire;
    assignments = webData.assignments;
    alerts = webData.alerts;
    loading = webData.loading;
  }

  const handleAction = async (action, label) => {
    const confirm = Platform.OS === 'web'
      ? window.confirm(`${label} this fire?`)
      : await new Promise(resolve => Alert.alert(label, `Are you sure you want to ${label.toLowerCase()} this fire?`, [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: label, onPress: () => resolve(true) },
        ]));
    if (!confirm) return;
    setActionLoading(true);
    try {
      await gqlFetch(action, { fire_id: fireId });
      refresh();
    } catch (e) {
      const msg = e.message || 'Action failed';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally { setActionLoading(false); }
  };

  const handleDispatch = async () => {
    setActionLoading(true);
    try {
      await gqlFetch(DISPATCH_CLOSEST_RESPONDER, { fire_id: fireId });
      refresh();
    } catch (e) {
      const msg = e.message || 'Dispatch failed';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally { setActionLoading(false); }
  };

  const handleUpdateAssignment = async (assignment_id, status) => {
    try {
      await gqlFetch(UPDATE_ASSIGNMENT_STATUS, { input: { assignment_id, status } });
      refresh();
    } catch (e) { console.error('Assignment update failed:', e); }
  };

  const severityColor = getSeverityColor(fire?.fire_severitylevel);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', padding: 16 }}>
        <TouchableOpacity onPress={() => nav?.goBack()} style={{ marginBottom: 10 }}>
          <Text style={{ color: '#64748b', fontSize: 14 }}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>Incident Details</Text>
        {fire && <Text style={{ fontSize: 12, color: '#94a3b8' }}>{fire.fire_id}</Text>}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#dc2626" />
        </View>
      ) : !fire ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>🔍</Text>
          <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center' }}>Fire incident not found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>

          {/* Main Fire Info */}
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 2, borderColor: '#fecaca' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#fef2f2', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24 }}>🔥</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>{fire.fire_location || 'Unknown Location'}</Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>{fire.fire_source || 'Manual Report'}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: severityColor + '20' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: severityColor }}>{getSeverityLabel(fire.fire_severitylevel)}</Text>
              </View>
            </View>

            {[
              { label: 'Status', value: fire.is_extinguished ? '✅ Extinguished' : '🔥 Active' },
              { label: 'Verified', value: fire.is_verified ? '✅ Yes' : '⏳ Pending' },
              { label: 'Severity', value: `${getSeverityLabel(fire.fire_severitylevel)} (${fire.fire_severitylevel || 'N/A'}/10)` },
              { label: 'Spread Prediction', value: fire.spread_prediction || 'N/A' },
              { label: 'Detected', value: fire.created_at ? new Date(fire.created_at).toLocaleString() : 'N/A' },
              { label: 'Last Updated', value: fire.updated_at ? new Date(fire.updated_at).toLocaleString() : 'N/A' },
            ].map(({ label, value }) => (
              <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 13, color: '#64748b' }}>{label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a', flex: 1, textAlign: 'right' }}>{value || 'N/A'}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>⚡ Actions</Text>
            {actionLoading ? (
              <ActivityIndicator color="#dc2626" />
            ) : (
              <View style={{ gap: 10 }}>
                {!fire.is_verified && (
                  <TouchableOpacity
                    onPress={() => handleAction(VERIFY_FIRE, 'Verify')}
                    style={{ backgroundColor: '#2563eb', borderRadius: 10, padding: 12, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>✅ Verify Fire</Text>
                  </TouchableOpacity>
                )}
                {!fire.is_extinguished && (
                  <TouchableOpacity
                    onPress={() => handleAction(EXTINGUISH_FIRE, 'Extinguish')}
                    style={{ backgroundColor: '#16a34a', borderRadius: 10, padding: 12, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>💧 Mark as Extinguished</Text>
                  </TouchableOpacity>
                )}
                {!fire.is_extinguished && (
                  <TouchableOpacity
                    onPress={handleDispatch}
                    style={{ backgroundColor: '#dc2626', borderRadius: 10, padding: 12, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>🚒 Dispatch Closest Responder</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Assignments */}
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>
              👥 Assigned Responders ({assignments.length})
            </Text>
            {assignments.length === 0 ? (
              <Text style={{ color: '#94a3b8', fontSize: 13 }}>No responders assigned yet</Text>
            ) : (
              assignments.map(a => (
                <View key={a.assignment_id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Text style={{ fontSize: 20 }}>🚒</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a' }}>Responder {a.responder_id?.slice(0, 10)}</Text>
                      <Text style={{ fontSize: 11, color: '#64748b' }}>Status: {a.assignment_status} • {a.assigned_at ? new Date(a.assigned_at).toLocaleTimeString() : 'N/A'}</Text>
                    </View>
                  </View>
                  {/* Status update buttons */}
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                    {['EnRoute', 'OnScene', 'Completed', 'Cancelled'].map(status => (
                      <TouchableOpacity
                        key={status}
                        onPress={() => handleUpdateAssignment(a.assignment_id, status)}
                        style={{
                          paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
                          backgroundColor: a.assignment_status === status ? '#0f172a' : '#f1f5f9',
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: '600', color: a.assignment_status === status ? '#fff' : '#64748b' }}>{status}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Alerts triggered by this fire */}
          {alerts.length > 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>
                🔔 Triggered Alerts ({alerts.length})
              </Text>
              {alerts.map(alert => (
                <View key={alert.alert_id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a' }}>{alert.alert_type?.replace(/_/g, ' ')}</Text>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>{alert.target_role}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>{alert.alert_message}</Text>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}
