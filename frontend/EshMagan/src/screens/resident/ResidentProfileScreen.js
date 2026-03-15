// src/screens/resident/ResidentProfileScreen.js
import React from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/screens/ResidentProfileScreen.styles';

const SETTINGS = [
  { label: 'Location Tracking', status: 'Active', emoji: '📍', statusColor: '#16a34a', statusBg: '#dcfce7' },
  { label: 'Push Notifications', status: 'Enabled', emoji: '🔔', statusColor: '#16a34a', statusBg: '#dcfce7' },
  { label: 'Data Encryption', status: 'Active', emoji: '🔒', statusColor: '#2563eb', statusBg: '#dbeafe' },
  { label: 'Emergency Alerts', status: 'On', emoji: '🚨', statusColor: '#dc2626', statusBg: '#fef2f2' },
];

export default function ResidentProfileScreen() {
  const { user, logout } = useAuth();

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={styles.userName}>{user?.email?.split('@')[0] || 'Resident User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role || 'Resident'}</Text>
          </View>
        </View>

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
