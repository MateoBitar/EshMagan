// src/screens/resident/ResidentAlertsScreen.js
import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import { GET_ALERTS } from '../../services/api';
import styles from '../../styles/screens/ResidentAlertsScreen.styles';

const PRIORITY_STYLE = {
  critical: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', emoji: '🚨' },
  high: { bg: '#fff7ed', border: '#fed7aa', color: '#ea580c', emoji: '⚠️' },
  moderate: { bg: '#fefce8', border: '#fef08a', color: '#ca8a04', emoji: '⚡' },
  low: { bg: '#f0fdf4', border: '#bbf7d0', color: '#16a34a', emoji: '✅' },
};

export default function ResidentAlertsScreen() {
  const navigation = useNavigation();
  const { data, loading } = useQuery(GET_ALERTS, { pollInterval: 15000 });
  const alerts = data?.alerts || [];

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
            const s = PRIORITY_STYLE[alert.alert_priority?.toLowerCase()] || PRIORITY_STYLE.low;
            return (
              <TouchableOpacity key={alert.id} onPress={() => navigation.navigate('Alert')} style={[styles.alertCard, { backgroundColor: s.bg, borderColor: s.border }]}>
                <View style={styles.alertRow}>
                  <View style={[styles.alertIconWrap, { backgroundColor: s.color + '20' }]}>
                    <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.alertHeaderRow}>
                      <Text style={styles.alertType}>{alert.alert_type?.replace(/_/g, ' ')} Alert</Text>
                      <View style={[styles.alertPriorityBadge, { backgroundColor: s.color + '20' }]}>
                        <Text style={[styles.alertPriorityText, { color: s.color }]}>{alert.alert_priority?.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={styles.alertMsg}>{alert.alert_message || 'Fire activity detected in your region.'}</Text>
                    <View style={styles.alertFooter}>
                      <Text style={styles.alertLocation}>{alert.fire?.fire_location || 'Unknown location'}</Text>
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
