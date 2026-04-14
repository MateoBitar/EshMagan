import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Platform, TouchableOpacity } from 'react-native';
import styles, { C, RESPONDER_STATUS_COLORS } from '../../../styles/screens/ResponderCommandView.styles';
import WebUnitsMap from '../maps/WebUnitsMap';
import NativeUnitsMap from '../maps/NativeUnitsMap';

function getResponderLocationText(responder) {
    if (responder?.last_known_location?.latitude != null && responder?.last_known_location?.longitude != null) {
        return `${Number(responder.last_known_location.latitude).toFixed(5)}, ${Number(responder.last_known_location.longitude).toFixed(5)}`;
    }

    if (responder?.unit_location?.latitude != null && responder?.unit_location?.longitude != null) {
        return `${Number(responder.unit_location.latitude).toFixed(5)}, ${Number(responder.unit_location.longitude).toFixed(5)}`;
    }

    return 'Location unavailable';
}

function getFireLocationText(fire) {
    const loc = fire?.coords;
    if (loc?.lat != null && loc?.lng != null) {
        return `${Number(loc.lat).toFixed(5)}, ${Number(loc.lng).toFixed(5)}`;
    }
    return 'Location unavailable';
}

function getSeverityColor(level) {
    if (!level) return { bg: 'rgba(148,163,184,0.14)', text: '#94a3b8', border: 'rgba(148,163,184,0.35)' };
    if (level >= 8) return { bg: 'rgba(220,38,38,0.14)', text: '#dc2626', border: 'rgba(220,38,38,0.35)' };
    if (level >= 6) return { bg: 'rgba(234,88,12,0.14)', text: '#ea580c', border: 'rgba(234,88,12,0.35)' };
    if (level >= 3) return { bg: 'rgba(245,158,11,0.14)', text: '#f59e0b', border: 'rgba(245,158,11,0.35)' };
    return { bg: 'rgba(22,163,74,0.14)', text: '#16a34a', border: 'rgba(22,163,74,0.35)' };
}

function getSeverityLabel(level) {
    if (!level) return 'Unknown';
    if (level >= 8) return 'Critical';
    if (level >= 6) return 'High';
    if (level >= 3) return 'Moderate';
    return 'Low';
}

