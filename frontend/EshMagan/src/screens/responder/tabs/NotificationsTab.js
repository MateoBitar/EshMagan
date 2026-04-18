import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import styles from '../../../styles/screens/ResponderCommandView.styles';

export default function NotificationsTab({
    notifications,
    unreadNotifs,
    handleMarkNotifRead,
}) {
    return (
        <>
            <Text style={styles.sectionHeader}>
                {unreadNotifs.length} unread • {notifications.length} total
            </Text>
            <View style={{ flex: 1, minHeight: '76vh', maxHeight: '76vh', overflow: 'hidden' }}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ gap: 2, paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    {notifications.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyTitle}>No notifications</Text>
                            <Text style={styles.emptyDesc}>Assignment alerts will appear here</Text>
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
                                        isUnread ? styles.notificationCardUnread : styles.notificationCardRead,
                                    ]}
                                >
                                    <View style={styles.notificationCardContent}>
                                        {isUnread && <View style={styles.notificationUnreadDot} />}

                                        <View style={styles.notificationInfo}>
                                            <Text
                                                style={[
                                                    styles.notificationMessage,
                                                    isUnread ? styles.notificationMessageUnread : styles.notificationMessageRead,
                                                ]}
                                            >
                                                {n.notification_message}
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
                                                                : n.notification_status}
                                                    </Text>
                                                </View>

                                                {n.fire_id && (
                                                    <Text style={styles.notificationFireId}>
                                                        🔥#{n.fire_id?.slice(0, 8)}
                                                    </Text>
                                                )}

                                                {n.notification_status === 'Sent' && (
                                                    <Text style={styles.notificationTapHint}>Tap to mark read</Text>
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
        </>
    );
}