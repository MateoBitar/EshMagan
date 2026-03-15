// src/screens/responder/ResponderCommandView.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { gqlFetch, GET_ALL_FIRES, GET_ALL_RESPONDERS, GET_ACTIVE_ASSIGNMENTS, UPDATE_ASSIGNMENT_STATUS, DISPATCH_CLOSEST_RESPONDER, GET_NOTIFICATIONS_BY_ROLE } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/screens/ResponderCommandView.styles';

const STATUS_STYLE = {
  Active: { bg: '#f0fdf4', text: '#16a34a', emoji: '✅' },
  Standby: { bg: '#fefce8', text: '#ca8a04', emoji: '⏳' },
  Unavailable: { bg: '#f8fafc', text: '#94a3b8', emoji: '💤' },
};

const ASSIGNMENT_STATUS_COLORS = {
  Assigned: '#2563eb', EnRoute: '#f59e0b', OnScene: '#dc2626', Completed: '#16a34a', Cancelled: '#94a3b8',
};

function useCommandData() {
  const [fires, setFires] = useState([]);
  const [responders, setResponders] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [fireData, respData, assignData, notifData] = await Promise.all([
        gqlFetch(GET_ALL_FIRES),
        gqlFetch(GET_ALL_RESPONDERS),
        gqlFetch(GET_ACTIVE_ASSIGNMENTS),
        gqlFetch(GET_NOTIFICATIONS_BY_ROLE, { target_role: 'Responder' }),
      ]);
      setFires(fireData?.getAllFires || []);
      setResponders(respData?.getAllResponders || []);
      setAssignments(assignData?.getActiveAssignments || []);
      setNotifications(notifData?.getNotificationsByTargetRole || []);
    } catch (e) { console.error('Command data fetch error:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (Platform.OS !== 'web') { setLoading(false); return; }
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, []);

  return { fires, responders, assignments, notifications, loading, refresh };
}

