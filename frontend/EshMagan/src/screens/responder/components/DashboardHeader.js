import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import styles from '../../../styles/screens/ResponderCommandView.styles';

export default function DashboardHeader({ myLocation, alertRadiusMeters, pulseAnim, logout }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerIcon}>
        <Text style={styles.headerIconEmoji}>🔥</Text>
      </View>

      <View style={styles.headerTextContainer}>
        <Text style={styles.headerTitle}>Responder Dashboard</Text>
        <View style={styles.headerLiveRow}>
          <Animated.View style={[styles.headerLiveDot, { opacity: pulseAnim }]} />
          <Text style={styles.headerLiveText}>
            Live • {myLocation ? `${(alertRadiusMeters / 1000).toFixed(0)}km radius` : 'Locating...'}
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={logout} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}
