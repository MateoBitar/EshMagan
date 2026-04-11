// src/screens/resident/ResidentAlertsScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  gqlFetch,
  GET_ALERTS_BY_ROLE,
  GET_ALL_FIRES,
} from '../../services/api';
import { getCurrentLocation } from '../../services/location.service';
import styles, { C } from '../../styles/screens/ResidentAlertsScreen.styles';

const ALERT_EMOJI = {
  FireAlert: '🔥',
  EvacuationAlert: '🚨',
  PredictionAlert: '⚠️',
};

const ALERT_RADIUS_METERS = 10000;

function fmtDate(val) {
  if (!val) return 'N/A';
  let d = new Date(val);
  if (isNaN(d.getTime())) d = new Date(Number(val));
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parsePoint(str) {
  if (!str) return null;

  try {
    const geo = JSON.parse(str);
    if (geo?.type === 'Point' && geo.coordinates?.length === 2) {
      return { lng: geo.coordinates[0], lat: geo.coordinates[1] };
    }
  } catch { }

  const match = String(str).match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/i);
  if (match) return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };

  return null;
}

function getFireCoords(fire) {
  return parsePoint(fire?.fire_location);
}

function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = d => (d * Math.PI) / 180;
  const R = 6371000;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function ResidentAlertsScreen({ navigation }) {
  let nav = navigation;
  if (Platform.OS !== 'web') {
    try {
      const { useNavigation } = require('@react-navigation/native');
      nav = useNavigation();
    } catch { }
  }

  const [alerts, setAlerts] = useState([]);
  const [allFires, setAllFires] = useState([]);
  const [myLocation, setMyLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasFetchedResidentAlertsRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const initLocation = async () => {
      try {
        const loc = await getCurrentLocation();
        if (mounted && loc) {
          setMyLocation({ lat: loc.latitude, lng: loc.longitude });
        }
      } catch (e) {
        console.warn('[ResidentAlertsScreen location]', e.message);
      }
    };

    initLocation();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      try {
        const [alertData, fireData] = await Promise.all([
          gqlFetch(GET_ALERTS_BY_ROLE, { target_role: 'Resident' }),
          gqlFetch(GET_ALL_FIRES),
        ]);

        if (!mounted) return;

        setAlerts(alertData?.getAlertsByTargetRole || []);
        setAllFires((fireData?.getAllFires || []).filter(f => !f.is_extinguished));
        hasFetchedResidentAlertsRef.current = true;
      } catch (e) {
        console.error('ResidentAlertsScreen fetch error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const activeAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (new Date(alert.expires_at) <= new Date()) return false;
      if (!alert.fire_id) return false;
      if (!myLocation) return false;

      const fire = allFires.find(f => f.fire_id === alert.fire_id);
      if (!fire) return false;

      const fireCoords = getFireCoords(fire);
      if (!fireCoords) return false;

      const distance = getDistanceMeters(
        myLocation.lat,
        myLocation.lng,
        fireCoords.lat,
        fireCoords.lng
      );

      return distance <= ALERT_RADIUS_METERS;
    });
  }, [alerts, allFires, myLocation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={C.tangerine} size="large" />
        <Text style={styles.loadingText}>Loading your alerts...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(236,119,66,0.2)',
            backgroundColor: C.bg,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginBottom: 8,
            }}
          >
            <TouchableOpacity
              onPress={() => nav?.goBack?.()}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: C.tangerine,
                }}
              >
                ‹ Back
              </Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: C.text,
                  fontSize: 20,
                  fontWeight: '800',
                  letterSpacing: -0.3,
                }}
              >
                Your Alerts
              </Text>
              <Text
                style={{
                  color: C.textMuted,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                {activeAlerts.length} nearby active alert{activeAlerts.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.alertsInfoBox,
              myLocation
                ? styles.alertsInfoBoxLocated
                : styles.alertsInfoBoxLocating,
            ]}
          >
            <Text style={styles.alertsInfoEmoji}>{myLocation ? '📍' : '🔄'}</Text>
            <Text style={styles.alertsInfoText}>
              {myLocation
                ? `Showing alerts within ${ALERT_RADIUS_METERS / 1000}km of your location`
                : 'Getting your location to filter nearby alerts...'}
            </Text>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.sectionHeader}>
            {activeAlerts.length} nearby active alerts
          </Text>

          <View style={{ flex: 1, minHeight: '81.8vh', overflow: 'hidden' }}>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ gap: 2, paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {activeAlerts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateEmoji}>✅</Text>
                  <Text
                    style={[
                      styles.emptyStateText,
                      { color: C.green, fontWeight: '600' },
                    ]}
                  >
                    No active alerts nearby
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    All clear within {ALERT_RADIUS_METERS / 1000}km
                  </Text>
                </View>
              ) : (
                activeAlerts.map(alert => {
                  const isExpired = new Date(alert.expires_at) < new Date();
                  const emoji = ALERT_EMOJI[alert.alert_type] || '⚠️';
                  const isFireAlert = alert.alert_type === 'FireAlert';
                  const accentColor = isExpired
                    ? C.slate
                    : isFireAlert
                      ? C.scarlet
                      : C.tangerine;

                  return (
                    <TouchableOpacity
                      key={alert.alert_id}
                      onPress={() => nav?.navigate?.('Alert', { alert })}
                      style={[
                        styles.alertCard,
                        { borderColor: accentColor + (isExpired ? '30' : '50') },
                        isExpired && styles.alertCardExpired,
                      ]}
                    >
                      <View style={styles.alertCardContent}>
                        <View
                          style={[
                            styles.alertCardIcon,
                            { backgroundColor: accentColor + '20' },
                          ]}
                        >
                          <Text style={styles.alertCardEmoji}>{emoji}</Text>
                        </View>

                        <View style={styles.alertCardInfo}>
                          <View style={styles.alertCardBadgeRow}>
                            <View
                              style={[
                                styles.alertCardTypeBadge,
                                { backgroundColor: accentColor + '20' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.alertCardTypeText,
                                  { color: accentColor },
                                ]}
                              >
                                {alert.alert_type}
                              </Text>
                            </View>

                            {isExpired && (
                              <View style={styles.alertCardExpiredBadge}>
                                <Text style={styles.alertCardExpiredText}>EXPIRED</Text>
                              </View>
                            )}
                          </View>

                          <Text style={styles.alertCardMessage}>
                            {alert.alert_message}
                          </Text>

                          <View style={styles.alertCardMetaRow}>
                            <Text style={styles.alertCardMeta}>
                              🕐 {fmtDate(alert.created_at)}
                            </Text>
                            {alert.fire_id && (
                              <Text style={styles.alertCardMeta}>
                                🔥 #{alert.fire_id?.slice(0, 8)}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
