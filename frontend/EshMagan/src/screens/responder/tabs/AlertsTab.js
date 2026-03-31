import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import styles, { C } from '../../../styles/screens/ResponderCommandView.styles';

const ALERT_EMOJI = {
    FireAlert: '🔥',
    EvacuationAlert: '🚨',
    PredictionAlert: '⚠️',
};

export default function AlertsTab({
    alerts,
    activeAlerts,
    myLocation,
    alertRadiusMeters,
    fmtDate,
}) {
    const content = (
        <>
            <View
                style={[
                    styles.alertsInfoBox,
                    myLocation ? styles.alertsInfoBoxLocated : styles.alertsInfoBoxLocating,
                ]}
            >
                <Text style={styles.alertsInfoEmoji}>{myLocation ? '📍' : '🔄'}</Text>
                <Text style={styles.alertsInfoText}>
                    {myLocation
                        ? `Showing alerts within ${alertRadiusMeters / 1000}km of your location`
                        : 'Getting your location to filter nearby alerts...'}
                </Text>
            </View>

            <Text style={styles.sectionHeader}>{activeAlerts.length} nearby active alerts</Text>

            <View style={{ flex: 1, minHeight: '71vh', maxHeight: '71vh', overflow: 'hidden', }}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ gap: 2, paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    {activeAlerts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyStateEmoji}>✅</Text>
                            <Text style={[styles.emptyStateText, { color: C.green, fontWeight: '600' }]}>
                                No active alerts nearby
                            </Text>
                            <Text style={styles.emptyStateSubtext}>
                                All clear within {alertRadiusMeters / 1000}km
                            </Text>
                        </View>
                    ) : (
                        activeAlerts.map(alert => {
                            const isExpired = new Date(alert.expires_at) < new Date();
                            const emoji = ALERT_EMOJI[alert.alert_type] || '⚠️';
                            const isFireAlert = alert.alert_type === 'FireAlert';
                            const accentColor = isExpired ? C.slate : isFireAlert ? C.scarlet : C.tangerine;

                            return (
                                <View
                                    key={alert.alert_id}
                                    style={[
                                        styles.alertCard,
                                        { borderColor: accentColor + (isExpired ? '30' : '50') },
                                        isExpired && styles.alertCardExpired,
                                    ]}
                                >
                                    <View style={styles.alertCardContent}>
                                        <View
                                            style={[
                                                styles.alertCardIcon,
                                                { backgroundColor: accentColor + '20' },
                                            ]}
                                        >
                                            <Text style={styles.alertCardEmoji}>{emoji}</Text>
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
                                                        {alert.alert_type}
                                                    </Text>
                                                </View>

                                                {isExpired && (
                                                    <View style={styles.alertCardExpiredBadge}>
                                                        <Text style={styles.alertCardExpiredText}>EXPIRED</Text>
                                                    </View>
                                                )}
                                            </View>

                                            <Text style={styles.alertCardMessage}>{alert.alert_message}</Text>

                                            <View style={styles.alertCardMetaRow}>
                                                <Text style={styles.alertCardMeta}>🕐 {fmtDate(alert.created_at)}</Text>
                                                {alert.fire_id && (
                                                    <Text style={styles.alertCardMeta}>
                                                        🔥 #{alert.fire_id?.slice(0, 8)}
                                                    </Text>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            </View>
        </>
    );

    return <View style={styles.tabFill}>{content}</View>;
}