export default function ResponderCommandView({ navigation }) {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('units');
  const [liveFlash, setLiveFlash] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const webData = useCommandData();

  let fires = [], responders = [], assignments = [], notifications = [], loading = false, refresh = webData.refresh;

  if (Platform.OS !== 'web') {
    try {
      const { useQuery, gql } = require('@apollo/client');
      const FIRES_Q = gql`query GetAllFires { getAllFires { fire_id fire_source fire_location fire_severitylevel is_extinguished created_at } }`;
      const RESP_Q = gql`query GetAllResponders { getAllResponders { responder_id unit_nb unit_location assigned_region responder_status last_known_location } }`;
      const ASSIGN_Q = gql`query GetActiveAssignments { getActiveAssignments { assignment_id assignment_status fire_id responder_id assigned_at } }`;
      const NOTIF_Q = gql`query GetNotificationsByTargetRole($target_role: NotificationTargetRole!) { getNotificationsByTargetRole(target_role: $target_role) { notification_id notification_message notification_status created_at fire_id } }`;
      const fr = useQuery(FIRES_Q, { pollInterval: 10000 });
      const rr = useQuery(RESP_Q, { pollInterval: 10000 });
      const ar = useQuery(ASSIGN_Q, { pollInterval: 10000 });
      const nr = useQuery(NOTIF_Q, { variables: { target_role: 'Responder' }, pollInterval: 10000 });
      fires = fr.data?.getAllFires || [];
      responders = rr.data?.getAllResponders || [];
      assignments = ar.data?.getActiveAssignments || [];
      notifications = nr.data?.getNotificationsByTargetRole || [];
      loading = fr.loading;
      refresh = () => { fr.refetch(); rr.refetch(); ar.refetch(); nr.refetch(); };
    } catch {}
  } else {
    fires = webData.fires;
    responders = webData.responders;
    assignments = webData.assignments;
    notifications = webData.notifications;
    loading = webData.loading;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveFlash(true);
      setTimeout(() => setLiveFlash(false), 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateAssignment = async (assignment_id, status) => {
    setActionLoading(assignment_id);
    try {
      await gqlFetch(UPDATE_ASSIGNMENT_STATUS, { input: { assignment_id, status } });
      refresh();
    } catch (e) {
      const msg = e.message || 'Update failed';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally { setActionLoading(null); }
  };

  const handleDispatch = async (fire_id) => {
    setActionLoading(fire_id);
    try {
      await gqlFetch(DISPATCH_CLOSEST_RESPONDER, { fire_id });
      refresh();
      Platform.OS === 'web' ? window.alert('Closest responder dispatched!') : Alert.alert('Dispatched', 'Closest responder has been dispatched.');
    } catch (e) {
      const msg = e.message || 'Dispatch failed';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally { setActionLoading(null); }
  };

  const activeFires = fires.filter(f => !f.is_extinguished);
  const TABS = [
    { id: 'units', label: '🚒 Units' },
    { id: 'fires', label: `🔥 Fires${activeFires.length > 0 ? ` (${activeFires.length})` : ''}` },
    { id: 'assignments', label: `📋 Active${assignments.length > 0 ? ` (${assignments.length})` : ''}` },
    { id: 'alerts', label: `🔔 Alerts${notifications.length > 0 ? ` (${notifications.length})` : ''}` },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerIcon}><Text style={{ fontSize: 20 }}>🔥</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Responder Command</Text>
          <View style={styles.liveRow}>
            <View style={[styles.liveDot, { backgroundColor: liveFlash ? '#ef4444' : '#22c55e' }]} />
            <Text style={styles.liveText}>Live Feed Active</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout}><Text style={{ fontSize: 20 }}>🚪</Text></TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' }}>
        <View style={{ flexDirection: 'row' }}>
          {TABS.map(tab => (
            <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id)} style={[styles.tab, { paddingHorizontal: 16 }, activeTab === tab.id ? styles.tabActive : styles.tabInactive]}>
              <Text style={[styles.tabText, activeTab === tab.id ? styles.tabTextActive : styles.tabTextInactive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* UNITS */}
        {activeTab === 'units' && (
          <View>
            <Text style={styles.tabSubtitle}>{loading ? 'Loading...' : `${responders.length} units registered`}</Text>
            {loading ? <ActivityIndicator color="#ef4444" /> : responders.length === 0 ? (
              <Text style={{ color: '#475569', textAlign: 'center', marginTop: 32 }}>No responder units found</Text>
            ) : (
              responders.map(r => {
                const s = STATUS_STYLE[r.responder_status] || STATUS_STYLE.Unavailable;
                return (
                  <View key={r.responder_id} style={styles.unitCard}>
                    <View style={styles.unitCardTop}>
                      <View style={styles.unitLeft}>
                        <View style={styles.unitIcon}><Text style={{ fontSize: 18 }}>🚒</Text></View>
                        <View>
                          <Text style={styles.unitName}>{r.unit_nb || r.responder_id?.slice(0, 8)}</Text>
                          <Text style={styles.unitType}>{r.assigned_region || 'Unassigned'}</Text>
                        </View>
                      </View>
                      <View style={[styles.unitStatusBadge, { backgroundColor: s.bg }]}>
                        <Text style={[styles.unitStatusText, { color: s.text }]}>{s.emoji} {r.responder_status}</Text>
                      </View>
                    </View>
                    <Text style={styles.unitLocation}>📍 {r.unit_location || r.last_known_location || 'Unknown'}</Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ACTIVE FIRES */}
        {activeTab === 'fires' && (
          <View>
            <Text style={styles.tabSubtitle}>{loading ? 'Loading...' : `${activeFires.length} active fires`}</Text>
            {loading ? <ActivityIndicator color="#ef4444" /> : activeFires.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>✅</Text>
                <Text style={{ color: '#10b981', fontWeight: '600' }}>No active fire incidents</Text>
              </View>
            ) : (
              activeFires.map(fire => (
                <View key={fire.fire_id} style={styles.fireCard}>
                  <View style={styles.fireCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fireLocation}>{fire.fire_location || 'Unknown Location'}</Text>
                      <Text style={styles.fireMeta}>{fire.fire_id?.slice(0, 10)} • {fire.fire_source}</Text>
                    </View>
                    <View style={styles.fireSeverityBadge}>
                      <Text style={styles.fireSeverityText}>Sev {fire.fire_severitylevel || 'N/A'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDispatch(fire.fire_id)}
                    disabled={actionLoading === fire.fire_id}
                    style={{ marginTop: 10, backgroundColor: '#dc2626', borderRadius: 8, padding: 8, alignItems: 'center' }}
                  >
                    {actionLoading === fire.fire_id
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>🚒 Dispatch Closest Responder</Text>
                    }
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* ACTIVE ASSIGNMENTS */}
        {activeTab === 'assignments' && (
          <View>
            <Text style={styles.tabSubtitle}>{loading ? 'Loading...' : `${assignments.length} active assignments`}</Text>
            {loading ? <ActivityIndicator color="#ef4444" /> : assignments.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
                <Text style={{ color: '#64748b', fontWeight: '600' }}>No active assignments</Text>
              </View>
            ) : (
              assignments.map(a => {
                const statusColor = ASSIGNMENT_STATUS_COLORS[a.assignment_status] || '#64748b';
                return (
                  <View key={a.assignment_id} style={styles.unitCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <View>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>🚒 Responder {a.responder_id?.slice(0, 8)}</Text>
                        <Text style={{ color: '#64748b', fontSize: 11 }}>Fire: {a.fire_id?.slice(0, 10)}</Text>
                      </View>
                      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: statusColor + '20' }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor }}>{a.assignment_status}</Text>
                      </View>
                    </View>
                    <Text style={{ color: '#475569', fontSize: 11, marginBottom: 10 }}>
                      Assigned: {a.assigned_at ? new Date(a.assigned_at).toLocaleString() : 'N/A'}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                      {['EnRoute', 'OnScene', 'Completed', 'Cancelled'].map(status => (
                        <TouchableOpacity
                          key={status}
                          onPress={() => handleUpdateAssignment(a.assignment_id, status)}
                          disabled={actionLoading === a.assignment_id || a.assignment_status === status}
                          style={{
                            paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
                            backgroundColor: a.assignment_status === status ? statusColor : '#1e293b',
                          }}
                        >
                          {actionLoading === a.assignment_id
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={{ fontSize: 11, fontWeight: '600', color: a.assignment_status === status ? '#fff' : '#64748b' }}>{status}</Text>
                          }
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ALERTS/NOTIFICATIONS */}
        {activeTab === 'alerts' && (
          <View>
            <Text style={styles.tabSubtitle}>{loading ? 'Loading...' : `${notifications.length} notifications for responders`}</Text>
            {loading ? <ActivityIndicator color="#ef4444" /> : notifications.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🔔</Text>
                <Text style={{ color: '#64748b', fontWeight: '600' }}>No notifications</Text>
              </View>
            ) : (
              notifications.map(n => (
                <View key={n.notification_id} style={styles.fireCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: n.notification_status === 'Sent' ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.15)' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: n.notification_status === 'Sent' ? '#ef4444' : '#64748b' }}>{n.notification_status}</Text>
                    </View>
                    <Text style={{ color: '#475569', fontSize: 11 }}>{n.created_at ? new Date(n.created_at).toLocaleTimeString() : ''}</Text>
                  </View>
                  <Text style={{ color: '#cbd5e1', fontSize: 13 }}>{n.notification_message}</Text>
                  {n.fire_id && <Text style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>Fire: {n.fire_id?.slice(0, 10)}</Text>}
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
