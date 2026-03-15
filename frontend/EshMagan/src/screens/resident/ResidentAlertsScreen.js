// src/screens/resident/ResidentAlertsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { gqlFetch, GET_ALERTS_BY_ROLE } from '../../services/api';
import styles from '../../styles/screens/ResidentAlertsScreen.styles';

const ALERT_TYPE_STYLE = {
  FireAlert: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', emoji: '🔥' },
  EvacuationAlert: { bg: '#fff7ed', border: '#fed7aa', color: '#ea580c', emoji: '🧭' },
  PredictionAlert: { bg: '#faf5ff', border: '#e9d5ff', color: '#9333ea', emoji: '🤖' },
};

function useAlertsData() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web') { setLoading(false); return; }
    const fetch = async () => {
      try {
        const data = await gqlFetch(GET_ALERTS_BY_ROLE, { target_role: 'Resident' });
        setAlerts(data?.getAlertsByTargetRole || []);
      } catch (e) { console.error('Failed to fetch alerts:', e); }
      finally { setLoading(false); }
    };
    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, []);

  return { alerts, loading };
}

export default function ResidentAlertsScreen({ navigation }) {
  let nav = navigation;
  if (Platform.OS !== 'web') {
    try { const { useNavigation } = require('@react-navigation/native'); nav = useNavigation(); } catch {}
  }

  let alerts = [], loading = false;
  const webData = useAlertsData();

  if (Platform.OS !== 'web') {
    try {
      const { useQuery, gql } = require('@apollo/client');
      const QUERY = gql`query GetAlertsByTargetRole($target_role: AlertTargetRole!) {
        getAlertsByTargetRole(target_role: $target_role) {
          alert_id alert_type target_role alert_message expires_at created_at fire_id
        }
      }`;
      const result = useQuery(QUERY, { variables: { target_role: 'Resident' }, pollInterval: 15000 });
      alerts = result.data?.getAlertsByTargetRole || [];
      loading = result.loading;
    } catch {}
  } else {
    alerts = webData.alerts;
    loading = webData.loading;
  }

  // Sort newest first
  const sortedAlerts = [...alerts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Your Alerts</Text>
        {!loading && <Text style={styles.subtitle}>{sortedAlerts.length} alert{sortedAlerts.length !== 1 ? 's' : ''} received</Text>}
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color="#dc2626" /></View>
      ) : sortedAlerts.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyTitle}>No Alerts Yet</Text>
          <Text style={styles.emptyDesc}>You'll be notified immediately when a fire threat is detected near your location.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {sortedAlerts.map(alert => {
            const s = ALERT_TYPE_STYLE[alert.alert_type] || ALERT_TYPE_STYLE.FireAlert;
            return (
              <TouchableOpacity
                key={alert.alert_id}
                onPress={() => nav?.navigate('Alert', { alert })}
                style={[styles.alertCard, { backgroundColor: s.bg, borderColor: s.border }]}
              >
                <View style={styles.alertRow}>
                  <View style={[styles.alertIconWrap, { backgroundColor: s.color + '20' }]}>
                    <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.alertHeaderRow}>
                      <Text style={styles.alertType}>{alert.alert_type?.replace(/_/g, ' ')}</Text>
                      <View style={[styles.alertPriorityBadge, { backgroundColor: s.color + '20' }]}>
                        <Text style={[styles.alertPriorityText, { color: s.color }]}>{alert.target_role?.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={styles.alertMsg}>{alert.alert_message || 'Fire activity detected in your region.'}</Text>
                    <View style={styles.alertFooter}>
                      <Text style={styles.alertLocation}>Fire: {alert.fire_id?.slice(0, 8) || 'Unknown'}</Text>
                      <Text style={styles.alertTime}>{alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : ''}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
