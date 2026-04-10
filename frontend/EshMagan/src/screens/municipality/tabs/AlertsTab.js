import React from 'react';
import { View, ScrollView, Text, ActivityIndicator } from 'react-native';
import styles from '../../../styles/screens/MunicipalityDashboard.styles';

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
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

function AlertsTab({ alerts = [], loading }) {
  const sorted = [...alerts].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  if (loading) {
    return (
      <View style={styles.emptyWrap}>
        <ActivityIndicator color="#EC7742" />
        <Text style={styles.emptyDesc}>Loading alerts.</Text>
      </View>
    );
  }

  if (!sorted.length) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>No alerts</Text>
        <Text style={styles.emptyDesc}>Municipality alerts will appear here.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.alertScrollContent}
      showsVerticalScrollIndicator={false}
    >
      {sorted.map(alert => {
        const level = alert.fire_severitylevel || alert.severity || 0;
        const severity = getSeverityColor(level);
        const expired = alert.expires_at ? new Date(alert.expires_at) <= new Date() : false;

        return (
          <View
            key={alert.alert_id}
            style={[styles.alertCard, expired && { opacity: 0.7 }]}
          >
            <View style={styles.alertCardHeader}>
              <View
                style={[
                  styles.alertIconWrap,
                  {
                    backgroundColor: severity.bg,
                    borderWidth: 1,
                    borderColor: severity.border,
                  },
                ]}
              >
                <Text style={{ color: severity.text, fontWeight: '800' }}>!</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.alertTypeName}>
                  {alert.alert_title || 'Wildfire Alert'}
                </Text>
                <Text style={styles.alertTime}>{timeAgo(alert.created_at)}</Text>
              </View>

              <View style={[styles.alertRoleBadge, { backgroundColor: severity.bg }]}>
                <Text style={[styles.alertRoleBadgeText, { color: severity.text }]}>
                  {getSeverityLabel(level)}
                </Text>
              </View>
            </View>

            <Text style={styles.alertMessage}>
              {alert.alert_message || 'No alert message provided.'}
            </Text>

            {alert.fire_id ? (
              <Text style={styles.alertFireId}>
                Fire: {String(alert.fire_id).slice(0, 12)}
              </Text>
            ) : null}

            <Text style={styles.alertExpires}>
              {expired ? 'Expired' : 'Active'}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

export default AlertsTab;