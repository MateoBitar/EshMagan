// src/screens/resident/ResidentHomeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Linking, Platform, Image } from 'react-native';
import { getPlaceName } from '../../services/location.service';
import { gqlFetch, GET_NEARBY_FIRES } from '../../services/api';
import ResidentSidebar from './ResidentSidebar';
import styles from '../../styles/screens/ResidentHomeScreen.styles';
import { useAuth } from '../../context/AuthContext';
import logoSource from '../../images/logoSource';

const ASSETS = {
  compass: Platform.select({
    web: { uri: '/compass.png' },
    android: { uri: 'compass' },
    ios: { uri: 'compass' },
    default: { uri: 'compass' },
  }),
  map: Platform.select({
    web: { uri: '/map.png' },
    android: { uri: 'map' },
    ios: { uri: 'map' },
    default: { uri: 'map' },
  }),
  openBook: Platform.select({
    web: { uri: '/open_book.png' },
    android: { uri: 'open_book' },
    ios: { uri: 'open_book' },
    default: { uri: 'open_book' },
  }),
  alert: Platform.select({
    web: { uri: '/alert.png' },
    android: { uri: 'alert' },
    ios: { uri: 'alert' },
    default: { uri: 'alert' },
  }),
  flame: Platform.select({
    web: { uri: '/flame_solid.png' },
    android: { uri: 'flame_solid' },
    ios: { uri: 'flame_solid' },
    default: { uri: 'flame_solid' },
  }),
  ambulance: Platform.select({
    web: { uri: '/ambulance.png' },
    android: { uri: 'ambulance' },
    ios: { uri: 'ambulance' },
    default: { uri: 'ambulance' },
  }),
  police: Platform.select({
    web: { uri: '/police_car.png' },
    android: { uri: 'police_car' },
    ios: { uri: 'police_car' },
    default: { uri: 'police_car' },
  }),
  bell: Platform.select({
    web: { uri: '/bell.png' },
    android: { uri: 'bell' },
    ios: { uri: 'bell' },
    default: { uri: 'bell' },
  }),
  shield: Platform.select({
    web: { uri: '/shield.png' },
    android: { uri: 'shield' },
    ios: { uri: 'shield' },
    default: { uri: 'shield' },
  }),
  siren: Platform.select({
    web: { uri: '/siren.png' },
    android: { uri: 'siren' },
    ios: { uri: 'siren' },
    default: { uri: 'siren' },
  }),
  pin: Platform.select({
    web: { uri: '/pin.png' },
    android: { uri: 'pin' },
    ios: { uri: 'pin' },
    default: { uri: 'pin' },
  }),
  phone: Platform.select({
    web: { uri: '/phone.png' },
    android: { uri: 'phone' },
    ios: { uri: 'phone' },
    default: { uri: 'phone' },
  }),
};

const QUICK_ACTIONS = [
  { icon: ASSETS.compass, label: 'Evacuation Routes', screen: 'Evacuation', color: '#FF6A3D' },
  { icon: ASSETS.map, label: 'Interactive Map', screen: 'ResidentMap', color: '#FF4D2D' },
  { icon: ASSETS.openBook, label: 'Safety Tips', screen: 'SafetyTips', color: '#E53923' },
  { icon: ASSETS.alert, label: 'My Alerts', screen: 'ResidentAlerts', color: '#A32020' },
];

const EMERGENCY_CONTACTS = [
  { name: 'Fire Emergency', number: '125', icon: ASSETS.flame, color: '#ef4444' },
  { name: 'Medical Emergency', number: '140', icon: ASSETS.ambulance, color: '#10b981' },
  { name: 'Police', number: '112', icon: ASSETS.police, color: '#3b82f6' },
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
    } catch { }
    return null;
  }
  const wkt = raw.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (wkt) return { longitude: parseFloat(wkt[1]), latitude: parseFloat(wkt[2]) };
  if (/^[0-9a-fA-F]{20,}$/.test(raw.trim())) return null;
  return null;
}

// Cache so repeated renders / 30s refresh don't re-query the same coords
const _placeCache = new Map();

async function getPlaceNameCached(latitude, longitude) {
  const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  if (_placeCache.has(key)) return _placeCache.get(key);
  const name = await getPlaceName(latitude, longitude);
  _placeCache.set(key, name);
  return name;
}

