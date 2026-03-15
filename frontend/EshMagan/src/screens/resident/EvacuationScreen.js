// src/screens/resident/EvacuationScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Animated, Platform, ActivityIndicator } from 'react-native';
import { gqlFetch, GET_EVACUATION_ROUTES, GET_EVACUATIONS_BY_FIRE } from '../../services/api';
import styles from '../../styles/screens/EvacuationScreen.styles';

const STEPS = [
  { instruction: 'Head north on Herzl Street', distance: '0.5 km', time: '2 min' },
  { instruction: 'Turn right onto Highway 75', distance: '5.2 km', time: '6 min' },
  { instruction: 'Take exit 3 toward Haifa Bay', distance: '1.8 km', time: '2 min' },
  { instruction: 'Arrive at Safe Zone Assembly Point', distance: '0.9 km', time: '2 min' },
];

function useEvacuationData(fireId) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web') { setLoading(false); return; }
    const fetch = async () => {
      try {
        let data;
        if (fireId) {
          data = await gqlFetch(GET_EVACUATIONS_BY_FIRE, { fire_id: fireId });
          setRoutes(data?.getEvacuationsByFireId || []);
        } else {
          data = await gqlFetch(GET_EVACUATION_ROUTES);
          setRoutes(data?.getAllEvacuations || []);
        }
      } catch (e) {
        console.error('Failed to fetch evacuation routes:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [fireId]);

  return { routes, loading };
}

export default function EvacuationScreen({ navigation, route }) {
  let nav = navigation;
  let routeParams = route?.params || {};
  if (Platform.OS !== 'web') {
    try {
      const { useNavigation, useRoute } = require('@react-navigation/native');
      nav = useNavigation();
      routeParams = useRoute().params || {};
    } catch {}
  }

  const { fireId } = routeParams;
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [voiceOn, setVoiceOn] = useState(false);
  const dot = useRef(new Animated.Value(1)).current;

  const webData = useEvacuationData(fireId);
  let routes = [], loading = false;

  if (Platform.OS !== 'web') {
    try {
      const { useQuery, gql } = require('@apollo/client');
      const QUERY = fireId
        ? gql`query GetEvacuationsByFireId($fire_id: ID!) {
            getEvacuationsByFireId(fire_id: $fire_id) {
              route_id route_status route_priority route_path
              safe_zone distance_km estimated_time fire_id
            }
          }`
        : gql`query GetAllEvacuations {
            getAllEvacuations {
              route_id route_status route_priority route_path
              safe_zone distance_km estimated_time fire_id
            }
          }`;
      const vars = fireId ? { fire_id: fireId } : {};
      const result = useQuery(QUERY, { variables: vars });
      routes = (fireId ? result.data?.getEvacuationsByFireId : result.data?.getAllEvacuations) || [];
      loading = result.loading;
    } catch {}
  } else {
    routes = webData.routes;
    loading = webData.loading;
  }

  const selectedRoute = routes.find(r => r.route_id === selectedRouteId) || routes[0];

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(dot, { toValue: 1.3, duration: 800, useNativeDriver: true }),
      Animated.timing(dot, { toValue: 1, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);

  const getStatusStyle = (status) => {
    if (status === 'Active' || status === 'Open' || status === 'Clear') return { view: styles.routeStatusClear, text: styles.routeStatusClearText };
    return { view: styles.routeStatusCaution, text: styles.routeStatusCautionText };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => nav?.goBack()}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>🧭 Live Navigation</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>Evacuation Route</Text>
        <Text style={styles.headerSub}>To nearest safe zone</Text>
      </View>

      <View style={styles.mapArea}>
        <View style={styles.mapOverlay}>
          <Text style={{ color: '#60a5fa', fontSize: 14 }}>🧭</Text>
          <Text style={styles.mapOverlayText}>
            {selectedRoute ? `${selectedRoute.distance_km?.toFixed(1) || '?'} km • ${selectedRoute.estimated_time || '?'}` : 'Select a route'}
          </Text>
        </View>
        <Animated.View style={{ position: 'absolute', bottom: 48, left: 32, transform: [{ scale: dot }] }}>
          <View style={styles.locationDot} />
        </Animated.View>
        <View style={styles.destinationDot}><Text style={{ fontSize: 14 }}>📍</Text></View>
        <Text style={styles.mapLabel}>Map View (react-native-maps)</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.routesSection}>
          <View style={styles.routesHeaderRow}>
            <Text style={styles.routesTitle}>Available Routes</Text>
            <TouchableOpacity style={styles.arModeBtn} onPress={() => nav?.navigate('ARMode')}>
              <Text style={styles.arModeBtnText}>⚡ AR Mode</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#60a5fa" style={{ marginVertical: 20 }} />
          ) : routes.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#64748b', fontSize: 14 }}>No evacuation routes available</Text>
            </View>
          ) : (
            routes.map(route => {
              const isSelected = (selectedRouteId || routes[0]?.route_id) === route.route_id;
              const statusStyle = getStatusStyle(route.route_status);
              return (
                <TouchableOpacity
                  key={route.route_id}
                  onPress={() => setSelectedRouteId(route.route_id)}
                  style={[styles.routeCard, isSelected ? styles.routeCardActive : styles.routeCardInactive]}
                >
                  <View style={styles.routeCardTop}>
                    <Text style={styles.routeName}>🛣️ Route Priority {route.route_priority || '?'}</Text>
                    <View style={statusStyle.view}>
                      <Text style={statusStyle.text}>{route.route_status || 'Unknown'}</Text>
                    </View>
                  </View>
                  <Text style={styles.routeMeta}>{route.distance_km?.toFixed(1) || '?'} km • {route.estimated_time || '?'}</Text>
                  <Text style={styles.routeDesc}>Safe zone: {route.safe_zone || 'N/A'}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.directionsSection}>
          <View style={styles.directionsHeaderRow}>
            <Text style={styles.directionsTitle}>Turn-by-Turn Directions</Text>
            <TouchableOpacity onPress={() => setVoiceOn(!voiceOn)} style={[styles.voiceBtn, voiceOn ? styles.voiceBtnOn : styles.voiceBtnOff]}>
              <Text style={voiceOn ? styles.voiceBtnTextOn : styles.voiceBtnTextOff}>🔊 {voiceOn ? 'Voice On' : 'Voice Off'}</Text>
            </TouchableOpacity>
          </View>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepCol}>
                <View style={[styles.stepNum, i === 0 ? styles.stepNumActive : styles.stepNumInactive]}>
                  <Text style={i === 0 ? styles.stepNumTextActive : styles.stepNumTextInactive}>{i + 1}</Text>
                </View>
                {i < STEPS.length - 1 && <View style={styles.stepLine} />}
              </View>
              <View style={styles.stepCard}>
                <Text style={styles.stepInstruction}>{step.instruction}</Text>
                <Text style={styles.stepMeta}>{step.distance} • {step.time}</Text>
              </View>
            </View>
          ))}
          <View style={styles.safeZoneBox}>
            <View style={styles.safeZoneRow}>
              <Text style={{ fontSize: 20 }}>📍</Text>
              <View>
                <Text style={styles.safeZoneTitle}>Safe Zone</Text>
                <Text style={styles.safeZoneName}>{selectedRoute?.safe_zone || 'Assembly Point'}</Text>
                <Text style={styles.safeZoneSub}>Emergency services and shelter available</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.startBtn}>
          <Text style={{ fontSize: 18 }}>🧭</Text>
          <Text style={styles.startBtnText}>Start Navigation</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
