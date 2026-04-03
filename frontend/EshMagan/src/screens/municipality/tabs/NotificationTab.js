import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import styles from '../../../styles/screens/MunicipalityDashboard.styles';

function NotificationsTab({ notifications, loading, onMarkRead }) {
  const sorted = [...notifications].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  const unread = sorted.filter(notification => notification.notification_status === 'Sent');

  if (loading) {
    return (
      <View style={styles.emptyWrap}>
        <ActivityIndicator color="#EC7742" />
        <Text style={styles.emptyDesc}>Loading notifications.</Text>
      </View>
    );
  }

  if (!sorted.length) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>No notifications</Text>
        <Text style={styles.emptyDesc}>Notifications for your municipality will appear here.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {unread.length > 0 ? (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadBannerText}>
            {unread.length} unread notification{unread.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity style={styles.markAllReadBtn} onPress={() => unread.forEach(n => onMarkRead(n.notification_id))}>
            <Text style={styles.markAllReadBtnText}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.notifScrollContent} showsVerticalScrollIndicator={false}>
        {sorted.map(notification => {
          const isUnread = notification.notification_status === 'Sent';

          return (
            <TouchableOpacity
              key={notification.notification_id}
              onPress={() => isUnread && onMarkRead(notification.notification_id)}
              style={[styles.notifCard, isUnread ? styles.notifCardUnread : styles.notifCardRead]}
            >
              <View style={styles.notifRow}>
                <View style={[styles.notifDot, isUnread ? styles.notifDotUnread : styles.notifDotRead]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifMessage}>{notification.notification_message}</Text>
                  <View style={styles.notifFooter}>
                    <View style={[styles.notifStatusBadge, isUnread ? styles.notifStatusBadgeUnread : styles.notifStatusBadgeRead]}>
                      <Text style={[styles.notifStatusText, isUnread ? styles.notifStatusTextUnread : styles.notifStatusTextRead]}>
                        {notification.notification_status}
                      </Text>
                    </View>
                    <Text style={styles.notifTimeText}>{timeAgo(notification.created_at)}</Text>
                  </View>
                  {notification.fire_id ? <Text style={styles.notifFireId}>Fire: {String(notification.fire_id).slice(0, 12)}</Text> : null}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}