import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { gqlFetch, GET_ALL_FIRES } from '../../services/api';
import styles from '../../styles/screens/ResidentMapScreen.styles';
import WebResidentMap from './maps/WebResidentMap';
import NativeResidentMap from './maps/NativeResidentMap';
import logoSource from '../../images/logoSource';
import { useAuth } from '../../context/AuthContext';

function isValidCoordPair(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function parsePoint(value) {
  if (!value) return null;

  if (typeof value === 'object') {
    const lat = Number(
      value.latitude ??
      value.lat ??
      value.y ??
      value?.coordinates?.[1]
    );
    const lng = Number(
      value.longitude ??
      value.lng ??
      value.lon ??
      value.x ??
      value?.coordinates?.[0]
    );

    if (isValidCoordPair(lat, lng)) return { lat, lng };

    if (value?.type === 'Point' && Array.isArray(value.coordinates) && value.coordinates.length === 2) {
      const geoLat = Number(value.coordinates[1]);
      const geoLng = Number(value.coordinates[0]);
      if (isValidCoordPair(geoLat, geoLng)) return { lat: geoLat, lng: geoLng };
    }
  }

  try {
    const geo = typeof value === 'string' ? JSON.parse(value) : value;
    if (geo?.type === 'Point' && Array.isArray(geo.coordinates) && geo.coordinates.length === 2) {
      const lat = Number(geo.coordinates[1]);
      const lng = Number(geo.coordinates[0]);
      if (isValidCoordPair(lat, lng)) return { lat, lng };
    }
  } catch { }

  const match = String(value).match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (match) {
    const lng = Number(match[1]);
    const lat = Number(match[2]);
    if (isValidCoordPair(lat, lng)) return { lat, lng };
  }

  return null;
}

function getSeverityColor(level) {
  if (!level) return { bg: 'rgba(148,163,184,0.14)', text: '#cbd5e1', border: 'rgba(148,163,184,0.35)' };
  if (level >= 8) return { bg: 'rgba(220,38,38,0.14)', text: '#f87171', border: 'rgba(220,38,38,0.35)' };
  if (level >= 6) return { bg: 'rgba(234,88,12,0.14)', text: '#fb923c', border: 'rgba(234,88,12,0.35)' };
  if (level >= 3) return { bg: 'rgba(245,158,11,0.14)', text: '#fbbf24', border: 'rgba(245,158,11,0.35)' };
  return { bg: 'rgba(22,163,74,0.14)', text: '#4ade80', border: 'rgba(22,163,74,0.35)' };
}

function getSeverityLabel(level) {
  if (!level) return 'Unknown';
  if (level >= 8) return 'Critical';
  if (level >= 6) return 'High';
  if (level >= 3) return 'Moderate';
  return 'Low';
}

export default function ResidentMapScreen({ navigation }) {
  const { userLocation } = useAuth();
  const [fires, setFires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFireId, setSelectedFireId] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [openSections, setOpenSections] = useState({
    fires: true,
  });

  useEffect(() => {
    let mounted = true;

    const fetchFires = async () => {
      try {
        const fireData = await gqlFetch(GET_ALL_FIRES);
        if (!mounted) return;
        setFires(fireData?.getAllFires || []);
      } catch (error) {
        console.error('Resident map fetch error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchFires();
    const interval = setInterval(fetchFires, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (userLocation?.lat != null && userLocation?.lng != null) {
      setUserCoords({
        lat: userLocation.lat,
        lng: userLocation.lng,
      });
    }
  }, [userLocation?.lat, userLocation?.lng]);

  const firesForMap = useMemo(
    () =>
      fires
        .filter(fire => !fire.is_extinguished)
        .map(fire => ({
          ...fire,
          coords: parsePoint(fire.fire_location),
          displayName: fire.fire_id ? `Fire ${String(fire.fire_id).slice(0, 8)}` : 'Fire',
        }))
        .filter(fire => fire.coords),
    [fires]
  );

  const toggleSection = key => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.logoIcon}>
          <Image
            source={logoSource}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.appName}>EshMagan</Text>
          <Text style={styles.portalLabel}>Resident Live Map</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation?.goBack?.()}>
          <Text style={styles.logoutBtnText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.mapTabContainer, { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }]}>
        <View style={styles.mapLayout}>
          <View style={styles.mapPane}>
            {Platform.OS === 'web' ? (
              <WebResidentMap
                fires={firesForMap}
                responders={[]}
                userCoords={userCoords}
                selectedFireId={selectedFireId}
                selectedResponderId={null}
              />
            ) : (
              <NativeResidentMap
                fires={firesForMap}
                responders={[]}
                userCoords={userCoords}
                selectedFireId={selectedFireId}
                selectedResponderId={null}
              />
            )}

            {loading ? (
              <View style={styles.mapLoadingBadge}>
                <ActivityIndicator size="small" color="#EC7742" />
                <Text style={styles.mapLoadingText}>Loading.</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.sidePanel}>
            <View style={styles.sidePanelHeader}>
              <View>
                <Text style={styles.sidePanelTitle}>Live overview</Text>
                <Text style={styles.sidePanelSubtitle}>Select a fire to focus it on the map.</Text>
                <Text style={styles.sidePanelSubtitle}>Active fires appear here in real time.</Text>
                {userCoords ? (
                  <Text style={styles.sidePanelSubtitle}>
                    Your location: {userCoords.lat.toFixed(5)}, {userCoords.lng.toFixed(5)}
                  </Text>
                ) : (
                  <Text style={styles.sidePanelSubtitle}>Your location is not available yet.</Text>
                )}
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statCardValue}>{firesForMap.length}</Text>
                  <Text style={styles.statCardLabel}>Active fires</Text>
                </View>
              </View>
            </View>

            <ScrollView
              style={styles.accordionScroll}
              contentContainerStyle={styles.accordionScrollContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              <View style={styles.accordionSection}>
                <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('fires')}>
                  <View style={styles.accordionHeaderLeft}>
                    <View style={[styles.accordionDot, { backgroundColor: '#dc2626' }]} />
                    <Text style={styles.accordionTitle}>Fires</Text>
                  </View>

                  <View style={styles.accordionMeta}>
                    <View style={styles.accordionCount}>
                      <Text style={styles.accordionCountText}>{firesForMap.length}</Text>
                    </View>
                    <Text style={styles.accordionChevron}>{openSections.fires ? '⌄' : '›'}</Text>
                  </View>
                </TouchableOpacity>

                {openSections.fires ? (
                  <View style={styles.accordionBodyWrapper}>
                    <ScrollView
                      style={styles.accordionBodyScroll}
                      contentContainerStyle={styles.accordionBodyScrollContent}
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={false}
                    >
                      {firesForMap.length === 0 ? (
                        <View style={styles.emptyWrap}>
                          <Text style={styles.emptyTitle}>No active fires</Text>
                          <Text style={styles.emptyDesc}>New fires will appear here.</Text>
                        </View>
                      ) : (
                        firesForMap.map(fire => {
                          const severity = getSeverityColor(fire.fire_severitylevel);
                          const isActive = selectedFireId === fire.fire_id;

                          return (
                            <TouchableOpacity
                              key={fire.fire_id}
                              style={[styles.entityItem, isActive && styles.entityItemActive]}
                              onPress={() => setSelectedFireId(fire.fire_id)}
                            >
                              <View style={styles.entityItemTop}>
                                <Text style={styles.entityItemTitle}>{fire.displayName}</Text>
                                <View
                                  style={[
                                    styles.entityItemBadge,
                                    {
                                      backgroundColor: severity.bg,
                                      borderColor: severity.border,
                                    },
                                  ]}
                                >
                                  <Text style={[styles.entityItemBadgeText, { color: severity.text }]}>
                                    {getSeverityLabel(fire.fire_severitylevel)}
                                  </Text>
                                </View>
                              </View>

                              <Text style={styles.entityItemSub}>
                                {fire.fire_source || 'Unknown source'} • Level {fire.fire_severitylevel ?? 'N/A'}
                              </Text>
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </ScrollView>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}