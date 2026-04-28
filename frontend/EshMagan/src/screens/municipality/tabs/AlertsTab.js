import React from 'react';
import {
  View,
  ScrollView,
  Text,
  Platform,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import styles, { C } from '../../../styles/screens/MunicipalityDashboard.styles';
import logoSource from '../../../images/logoSource';

const ASSETS = {
  fire: Platform.select({
    web: { uri: '/fire.png' },
    android: { uri: 'fire' },
    ios: { uri: 'fire' },
    default: { uri: 'fire' },
  }),
  time: Platform.select({
    web: { uri: '/time.png' },
    android: { uri: 'time' },
    ios: { uri: 'time' },
    default: { uri: 'time' },
  }),
};

export default function AlertsTab({
  alerts = [],
  loading,
  fmtDate,
}) {
  let nav = null;

  try {
    const { useNavigation } = require('@react-navigation/native');
    nav = useNavigation();
  } catch {}

  const sorted = [...alerts].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  const handleOpenIncident = alert => {
    if (!alert?.fire_id) return;

    nav?.navigate?.('IncidentDetails', {
      fireId: alert.fire_id,
      alert,
      source: 'MunicipalityAlerts',
    });
  };

  if (loading) {
    return (
      <View style={styles.tabFill}>
        <Text style={styles.sectionHeader}>
          0 nearby alerts • loading...
        </Text>

        <View style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <View style={styles.emptyWrap}>
            <ActivityIndicator color={C.tangerine} />
            <Text style={styles.emptyDesc}>Loading municipality alerts.</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.tabFill}>
      <Text style={styles.sectionHeader}>
        {sorted.length} nearby alert{sorted.length !== 1 ? 's' : ''} • municipality coverage
      </Text>

      <View style={{ flex: 1, minHeight: '81vh', maxHeight: '81vh', overflow: 'hidden' }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 2, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {sorted.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No alerts</Text>
              <Text style={styles.emptyDesc}>
                No active alerts for your municipality.
              </Text>
            </View>
          ) : (
            sorted.map(alert => {
              const isExpired = alert.expires_at ? new Date(alert.expires_at) < new Date() : false;
              const isFireAlert = alert.alert_type === 'FireAlert';
              const accentColor = isExpired ? C.slate : isFireAlert ? C.scarlet : C.tangerine;

              return (
                <TouchableOpacity
                  key={alert.alert_id}
                  activeOpacity={0.88}
                  onPress={() => handleOpenIncident(alert)}
                  disabled={!alert?.fire_id}
                  style={[
                    styles.alertCard,
                    { borderColor: accentColor + (isExpired ? '30' : '50') },
                    isExpired && styles.alertCardExpired,
                  ]}
                >
                  <View style={styles.alertCardContent}>
                    <View style={styles.alertCardIcon}>
                      <Image
                        source={logoSource}
                        style={styles.logoImage}
                        resizeMode="contain"
                      />
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
                            {alert.alert_title || alert.alert_type || 'Municipality Alert'}
                          </Text>
                        </View>

                        {isExpired ? (
                          <View style={styles.alertCardExpiredBadge}>
                            <Text style={styles.alertCardExpiredText}>EXPIRED</Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={styles.alertMessage}>
                        {alert.alert_message || 'No alert message provided.'}
                      </Text>

                      <View style={styles.alertCardMetaRow}>
                        <View style={styles.alertMetaRow}>
                          <Image source={ASSETS.time} style={styles.alertMetaIcon} />
                          <Text style={styles.alertCardMeta}>
                            {fmtDate ? fmtDate(alert.created_at) : alert.created_at}
                          </Text>
                        </View>

                        {alert.fire_id ? (
                          <View style={styles.alertMetaRow}>
                            <Image source={ASSETS.fire} style={styles.alertMetaIcon} />
                            <Text style={styles.alertCardMeta}>
                              #{String(alert.fire_id).slice(0, 8)}
                            </Text>
                          </View>
                        ) : null}
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
  );
}