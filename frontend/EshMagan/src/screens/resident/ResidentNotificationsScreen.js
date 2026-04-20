import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { gqlFetch, GET_NOTIFICATIONS_BY_USER } from '../../services/api';
import styles from '../../styles/screens/ResidentNotificationsScreen.styles';

function formatDate(value) {
  if (!value) return 'Unknown date';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown date';

  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getReadableStatus(status) {
  if (status === 'Sent') return 'Unread';
  if (status === 'Delivered') return 'Read';
  return status || 'Unknown';
}

export default function ResidentNotificationsScreen({ navigation }) {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async (showRefresh = false) => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await gqlFetch(GET_NOTIFICATIONS_BY_USER, {
        user_id: user.id,
      });

      const list = data?.getNotificationsByUser || [];

      const sorted = [...list].sort(
        (a, b) =>
          new Date(b.created_at || b.notification_created_at || 0) -
          new Date(a.created_at || a.notification_created_at || 0)
      );

      setNotifications(sorted);
    } catch (e) {
      console.error('Failed to load resident notifications:', e);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const unsub = navigation?.addListener?.('focus', () => {
      loadNotifications(true);
    });
    return unsub;
  }, [navigation, loadNotifications]);

  const unreadNotifs = notifications.filter(
    n => n.notification_status !== 'Delivered'
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>{'‹ Back'}</Text>
          </TouchableOpacity>

          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSub}>
              {unreadNotifs.length} unread • {notifications.length} total
            </Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#EC7742" />
          <Text style={styles.loaderText}>Loading notifications...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadNotifications(true)}
              tintColor="#EC7742"
            />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptyDesc}>
                Notifications and important updates for residents will appear here.
              </Text>
            </View>
          ) : (
            notifications.map(n => {
              const isUnread = n.notification_status !== 'Delivered';

              return (
                <View
                  key={n.notification_id}
                  style={[
                    styles.card,
                    isUnread ? styles.cardUnread : styles.cardRead,
                  ]}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleRow}>
                      {isUnread && <View style={styles.unreadDot} />}
                      <Text
                        style={[
                          styles.message,
                          isUnread ? styles.messageUnread : styles.messageRead,
                        ]}
                      >
                        {n.notification_message || 'No message'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View
                      style={[
                        styles.badge,
                        isUnread ? styles.badgeUnread : styles.badgeRead,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          isUnread ? styles.badgeTextUnread : styles.badgeTextRead,
                        ]}
                      >
                        {getReadableStatus(n.notification_status)}
                      </Text>
                    </View>

                    {!!n.fire_id && (
                      <Text style={styles.fireId}>
                        Fire #{String(n.fire_id).slice(0, 8)}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.dateText}>
                    {formatDate(n.created_at || n.notification_created_at)}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}