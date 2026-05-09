import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  gqlFetch,
  GET_NOTIFICATIONS_BY_USER,
  UPDATE_NOTIFICATION_STATUS,
} from '../../services/api';
import styles, { C } from '../../styles/screens/ResidentNotificationsScreen.styles';

const ASSETS = {
  fire: Platform.select({
    web: { uri: '/fire.png' },
    android: { uri: 'fire' },
    ios: { uri: 'fire' },
    default: { uri: 'fire' },
  }),
};

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

      const list = data?.getNotificationsByUserId || [];

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

  const handleMarkNotifRead = async notificationId => {
    try {
      await gqlFetch(UPDATE_NOTIFICATION_STATUS, {
        notification_id: notificationId,
        notification_status: 'Delivered',
      });

      setNotifications(prev =>
        prev.map(n =>
          n.notification_id === notificationId
            ? { ...n, notification_status: 'Delivered' }
            : n
        )
      );
    } catch (e) {
      console.error('Failed to mark resident notification as read:', e);
    }
  };

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

          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={C.tangerine} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionHeader}>
              {unreadNotifs.length} unread • {notifications.length} total
            </Text>

            <View style={styles.tabScrollContainer}>
              <View style={styles.tabScrollViewport}>
                <ScrollView
                  style={styles.fullFlex || { flex: 1 }}
                  contentContainerStyle={styles.tabScrollContent}
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
                      <Text style={styles.emptyTitle}>No notifications</Text>
                      <Text style={styles.emptyDesc}>
                        Notifications and important updates for residents will appear here.
                      </Text>
                    </View>
                  ) : (
                    notifications.map(n => {
                      const isUnread = n.notification_status !== 'Delivered';

                      return (
                        <TouchableOpacity
                          key={n.notification_id}
                          onPress={() => isUnread && handleMarkNotifRead(n.notification_id)}
                          activeOpacity={isUnread ? 0.7 : 1}
                          style={[
                            styles.notificationCard,
                            isUnread
                              ? styles.notificationCardUnread
                              : styles.notificationCardRead,
                          ]}
                        >
                          <View style={styles.notificationCardContent}>
                            {isUnread && <View style={styles.notificationUnreadDot} />}

                            <View style={styles.notificationInfo}>
                              <Text
                                style={[
                                  styles.notificationMessage,
                                  isUnread
                                    ? styles.notificationMessageUnread
                                    : styles.notificationMessageRead,
                                ]}
                              >
                                {n.notification_message || 'No message'}
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
                                    {getReadableStatus(n.notification_status)}
                                  </Text>
                                </View>

                                {!!n.fire_id && (
                                  <View style={styles.notificationFireIdRow}>
                                    <Image
                                      source={ASSETS.fire}
                                      style={styles.notificationFireIcon}
                                      resizeMode="contain"
                                    />
                                    <Text style={styles.notificationFireId}>
                                      #{String(n.fire_id).slice(0, 8)}
                                    </Text>
                                  </View>
                                )}

                                {n.notification_status === 'Sent' && (
                                  <Text style={styles.notificationTapHint}>
                                    Tap to mark read
                                  </Text>
                                )}
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
          </>
        )}
      </View>
    </SafeAreaView>
  );
}