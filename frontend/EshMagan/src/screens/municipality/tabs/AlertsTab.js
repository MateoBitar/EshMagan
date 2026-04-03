import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import styles from '../../../styles/screens/MunicipalityDashboard.styles';

function AlertsTab({ alerts, loading }) {
  const sorted = [...alerts].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

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
    <ScrollView contentContainerStyle={styles.alertScrollContent} showsVerticalScrollIndicator={false}>
      {sorted.map(alert => {
        const severity = getSeverityColor(alert.fire_severitylevel || alert.severity || 0);
        const expired = alert.expires_at ? new Date(alert.expires_at) <= new Date() : false;

        return (
          <View key={alert.alert_id} style={[styles.alertCard, expired && { opacity: 0.7 }]}>
            <View style={styles.alertCardHeader}>
              <View style={[styles.alertIconWrap, { backgroundColor: severity.bg, borderWidth: 1, borderColor: severity.border }]}>
                <Text style={{ color: severity.text, fontWeight: '800' }}>!</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.alertTypeName}>{alert.alert_title || 'Wildfire Alert'}</Text>
                <Text style={styles.alertTime}>{timeAgo(alert.created_at)}</Text>
              </View>

              <View style={[styles.alertRoleBadge, { backgroundColor: severity.bg }]}>
                <Text style={[styles.alertRoleBadgeText, { color: severity.text }]}>
                  {getSeverityLabel(alert.fire_severitylevel || alert.severity || 0)}
                </Text>
              </View>
            </View>

            <Text style={styles.alertMessage}>{alert.alert_message || 'No alert message provided.'}</Text>
            {alert.fire_id ? <Text style={styles.alertFireId}>Fire: {String(alert.fire_id).slice(0, 12)}</Text> : null}
            <Text style={styles.alertExpires}>{expired ? 'Expired' : 'Active'}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}