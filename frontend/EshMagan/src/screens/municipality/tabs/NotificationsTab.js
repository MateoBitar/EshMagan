import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import styles, { C } from '../../../styles/screens/MunicipalityDashboard.styles';

const ASSETS = {
  fire: Platform.select({
    web: { uri: '/fire.png' },
    android: { uri: 'fire' },
    ios: { uri: 'fire' },
    default: { uri: 'fire' },
  }),
};

export default function NotificationsTab({
  notifications = [],
  loading,
  onMarkRead,
}) {
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  const unreadNotifs = sorted.filter(
    n => n.notification_status !== 'Delivered'
  );

  if (loading) {
    return (
      <>
        <Text style={styles.sectionHeader}>0 unread • 0 total</Text>
        <View style={{ flex: 1, minHeight: '75.1vh', maxHeight: '75.1vh', overflow: 'hidden' }}>
          <View style={styles.emptyWrap}>
            <ActivityIndicator color={C.tangerine} />
            <Text style={styles.emptyDesc}>Loading notifications.</Text>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Text style={styles.sectionHeader}>
        {unreadNotifs.length} unread • {sorted.length} total
      </Text>

      <View style={{ flex: 1, minHeight: '81vh', maxHeight: '81vh', overflow: 'hidden' }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 2, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {sorted.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyDesc}>Notifications for your municipality will appear here.</Text>
            </View>
          ) : (
            sorted.map(n => {
              const isUnread = n.notification_status !== 'Delivered';

              return (
                <TouchableOpacity
                  key={n.notification_id}
                  onPress={() => isUnread && onMarkRead?.(n.notification_id)}
                  activeOpacity={isUnread ? 0.7 : 1}
                  style={[
                    styles.notificationCard,
                    isUnread ? styles.notificationCardUnread : styles.notificationCardRead,
                  ]}
                >
                  <View style={styles.notificationCardContent}>
                    {isUnread ? <View style={styles.notificationUnreadDot} /> : null}

                    <View style={styles.notificationInfo}>
                      <Text
                        style={[
                          styles.notificationMessage,
                          isUnread
                            ? styles.notificationMessageUnread
                            : styles.notificationMessageRead,
                        ]}
                      >
                        {n.notification_message || 'No notification message provided.'}
                      </Text>

                      <View style={styles.notificationMetaRow}>
                        <View
                          style={[
                            styles.notificationStatusBadge,
                            isUnread
                              ? styles.notificationStatusBadgeUnread
                              : styles.notificationStatusBadgeRead,
                          ]}
                        >
                          <Text
                            style={[
                              styles.notificationStatusText,
                              isUnread
                                ? styles.notificationStatusTextUnread
                                : styles.notificationStatusTextRead,
                            ]}
                          >
                            {n.notification_status === 'Sent'
                              ? 'Unread'
                              : n.notification_status === 'Delivered'
                                ? 'Read'
                                : n.notification_status || 'Unknown'}
                          </Text>
                        </View>

                        {n.fire_id ? (
                          <View style={styles.notificationFireIdRow}>
                            <Image source={ASSETS.fire} style={styles.notificationFireIcon} resizeMode="contain" />
                            <Text style={styles.notificationFireId}>
                              #{String(n.fire_id).slice(0, 8)}
                            </Text>
                          </View>
                        ) : null}

                        {isUnread ? (
                          <Text style={styles.notificationTapHint}>Tap to mark read</Text>
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
    </>
  );
}