export default function UnitsTab({ myResponder, myStatus, otherResponders, unitsForMap, firesForMap }) {
    const [openSections, setOpenSections] = useState({
        responders: true,
        units: true,
        fires: true,
    });

    const [selectedResponderId, setSelectedResponderId] = useState(null);
    const [selectedUnitId, setSelectedUnitId] = useState(null);
    const [selectedFireId, setSelectedFireId] = useState(null);

    useEffect(() => {
        if (Platform.OS !== 'web' || typeof document === 'undefined') return;

        if (!document.getElementById('units-scrollbar-style')) {
            const styleTag = document.createElement('style');
            styleTag.id = 'units-scrollbar-style';
            styleTag.innerHTML = `
        #units-accordion-scroll::-webkit-scrollbar,
        .units-inner-scroll::-webkit-scrollbar {
          width: 10px;
        }

        #units-accordion-scroll::-webkit-scrollbar-track,
        .units-inner-scroll::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 999px;
        }

        #units-accordion-scroll::-webkit-scrollbar-thumb,
        .units-inner-scroll::-webkit-scrollbar-thumb {
          background: #EC7742;
          border-radius: 999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        #units-accordion-scroll::-webkit-scrollbar-thumb:hover,
        .units-inner-scroll::-webkit-scrollbar-thumb:hover {
          background: #d96532;
          border-radius: 999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
      `;
            document.head.appendChild(styleTag);
        }
    }, []);

    const respondersList = useMemo(() => {
        const mine = myResponder
            ? [{
                responder_id: myResponder.responder_id,
                unit_nb: myResponder.unit_nb,
                responder_status: myStatus,
                last_known_location: myResponder.last_known_location,
                unit_location: myResponder.unit_location,
            }]
            : [];

        const others = otherResponders.map(r => ({
            responder_id: r.responder_id,
            unit_nb: r.unit_nb,
            responder_status: r.responder_status,
            last_known_location: r.last_known_location,
            unit_location: r.unit_location,
        }));

        return [...mine, ...others];
    }, [myResponder, myStatus, otherResponders]);

    const activeResponderCount = useMemo(
        () => respondersList.filter(r => r?.responder_status === 'Active').length,
        [respondersList]
    );

    const standbyResponderCount = useMemo(
        () => respondersList.filter(r => r?.responder_status === 'Standby').length,
        [respondersList]
    );

    const unitsList = useMemo(() => {
        const map = new Map();

        respondersList.forEach((r, i) => {
            const unitId = r.unit_nb || r.responder_id || `unit-${i}`;
            if (!map.has(unitId)) {
                map.set(unitId, {
                    responder_id: r.responder_id,
                    unit_nb: r.unit_nb,
                    responder_status: r.responder_status,
                    last_known_location: r.last_known_location,
                    unit_location: r.unit_location,
                    unitId,
                });
            }
        });

        return Array.from(map.values());
    }, [respondersList]);

    const toggleSection = key => {
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const renderChevron = open => (open ? '⌄' : '›');

    return (
        <View style={styles.unitsMapTabContainer}>
            <View style={styles.unitsMapLayout}>
                <View style={styles.unitsMapPane}>
                    {Platform.OS === 'web' ? (
                        <WebUnitsMap
                            units={unitsForMap}
                            fires={firesForMap}
                            selectedResponderId={selectedResponderId}
                            selectedUnitId={selectedUnitId}
                            selectedFireId={selectedFireId}
                        />
                    ) : (
                        <NativeUnitsMap
                            units={unitsForMap}
                            fires={firesForMap}
                            selectedResponderId={selectedResponderId}
                            selectedUnitId={selectedUnitId}
                            selectedFireId={selectedFireId}
                        />
                    )}
                </View>

                <View style={styles.unitsSidePanel}>
                    <View style={styles.unitsSidePanelHeader}>
                        <View>
                            <Text style={styles.unitsSidePanelTitle}>Live overview</Text>
                            <Text style={styles.unitsSidePanelSubtitle}>
                                Select a responder, unit, or fire to focus it on the map.
                            </Text>
                        </View>

                        <View style={styles.unitsStatsRow}>
                            <View style={styles.unitsStatCard}>
                                <Text style={styles.unitsStatCardValue}>{firesForMap.length}</Text>
                                <Text style={styles.unitsStatCardLabel}>Active fires</Text>
                            </View>

                            <View style={styles.unitsStatCard}>
                                <Text style={styles.unitsStatCardValue}>{activeResponderCount}</Text>
                                <Text style={styles.unitsStatCardLabel}>Active units</Text>
                            </View>

                            <View style={styles.unitsStatCard}>
                                <Text style={styles.unitsStatCardValue}>{standbyResponderCount}</Text>
                                <Text style={styles.unitsStatCardLabel}>Stand by</Text>
                            </View>
                        </View>
                    </View>

                    <ScrollView
                        nativeID="units-accordion-scroll"
                        style={styles.unitsAccordionScroll}
                        contentContainerStyle={styles.unitsAccordionScrollContent}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled
                    >
                        <View style={[styles.unitsAccordionSection]}>
                            <TouchableOpacity style={styles.unitsAccordionHeader} onPress={() => toggleSection('fires')}>
                                <View style={styles.unitsAccordionHeaderLeft}>
                                    <View style={[styles.unitsAccordionDot, { backgroundColor: '#dc2626' }]} />
                                    <Text style={styles.unitsAccordionTitle}>Active Fires</Text>
                                </View>

                                <View style={styles.unitsAccordionMeta}>
                                    <View style={styles.unitsAccordionCount}>
                                        <Text style={styles.unitsAccordionCountText}>{firesForMap.length}</Text>
                                    </View>
                                    <Text style={styles.unitsAccordionChevron}>{renderChevron(openSections.fires)}</Text>
                                </View>
                            </TouchableOpacity>

                            {openSections.fires ? (
                                <View style={styles.unitsAccordionBodyWrapper}>
                                    <ScrollView
                                        style={styles.unitsAccordionBodyScroll}
                                        contentContainerStyle={styles.unitsAccordionBodyScrollContent}
                                        nestedScrollEnabled
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {firesForMap.length === 0 ? (
                                            <View style={styles.unitsEmptyWrap}>
                                                <Text style={styles.unitsEmptyTitle}>No active fires</Text>
                                                <Text style={styles.unitsEmptyDesc}>Fire locations will appear here.</Text>
                                            </View>
                                        ) : (
                                            firesForMap.map(fire => {
                                                const severity = getSeverityColor(fire.fire_severitylevel ?? fire.severity);

                                                return (
                                                    <TouchableOpacity
                                                        key={fire.fire_id}
                                                        style={[
                                                            styles.unitsEntityItem,
                                                            selectedFireId === fire.fire_id && styles.unitsEntityItemActive,
                                                        ]}
                                                        onPress={() => {
                                                            setSelectedResponderId(null);
                                                            setSelectedUnitId(null);
                                                            setSelectedFireId(fire.fire_id);
                                                        }}
                                                    >
                                                        <View style={styles.unitsEntityItemTop}>
                                                            <Text style={styles.unitsEntityItemTitle}>
                                                                {fire.displayName || `Fire ${String(fire.fire_id).slice(0, 8)}`}
                                                            </Text>

                                                            <View
                                                                style={[
                                                                    styles.unitsEntityItemBadge,
                                                                    {
                                                                        backgroundColor: severity.bg,
                                                                        borderColor: severity.border,
                                                                    },
                                                                ]}
                                                            >
                                                                <Text style={[styles.unitsEntityItemBadgeText, { color: severity.text }]}>
                                                                    {getSeverityLabel(fire.fire_severitylevel ?? fire.severity)}
                                                                </Text>
                                                            </View>
                                                        </View>

                                                        <Text style={styles.unitsEntityItemSub}>
                                                            Severity level: {fire.fire_severitylevel ?? fire.severity ?? 'Unknown'}
                                                        </Text>
                                                        <Text style={styles.unitsEntityItemMeta}>{getFireLocationText(fire)}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })
                                        )}
                                    </ScrollView>
                                </View>
                            ) : null}
                        </View>

                        <View style={styles.unitsAccordionSection}>
                            <TouchableOpacity style={styles.unitsAccordionHeader} onPress={() => toggleSection('responders')}>
                                <View style={styles.unitsAccordionHeaderLeft}>
                                    <View style={[styles.unitsAccordionDot, { backgroundColor: '#2563eb' }]} />
                                    <Text style={styles.unitsAccordionTitle}>Responders</Text>
                                </View>

                                <View style={styles.unitsAccordionMeta}>
                                    <View style={styles.unitsAccordionCount}>
                                        <Text style={styles.unitsAccordionCountText}>{respondersList.length}</Text>
                                    </View>
                                    <Text style={styles.unitsAccordionChevron}>{renderChevron(openSections.responders)}</Text>
                                </View>
                            </TouchableOpacity>

                            {openSections.responders ? (
                                <View style={styles.unitsAccordionBodyWrapper}>
                                    <ScrollView
                                        style={styles.unitsAccordionBodyScroll}
                                        contentContainerStyle={styles.unitsAccordionBodyScrollContent}
                                        nestedScrollEnabled
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {respondersList.length === 0 ? (
                                            <View style={styles.unitsEmptyWrap}>
                                                <Text style={styles.unitsEmptyTitle}>No responders available</Text>
                                                <Text style={styles.unitsEmptyDesc}>Responder locations will appear here.</Text>
                                            </View>
                                        ) : (
                                            respondersList.map((r, i) => {
                                                const statusColor = RESPONDER_STATUS_COLORS[r.responder_status] || C.slate;
                                                const statusLabel = r.responder_status === 'Standby' ? 'Stand by' : (r.responder_status || 'Unknown');

                                                return (
                                                    <TouchableOpacity
                                                        key={`${r.responder_id}-${r.unit_nb}-${i}`}
                                                        style={[
                                                            styles.unitsEntityItem,
                                                            selectedResponderId === r.responder_id && styles.unitsEntityItemActive,
                                                        ]}
                                                        onPress={() => {
                                                            setSelectedFireId(null);
                                                            setSelectedUnitId(null);
                                                            setSelectedResponderId(r.responder_id);
                                                        }}
                                                    >
                                                        <View style={styles.unitsEntityItemTop}>
                                                            <Text style={styles.unitsEntityItemTitle}>
                                                                {r.responder_id} - {r.unit_nb}
                                                            </Text>

                                                            <View
                                                                style={[
                                                                    styles.unitsEntityItemBadge,
                                                                    {
                                                                        backgroundColor: statusColor + '18',
                                                                        borderColor: statusColor + '40',
                                                                    },
                                                                ]}
                                                            >
                                                                <Text style={[styles.unitsEntityItemBadgeText, { color: statusColor }]}>
                                                                    {statusLabel}
                                                                </Text>
                                                            </View>
                                                        </View>

                                                        <Text style={styles.unitsEntityItemSub}>Responder</Text>
                                                        <Text style={styles.unitsEntityItemMeta}>{getResponderLocationText(r)}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })
                                        )}
                                    </ScrollView>
                                </View>
                            ) : null}
                        </View>

                        <View style={styles.unitsAccordionSection}>
                            <TouchableOpacity style={styles.unitsAccordionHeader} onPress={() => toggleSection('units')}>
                                <View style={styles.unitsAccordionHeaderLeft}>
                                    <View style={[styles.unitsAccordionDot, { backgroundColor: C.tangerine }]} />
                                    <Text style={styles.unitsAccordionTitle}>Units</Text>
                                </View>

                                <View style={styles.unitsAccordionMeta}>
                                    <View style={styles.unitsAccordionCount}>
                                        <Text style={styles.unitsAccordionCountText}>{unitsList.length}</Text>
                                    </View>
                                    <Text style={styles.unitsAccordionChevron}>{renderChevron(openSections.units)}</Text>
                                </View>
                            </TouchableOpacity>

                            {openSections.units ? (
                                <View style={styles.unitsAccordionBodyWrapper}>
                                    <ScrollView
                                        style={styles.unitsAccordionBodyScroll}
                                        contentContainerStyle={styles.unitsAccordionBodyScrollContent}
                                        nestedScrollEnabled
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {unitsList.length === 0 ? (
                                            <View style={styles.unitsEmptyWrap}>
                                                <Text style={styles.unitsEmptyTitle}>No units available</Text>
                                                <Text style={styles.unitsEmptyDesc}>Units will appear here.</Text>
                                            </View>
                                        ) : (
                                            unitsList.map((unit, i) => {
                                                const statusColor = RESPONDER_STATUS_COLORS[unit.responder_status] || C.slate;
                                                const statusLabel = unit.responder_status === 'Standby' ? 'Stand by' : (unit.responder_status || 'Unknown');

                                                return (
                                                    <TouchableOpacity
                                                        key={`${unit.unitId}-${i}`}
                                                        style={[
                                                            styles.unitsEntityItem,
                                                            selectedUnitId === unit.unitId && styles.unitsEntityItemActive,
                                                        ]}
                                                        onPress={() => {
                                                            setSelectedFireId(null);
                                                            setSelectedResponderId(null);
                                                            setSelectedUnitId(unit.unitId);
                                                        }}
                                                    >
                                                        <View style={styles.unitsEntityItemTop}>
                                                            <Text style={styles.unitsEntityItemTitle}>
                                                                {unit.unit_nb || 'Unit'}
                                                            </Text>

                                                            <View
                                                                style={[
                                                                    styles.unitsEntityItemBadge,
                                                                    {
                                                                        backgroundColor: statusColor + '18',
                                                                        borderColor: statusColor + '40',
                                                                    },
                                                                ]}
                                                            >
                                                                <Text style={[styles.unitsEntityItemBadgeText, { color: statusColor }]}>
                                                                    {statusLabel}
                                                                </Text>
                                                            </View>
                                                        </View>

                                                        <Text style={styles.unitsEntityItemSub}>{unit.responder_id || 'Responder'}</Text>
                                                        <Text style={styles.unitsEntityItemMeta}>{getResponderLocationText(unit)}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })
                                        )}
                                    </ScrollView>
                                </View>
                            ) : null}
                        </View>


                    </ScrollView>
                </View>
            </View>
        </View>
    );
}
