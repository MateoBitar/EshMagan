import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import styles, { C } from '../../styles/screens/IncidentDetailsScreen.styles';
import {
  gqlFetch,
  GET_FIRE,
  GET_ASSIGNMENTS_BY_FIRE,
  GET_ALERTS_BY_FIRE,
  VERIFY_FIRE,
  EXTINGUISH_FIRE,
  DISPATCH_CLOSEST_RESPONDER,
  UPDATE_ASSIGNMENT_STATUS,
} from '../../services/api';

function getSeverityColor(level) {
  if (!level) return '#94a3b8';
  if (level >= 8) return '#dc2626';
  if (level >= 6) return '#ea580c';
  if (level >= 3) return '#d97706';
  return '#16a34a';
}

function getSeverityLabel(level) {
  if (!level) return 'Unknown';
  if (level >= 8) return 'Critical';
  if (level >= 6) return 'High';
  if (level >= 3) return 'Moderate';
  return 'Low';
}

function formatDateTime(value) {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return 'N/A';
  }
}

function formatTime(value) {
  if (!value) return 'N/A';
  try {
    return new Date(value).toLocaleTimeString();
  } catch {
    return 'N/A';
  }
}

function titleCase(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, m => m.toUpperCase());
}

function useIncidentData(fireId, initialFire = null) {
  const [fire, setFire] = useState(initialFire);
  const [assignments, setAssignments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!fireId) {
      setLoading(false);
      return;
    }

    try {
      const [fireData, assignData, alertData] = await Promise.all([
        gqlFetch(GET_FIRE, { fire_id: fireId }),
        gqlFetch(GET_ASSIGNMENTS_BY_FIRE, { fire_id: fireId }),
        gqlFetch(GET_ALERTS_BY_FIRE, { fire_id: fireId }),
      ]);

      setFire(fireData?.getFireById || initialFire || null);
      setAssignments(assignData?.getAssignmentsByFireId || []);
      setAlerts(alertData?.getAlertsByFireId || []);
    } catch (e) {
      console.error('Failed to fetch incident details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFire(initialFire || null);
  }, [initialFire]);

  useEffect(() => {
    refresh();
  }, [fireId]);

  return { fire, assignments, alerts, loading, refresh };
}

