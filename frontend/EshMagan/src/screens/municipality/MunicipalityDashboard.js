// src/screens/municipality/MunicipalityDashboard.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform } from 'react-native';
import { gqlFetch, GET_FIRES } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/screens/MunicipalityDashboard.styles';

const NAV_ITEMS = [
  { id: 'dashboard', emoji: '📊', label: 'Dashboard' },
  { id: 'incidents', emoji: '⚠️', label: 'Incidents' },
  { id: 'responders', emoji: '👥', label: 'Responders' },
  { id: 'settings', emoji: '⚙️', label: 'Settings' },
];

function getSeverityColor(level) {
  if (!level) return { bg: '#f8fafc', text: '#94a3b8' };
  if (level >= 8) return { bg: '#fef2f2', text: '#dc2626' };
  if (level >= 6) return { bg: '#fff7ed', text: '#ea580c' };
  if (level >= 3) return { bg: '#fefce8', text: '#ca8a04' };
  return { bg: '#f0fdf4', text: '#16a34a' };
}

function useFiresData() {
  const [fires, setFires] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web') { setLoading(false); return; }
    const fetch = async () => {
      try {
        const data = await gqlFetch(GET_FIRES);
        setFires(data?.getAllFires || []);
      } catch (e) { console.error('Failed to fetch fires:', e); }
      finally { setLoading(false); }
    };
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, []);

  return { fires, loading };
}

export default function MunicipalityDashboard({ navigation }) {
  let nav = navigation;
  if (Platform.OS !== 'web') {
    try { const { useNavigation } = require('@react-navigation/native'); nav = useNavigation(); } catch {}
  }

  const { logout } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  const webData = useFiresData();

  let fires = [], loading = false;

  if (Platform.OS !== 'web') {
    try {
      const { useQuery, gql } = require('@apollo/client');
      const QUERY = gql`query GetAllFires {
        getAllFires { fire_id fire_source fire_location fire_severitylevel is_extinguished is_verified created_at }
      }`;
      const result = useQuery(QUERY, { pollInterval: 15000 });
      fires = result.data?.getAllFires || [];
      loading = result.loading;
    } catch {}
  } else {
    fires = webData.fires;
    loading = webData.loading;
  }

  const stats = [
    { label: 'Active Fires', value: fires.filter(f => !f.is_extinguished).length.toString(), emoji: '🔥', color: '#dc2626', bg: '#fef2f2' },
    { label: 'Total Fires', value: fires.length.toString(), emoji: '📊', color: '#2563eb', bg: '#eff6ff' },
    { label: 'Verified', value: fires.filter(f => f.is_verified).length.toString(), emoji: '✅', color: '#16a34a', bg: '#f0fdf4' },
    { label: 'Extinguished', value: fires.filter(f => f.is_extinguished).length.toString(), emoji: '💧', color: '#0891b2', bg: '#ecfeff' },
  ];

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
            <TouchableOpacity key={item.id} onPress={() => setActiveNav(item.id)} style={[styles.navItem, activeNav === item.id ? styles.navItemActive : styles.navItemInactive]}>
              <Text style={styles.navEmoji}>{item.emoji}</Text>
              <Text style={[styles.navLabel, activeNav === item.id ? styles.navLabelActive : styles.navLabelInactive]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.mainContent}>
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

          <Text style={styles.firesTitle}>Fire Events</Text>
          {loading ? (
            <ActivityIndicator color="#dc2626" style={{ marginTop: 20 }} />
          ) : fires.length === 0 ? (
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
                      <Text style={styles.fireMeta}>{fire.fire_id?.slice(0, 8)}... • {fire.fire_source || 'Manual'}</Text>
                    </View>
                    <View style={[styles.fireSeverityBadge, { backgroundColor: riskStyle.bg }]}>
                      <Text style={[styles.fireSeverityText, { color: riskStyle.text }]}>{fire.fire_severitylevel || 'N/A'}</Text>
                    </View>
                  </View>
                  <View style={styles.fireCardBottom}>
                    <Text style={styles.fireStatusText}>📌 {fire.is_extinguished ? 'Extinguished' : 'Active'}</Text>
                    <Text style={styles.fireStatusText}>🕐 {fire.created_at ? new Date(fire.created_at).toLocaleTimeString() : 'N/A'}</Text>
                    <Text style={styles.fireArrow}>›</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
