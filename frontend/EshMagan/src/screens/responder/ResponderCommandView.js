import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  gqlFetch,
  GET_RESPONDER_BY_ID,
  GET_ALL_RESPONDERS,
  GET_ALL_FIRES,
  GET_ALL_ASSIGNMENTS,
  GET_ASSIGNMENTS_BY_RESPONDER,
  GET_ALERTS_BY_ROLE,
  GET_NOTIFICATIONS_BY_USER,
  UPDATE_ASSIGNMENT_STATUS,
  UPDATE_RESPONDER_STATUS,
  UPDATE_NOTIFICATION_STATUS,
  EXTINGUISH_FIRE,
} from '../../services/api';
import { getCurrentLocation } from '../../services/location.service';
import { notifyAlert, notifyInfo } from '../../services/notifications';
import styles, { C } from '../../styles/screens/ResponderCommandView.styles';

import DashboardHeader from './components/DashboardHeader';
import StatusBar from './components/StatusBar';
import TabBar from './components/TabBar';

import AlertsTab from './tabs/AlertsTab';
import AssignmentsTab from './tabs/AssignmentsTab';
import NotificationsTab from './tabs/NotificationsTab';
import UnitsTab from './tabs/UnitsTab';

import { fmtDate, getResponderCoords, getFireCoords, getDistanceMeters } from './utils/helpers';

