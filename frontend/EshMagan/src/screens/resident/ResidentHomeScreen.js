// src/screens/resident/ResidentHomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Linking, Platform } from 'react-native';
import { gqlFetch, GET_ACTIVE_FIRES } from '../../services/api';
import ResidentSidebar from './ResidentSidebar';
import { getPlaceName } from '../../services/location.service';
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

function parsePoint(raw) {
  if (!raw) return null;
  if (raw.startsWith('{')) {
    try {
      const g = JSON.parse(raw);
      if (g.type === 'Point' && Array.isArray(g.coordinates)) {
        return { longitude: g.coordinates[0], latitude: g.coordinates[1] };
      }
    } catch {}
    return null;
  }
  const wkt = raw.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (wkt) return { longitude: parseFloat(wkt[1]), latitude: parseFloat(wkt[2]) };
  if (/^[0-9a-fA-F]{20,}$/.test(raw.trim())) return null;
  return null;
}

// Small delay helper to respect Nominatim's 1 req/sec rate limit
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Cache so repeated renders / 30s refresh don't re-query the same coords
const _placeCache = new Map();

async function getPlaceNameCached(latitude, longitude) {
  const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  if (_placeCache.has(key)) return _placeCache.get(key);
  const name = await getPlaceName(latitude, longitude);
  _placeCache.set(key, name);
  return name;
}

function useActiveFires() {
  const [fires, setFires] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web') { setLoading(false); return; }

    const fetchFires = async () => {
      try {
        const data = await gqlFetch(GET_ACTIVE_FIRES);
        const rawFires = data?.getActiveFires || [];

        // Sequential calls with 1.1s gap to respect Nominatim rate limit
        const enriched = [];
        for (const fire of rawFires) {
          const coords = parsePoint(fire.fire_location);
          let place_name = null;
          if (coords) {
            place_name = await getPlaceNameCached(coords.latitude, coords.longitude);
            await sleep(1100); // 1 request per second max
          }
          enriched.push({ ...fire, place_name });
        }
        setFires(enriched);
      } catch (e) {
        console.error('Failed to fetch fires:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchFires();
    const interval = setInterval(fetchFires, 30000);
    return () => clearInterval(interval);
  }, []);

  return { fires, loading };
}

export default function ResidentHomeScreen({ navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userPlaceName, setUserPlaceName] = useState('Locating…');

  let nav = navigation;
  if (Platform.OS !== 'web') {
    try { const { useNavigation } = require('@react-navigation/native'); nav = useNavigation(); } catch {}
  }

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (!navigator.geolocation) { setUserPlaceName('Location unavailable'); return; }
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const name = await getPlaceNameCached(pos.coords.latitude, pos.coords.longitude);
          setUserPlaceName(name);
        },
        () => setUserPlaceName('Location unavailable'),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      try {
        const Geolocation = require('@react-native-community/geolocation').default;
        Geolocation.getCurrentPosition(
          async pos => {
            const name = await getPlaceNameCached(pos.coords.latitude, pos.coords.longitude);
            setUserPlaceName(name);
          },
          () => setUserPlaceName('Location unavailable'),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } catch {
        setUserPlaceName('Location unavailable');
      }
    }
  }, []);

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
    } catch {}
  } else {
    fires = webData.fires;
    loading = webData.loading;
  }

  const activeFires = fires.filter(f => f.is_extinguished === false);
  const hasActiveThreat = activeFires.length > 0;

  const navigate = (screen, params) => { if (!screen) return; nav?.navigate(screen, params); };
  const currentScreen = nav?.currentScreen || 'ResidentHome';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ResidentSidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} navigation={nav} currentScreen={currentScreen} />

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
              {Platform.OS === 'web' && (
                <TouchableOpacity style={[styles.bellBtn, { marginLeft: 4 }]} onPress={() => setSidebarOpen(true)}>
                  <Text style={{ fontSize: 20 }}>☰</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

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
              <Text style={styles.locationText}>Your Location: {userPlaceName}</Text>
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
                style={[styles.actionBtn, { backgroundColor: action.color }]}
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
                      <Text style={styles.fireLocation}>{fire.place_name || 'Unknown Location'}</Text>
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
                <View style={styles.contactPhoneBtn}><Text>📞</Text></View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}