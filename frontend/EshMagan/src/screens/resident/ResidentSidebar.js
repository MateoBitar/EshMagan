// src/screens/resident/ResidentSidebar.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { screen: 'ResidentHome', emoji: '🏠', label: 'Home', desc: 'Dashboard & fire status' },
  { screen: 'ResidentAlerts', emoji: '⚠️', label: 'Alerts', desc: 'Your fire alerts' },
  { screen: 'Evacuation', emoji: '🧭', label: 'Evacuation', desc: 'Evacuation routes' },
  { screen: 'SafetyTips', emoji: '📖', label: 'Safety Tips', desc: 'Preparedness guide' },
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
    <Modal visible={visible} transparent animationIn="slideInLeft" animationOut="slideOutLeft" animationInTiming={10000} animationOutTiming={10000}
      backdropTrasnitionInTiming={10000} backdropTrasnitionOutTiming={10000} easing="linear" useNativeDriver={true} hideModalContentWhileAnimating={true}
      onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0)', flexDirection: 'row' }}
        activeOpacity={1}
        onPress={onClose}
      >

        <TouchableOpacity
          activeOpacity={1}
          style={{ width: 280, backgroundColor: '#0f172a', height: '100%', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 32 }}
        >
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 20, top: -20, left: 10 }}>EshMagan</Text>
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