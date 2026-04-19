// src/screens/resident/ResidentSidebar.js
import React from 'react';
import { View, Text, TouchableOpacity, Modal, Platform, StyleSheet, Image, } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { screen: 'ResidentHome', emoji: '🏠', label: 'Home', desc: 'Dashboard & fire status' },
  { screen: 'ResidentAlerts', emoji: '⚠️', label: 'Alerts', desc: 'Your fire alerts' },
  { screen: 'Evacuation', emoji: '🧭', label: 'Evacuation', desc: 'Evacuation routes' },
  { screen: 'SafetyTips', emoji: '📖', label: 'Safety Tips', desc: 'Preparedness guide' },
  { screen: 'ResidentProfile', emoji: '👤', label: 'Profile', desc: 'Your account' },
];

export default function ResidentSidebar({ visible, onClose, navigation, currentScreen }) {
  const { logout } = useAuth();

  const navigate = screen => {
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.sidebar}>
          <View style={styles.brandWrap}>
            <View style={styles.brandLogoIcon}>
              <Image
                source={Platform.OS === 'web'
                    ? { uri: '/EshMagan_Logo-Badge.png' }
                    : { uri: 'eshmagan_logo_badge' }}
                style={styles.brandLogoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTitle}>EshMagan</Text>
            <Text style={styles.brandSub}>Resident Panel</Text>
          </View>

          <View style={styles.navList}>
            {NAV_ITEMS.map(item => {
              const isActive = currentScreen === item.screen;

              return (
                <TouchableOpacity
                  key={item.screen}
                  onPress={() => navigate(item.screen)}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                >
                  <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                    <Text style={styles.iconEmoji}>{item.emoji}</Text>
                  </View>

                  <View style={styles.navTextWrap}>
                    <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.navDesc, isActive && styles.navDescActive]}>
                      {item.desc}
                    </Text>
                  </View>

                  {isActive ? <View style={styles.activeDot} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
    flexDirection: 'row',
  },

  sidebar: {
    width: 290,
    height: '100%',
    backgroundColor: '#FFF1D6',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 28,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    borderRightWidth: 1,
    borderRightColor: '#F5D7A1',
    boxShadow: '4px 0px 18px rgba(0, 0, 0, 0.08)',
  },

  brandWrap: {
    marginBottom: 22,
    paddingHorizontal: 6,
    marginRight: '10px',
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandLogoIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },

  brandLogoImage: {
    width: 50,
    height: 50
  },

  brandTitle: {
    color: '#DC2626',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },

  brandSub: {
    color: '#7C2D12',
    fontSize: 12,
    fontWeight: '600',
  },

  navList: {
    flex: 1,
  },

  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F5E7C7',
  },

  navItemActive: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F7B267',
  },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FDE7C0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconWrapActive: {
    backgroundColor: '#FCD9A5',
  },

  iconEmoji: {
    fontSize: 18,
  },

  navTextWrap: {
    flex: 1,
  },

  navLabel: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 2,
  },

  navLabelActive: {
    color: '#C2410C',
  },

  navDesc: {
    color: '#78716C',
    fontSize: 11,
  },

  navDescActive: {
    color: '#9A3412',
  },

  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#EC7742',
  },

  logoutBtn: {
    marginTop: 10,
    backgroundColor: '#DC2626',
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DC2626',
  },

  logoutText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});