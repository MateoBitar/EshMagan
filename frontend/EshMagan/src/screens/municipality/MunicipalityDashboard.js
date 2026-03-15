// src/screens/municipality/MunicipalityDashboard.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform, Alert, TextInput, Modal } from 'react-native';
import { gqlFetch, GET_ALL_FIRES, GET_FIRE_STATISTICS, CREATE_FIRE_AND_TRIGGER, GET_ALL_RESPONDERS } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/screens/MunicipalityDashboard.styles';

const NAV_ITEMS = [
  { id: 'dashboard', emoji: '📊', label: 'Dashboard' },
  { id: 'incidents', emoji: '⚠️', label: 'Incidents' },
  { id: 'responders', emoji: '👥', label: 'Responders' },
  { id: 'report', emoji: '➕', label: 'Report' },
];

function getSeverityColor(level) {
  if (!level) return { bg: '#f8fafc', text: '#94a3b8' };
  if (level >= 8) return { bg: '#fef2f2', text: '#dc2626' };
  if (level >= 6) return { bg: '#fff7ed', text: '#ea580c' };
  if (level >= 3) return { bg: '#fefce8', text: '#ca8a04' };
  return { bg: '#f0fdf4', text: '#16a34a' };
}

function useDashboardData() {
  const [fires, setFires] = useState([]);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const [fireData, respData] = await Promise.all([
        gqlFetch(GET_ALL_FIRES),
        gqlFetch(GET_ALL_RESPONDERS),
      ]);
      setFires(fireData?.getAllFires || []);
      setResponders(respData?.getAllResponders || []);
    } catch (e) { console.error('Dashboard fetch error:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (Platform.OS !== 'web') { setLoading(false); return; }
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, []);

  return { fires, responders, loading, refresh };
}

