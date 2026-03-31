import React, { useEffect } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import styles, { C, RESPONDER_STATUS_COLORS } from '../../../styles/screens/ResponderCommandView.styles';
import WebUnitsMap from '../maps/WebUnitsMap';
import NativeUnitsMap from '../maps/NativeUnitsMap';

export default function UnitsTab({ myResponder, myStatus, otherResponders, unitsForMap, firesForMap }) {
    useEffect(() => {
        if (Platform.OS !== 'web' || typeof document === 'undefined') return;

        if (!document.getElementById('units-scrollbar-style')) {
            const styleTag = document.createElement('style');
            styleTag.id = 'units-scrollbar-style';
            styleTag.innerHTML = `
                #units-scroll-area::-webkit-scrollbar {
                    width: 10px;
                }

                #units-scroll-area::-webkit-scrollbar-track {
                    background: transparent;
                    border-radius: 999px;
                }

                #units-scroll-area::-webkit-scrollbar-thumb {
                    background: #EC7742;
                    border-radius: 999px;
                    border: 2px solid transparent;
                    background-clip: padding-box;
                }

                #units-scroll-area::-webkit-scrollbar-thumb:hover {
                    background: #d96532;
                    border-radius: 999px;
                    border: 2px solid transparent;
                    background-clip: padding-box;
                }
            `;
            document.head.appendChild(styleTag);
        }
    }, []);

    return (
        <View style={[styles.unitsTabContainer, { flex: 1, minHeight: 0, overflow: 'hidden' }]}>
            <Text style={styles.sectionHeader}>{otherResponders.length} other units</Text>

            {Platform.OS === 'web' ? (
                <View style={[styles.unitsWebRow, { flex: 1, minHeight: '76vh', overflow: 'hidden' }]}>
                    <View style={styles.unitsMapContainer}>
                        <View style={styles.unitsMapInner}>
                            <WebUnitsMap units={unitsForMap} fires={firesForMap} />
                        </View>
                    </View>

                    <View style={[styles.unitsListContainer, { minHeight: 0, overflow: 'hidden' }]}>
                        <View
                            nativeID="units-scroll-area"
                            style={[
                                styles.unitsListScrollContainer,
                                {
                                    flex: 1,
                                    minHeight: 0,
                                    overflowY: 'auto',
                                    overflowX: 'hidden',
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: '#EC7742 transparent',
                                },
                            ]}
                        >
                            <View style={styles.unitsListScrollContent}>
                                {myResponder && (
                                    <View style={styles.unitCardMe}>
                                        <View style={styles.unitCardHeader}>
                                            <View style={[styles.unitCardIcon, styles.unitCardIconMe]}>
                                                <Text style={styles.unitCardEmoji}>🚒</Text>
                                            </View>
                                            <View style={styles.unitCardTextContainer}>
                                                <View style={styles.unitCardNameRow}>
                                                    <Text style={styles.unitCardName}>
                                                        {myResponder.responder_id} - {myResponder.unit_nb}
                                                    </Text>
                                                    <View style={styles.unitCardYouBadge}>
                                                        <Text style={styles.unitCardYouBadgeText}>YOU</Text>
                                                    </View>
                                                </View>
                                            </View>
                                            <View
                                                style={[
                                                    styles.unitCardStatusBadge,
                                                    { backgroundColor: (RESPONDER_STATUS_COLORS[myStatus] || C.slate) + '20' },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.unitCardStatusText,
                                                        { color: RESPONDER_STATUS_COLORS[myStatus] || C.slate },
                                                    ]}
                                                >
                                                    {myStatus}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={styles.unitCardLocation}>
                                            📍 {myResponder.last_known_location?.latitude
                                                ? `${myResponder.last_known_location.latitude.toFixed(5)}, ${myResponder.last_known_location.longitude.toFixed(5)}`
                                                : myResponder.unit_location?.latitude
                                                    ? `${myResponder.unit_location.latitude.toFixed(5)}, ${myResponder.unit_location.longitude.toFixed(5)}`
                                                    : 'Locating...'}
                                        </Text>
                                    </View>
                                )}

                                {otherResponders.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyStateEmoji}>🚒</Text>
                                        <Text style={styles.emptyStateText}>No other units online</Text>
                                    </View>
                                ) : (
                                    otherResponders.map((r, i) => {
                                        const statusColor = RESPONDER_STATUS_COLORS[r.responder_status] || C.slate;
                                        return (
                                            <View key={`${r.responder_id}-${r.unit_nb}-${i}`} style={styles.unitCardOther}>
                                                <View style={styles.unitCardHeader}>
                                                    <View
                                                        style={[
                                                            styles.unitCardIcon,
                                                            { backgroundColor: statusColor + '15' },
                                                        ]}
                                                    >
                                                        <Text style={styles.unitCardEmoji}>🚒</Text>
                                                    </View>

                                                    <View style={styles.unitCardTextContainer}>
                                                        <Text style={styles.unitCardName}>
                                                            {r.responder_id} - {r.unit_nb}
                                                        </Text>
                                                    </View>

                                                    <View
                                                        style={[
                                                            styles.unitCardStatusBadge,
                                                            { backgroundColor: statusColor + '20' },
                                                        ]}
                                                    >
                                                        <Text style={[styles.unitCardStatusText, { color: statusColor }]}>
                                                            {r.responder_status || 'Unknown'}
                                                        </Text>
                                                    </View>
                                                </View>

                                                <Text style={styles.unitCardLocation}>
                                                    📍 {r.last_known_location?.latitude
                                                        ? `${r.last_known_location.latitude.toFixed(5)}, ${r.last_known_location.longitude.toFixed(5)}`
                                                        : r.unit_location?.latitude
                                                            ? `${r.unit_location.latitude.toFixed(5)}, ${r.unit_location.longitude.toFixed(5)}`
                                                            : 'Location unavailable'}
                                                </Text>
                                            </View>
                                        );
                                    })
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            ) : (
                <View style={styles.unitsMobileColumn}>
                    <View style={styles.unitsMapContainerMobile}>
                        <NativeUnitsMap units={unitsForMap} fires={firesForMap} />
                    </View>

                    <ScrollView
                        style={styles.unitsListContainerMobile}
                        contentContainerStyle={styles.tabScrollContent}
                        showsVerticalScrollIndicator
                    >
                        {myResponder && (
                            <View style={styles.unitCardMe}>
                                <View style={styles.unitCardHeader}>
                                    <View style={[styles.unitCardIcon, styles.unitCardIconMe]}>
                                        <Text style={styles.unitCardEmoji}>🚒</Text>
                                    </View>
                                    <View style={styles.unitCardTextContainer}>
                                        <View style={styles.unitCardNameRow}>
                                            <Text style={styles.unitCardName}>{myResponder.responder_id} - {myResponder.unit_nb}</Text>
                                            <View style={styles.unitCardYouBadge}>
                                                <Text style={styles.unitCardYouBadgeText}>YOU</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View
                                        style={[
                                            styles.unitCardStatusBadge,
                                            { backgroundColor: (RESPONDER_STATUS_COLORS[myStatus] || C.slate) + '20' },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.unitCardStatusText,
                                                { color: RESPONDER_STATUS_COLORS[myStatus] || C.slate },
                                            ]}
                                        >
                                            {myStatus}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.unitCardLocation}>
                                    📍 {myResponder.last_known_location?.latitude
                                        ? `${myResponder.last_known_location.latitude.toFixed(5)}, ${myResponder.last_known_location.longitude.toFixed(5)}`
                                        : myResponder.unit_location?.latitude
                                            ? `${myResponder.unit_location.latitude.toFixed(5)}, ${myResponder.unit_location.longitude.toFixed(5)}`
                                            : 'Locating...'}
                                </Text>
                            </View>
                        )}

                        {otherResponders.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateEmoji}>🚒</Text>
                                <Text style={styles.emptyStateText}>No other units online</Text>
                            </View>
                        ) : (
                            otherResponders.map((r, i) => {
                                const statusColor = RESPONDER_STATUS_COLORS[r.responder_status] || C.slate;
                                return (
                                    <View key={r.responder_id} style={styles.unitCardOther}>
                                        <View style={styles.unitCardHeader}>
                                            <View
                                                style={[
                                                    styles.unitCardIcon,
                                                    { backgroundColor: statusColor + '15' },
                                                ]}
                                            >
                                                <Text style={styles.unitCardEmoji}>🚒</Text>
                                            </View>

                                            <View style={styles.unitCardTextContainer}>
                                                <Text style={styles.unitCardName}>
                                                    {r.responder_id} - {r.unit_nb}
                                                </Text>
                                            </View>

                                            <View
                                                style={[
                                                    styles.unitCardStatusBadge,
                                                    { backgroundColor: statusColor + '20' },
                                                ]}
                                            >
                                                <Text style={[styles.unitCardStatusText, { color: statusColor }]}>
                                                    {r.responder_status || 'Unknown'}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={styles.unitCardLocation}>
                                            📍 {r.last_known_location?.latitude
                                                ? `${r.last_known_location.latitude.toFixed(5)}, ${r.last_known_location.longitude.toFixed(5)}`
                                                : r.unit_location?.latitude
                                                    ? `${r.unit_location.latitude.toFixed(5)}, ${r.unit_location.longitude.toFixed(5)}`
                                                    : 'Location unavailable'}
                                        </Text>
                                    </View>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}
