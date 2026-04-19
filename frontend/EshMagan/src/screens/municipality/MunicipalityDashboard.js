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
import {
  gqlFetch,
  GET_ALL_FIRES,
  GET_ALL_RESPONDERS,
  GET_ALERTS_BY_ROLE,
  GET_NOTIFICATIONS_BY_ROLE,
  UPDATE_NOTIFICATION_STATUS,
  GET_MUNICIPALITY_BY_ID,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/screens/MunicipalityDashboard.styles';
import WebMunicipalityMap from './maps/WebMunicipalityMap';
import NativeMunicipalityMap from './maps/NativeMunicipalityMap';
import AlertsTab from './tabs/AlertsTab';
import NotificationsTab from './tabs/NotificationsTab';
import { getDistanceMeters } from '../responder/utils/helpers';
import { act } from 'react';

const ALERT_RADIUS_METERS = 10000;

const RESPONDER_STATUS_COLORS = {
  Active: '#16a34a',
  Standby: '#f59e0b',
  Unavailable: '#94a3b8',
};

function isValidCoordPair(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function getSeverityColor(level) {
  if (!level) return { bg: 'rgba(148,163,184,0.14)', text: '#cbd5e1', border: 'rgba(148,163,184,0.35)', solid: '#94a3b8' };
  if (level >= 8) return { bg: 'rgba(220,38,38,0.14)', text: '#f87171', border: 'rgba(220,38,38,0.35)', solid: '#dc2626' };
  if (level >= 6) return { bg: 'rgba(234,88,12,0.14)', text: '#fb923c', border: 'rgba(234,88,12,0.35)', solid: '#ea580c' };
  if (level >= 3) return { bg: 'rgba(245,158,11,0.14)', text: '#fbbf24', border: 'rgba(245,158,11,0.35)', solid: '#f59e0b' };
  return { bg: 'rgba(22,163,74,0.14)', text: '#4ade80', border: 'rgba(22,163,74,0.35)', solid: '#16a34a' };
}

function getSeverityLabel(level) {
  if (!level) return 'Unknown';
  if (level >= 8) return 'Critical';
  if (level >= 6) return 'High';
  if (level >= 3) return 'Moderate';
  return 'Low';
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

function getResponderCoords(responder) {
  if (responder?.last_known_location?.latitude != null && responder?.last_known_location?.longitude != null) {
    const lat = Number(responder.last_known_location.latitude);
    const lng = Number(responder.last_known_location.longitude);
    if (isValidCoordPair(lat, lng)) return { lat, lng };
  }

  return parsePoint(responder?.last_known_location);
}

function getResponderUnitCoords(responder) {
  if (responder?.unit_location?.latitude != null && responder?.unit_location?.longitude != null) {
    const lat = Number(responder.unit_location.latitude);
    const lng = Number(responder.unit_location.longitude);
    if (isValidCoordPair(lat, lng)) return { lat, lng };
  }

  return parsePoint(responder?.unit_location);
}

function getMunicipalityCoords(municipality) {
  return (
    parsePoint(municipality?.municipality_location) ||
    parsePoint(municipality?.location) ||
    null
  );
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function MunicipalityDashboard() {
  const { user, logout } = useAuth();

  const municipalityId = user?.id;

  const [activeTab, setActiveTab] = useState('map');
  const [selectedFireId, setSelectedFireId] = useState(null);
  const [selectedResponderId, setSelectedResponderId] = useState(null);
  const [openSections, setOpenSections] = useState({
    fires: true,
    responders: true,
  });

  const [fires, setFires] = useState([]);
  const [responders, setResponders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [municipality, setMunicipality] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      try {
        const [fireData, responderData, alertData, notificationData, municipalityData] = await Promise.all([
          gqlFetch(GET_ALL_FIRES),
          gqlFetch(GET_ALL_RESPONDERS),
          gqlFetch(GET_ALERTS_BY_ROLE, { target_role: 'Municipality' }),
          gqlFetch(GET_NOTIFICATIONS_BY_ROLE, { target_role: 'Municipality' }),
          municipalityId ? gqlFetch(GET_MUNICIPALITY_BY_ID, { municipality_id: municipalityId }) : Promise.resolve(null),
        ]);

        if (!mounted) return;

        setFires(fireData?.getAllFires || []);
        setResponders(responderData?.getAllResponders || []);
        setAlerts(alertData?.getAlertsByTargetRole || []);
        setNotifications(notificationData?.getNotificationsByTargetRole || []);
        setMunicipality(municipalityData?.getMunicipalityById || null);
      } catch (error) {
        console.error('Municipality dashboard fetch error:', error);
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
  }, [municipalityId]);

  const municipalityCoords = useMemo(
    () => getMunicipalityCoords(municipality),
    [municipality]
  );

  const respondersWithCoords = useMemo(
    () =>
      responders
        .map(responder => ({
          ...responder,
          coords: getResponderCoords(responder),
          unitCoords: getResponderUnitCoords(responder),
          displayName: responder.unit_nb
            ? `${responder.responder_id || 'Responder'} - ${responder.unit_nb}`
            : responder.responder_id || 'Responder',
        }))
        .filter(responder => responder.coords || responder.unitCoords),
    [responders]
  );

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

  const activeAlerts = useMemo(() => {
    if (!municipalityCoords) return [];

    return alerts.filter(alert => {
      if (alert.expires_at && new Date(alert.expires_at) <= new Date()) return false;
      if (!alert.fire_id) return false;

      const fire = fires.find(f => f.fire_id === alert.fire_id);
      if (!fire) return false;

      const fireCoords = parsePoint(fire.fire_location);
      if (!fireCoords) return false;

      const distance = getDistanceMeters(
        municipalityCoords.lat,
        municipalityCoords.lng,
        fireCoords.lat,
        fireCoords.lng
      );

      return distance <= ALERT_RADIUS_METERS;
    });
  }, [alerts, fires, municipalityCoords]);

  const activeResponderCount = responders.filter(r => r.responder_status === 'Active').length;
  const standbyResponderCount = responders.filter(r => r.responder_status === 'Standby').length;
  const unreadNotifCount = notifications.filter(n => n.notification_status === 'Sent').length;
  const activeAlertCount = activeAlerts.length;

  const tabs = [
    { id: 'map', title: 'Map', count: null },
    { id: 'alerts', title: 'Alerts', count: activeAlertCount || null },
    { id: 'notifs', title: 'Inbox', count: unreadNotifCount || null },
  ];

  const toggleSection = key => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleMarkRead = async notification_id => {
    try {
      await gqlFetch(UPDATE_NOTIFICATION_STATUS, {
        notification_id,
        notification_status: 'Delivered',
      });

      setNotifications(prev =>
        prev.map(notification =>
          notification.notification_id === notification_id
            ? { ...notification, notification_status: 'Delivered' }
            : notification
        )
      );
    } catch (error) {
      console.warn('Failed to mark municipality notification read', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <View style={styles.logoIcon}>
          <Image
            source={Platform.OS === 'web'
              ? { uri: '/EshMagan_Logo-Badge.png' }
              : { uri: 'eshmagan_logo_badge' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.appName}>EshMagan</Text>
          <Text style={styles.portalLabel}>
            {municipality?.municipality_name
              ? `${municipality.municipality_name} Command Dashboard`
              : 'Municipality Command Dashboard'}
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {tabs.map(tab => {
          const active = activeTab === tab.id;

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tab, active ? styles.tabActive : styles.tabInactive]}
            >
              <Text style={[styles.tabText, active ? styles.tabTextActive : styles.tabTextInactive]}>
                {tab.title}
              </Text>

              {tab.count ? (
                <View style={[styles.tabBadge, active ? styles.tabBadgeActive : styles.tabBadgeInactive]}>
                  <Text style={[styles.tabBadgeText, active ? styles.tabBadgeTextActive : styles.tabBadgeTextInactive]}>
                    {tab.count > 99 ? '99+' : tab.count}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === 'map' ? (
        <View style={styles.mapTabContainer}>
          <View style={styles.mapLayout}>
            <View style={styles.mapPane}>
              {Platform.OS === 'web' ? (
                <WebMunicipalityMap
                  fires={firesForMap}
                  responders={respondersWithCoords}
                  municipalityCoords={municipalityCoords}
                  selectedFireId={selectedFireId}
                  selectedResponderId={selectedResponderId}
                />
              ) : (
                <NativeMunicipalityMap
                  fires={firesForMap}
                  responders={respondersWithCoords}
                  municipalityCoords={municipalityCoords}
                  selectedFireId={selectedFireId}
                  selectedResponderId={selectedResponderId}
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
                  <Text style={styles.sidePanelSubtitle}>Select a fire or responder to focus it on the map.</Text>
                  {municipalityCoords ? (
                    <Text style={styles.sidePanelSubtitle}>
                      Municipality: {municipalityCoords.lat.toFixed(5)}, {municipalityCoords.lng.toFixed(5)}
                    </Text>
                  ) : (
                    <Text style={styles.sidePanelSubtitle}>Municipality location not available.</Text>
                  )}
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statCardValue}>{firesForMap.length}</Text>
                    <Text style={styles.statCardLabel}>Active fires</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statCardValue}>{activeResponderCount}</Text>
                    <Text style={styles.statCardLabel}>Active units</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statCardValue}>{standbyResponderCount}</Text>
                    <Text style={styles.statCardLabel}>Standby</Text>
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
                                onPress={() => {
                                  setSelectedResponderId(null);
                                  setSelectedFireId(fire.fire_id);
                                }}
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

                <View style={[styles.accordionSection, { maxHeight: '23.3vh' }]}>
                  <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleSection('responders')}>
                    <View style={styles.accordionHeaderLeft}>
                      <View style={[styles.accordionDot, { backgroundColor: '#16a34a' }]} />
                      <Text style={styles.accordionTitle}>Responders</Text>
                    </View>
                    <View style={styles.accordionMeta}>
                      <View style={styles.accordionCount}>
                        <Text style={styles.accordionCountText}>{respondersWithCoords.length}</Text>
                      </View>
                      <Text style={styles.accordionChevron}>{openSections.responders ? '⌄' : '›'}</Text>
                    </View>
                  </TouchableOpacity>

                  {openSections.responders ? (
                    <View style={styles.accordionBodyWrapper}>
                      <ScrollView
                        style={styles.accordionBodyScroll}
                        contentContainerStyle={styles.accordionBodyScrollContent}
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={false}
                      >
                        {respondersWithCoords.length === 0 ? (
                          <View style={styles.emptyWrap}>
                            <Text style={styles.emptyTitle}>No responder locations</Text>
                            <Text style={styles.emptyDesc}>Responders will appear here when location data is available.</Text>
                          </View>
                        ) : (
                          respondersWithCoords.map(responder => {
                            const isActive = selectedResponderId === responder.responder_id;
                            const statusColor = RESPONDER_STATUS_COLORS[responder.responder_status] || '#94a3b8';

                            return (
                              <TouchableOpacity
                                key={responder.responder_id}
                                style={[styles.entityItem, isActive && styles.entityItemActive]}
                                onPress={() => {
                                  setSelectedFireId(null);
                                  setSelectedResponderId(responder.responder_id);
                                }}
                              >
                                <View style={styles.entityItemTop}>
                                  <Text style={styles.entityItemTitle}>{responder.displayName}</Text>
                                  <View
                                    style={[
                                      styles.entityItemBadge,
                                      {
                                        backgroundColor: `${statusColor}22`,
                                        borderColor: `${statusColor}66`,
                                      },
                                    ]}
                                  >
                                    <Text style={[styles.entityItemBadgeText, { color: statusColor }]}>
                                      {responder.responder_status || 'Unknown'}
                                    </Text>
                                  </View>
                                </View>
                                <Text style={styles.entityItemSub}>
                                  {responder.assigned_region || responder.unit_nb || 'No region'}
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
      ) : null}

      {activeTab === 'alerts' ? (
        <View style={styles.tabContent}>
          <AlertsTab alerts={activeAlerts} loading={loading} />
        </View>
      ) : null}

      {activeTab === 'notifs' ? (
        <View style={styles.tabContent}>
          <NotificationsTab notifications={notifications} loading={loading} onMarkRead={handleMarkRead} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}