export default function MunicipalityDashboard({ navigation }) {
  let nav = navigation;
  if (Platform.OS !== 'web') {
    try { const { useNavigation } = require('@react-navigation/native'); nav = useNavigation(); } catch {}
  }

  const { logout } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [reportModal, setReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ fire_location: '', fire_source: 'Responder', fire_severitylevel: '5' });
  const [submitting, setSubmitting] = useState(false);
  const webData = useDashboardData();

  let fires = [], responders = [], loading = false, refresh = webData.refresh;

  if (Platform.OS !== 'web') {
    try {
      const { useQuery, gql } = require('@apollo/client');
      const FIRES_Q = gql`query GetAllFires { getAllFires { fire_id fire_source fire_location fire_severitylevel is_extinguished is_verified created_at } }`;
      const RESP_Q = gql`query GetAllResponders { getAllResponders { responder_id unit_nb unit_location assigned_region responder_status last_known_location } }`;
      const fr = useQuery(FIRES_Q, { pollInterval: 15000 });
      const rr = useQuery(RESP_Q, { pollInterval: 15000 });
      fires = fr.data?.getAllFires || [];
      responders = rr.data?.getAllResponders || [];
      loading = fr.loading;
      refresh = () => { fr.refetch(); rr.refetch(); };
    } catch {}
  } else {
    fires = webData.fires;
    responders = webData.responders;
    loading = webData.loading;
  }

  const activeFires = fires.filter(f => !f.is_extinguished);
  const verifiedFires = fires.filter(f => f.is_verified);
  const activeResponders = responders.filter(r => r.responder_status === 'Active');

  const stats = [
    { label: 'Active Fires', value: activeFires.length.toString(), emoji: '🔥', color: '#dc2626', bg: '#fef2f2' },
    { label: 'Total Fires', value: fires.length.toString(), emoji: '📊', color: '#2563eb', bg: '#eff6ff' },
    { label: 'Verified', value: verifiedFires.length.toString(), emoji: '✅', color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Active Units', value: activeResponders.length.toString(), emoji: '🚒', color: '#9333ea', bg: '#faf5ff' },
  ];

  const handleReportFire = async () => {
    if (!reportForm.fire_location.trim()) {
      Platform.OS === 'web' ? window.alert('Please enter a fire location') : Alert.alert('Error', 'Please enter a fire location');
      return;
    }
    setSubmitting(true);
    try {
      await gqlFetch(CREATE_FIRE_AND_TRIGGER, {
        input: {
          fire_location: reportForm.fire_location,
          fire_source: reportForm.fire_source,
          fire_severitylevel: parseInt(reportForm.fire_severitylevel) || 5,
          is_extinguished: false,
          is_verified: false,
        }
      });
      setReportModal(false);
      setReportForm({ fire_location: '', fire_source: 'Responder', fire_severitylevel: '5' });
      refresh();
      Platform.OS === 'web' ? window.alert('Fire reported! System alerts have been triggered.') : Alert.alert('Success', 'Fire reported! System alerts have been triggered.');
    } catch (e) {
      const msg = e.message || 'Failed to report fire';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.logoIcon}><Text style={{ fontSize: 20 }}>🔥</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.appName}>EshMagan</Text>
          <Text style={styles.portalLabel}>Municipality Portal</Text>
        </View>
        <TouchableOpacity onPress={logout}><Text style={{ fontSize: 20 }}>🚪</Text></TouchableOpacity>
      </View>

      <View style={styles.layout}>
        <View style={styles.sidebar}>
          {NAV_ITEMS.map(item => (
            <TouchableOpacity
              key={item.id}
              onPress={() => item.id === 'report' ? setReportModal(true) : setActiveNav(item.id)}
              style={[styles.navItem, activeNav === item.id ? styles.navItemActive : styles.navItemInactive]}
            >
              <Text style={styles.navEmoji}>{item.emoji}</Text>
              <Text style={[styles.navLabel, activeNav === item.id ? styles.navLabelActive : styles.navLabelInactive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.mainContent}>

          {/* DASHBOARD TAB */}
          {activeNav === 'dashboard' && (
            <>
              <Text style={styles.dashTitle}>Fire Operations Dashboard</Text>
              <Text style={styles.dashSubtitle}>Real-time monitoring • Northern District</Text>
              <View style={styles.statsGrid}>
                {stats.map(stat => (
                  <View key={stat.label} style={[styles.statCard, { backgroundColor: stat.bg, borderLeftColor: stat.color }]}>
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                      <Text style={{ fontSize: 18 }}>{stat.emoji}</Text>
                    </View>
                    {loading ? <ActivityIndicator color={stat.color} size="small" /> : <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>}
                  </View>
                ))}
              </View>

              <Text style={styles.firesTitle}>Recent Active Fires</Text>
              {loading ? <ActivityIndicator color="#dc2626" style={{ marginTop: 20 }} /> :
                activeFires.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>✅</Text>
                    <Text style={{ color: '#15803d', fontWeight: '600' }}>No active fires</Text>
                  </View>
                ) : (
                  activeFires.slice(0, 5).map(fire => {
                    const riskStyle = getSeverityColor(fire.fire_severitylevel);
                    return (
                      <TouchableOpacity key={fire.fire_id} onPress={() => nav?.navigate('IncidentDetails', { fireId: fire.fire_id })} style={styles.fireCard}>
                        <View style={styles.fireCardTop}>
                          <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.fireLocation}>{fire.fire_location || 'Unknown Location'}</Text>
                            <Text style={styles.fireMeta}>{fire.fire_id?.slice(0, 8)}... • {fire.fire_source || 'Manual'}</Text>
                          </View>
                          <View style={[styles.fireSeverityBadge, { backgroundColor: riskStyle.bg }]}>
                            <Text style={[styles.fireSeverityText, { color: riskStyle.text }]}>{fire.fire_severitylevel || 'N/A'}</Text>
                          </View>
                        </View>
                        <View style={styles.fireCardBottom}>
                          <Text style={styles.fireStatusText}>📌 {fire.is_verified ? 'Verified' : 'Unverified'}</Text>
                          <Text style={styles.fireStatusText}>🕐 {fire.created_at ? new Date(fire.created_at).toLocaleTimeString() : 'N/A'}</Text>
                          <Text style={styles.fireArrow}>›</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )
              }
            </>
          )}

          {/* INCIDENTS TAB */}
          {activeNav === 'incidents' && (
            <>
              <Text style={styles.dashTitle}>All Incidents</Text>
              <Text style={styles.dashSubtitle}>{fires.length} total fire events</Text>
              {loading ? <ActivityIndicator color="#dc2626" style={{ marginTop: 20 }} /> :
                fires.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>✅</Text>
                    <Text style={{ color: '#15803d', fontWeight: '600' }}>No fire events recorded</Text>
                  </View>
                ) : (
                  fires.map(fire => {
                    const riskStyle = getSeverityColor(fire.fire_severitylevel);
                    return (
                      <TouchableOpacity key={fire.fire_id} onPress={() => nav?.navigate('IncidentDetails', { fireId: fire.fire_id })} style={styles.fireCard}>
                        <View style={styles.fireCardTop}>
                          <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.fireLocation}>{fire.fire_location || 'Unknown Location'}</Text>
                            <Text style={styles.fireMeta}>{fire.fire_id?.slice(0, 10)} • {fire.fire_source}</Text>
                          </View>
                          <View style={[styles.fireSeverityBadge, { backgroundColor: riskStyle.bg }]}>
                            <Text style={[styles.fireSeverityText, { color: riskStyle.text }]}>{fire.fire_severitylevel || 'N/A'}</Text>
                          </View>
                        </View>
                        <View style={styles.fireCardBottom}>
                          <Text style={styles.fireStatusText}>{fire.is_extinguished ? '💧 Extinguished' : '🔥 Active'}</Text>
                          <Text style={styles.fireStatusText}>{fire.is_verified ? '✅ Verified' : '⏳ Unverified'}</Text>
                          <Text style={styles.fireArrow}>›</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )
              }
            </>
          )}

          {/* RESPONDERS TAB */}
          {activeNav === 'responders' && (
            <>
              <Text style={styles.dashTitle}>Responder Units</Text>
              <Text style={styles.dashSubtitle}>{responders.length} units • {activeResponders.length} active</Text>
              {loading ? <ActivityIndicator color="#dc2626" style={{ marginTop: 20 }} /> :
                responders.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>🚒</Text>
                    <Text style={{ color: '#64748b', fontWeight: '600' }}>No responders registered</Text>
                  </View>
                ) : (
                  responders.map(r => {
                    const statusColors = { Active: '#16a34a', Standby: '#ca8a04', Unavailable: '#94a3b8' };
                    const color = statusColors[r.responder_status] || '#94a3b8';
                    return (
                      <View key={r.responder_id} style={[styles.fireCard, { marginBottom: 10 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={{ width: 40, height: 40, backgroundColor: '#fef2f2', borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 20 }}>🚒</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.fireLocation}>{r.unit_nb || r.responder_id?.slice(0, 8)}</Text>
                            <Text style={styles.fireMeta}>{r.assigned_region || 'Unassigned'}</Text>
                          </View>
                          <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: color + '20' }}>
                            <Text style={{ fontSize: 11, fontWeight: '700', color }}>{r.responder_status}</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>📍 {r.unit_location || r.last_known_location || 'Unknown'}</Text>
                      </View>
                    );
                  })
                )
              }
            </>
          )}

        </ScrollView>
      </View>

      {/* Report Fire Modal */}
      <Modal visible={reportModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 20 }}>🔥 Report New Fire</Text>

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Location (WKT or description)</Text>
            <TextInput
              value={reportForm.fire_location}
              onChangeText={v => setReportForm(f => ({ ...f, fire_location: v }))}
              placeholder="e.g. POINT(35.2 32.8) or Northern Forest"
              style={{ borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 14, color: '#0f172a' }}
            />

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Source</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              {['Infrared', 'Responder', 'Prediction', 'Weather'].map(src => (
                <TouchableOpacity
                  key={src}
                  onPress={() => setReportForm(f => ({ ...f, fire_source: src }))}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: reportForm.fire_source === src ? '#dc2626' : '#e2e8f0', backgroundColor: reportForm.fire_source === src ? '#fef2f2' : '#f8fafc' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: reportForm.fire_source === src ? '#dc2626' : '#64748b' }}>{src}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 }}>Severity (1-10)</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
              {['1','2','3','4','5','6','7','8','9','10'].map(n => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setReportForm(f => ({ ...f, fire_severitylevel: n }))}
                  style={{ width: 36, height: 36, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', borderColor: reportForm.fire_severitylevel === n ? '#dc2626' : '#e2e8f0', backgroundColor: reportForm.fire_severitylevel === n ? '#fef2f2' : '#f8fafc' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: reportForm.fire_severitylevel === n ? '#dc2626' : '#64748b' }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setReportModal(false)} style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#64748b', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleReportFire} disabled={submitting} style={{ flex: 2, height: 48, borderRadius: 12, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center' }}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>🔥 Report & Trigger System</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