export default function ResponderCommandView({ navigation }) {
  const { user, logout } = useAuth();

  const responderId = user?.id;
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState('units');
  const [myAssignments, setMyAssignments] = useState([]);
  const [allResponders, setAllResponders] = useState([]);
  const [allFires, setAllFires] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [myResponder, setMyResponder] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [myStatus, setMyStatus] = useState('Active');
  const [fireLocations, setFireLocations] = useState({});
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const seenAlertIdsRef = useRef(new Set());
  const seenNotificationIdsRef = useRef(new Set());
  const seenAssignmentIdsRef = useRef(new Set());
  const hasInitializedNotificationRefs = useRef(false);
  const hasCompletedInitialFetchRef = useRef(false);

  const ALERT_RADIUS_METERS = 25000;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    if (!document.getElementById('responder-scrollbar-style')) {
      const styleTag = document.createElement('style');
      styleTag.id = 'responder-scrollbar-style';
      styleTag.innerHTML = `
      .responder-scroll-area::-webkit-scrollbar {
        width: 10px;
      }

      .responder-scroll-area::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 999px;
      }

      .responder-scroll-area::-webkit-scrollbar-thumb {
        background: #EC7742;
        border-radius: 999px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }

      .responder-scroll-area::-webkit-scrollbar-thumb:hover {
        background: #d96532;
        border-radius: 999px;
        border: 2px solid transparent;
        background-clip: padding-box;
      }
    `;
      document.head.appendChild(styleTag);
    }
  }, []);

  useEffect(() => {
    if (!responderId) return;

    let mounted = true;

    const initResponderLocation = async () => {
      try {
        const loc = await getCurrentLocation();
        if (mounted && loc) {
          setMyLocation({ lat: loc.latitude, lng: loc.longitude });
        }
      } catch (e) {
        console.warn('[Responder initial location]', e.message);
      }
    };

    initResponderLocation();

    return () => {
      mounted = false;
    };
  }, [responderId]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
      ])
    ).start();
  }, [pulseAnim]);

  const fetchAll = async () => {
    try {
      let loc = myLocation;

      if (responderId) {
        const respData = await gqlFetch(GET_RESPONDER_BY_ID, { responder_id: responderId });
        const me = respData?.getResponderById;

        if (me) {
          setMyResponder(me);
          setMyStatus(me.responder_status || 'Active');

          const locObj = me.last_known_location;
          if (locObj?.latitude && locObj?.longitude) {
            loc = { lat: locObj.latitude, lng: locObj.longitude };
            setMyLocation(loc);
          }
        }
      }

      const [assignData, allAssignData, respListData, fireData, alertData, notifData] = await Promise.all([
        responderId ? gqlFetch(GET_ASSIGNMENTS_BY_RESPONDER, { responder_id: responderId }) : Promise.resolve(null),
        gqlFetch(GET_ALL_ASSIGNMENTS),
        gqlFetch(GET_ALL_RESPONDERS),
        gqlFetch(GET_ALL_FIRES),
        gqlFetch(GET_ALERTS_BY_ROLE, { target_role: 'Responder' }),
        userId ? gqlFetch(GET_NOTIFICATIONS_BY_USER, { user_id: userId }) : Promise.resolve(null),
      ]);

      const assignments = assignData?.getAssignmentsByResponderId || [];
      setMyAssignments(assignments);

      const allAssignmentsList = allAssignData?.getAllAssignments || [];
      setAllAssignments(allAssignmentsList);

      const responders = respListData?.getAllResponders || [];
      setAllResponders(responders);

      const fires = (fireData?.getAllFires || []).filter(f => !f.is_extinguished);
      setAllFires(fires);

      const fireMap = {};
      fires.forEach(fire => {
        fireMap[fire.fire_id] = {
          source: fire.fire_source || 'Active Fire',
          raw: fire.fire_location,
          coords: getFireCoords(fire),
          severity: fire.fire_severitylevel,
        };
      });
      setFireLocations(fireMap);

      const nextAlerts = alertData?.getAlertsByTargetRole || [];
      const nextNotifications = notifData?.getNotificationsByUserId || [];
      const nextAssignmentIds = new Set(assignments.map(a => a.assignment_id));
      const nextAlertIds = new Set(nextAlerts.map(a => a.alert_id));
      const nextNotificationIds = new Set(nextNotifications.map(n => n.notification_id));

      setAlerts(nextAlerts);
      setNotifications(nextNotifications);

      if (!hasInitializedNotificationRefs.current) {
        if (hasCompletedInitialFetchRef.current) {
          seenAssignmentIdsRef.current = nextAssignmentIds;
          seenAlertIdsRef.current = nextAlertIds;
          seenNotificationIdsRef.current = nextNotificationIds;
          hasInitializedNotificationRefs.current = true;
        }
      } else {
        for (const assignment of assignments) {
          if (!seenAssignmentIdsRef.current.has(assignment.assignment_id)) {
            notifyAlert('New Assignment', `You were assigned to fire ${assignment.fire_id || 'incident'}.`);
          }
        }

        for (const notif of nextNotifications) {
          if (!seenNotificationIdsRef.current.has(notif.notification_id)) {
            notifyInfo('New Notification', notif.notification_message || 'You received a new notification.');
          }
        }

        seenAssignmentIdsRef.current = nextAssignmentIds;
        seenAlertIdsRef.current = nextAlertIds;
        seenNotificationIdsRef.current = nextNotificationIds;
      }

      hasCompletedInitialFetchRef.current = true;
    } catch (e) {
      console.error('Responder fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [responderId, userId]);

  const handleUpdateMyStatus = async nextStatus => {
    try {
      const hasActiveAssignments = activeAssignments.length > 0;

      if (hasActiveAssignments && nextStatus === 'Unavailable') {
        return;
      }

      setActionLoading('status');
      await gqlFetch(UPDATE_RESPONDER_STATUS, {
        responder_id: responderId,
        responder_status: nextStatus,
      });
      setMyStatus(nextStatus);
      setMyResponder(prev => (prev ? { ...prev, responder_status: nextStatus } : prev));
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.message || 'Failed to update status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateAssignment = async (assignmentId, nextStatus, fireId = null) => {
    try {
      setActionLoading(assignmentId);

      await gqlFetch(UPDATE_ASSIGNMENT_STATUS, {
        input: {
          assignment_id: assignmentId,
          status: nextStatus,
        },
      });

      if (nextStatus === 'Completed' && fireId) {
        await gqlFetch(EXTINGUISH_FIRE, { fire_id: fireId });
      }

      fetchAll();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.message || 'Failed to update assignment.');
    } finally {
      setActionLoading(null);
    }
  };

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
      console.error(e);
    }
  };

  const activeAssignments = myAssignments.filter(
    a => a.assignment_status !== 'Completed' && a.assignment_status !== 'Cancelled'
  );

  const unreadNotifs = notifications.filter(n => n.notification_status !== 'Delivered');

  const activeAlerts = alerts.filter(alert => {
    if (!myLocation || !alert.fire_id) return false;
    if (alert.expires_at && new Date(alert.expires_at) <= new Date()) return false;

    const fireCoords = fireLocations[alert.fire_id]?.coords;
    if (!fireCoords) return false;

    const distance = getDistanceMeters(
      myLocation.lat,
      myLocation.lng,
      fireCoords.lat,
      fireCoords.lng
    );

    return distance <= ALERT_RADIUS_METERS;
  });

  const selfResponderId = myResponder?.responder_id;
  const otherResponders = allResponders.filter(r => r.responder_id !== selfResponderId);

  const unitsForMap = allResponders
    .map(r => {
      const coords = getResponderCoords(r);

      let unitCoords = null;
      if (r.unit_location?.latitude != null && r.unit_location?.longitude != null) {
        unitCoords = {
          lat: Number(r.unit_location.latitude),
          lng: Number(r.unit_location.longitude),
        };
      }

      return {
        responder_id: r.responder_id,
        unit_nb: r.unit_nb,
        status: r.responder_status,
        coords,
        unitCoords,
        isMe: r.responder_id === myResponder?.responder_id,
        unitId: r.unit_nb || r.responder_id,
        displayName: r.unit_nb ? `${r.responder_id} - ${r.unit_nb}` : r.responder_id,
      };
    })
    .filter(u => u.coords || u.unitCoords);

  const firesForMap = allFires
    .map(fire => ({
      fire_id: fire.fire_id,
      fire_severitylevel: fire.fire_severitylevel,
      severity: fire.fire_severitylevel,
      coords: getFireCoords(fire),
      displayName: fire.fire_id ? `Fire ${String(fire.fire_id).slice(0, 8)}` : 'Fire',
    }))
    .filter(fire => fire.coords);

  const tabs = [
    { id: 'units', title: 'Units', count: null },
    { id: 'assignments', title: 'My Jobs', count: activeAssignments.length || null },
    { id: 'alerts', title: 'Alerts', count: activeAlerts.length || null },
    { id: 'notifications', title: 'Inbox', count: unreadNotifs.length || null },
  ];

  const renderMainContent = () => (
    <>
      {activeTab === 'units' && (
        <UnitsTab
          myResponder={myResponder}
          myStatus={myStatus}
          otherResponders={otherResponders}
          unitsForMap={unitsForMap}
          firesForMap={firesForMap}
        />
      )}

      {activeTab === 'assignments' && (
        <AssignmentsTab
          myAssignments={myAssignments}
          activeAssignments={activeAssignments}
          fireLocations={fireLocations}
          myStatus={myStatus}
          actionLoading={actionLoading}
          fmtDate={fmtDate}
          handleUpdateAssignment={handleUpdateAssignment}
        />
      )}

      {activeTab === 'alerts' && (
        <AlertsTab
          alerts={alerts}
          activeAlerts={activeAlerts}
          myLocation={myLocation}
          alertRadiusMeters={ALERT_RADIUS_METERS}
          fmtDate={fmtDate}
        />
      )}

      {activeTab === 'notifications' && (
        <NotificationsTab
          notifications={notifications}
          unreadNotifs={unreadNotifs}
          handleMarkNotifRead={handleMarkNotifRead}
        />
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <DashboardHeader
          myLocation={myLocation}
          alertRadiusMeters={ALERT_RADIUS_METERS}
          pulseAnim={pulseAnim}
          logout={logout}
        />

        <StatusBar
          myResponder={myResponder}
          myStatus={myStatus}
          actionLoading={actionLoading}
          handleUpdateMyStatus={handleUpdateMyStatus}
          hasActiveAssignments={activeAssignments.length > 0}
        />

        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />

        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={C.tangerine} />
              <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
          ) : (
            renderMainContent()
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
