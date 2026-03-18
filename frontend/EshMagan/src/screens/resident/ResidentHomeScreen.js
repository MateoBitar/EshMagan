// src/screens/resident/ResidentHomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Linking, Platform } from 'react-native';
import { gqlFetch, GET_ACTIVE_FIRES } from '../../services/api';
import ResidentSidebar from './ResidentSidebar';
import styles from '../../styles/screens/ResidentHomeScreen.styles';

const QUICK_ACTIONS = [
  { emoji: '🧭', label: 'Evacuation Routes', screen: 'Evacuation', color: '#3b82f6' },
  { emoji: '🗺️', label: 'Interactive Map', screen: 'ResidentMap', color: '#8b5cf6' },
  { emoji: '📖', label: 'Safety Tips', screen: 'SafetyTips', color: '#f97316' },
  { emoji: '⚠️', label: 'My Alerts', screen: 'ResidentAlerts', color: '#10b981' }
];

const EMERGENCY_CONTACTS = [
  { name: 'Fire Emergency', number: '125', emoji: '🔥', color: '#ef4444' },
  { name: 'Medical Emergency', number: '140', emoji: '🚑', color: '#10b981' },
  { name: 'Police', number: '112', emoji: '🚔', color: '#3b82f6' },
];

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

function useActiveFires() {
  const [fires, setFires] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web') { setLoading(false); return; }
    const fetchFires = async () => {
      try {
        const data = await gqlFetch(GET_ACTIVE_FIRES);
        setFires(data?.getActiveFires || []);
      } catch (e) { console.error('Failed to fetch fires:', e); }
      finally { setLoading(false); }
    };
    fetchFires();
    const interval = setInterval(fetchFires, 30000);
    return () => clearInterval(interval);
  }, []);

  return { fires, loading };
}

export default function ResidentHomeScreen({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  let nav = navigation;
  if (Platform.OS !== 'web') {
    try { const { useNavigation } = require('@react-navigation/native'); nav = useNavigation(); } catch { }
  }

  // For native use Apollo, for web use fetch
  let fires = [], loading = false;
  const webData = useActiveFires();

  if (Platform.OS !== 'web') {
    try {
      const { useQuery, gql } = require('@apollo/client');
      const QUERY = gql`query GetActiveFires {
        getActiveFires { fire_id fire_source fire_location fire_severitylevel is_extinguished is_verified created_at }
      }`;
      const result = useQuery(QUERY, { pollInterval: 30000 });
      fires = result.data?.getActiveFires || [];
      loading = result.loading;
    } catch { }
  } else {
    fires = webData.fires;
    loading = webData.loading;
  }

  const activeFires = fires.filter(f => f.is_extinguished === false);
  const hasActiveThreat = activeFires.length > 0;

  const navigate = (screen, params) => {
    if (!screen) return;
    nav?.navigate(screen, params);
  };

  // currentScreen for sidebar active state
  const currentScreen = nav?.currentScreen || 'ResidentHome';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ResidentSidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={nav}
        currentScreen={currentScreen}
      />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header Banner */}
        <View style={hasActiveThreat ? styles.headerBannerDanger : styles.headerBannerSafe}>
          <View style={styles.headerRow}>
            <View style={styles.headerLogoWrap}>
              <View style={styles.headerLogoIcon}>
                <Text style={styles.headerLogoEmoji}>🔥</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>EshMagan</Text>
                <Text style={styles.headerSub}>Resident Portal</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TouchableOpacity style={styles.bellBtn} onPress={() => navigate('Alert')}>
                <Text style={styles.bellEmoji}>🔔</Text>
              </TouchableOpacity>
              {/* Hamburger menu — web/desktop only */}
              {Platform.OS === 'web' && (
                <TouchableOpacity
                  style={[styles.bellBtn, { marginLeft: 4 }]}
                  onPress={() => setSidebarOpen(true)}
                >
                  <Text style={{ fontSize: 20 }}>☰</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={hasActiveThreat ? styles.statusIconWrapDanger : styles.statusIconWrapSafe}>
                <Text style={styles.statusEmoji}>{hasActiveThreat ? '🚨' : '🛡️'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusMsg}>{hasActiveThreat ? 'Active Fire Threat' : 'You Are Safe'}</Text>
                <Text style={styles.statusDesc}>
                  {loading ? 'Checking status...' : hasActiveThreat
                    ? `${activeFires.length} active fire(s) detected nearby`
                    : 'No active fire threats in your area'}
                </Text>
              </View>
              {loading && <ActivityIndicator color="#dc2626" size="small" />}
            </View>
            <View style={styles.locationRow}>
              <Text>📍</Text>
              <Text style={styles.locationText}>Your Location: Haifa, Northern District</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity
                key={action.label}
                onPress={() => navigate(action.screen)}
                style={[styles.actionBtn, { backgroundColor: action.color, shadowColor: action.color }]}
              >
                <Text style={styles.actionEmoji}>{action.emoji}</Text>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nearby Fires */}
        <View style={styles.firesSection}>
          <View style={styles.firesHeaderRow}>
            <Text style={styles.sectionTitle}>Nearby Fire Events</Text>
            <View style={styles.firesCount}>
              <Text style={styles.firesCountText}>{fires.length} total</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color="#dc2626" style={{ marginTop: 20 }} />
          ) : fires.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyText}>No active fires in your area</Text>
            </View>
          ) : (
            fires.slice(0, 5).map(fire => {
              const riskColor = getSeverityColor(fire.fire_severitylevel);
              const riskLabel = getSeverityLabel(fire.fire_severitylevel);
              return (
                <TouchableOpacity
                  key={fire.fire_id}
                  onPress={() => navigate('IncidentDetails', { fireId: fire.fire_id })}
                  style={[styles.fireCard, { borderColor: riskColor }]}
                >
                  <View style={styles.fireCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fireLocation}>{fire.fire_location || 'Unknown Location'}</Text>
                      <Text style={styles.fireId}>ID: {fire.fire_id?.slice(0, 8)}</Text>
                    </View>
                  </View>
                  <View style={styles.fireCardBottom}>
                    <Text style={styles.fireStatus}>{fire.is_extinguished ? 'Extinguished' : 'Active'} • {riskLabel}</Text>
                    <Text style={styles.fireArrow}>›</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Emergency Contacts */}
        <View style={styles.contactsSection}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          {EMERGENCY_CONTACTS.map(contact => (
            <TouchableOpacity
              key={contact.name}
              onPress={() => Linking.openURL(`tel:${contact.number}`)}
              style={styles.contactCard}
            >
              <View style={styles.contactLeft}>
                <View style={[styles.contactIcon, { backgroundColor: contact.color + '20' }]}>
                  <Text style={styles.contactEmoji}>{contact.emoji}</Text>
                </View>
                <Text style={styles.contactName}>{contact.name}</Text>
              </View>
              <View style={styles.contactRight}>
                <Text style={styles.contactNumber}>{contact.number}</Text>
                <View style={styles.contactPhoneBtn}>
                  <Text>📞</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