function parsePoint(value) {
  if (!value) return null;

  if (typeof value === 'object') {
    const lat = Number(
      value.latitude ??
      value.lat ??
      value.y ??
      value?.coordinates?.[1]
    );
    const lng = Number(
      value.longitude ??
      value.lng ??
      value.lon ??
      value.x ??
      value?.coordinates?.[0]
    );
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (parsed?.type === 'Point' && Array.isArray(parsed.coordinates) && parsed.coordinates.length === 2) {
      const lat = Number(parsed.coordinates[1]);
      const lng = Number(parsed.coordinates[0]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
  } catch {}

  const match = String(value).match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (match) {
    const lng = Number(match[1]);
    const lat = Number(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  return null;
}

function windDirectionFromDegrees(deg) {
  if (!Number.isFinite(Number(deg))) return 'NE';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round((((Number(deg) % 360) + 360) % 360) / 45) % 8;
  return dirs[index];
}

function directionToAngle(direction) {
  const map = {
    N: '-90deg',
    NE: '-45deg',
    E: '0deg',
    SE: '45deg',
    S: '90deg',
    SW: '135deg',
    W: '180deg',
    NW: '225deg',
  };
  return map[direction] || '-45deg';
}

function getIncidentPredictionBundle(fire) {
  const aiPayload =
    fire?.ai_output ||
    fire?.prediction_payload ||
    fire?.fire_ai_output ||
    fire?.fire_metadata ||
    fire?.analysis ||
    {};

  const weatherSource =
    aiPayload.weather_data ||
    fire?.weather_data ||
    fire?.weather ||
    {};

  const behaviorSource =
    aiPayload.predicted_behavior ||
    fire?.predicted_behavior ||
    fire?.behavior_data ||
    {};

  const confidence =
    aiPayload.final_probability != null
      ? Math.round(Number(aiPayload.final_probability) * 100)
      : aiPayload.prediction_confidence != null
        ? Math.round(Number(aiPayload.prediction_confidence))
        : fire?.prediction_confidence != null
          ? Math.round(Number(fire.prediction_confidence))
          : 94;

  const direction =
    behaviorSource.spread_direction ||
    fire?.spread_direction ||
    windDirectionFromDegrees(
      weatherSource.wind_dir ??
      behaviorSource.wind_direction_deg
    ) ||
    'NE';

  return {
    weather: {
      temperature: weatherSource.temperature ?? fire?.temperature ?? 34,
      windSpeed: weatherSource.wind_speed ?? fire?.wind_speed ?? 18,
      humidity: weatherSource.humidity ?? fire?.humidity ?? 23,
      windDirection: windDirectionFromDegrees(weatherSource.wind_dir ?? behaviorSource.wind_direction_deg ?? 45),
      pressure: weatherSource.pressure ?? fire?.pressure ?? 1013,
      rainfall: weatherSource.rainfall ?? fire?.rainfall ?? 0,
    },
    behavior: {
      spreadSpeed:
        behaviorSource.rate_of_spread_m_per_min != null
          ? Number((Number(behaviorSource.rate_of_spread_m_per_min) * 0.06).toFixed(1))
          : fire?.spread_speed_kmh ?? 12,
      affectedArea: fire?.affected_area_km2 ?? fire?.affected_area ?? 2.4,
      direction,
      prediction24h:
        fire?.prediction_24h_km2 ??
        fire?.predicted_area_24h ??
        8.7,
      crownRisk: behaviorSource.crown_fire_risk ?? 'Moderate',
      flameLength: behaviorSource.flame_length_m ?? '1.2–2.8',
      spottingDistance: behaviorSource.spotting_distance_km ?? 0.32,
      emberRisk: behaviorSource.ember_transport_risk ?? 'Moderate',
    },
    confidence,
    modelName: aiPayload.model_name || fire?.model_name || 'EshMagan AI',
    runtimeThreshold:
      aiPayload.runtime_threshold != null
        ? Number(aiPayload.runtime_threshold)
        : null,
    coordinates: parsePoint(fire?.fire_location),
  };
}

function buildWeatherCards(bundle) {
  return [
    { label: 'Temperature', value: `${bundle.weather.temperature}°C`, sub: 'Current ambient heat', tone: 'orange' },
    { label: 'Wind Speed', value: `${bundle.weather.windSpeed} km/h`, sub: 'Wind forcing spread', tone: 'blue' },
    { label: 'Humidity', value: `${bundle.weather.humidity}%`, sub: 'Air moisture level', tone: 'green' },
    { label: 'Wind Direction', value: bundle.weather.windDirection, sub: 'Current dominant flow', tone: 'purple' },
    { label: 'Pressure', value: `${bundle.weather.pressure} hPa`, sub: 'Atmospheric pressure', tone: 'slate' },
    { label: 'Rainfall', value: `${bundle.weather.rainfall} mm`, sub: 'Recent precipitation', tone: 'gold' },
  ];
}

function buildBehaviorCards(bundle) {
  return [
    { label: 'Spread Speed', value: `${bundle.behavior.spreadSpeed} km/h`, sub: 'Current rate of expansion', tone: 'orange' },
    { label: 'Affected Area', value: `${bundle.behavior.affectedArea} km²`, sub: 'Current fire zone size', tone: 'rose' },
    { label: 'Direction', value: bundle.behavior.direction, sub: 'Primary spread direction', tone: 'blue' },
    { label: '24h Prediction', value: `${bundle.behavior.prediction24h} km²`, sub: 'Estimated area in 24 hours', tone: 'gold' },
    { label: 'Crown Fire Risk', value: bundle.behavior.crownRisk, sub: 'Canopy ignition risk', tone: 'scarlet' },
    { label: 'Spotting Distance', value: `${bundle.behavior.spottingDistance} km`, sub: 'Potential ember travel', tone: 'purple' },
  ];
}

function toneStyles(tone) {
  const map = {
    orange: { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.22)', accent: '#ea580c' },
    rose: { bg: 'rgba(244,114,182,0.08)', border: 'rgba(244,114,182,0.20)', accent: '#e11d48' },
    blue: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.20)', accent: '#2563eb' },
    gold: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.24)', accent: '#d97706' },
    green: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.24)', accent: '#059669' },
    purple: { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.22)', accent: '#7c3aed' },
    scarlet: { bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.22)', accent: '#dc2626' },
    slate: { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.24)', accent: '#64748b' },
  };
  return map[tone] || map.orange;
}

function PredictionMap({ bundle, severityColor }) {
  const coords = bundle.coordinates;
  const direction = bundle.behavior.direction || 'NE';
  const arrowRotation = directionToAngle(direction);

  return (
    <View style={styles.predictionMapCard}>
      <View style={styles.predictionMapHeader}>
        <View>
          <Text style={styles.predictionTitle}>Fire Behavior Prediction</Text>
          <Text style={styles.predictionSub}>AI-powered projected spread visualization</Text>
        </View>

        <View style={styles.predictionChip}>
          <Text style={styles.predictionChipText}>AI Powered</Text>
        </View>
      </View>

      <View style={styles.mapViewport}>
        <View style={styles.mapCanvas}>
          <View style={styles.fireGlowOuter} />
          <View style={styles.fireGlowMiddle} />
          <View style={styles.predictionCone} />
          <View style={styles.predictionConeOutline} />

          <View style={styles.windInfoBadge}>
            <Text style={styles.windInfoBadgeValue}>{bundle.weather.windSpeed} km/h</Text>
            <Text style={styles.windInfoBadgeSub}>{direction}</Text>
          </View>

          <View style={styles.coordinatesBadge}>
            <Text style={styles.coordinatesBadgeText}>
              {coords ? `${coords.lat.toFixed(4)}°N, ${coords.lng.toFixed(4)}°E` : '32.7944°N, 35.0466°E'}
            </Text>
          </View>

          <View style={[styles.directionArrowWrap, { transform: [{ rotate: arrowRotation }] }]}>
            <View style={styles.directionArrowShaft} />
            <View style={styles.directionArrowHead} />
          </View>

          <View style={[styles.fireCore, { borderColor: severityColor }]}>
            <Text style={styles.fireCoreIcon}>🔥</Text>
          </View>
        </View>
      </View>

      <View style={styles.timelineCard}>
        <View style={styles.timelineHeader}>
          <Text style={styles.timelineTitle}>Prediction Timeline</Text>
          <Text style={styles.timelineFocus}>Next 6 hours</Text>
        </View>

        <View style={styles.timelineTrack}>
          <View style={styles.timelineFill} />
          <View style={styles.timelineThumb} />
        </View>

        <View style={styles.timelineScale}>
          <Text style={styles.timelineTick}>1h</Text>
          <Text style={styles.timelineTick}>6h</Text>
          <Text style={styles.timelineTick}>12h</Text>
          <Text style={styles.timelineTick}>24h</Text>
        </View>
      </View>
    </View>
  );
}

function DataChip({ label, value, tone }) {
  const theme = toneStyles(tone);

  return (
    <View style={[styles.infoMiniCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <Text style={styles.infoMiniCardLabel}>{label}</Text>
      <Text style={[styles.infoMiniCardValue, { color: theme.accent }]}>{value}</Text>
    </View>
  );
}

function MetricCard({ label, value, sub, tone }) {
  const theme = toneStyles(tone);

  return (
    <View style={[styles.metricCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricSub}>{sub}</Text>
    </View>
  );
}

function DataCarousel({ title, items }) {
  return (
    <View style={styles.carouselCard}>
      <Text style={styles.carouselTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselTrack}>
        {items.map(item => (
          <MetricCard
            key={`${title}-${item.label}`}
            label={item.label}
            value={item.value}
            sub={item.sub}
            tone={item.tone}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default function IncidentDetailsScreen({ navigation, route }) {
  let nav = navigation;
  let routeParams = route?.params || {};

  if (Platform.OS !== 'web') {
    try {
      const { useNavigation, useRoute } = require('@react-navigation/native');
      nav = useNavigation();
      routeParams = useRoute().params || {};
    } catch {}
  }

  const fireId =
    routeParams?.fireId ??
    routeParams?.fire_id ??
    routeParams?.alert?.fire_id ??
    routeParams?.fire?.fire_id ??
    null;

  const initialFire = routeParams?.fire || null;
  const [actionLoading, setActionLoading] = useState(false);
  const [respondersOpen, setRespondersOpen] = useState(true);

  const incidentData = useIncidentData(fireId, initialFire);
  const fire = incidentData.fire;
  const assignments = incidentData.assignments;
  const alerts = incidentData.alerts;
  const loading = incidentData.loading;
  const refresh = incidentData.refresh;

  const severityColor = getSeverityColor(fire?.fire_severitylevel);
  const severityLabel = getSeverityLabel(fire?.fire_severitylevel);

  const predictionBundle = useMemo(() => getIncidentPredictionBundle(fire), [fire]);
  const weatherCards = useMemo(() => buildWeatherCards(predictionBundle), [predictionBundle]);
  const behaviorCards = useMemo(() => buildBehaviorCards(predictionBundle), [predictionBundle]);

  const handleAction = async (action, label) => {
    if (!fireId) return;

    const confirm = Platform.OS === 'web'
      ? window.confirm(`${label} this fire?`)
      : await new Promise(resolve =>
          Alert.alert(label, `Are you sure you want to ${label.toLowerCase()} this fire?`, [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            { text: label, onPress: () => resolve(true) },
          ])
        );

    if (!confirm) return;

    setActionLoading(true);
    try {
      await gqlFetch(action, { fire_id: fireId });
      refresh();
    } catch (e) {
      const msg = e?.message || 'Action failed';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatch = async () => {
    if (!fireId) return;

    setActionLoading(true);
    try {
      await gqlFetch(DISPATCH_CLOSEST_RESPONDER, { fire_id: fireId });
      refresh();
    } catch (e) {
      const msg = e?.message || 'Dispatch failed';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateAssignment = async (assignment_id, status) => {
    try {
      await gqlFetch(UPDATE_ASSIGNMENT_STATUS, { input: { assignment_id, status } });
      refresh();
    } catch (e) {
      console.error('Assignment update failed:', e);
    }
  };

  const quickFacts = [
    { label: 'Status', value: fire?.is_extinguished ? 'Extinguished' : 'Active', tone: fire?.is_extinguished ? 'slate' : 'scarlet' },
    { label: 'Verified', value: fire?.is_verified ? 'Yes' : 'Pending', tone: fire?.is_verified ? 'green' : 'gold' },
    { label: 'Severity', value: `${severityLabel}${fire?.fire_severitylevel ? ` (${fire.fire_severitylevel}/10)` : ''}`, tone: 'orange' },
    { label: 'Prediction Confidence', value: `${predictionBundle.confidence}%`, tone: 'purple' },
  ];

  const detailRows = [
    { label: 'Spread Prediction', value: fire?.spread_prediction || predictionBundle.behavior.direction || 'N/A' },
    { label: 'Detected', value: formatDateTime(fire?.created_at) },
    { label: 'Last Updated', value: formatDateTime(fire?.updated_at) },
    { label: 'Source', value: fire?.fire_source || 'Manual Report' },
    { label: 'Model', value: predictionBundle.modelName },
    { label: 'Runtime Threshold', value: predictionBundle.runtimeThreshold != null ? predictionBundle.runtimeThreshold : 'N/A' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => nav?.goBack?.()} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹ Back to Dashboard</Text>
            </TouchableOpacity>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Incident Details</Text>
            </View>
          </View>
        </View>

        <View style={styles.loader}>
          <ActivityIndicator size="large" color={C.scarlet} />
        </View>
      </SafeAreaView>
    );
  }

  if (!fire) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => nav?.goBack?.()} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹ Back to Dashboard</Text>
            </TouchableOpacity>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Incident Details</Text>
            </View>
          </View>
        </View>

        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Fire incident not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => nav?.goBack?.()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>

          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Incident Details</Text>
            {fire ? (
              <Text style={styles.subtitle}>
                🔥{fire.fire_id || fire.fire_location || 'Live fire incident'}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView style={styles.pageScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.desktopLayout}>
          <View style={styles.leftColumn}>
            <PredictionMap bundle={predictionBundle} severityColor={severityColor} />

            <View style={styles.leftColumnStack}>
              <View style={styles.sideCard}>
                <Text style={styles.sideCardTitle}>Detection Details</Text>

                <View style={styles.detailList}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fire Detected</Text>
                    <Text style={styles.detailValue}>{formatTime(fire?.created_at)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Responders</Text>
                    <Text style={styles.detailValue}>{assignments.length} units deployed</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Alerts Triggered</Text>
                    <Text style={styles.detailValue}>{alerts.length}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Spread Heading</Text>
                    <Text style={styles.detailValue}>{predictionBundle.behavior.direction}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.rightBottomRow}>
                <DataCarousel title="Weather Conditions" items={weatherCards} />
                <DataCarousel title="Behavioral Insights" items={behaviorCards} />
              </View>

              {alerts.length > 0 ? (
                <View style={styles.sideCard}>
                  <Text style={styles.sideCardTitle}>Triggered Alerts</Text>

                  <View style={styles.alertsList}>
                    {alerts.map(alert => (
                      <View key={alert.alert_id} style={styles.alertItem}>
                        <View style={styles.alertItemTop}>
                          <Text style={styles.alertItemType}>
                            {titleCase(alert.alert_type || 'Alert')}
                          </Text>
                          <Text style={styles.alertItemPriority}>
                            {titleCase(alert.target_role || 'Target')}
                          </Text>
                        </View>
                        <Text style={styles.alertItemMsg}>{alert.alert_message}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.rightColumn}>
            <View style={styles.sideCard}>
              <Text style={styles.sideCardTitle}>AI Prediction Confidence</Text>

              <View style={styles.confidenceRingWrap}>
                <View style={styles.confidenceRingOuter}>
                  <View style={styles.confidenceRingInner}>
                    <Text style={styles.confidenceValue}>{predictionBundle.confidence}%</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.confidenceLabel}>Model Accuracy</Text>
              <Text style={styles.confidenceDesc}>
                Based on infrared detection, weather patterns, and historical data.
              </Text>
            </View>

            <View style={styles.sideCard}>
              <Text style={styles.sideCardTitle}>Live Incident Snapshot</Text>

              <View style={styles.quickFactsGrid}>
                {quickFacts.map(item => (
                  <DataChip key={item.label} label={item.label} value={item.value} tone={item.tone} />
                ))}
              </View>

              <View style={styles.detailList}>
                {detailRows.map(row => (
                  <View key={row.label} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <Text style={styles.detailValue}>{row.value}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.sideCard}>
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => setRespondersOpen(prev => !prev)}
                activeOpacity={0.85}
              >
                <View style={styles.accordionHeaderLeft}>
                  <View style={[styles.accordionDot, { backgroundColor: C.tangerine }]} />
                  <Text style={styles.accordionTitle}>Assigned Responders</Text>
                </View>

                <View style={styles.accordionMeta}>
                  <View style={styles.accordionCount}>
                    <Text style={styles.accordionCountText}>{assignments.length}</Text>
                  </View>
                  <Text style={styles.accordionChevron}>{respondersOpen ? '⌃' : '⌄'}</Text>
                </View>
              </TouchableOpacity>

              {respondersOpen ? (
                <View style={styles.accordionBodyWrapper}>
                  <ScrollView
                    nestedScrollEnabled
                    style={styles.accordionBodyScroll}
                    contentContainerStyle={styles.accordionBodyScrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {assignments.length === 0 ? (
                      <View style={styles.emptyAccordionState}>
                        <Text style={styles.emptyAccordionTitle}>No responders assigned yet</Text>
                        <Text style={styles.emptyAccordionDesc}>
                          Once units are dispatched, they will appear here with live status controls.
                        </Text>
                      </View>
                    ) : (
                      assignments.map(item => {
                        const statusColor =
                          item.assignment_status === 'Completed'
                            ? '#16a34a'
                            : item.assignment_status === 'EnRoute'
                              ? '#2563eb'
                              : item.assignment_status === 'Assigned'
                                ? '#f59e0b'
                                : '#94a3b8';

                        return (
                          <View key={item.assignment_id} style={styles.entityItem}>
                            <View style={styles.entityItemTop}>
                              <Text style={styles.entityItemTitle}>
                                {item.unit_nb
                                  ? `${item.responder_id || 'Responder'} - ${item.unit_nb}`
                                  : item.responder_id || 'Responder'}
                              </Text>

                              <View
                                style={[
                                  styles.entityItemBadge,
                                  {
                                    backgroundColor: `${statusColor}18`,
                                    borderColor: `${statusColor}55`,
                                  },
                                ]}
                              >
                                <Text style={[styles.entityItemBadgeText, { color: statusColor }]}>
                                  {item.assignment_status || 'Unknown'}
                                </Text>
                              </View>
                            </View>

                            <Text style={styles.entityItemSub}>
                              Assigned at {formatTime(item.assigned_at)}
                            </Text>

                            <View style={styles.assignmentActionsRow}>
                              {['Assigned', 'EnRoute', 'Completed'].map(status => {
                                const active = item.assignment_status === status;
                                return (
                                  <TouchableOpacity
                                    key={status}
                                    style={[
                                      styles.assignmentStatusButton,
                                      active && styles.assignmentStatusButtonActive,
                                    ]}
                                    onPress={() => handleUpdateAssignment(item.assignment_id, status)}
                                  >
                                    <Text
                                      style={[
                                        styles.assignmentStatusButtonText,
                                        active && styles.assignmentStatusButtonTextActive,
                                      ]}
                                    >
                                      {status}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}