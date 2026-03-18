// src/screens/resident/AlertScreen.js
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Animated, Easing, Platform, ActivityIndicator } from 'react-native';
import { gqlFetch, GET_ALERTS_BY_ROLE } from '../../services/api';
import styles from '../../styles/screens/AlertScreen.styles';

const DEFAULT_RECOMMENDATIONS = [
  'Prepare emergency supplies and important documents',
  'Review evacuation routes and transportation options',
  'Stay informed through official channels',
  'Be ready to evacuate if conditions worsen',
];

function useLatestAlert() {
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web') { setLoading(false); return; }
    const fetch = async () => {
      try {
        const data = await gqlFetch(GET_ALERTS_BY_ROLE, { target_role: 'Resident' });
        const alerts = data?.getAlertsByTargetRole || [];
        // Get the most recent alert
        const latest = alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        setAlert(latest || null);
      } catch (e) { console.error('Failed to fetch alert:', e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  return { alert, loading };
}

export default function AlertScreen({ navigation, route }) {
  let nav = navigation;
  let routeParams = route?.params || {};
  if (Platform.OS !== 'web') {
    try {
      const { useNavigation, useRoute } = require('@react-navigation/native');
      nav = useNavigation();
      routeParams = useRoute().params || {};
    } catch { }
  }

  // Alert can be passed via route params (from alerts list) or fetched fresh
  const passedAlert = routeParams.alert || null;
  const webData = useLatestAlert();

  let alertData = passedAlert;
  let loading = false;

  if (Platform.OS !== 'web' && !passedAlert) {
    try {
      const { useQuery, gql } = require('@apollo/client');
      const QUERY = gql`query GetAlertsByTargetRole($target_role: AlertTargetRole!) {
        getAlertsByTargetRole(target_role: $target_role) {
          alert_id alert_type target_role alert_message expires_at created_at fire_id
        }
      }`;
      const result = useQuery(QUERY, { variables: { target_role: 'Resident' } });
      const alerts = result.data?.getAlertsByTargetRole || [];
      alertData = alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
      loading = result.loading;
    } catch { }
  } else if (!passedAlert) {
    alertData = webData.alert;
    loading = webData.loading;
  }

  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.05, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 0.7, duration: 1000, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
    ])).start();
  }, []);

  const detailRows = alertData ? [
    { icon: '⚠️', title: 'Alert Type', body: alertData.alert_type?.replace(/_/g, ' ') || 'Fire Alert' },
    { icon: '🎯', title: 'Target', body: alertData.target_role || 'Resident' },
    { icon: '⏰', title: 'Expires', body: alertData.expires_at ? new Date(alertData.expires_at).toLocaleString() : 'N/A' },
  ] : [
    { icon: '⏱️', title: 'Estimated Time', body: 'Fire may reach your area in 12 hours' },
    { icon: '📍', title: 'Your Location', body: 'Haifa, Northern District', sub: '2.8 km from active fire zone' },
    { icon: '⚠️', title: 'Risk Level', body: 'Moderate to High', sub: 'Wind conditions may accelerate spread' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <Animated.View style={[styles.glowCircle, { opacity: glow }]} />
          <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulse }] }]}>
            <Text style={styles.pulseEmoji}>🔥</Text>
          </Animated.View>
        </View>

        {loading ? (
          <ActivityIndicator color="#ef4444" style={{ marginVertical: 40 }} />
        ) : (
          <View style={styles.card}>
            <View style={styles.priorityBadgeWrap}>
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>🚨 {alertData ? alertData.alert_type?.replace(/_/g, ' ').toUpperCase() : 'HIGH PRIORITY ALERT'}</Text>
              </View>
            </View>

            <Text style={styles.alertTitle}>
              {alertData?.alert_message || 'Fire Predicted Near Your Location'}
            </Text>
            <Text style={styles.alertSubtitle}>
              {alertData ? `Issued: ${new Date(alertData.created_at).toLocaleString()}` : 'Based on AI analysis and current fire spread patterns'}
            </Text>

            <View style={styles.detailRowWrap}>
              {detailRows.map(item => (
                <View key={item.title} style={styles.detailRow}>
                  <Text style={styles.detailIcon}>{item.icon}</Text>
                  <Text style={styles.detailTitle}>{item.title}</Text>
                  <Text style={styles.detailBody}>{item.body}</Text>
                  {item.sub && <Text style={styles.detailSub}>{item.sub}</Text>}
                </View>
              ))}
            </View>

            <View style={styles.recsBox}>
              <Text style={styles.recsTitle}>Recommended Actions</Text>
              {DEFAULT_RECOMMENDATIONS.map((rec, i) => (
                <Text key={i} style={styles.recItem}>• {rec}</Text>
              ))}
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => nav?.navigate('Evacuation', alertData?.fire_id ? { fireId: alertData.fire_id } : {})}
            >
              <Text style={{ fontSize: 18 }}>🧭</Text>
              <Text style={styles.primaryBtnText}>View Evacuation Route</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={() => {
            if (nav?.canGoBack?.()) { nav.goBack(); }
            else { nav?.navigate('ResidentHome'); }
          }}
        >
          <Text style={styles.dismissText}>✕  Dismiss Alert</Text>
        </TouchableOpacity>

        <View style={styles.source}>
          <Text style={styles.sourceText}>Alert system powered by EshMagan AI</Text>
          {alertData && <Text style={styles.sourceText2}>ID: {alertData.alert_id?.slice(0, 12)}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