function useNearbyFires(currentLocation) {
  const [fires, setFires] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchFires = async () => {
      if (!currentLocation?.latitude || !currentLocation?.longitude) {
        if (!cancelled) {
          setFires([]);
          setLoading(false);
        }
        return;
      }

      try {
        if (!cancelled) setLoading(true);

        const data = await gqlFetch(GET_NEARBY_FIRES, {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });

        const rawFires = data?.getNearbyFires || [];

        const enrichedFires = await Promise.all(
          rawFires.map(async fire => {
            const coords = parsePoint(fire.fire_location);

            if (!coords) {
              return { ...fire, place_name: 'Unknown Location' };
            }

            try {
              const place_name = await getPlaceNameCached(coords.latitude, coords.longitude);
              return { ...fire, place_name };
            } catch {
              return { ...fire, place_name: 'Unknown Location' };
            }
          })
        );

        if (!cancelled) setFires(enrichedFires);

      } catch (e) {
        console.error('Failed to fetch nearby fires:', e);
        if (!cancelled) setFires([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFires();
    const interval = setInterval(fetchFires, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentLocation?.latitude, currentLocation?.longitude]);

  return { fires, loading };
}

export default function ResidentHomeScreen({ navigation }) {
  const { user, userLocation } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userPlaceName, setUserPlaceName] = useState('Locating…');
  const [currentLocation, setCurrentLocation] = useState(null);

  const nav = navigation;

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (!navigator.geolocation) {
        setUserPlaceName('Location unavailable');
        return;
      }
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

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    const updateLocationLabel = async () => {
      if (userLocation?.lat == null || userLocation?.lng == null) return;

      const loc = {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
      };

      setCurrentLocation(loc);

      try {
        const place = await getPlaceNameCached(loc.latitude, loc.longitude);
        if (mounted) setUserPlaceName(place);
      } catch {
        if (mounted) {
          setUserPlaceName(
            `${Math.abs(loc.latitude).toFixed(4)}°${loc.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(loc.longitude).toFixed(4)}°${loc.longitude >= 0 ? 'E' : 'W'}`
          );
        }
      }
    };

    updateLocationLabel();

    return () => {
      mounted = false;
    };
  }, [userLocation?.lat, userLocation?.lng]);

  const firesData = useNearbyFires(currentLocation);
  const fires = firesData.fires;
  const loading = firesData.loading;

  const dangerousFires = fires;
  const hasActiveThreat = dangerousFires.length > 0;

  const navigate = (screen, params) => {
    if (!screen) return;
    nav?.navigate(screen, params);
  };

  const currentScreen = nav?.currentScreen || 'ResidentHome';

  const headerTitleColor = hasActiveThreat ? '#fff' : '#000';
  const headerSubColor = hasActiveThreat ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ResidentSidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={nav}
        currentScreen={currentScreen}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={hasActiveThreat ? styles.headerBannerDanger : styles.headerBannerSafe}>
          <View style={styles.headerRow}>
            <View style={styles.headerLogoWrap}>
              <View style={styles.headerLogoIcon}>
                <Image
                  source={logoSource}
                  style={styles.headerLogoImage}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: headerTitleColor }]}>EshMagan</Text>
                <Text style={[styles.headerSub, { color: headerSubColor }]}>Resident Portal</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TouchableOpacity style={styles.bellBtn} onPress={() => navigate('ResidentNotifications')}>
                <Image source={ASSETS.bell} style={styles.bellIconImage} resizeMode="contain" />
              </TouchableOpacity>

              {Platform.OS === 'web' && (
                <TouchableOpacity style={[styles.bellBtn, { marginLeft: 4 }]} onPress={() => setSidebarOpen(true)}>
                  <Text style={styles.menuEmoji}>☰</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={hasActiveThreat ? styles.statusIconWrapDanger : styles.statusIconWrapSafe}>
                <Image
                  source={hasActiveThreat ? ASSETS.siren : ASSETS.shield}
                  style={styles.statusIconImage}
                  resizeMode="contain"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.statusMsg}>{hasActiveThreat ? 'Active Fire Threat' : 'You Are Safe'}</Text>
                <Text style={styles.statusDesc}>
                  {loading
                    ? 'Checking status...'
                    : hasActiveThreat
                      ? `${dangerousFires.length} active fire(s) detected nearby`
                      : 'No active fire threats in your area'}
                </Text>
              </View>

              {loading && <ActivityIndicator color="#dc2626" size="small" />}
            </View>

            <View style={styles.locationRow}>
              <Image
                source={ASSETS.pin}
                style={styles.locationIconImage}
                resizeMode="contain"
              />
              <Text style={styles.locationText}>Your Location: {userPlaceName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity
                key={action.label}
                onPress={() =>
                  navigate(action.screen, {
                    isUnsafe: hasActiveThreat,
                    nearbyFireIds: dangerousFires.map(f => f.fire_id),
                  })
                }
                style={[styles.actionBtn, { backgroundColor: action.color }]}
              >
                <Image source={action.icon} style={styles.actionIconImage} resizeMode="contain" />
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

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

        <View style={styles.contactsSection}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          {EMERGENCY_CONTACTS.map(contact => (
            <TouchableOpacity
              key={contact.name}
              onPress={() => Linking.openURL(`tel:${contact.number}`)}
              style={styles.contactCard}
            >
              <View style={styles.contactLeft}>
                <View style={[styles.contactIcon, { backgroundColor: `${contact.color}20` }]}>
                  <Image source={contact.icon} style={styles.contactIconImage} resizeMode="contain" />
                </View>
                <Text style={styles.contactName}>{contact.name}</Text>
              </View>
              <View style={styles.contactRight}>
                <Text style={styles.contactNumber}>{contact.number}</Text>
                <View style={styles.contactPhoneBtn}>
                  <Image
                    source={ASSETS.phone}
                    style={styles.contactPhoneImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}