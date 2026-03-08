// src/screens/municipality/MunicipalityDashboard.js
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@apollo/client';
import { GET_FIRES } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/screens/MunicipalityDashboard.styles';

const NAV_ITEMS = [
  { id: 'dashboard', emoji: '📊', label: 'Dashboard' },
  { id: 'incidents', emoji: '⚠️', label: 'Incidents' },
  { id: 'responders', emoji: '👥', label: 'Responders' },
  { id: 'settings', emoji: '⚙️', label: 'Settings' },
];

const RISK_COLORS = {
  critical: { bg: '#fef2f2', text: '#dc2626' },
  high: { bg: '#fff7ed', text: '#ea580c' },
  moderate: { bg: '#fefce8', text: '#ca8a04' },
  low: { bg: '#f0fdf4', text: '#16a34a' },
};

export default function MunicipalityDashboard() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [activeNav, setActiveNav] = useState('dashboard');
  const { data, loading } = useQuery(GET_FIRES, { pollInterval: 15000 });
  const fires = data?.fires || [];

  const stats = [
    { label: 'Active Fires', value: fires.filter(f => f.fire_status === 'Active').length.toString(), emoji: '🔥', color: '#dc2626', bg: '#fef2f2' },
    { label: 'Total Fires', value: fires.length.toString(), emoji: '📊', color: '#2563eb', bg: '#eff6ff' },
    { label: 'Predicted', value: fires.filter(f => f.fire_status === 'predicted').length.toString(), emoji: '🤖', color: '#9333ea', bg: '#faf5ff' },
    { label: 'Contained', value: fires.filter(f => f.fire_status === 'Contained').length.toString(), emoji: '✅', color: '#16a34a', bg: '#f0fdf4' },
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
        {/* Sidebar */}
        <View style={styles.sidebar}>
          {NAV_ITEMS.map(item => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setActiveNav(item.id)}
              style={[styles.navItem, activeNav === item.id ? styles.navItemActive : styles.navItemInactive]}
            >
              <Text style={styles.navEmoji}>{item.emoji}</Text>
              <Text style={[styles.navLabel, activeNav === item.id ? styles.navLabelActive : styles.navLabelInactive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main */}
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
                {loading
                  ? <ActivityIndicator color={stat.color} size="small" />
                  : <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                }
              </View>
            ))}
          </View>

          <Text style={styles.firesTitle}>Active Fire Events</Text>
          {loading ? (
            <ActivityIndicator color="#dc2626" style={{ marginTop: 20 }} />
          ) : fires.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>✅</Text>
              <Text style={{ color: '#15803d', fontWeight: '600' }}>No active fire events</Text>
            </View>
          ) : (
            fires.map(fire => {
              const riskStyle = RISK_COLORS[fire.fire_severitylevel?.toLowerCase()] || RISK_COLORS.low;
              return (
                <TouchableOpacity
                  key={fire.id}
                  onPress={() => navigation.navigate('IncidentDetails', { fireId: fire.id })}
                  style={styles.fireCard}
                >
                  <View style={styles.fireCardTop}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.fireLocation}>{fire.fire_location || 'Unknown Location'}</Text>
                      <Text style={styles.fireMeta}>{fire.id?.slice(0, 8)}... • {fire.fire_source || 'Manual'}</Text>
                    </View>
                    <View style={[styles.fireSeverityBadge, { backgroundColor: riskStyle.bg }]}>
                      <Text style={[styles.fireSeverityText, { color: riskStyle.text }]}>{fire.fire_severitylevel || 'N/A'}</Text>
                    </View>
                  </View>
                  <View style={styles.fireCardBottom}>
                    <Text style={styles.fireStatusText}>📌 {fire.fire_status}</Text>
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
