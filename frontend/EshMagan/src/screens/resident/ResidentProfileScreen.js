// src/screens/resident/ResidentProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { gqlFetch, GET_RESIDENT_BY_EMAIL, GET_NOTIFICATIONS_BY_USER, UPDATE_NOTIFICATION_STATUS } from '../../services/api';
import styles from '../../styles/screens/ResidentProfileScreen.styles';

const SETTINGS = [
  { label: 'Location Tracking', status: 'Active', emoji: '📍', statusColor: '#16a34a', statusBg: '#dcfce7' },
  { label: 'Push Notifications', status: 'Enabled', emoji: '🔔', statusColor: '#16a34a', statusBg: '#dcfce7' },
  { label: 'Data Encryption', status: 'Active', emoji: '🔒', statusColor: '#2563eb', statusBg: '#dbeafe' },
  { label: 'Emergency Alerts', status: 'On', emoji: '🚨', statusColor: '#dc2626', statusBg: '#fef2f2' },
];

function useProfileData(user) {
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) { setLoading(false); return; }
    const fetch = async () => {
      try {
        const [profileData, notifData] = await Promise.all([
          gqlFetch(GET_RESIDENT_BY_EMAIL, { user_email: user.email }).catch(() => null),
          user.id ? gqlFetch(GET_NOTIFICATIONS_BY_USER, { user_id: user.id }).catch(() => null) : null,
        ]);
        setProfile(profileData?.getResidentByEmail || null);
        setNotifications(notifData?.getNotificationsByUserId || []);
      } catch (e) { console.error('Profile fetch error:', e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [user]);

  return { profile, notifications, loading };
}

export default function ResidentProfileScreen() {
  const { user, logout } = useAuth();
  const { profile, notifications, loading } = useProfileData(user);

  const unreadCount = notifications.filter(n => n.notification_status === 'Sent').length;

  const markAllRead = async () => {
    const unread = notifications.filter(n => n.notification_status === 'Sent');
    for (const n of unread) {
      await gqlFetch(UPDATE_NOTIFICATION_STATUS, {
        notification_id: n.notification_id,
        notification_status: 'Delivered',
      }).catch(() => {});
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) logout();
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]);
    }
  };

  const displayName = profile
    ? `${profile.resident_fname} ${profile.resident_lname}`
    : user?.email?.split('@')[0] || 'Resident User';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          {loading ? (
            <ActivityIndicator color="#3b82f6" style={{ marginVertical: 8 }} />
          ) : (
            <>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              {profile?.home_location && (
                <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>📍 {profile.home_location}</Text>
              )}
            </>
          )}
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role || 'Resident'}</Text>
          </View>
        </View>

        {/* Notifications summary */}
        {notifications.length > 0 && (
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>🔔 Notifications</Text>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllRead}>
                  <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: '600' }}>Mark all read</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={{ color: '#64748b', fontSize: 13 }}>
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up ✅'}
            </Text>
          </View>
        )}

        <View style={styles.settingsCard}>
          {SETTINGS.map((s, i) => (
            <View key={s.label} style={[styles.settingRow, i < SETTINGS.length - 1 && styles.settingRowBorder]}>
              <View style={styles.settingLeft}>
                <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
                <Text style={styles.settingLabel}>{s.label}</Text>
              </View>
              <View style={[styles.settingBadge, { backgroundColor: s.statusBg }]}>
                <Text style={[styles.settingBadgeText, { color: s.statusColor }]}>{s.status}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={{ fontSize: 16 }}>🚪</Text>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
