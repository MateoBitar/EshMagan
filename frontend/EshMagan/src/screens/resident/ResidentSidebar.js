// src/screens/resident/ResidentSidebar.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { screen: 'ResidentHome', emoji: '🏠', label: 'Home', desc: 'Dashboard & fire status' },
  { screen: 'ResidentAlerts', emoji: '🔔', label: 'Alerts', desc: 'Your fire alerts' },
  { screen: 'Evacuation', emoji: '🧭', label: 'Evacuation', desc: 'Evacuation routes' },
  { screen: 'SafetyTips', emoji: '📖', label: 'Safety Tips', desc: 'Preparedness guide' },
  { screen: 'ResidentMap', emoji: '🗺️', label: 'Map', desc: 'Live fire map' },
  { screen: 'ResidentProfile', emoji: '👤', label: 'Profile', desc: 'Your account' },
];

export default function ResidentSidebar({ visible, onClose, navigation, currentScreen }) {
  const { user, logout } = useAuth();

  const navigate = (screen) => {
    navigation?.navigate(screen);
    onClose();
  };

  const handleLogout = () => {
    onClose();
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) logout();
    } else {
      const { Alert } = require('react-native');
      Alert.alert('Log Out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout },
      ]);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row' }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{ width: 280, backgroundColor: '#0f172a', height: '100%', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 32 }}
        >
          {/* User info */}
          <View style={{ marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <Text style={{ fontSize: 24 }}>👤</Text>
            </View>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{user?.email?.split('@')[0] || 'Resident'}</Text>
            <Text style={{ color: '#64748b', fontSize: 12 }}>{user?.email}</Text>
            <View style={{ marginTop: 6, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: '#1e293b', borderRadius: 6, alignSelf: 'flex-start' }}>
              <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '600' }}>{user?.role}</Text>
            </View>
          </View>

          {/* Nav items */}
          <View style={{ flex: 1 }}>
            {NAV_ITEMS.map(item => {
              const isActive = currentScreen === item.screen;
              return (
                <TouchableOpacity
                  key={item.screen}
                  onPress={() => navigate(item.screen)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    padding: 12, borderRadius: 12, marginBottom: 4,
                    backgroundColor: isActive ? 'rgba(239,68,68,0.15)' : 'transparent',
                  }}
                >
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isActive ? 'rgba(239,68,68,0.2)' : '#1e293b', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isActive ? '#ef4444' : '#fff', fontWeight: '600', fontSize: 14 }}>{item.label}</Text>
                    <Text style={{ color: '#475569', fontSize: 11 }}>{item.desc}</Text>
                  </View>
                  {isActive && <Text style={{ color: '#ef4444', fontSize: 8 }}>●</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' }}
          >
            <Text style={{ fontSize: 18 }}>🚪</Text>
            <Text style={{ color: '#ef4444', fontWeight: '600', fontSize: 14 }}>Log Out</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}