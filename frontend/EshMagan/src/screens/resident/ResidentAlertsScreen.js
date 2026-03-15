// src/screens/resident/ResidentAlertsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { gqlFetch, GET_ALERTS } from '../../services/api';
import styles from '../../styles/screens/ResidentAlertsScreen.styles';

const PRIORITY_STYLE = {
  critical: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', emoji: '🚨' },
  high: { bg: '#fff7ed', border: '#fed7aa', color: '#ea580c', emoji: '⚠️' },
  moderate: { bg: '#fefce8', border: '#fef08a', color: '#ca8a04', emoji: '⚡' },
  low: { bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', emoji: '✅' },
};

function useAlertsData() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web') { setLoading(false); return; }
    const fetch = async () => {
      try {
        const data = await gqlFetch(GET_ALERTS);
        setAlerts(data?.getAllAlerts || []);
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
      const QUERY = gql`query GetAllAlerts {
        getAllAlerts { alert_id alert_type target_role alert_message expires_at created_at fire_id }
      }`;
      const result = useQuery(QUERY, { pollInterval: 15000 });
      alerts = result.data?.getAllAlerts || [];
      loading = result.loading;
    } catch {}
  } else {
    alerts = webData.alerts;
    loading = webData.loading;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Your Alerts</Text>
        {!loading && <Text style={styles.subtitle}>{alerts.length} alert{alerts.length !== 1 ? 's' : ''} received</Text>}
      </View>
      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color="#dc2626" /></View>
      ) : alerts.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyTitle}>No Alerts Yet</Text>
          <Text style={styles.emptyDesc}>You'll be notified immediately when a fire threat is detected near your location.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {alerts.map(alert => {
            const s = PRIORITY_STYLE[alert.target_role?.toLowerCase()] || PRIORITY_STYLE.low;
            return (
              <TouchableOpacity key={alert.alert_id} onPress={() => nav?.navigate('Alert')} style={[styles.alertCard, { backgroundColor: s.bg, borderColor: s.border }]}>
                <View style={styles.alertRow}>
                  <View style={[styles.alertIconWrap, { backgroundColor: s.color + '20' }]}>
                    <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.alertHeaderRow}>
                      <Text style={styles.alertType}>{alert.alert_type?.replace(/_/g, ' ')} Alert</Text>
                      <View style={[styles.alertPriorityBadge, { backgroundColor: s.color + '20' }]}>
                        <Text style={[styles.alertPriorityText, { color: s.color }]}>{alert.target_role?.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={styles.alertMsg}>{alert.alert_message || 'Fire activity detected in your region.'}</Text>
                    <View style={styles.alertFooter}>
                      <Text style={styles.alertLocation}>{alert.fire_id || 'Unknown fire'}</Text>
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
