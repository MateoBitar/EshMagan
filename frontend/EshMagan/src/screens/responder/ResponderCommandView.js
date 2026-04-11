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
            notifyAlert(
              'New Assignment',
              `You were assigned to fire ${assignment.fire_id || 'incident'}.`
            );
          }
        }

        for (const alert of nextAlerts) {
          if (!seenAlertIdsRef.current.has(alert.alert_id)) {
            notifyAlert(
              alert.alert_type || 'New Alert',
              alert.alert_message || 'A new alert was received.'
            );
          }
        }

        for (const notification of nextNotifications) {
          if (!seenNotificationIdsRef.current.has(notification.notification_id)) {
            notifyInfo(
              'New Notification',
              notification.notification_message || 'You received a new notification.'
            );
          }
        }

        seenAssignmentIdsRef.current = nextAssignmentIds;
        seenAlertIdsRef.current = nextAlertIds;
        seenNotificationIdsRef.current = nextNotificationIds;
      }
    } catch (e) {
      console.error('ResponderDashboard fetch error:', e);
    } finally {
      hasCompletedInitialFetchRef.current = true;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => fetchAll(), 10000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateAssignment = async (assignment_id, fire_id, status) => {
    setActionLoading(assignment_id + status);
    try {
      if ((status === 'Completed' || status === 'Cancelled') && fire_id) {
        await gqlFetch(EXTINGUISH_FIRE, { fire_id });
        await gqlFetch(UPDATE_ASSIGNMENT_STATUS, { input: { assignment_id, status } });
      } else {
        await gqlFetch(UPDATE_ASSIGNMENT_STATUS, { input: { assignment_id, status } });
      }

      fetchAll();
    } catch (e) {
      const msg = e.message || 'Update failed';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateMyStatus = async status => {
    const activeAssignmentsNow = myAssignments.filter(
      a => !['Completed', 'Cancelled'].includes(a.assignment_status)
    );

    if (status === 'Unavailable' && activeAssignmentsNow.length > 0) {
      const msg = 'You have active assignments. Complete or cancel them before going Unavailable.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Cannot Go Unavailable', msg);
      return;
    }

    if (!responderId) return;

    setActionLoading('status');
    try {
      await gqlFetch(UPDATE_RESPONDER_STATUS, {
        responder_id: responderId,
        responder_status: status,
      });
      setMyStatus(status);
      fetchAll();
    } catch (e) {
      const msg = e.message || 'Status update failed';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkNotifRead = async notification_id => {
    try {
      await gqlFetch(UPDATE_NOTIFICATION_STATUS, {
        notification_id,
        notification_status: 'Delivered',
      });

      setNotifications(prev =>
        prev.map(n =>
          n.notification_id === notification_id
            ? { ...n, notification_status: 'Delivered' }
            : n
        )
      );
    } catch {
      console.warn('Failed to mark notification read');
    }
  };

  const activeAssignments = myAssignments.filter(
    a => !['Completed', 'Cancelled'].includes(a.assignment_status)
  );
  const unreadNotifs = notifications.filter(n => n.notification_status !== 'Delivered');
  const activeAlerts = alerts.filter(alert => {
    if (new Date(alert.expires_at) <= new Date()) return false;
    if (!alert.fire_id) return false;
    if (!myLocation) return false;

    const fire = allFires.find(f => f.fire_id === alert.fire_id);
    if (!fire) return false;

    const fireCoords = getFireCoords(fire);
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

  const unitsForMap = allResponders.map(r => {
    const coords = getResponderCoords(r);

    let unitCoords = null;
    if (r.unit_location?.latitude && r.unit_location?.longitude) {
      unitCoords = {
        lat: r.unit_location.latitude,
        lng: r.unit_location.longitude,
      };
    }

    return {
      responder_id: r.responder_id,
      unit_nb: r.unit_nb,
      status: r.responder_status,
      coords,
      unitCoords,
      isMe: r.responder_id === myResponder?.responder_id,
    };
  });

  const firesForMap = allFires
    .map(fire => ({
      fire_id: fire.fire_id,
      severity: fire.fire_severitylevel,
      coords: getFireCoords(fire),
    }))
    .filter(fire => fire.coords);

  const tabs = [
    { id: 'units', emoji: '🚒', title: 'Units', count: null },
    { id: 'assignments', emoji: '📋', title: 'My Jobs', count: activeAssignments.length || null },
    { id: 'alerts', emoji: '🔥', title: 'Alerts', count: activeAlerts.length || null },
    { id: 'notifications', emoji: '🔔', title: 'Inbox', count: unreadNotifs.length || null },
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

  const isUnitsTab = activeTab === 'units';

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator color={C.tangerine} size="large" />
        <Text style={styles.loadingText}>Loading responder dashboard...</Text>
      </SafeAreaView>
    );
  }

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
        />

        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />

        <View style={styles.contentContainer}>
          {renderMainContent()}
        </View>
      </View>
    </SafeAreaView>
  );
}
