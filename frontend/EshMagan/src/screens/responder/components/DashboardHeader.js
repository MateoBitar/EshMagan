import React from 'react';
import { View, Text, TouchableOpacity, Animated, Image } from 'react-native';
import styles from '../../../styles/screens/ResponderCommandView.styles';

export default function DashboardHeader({ myLocation, alertRadiusMeters, pulseAnim, logout }) {
  return (
    <View style={styles.topBar}>
      <View style={styles.logoIcon}>
        <Image
          source={{ uri: '/EshMagan_Logo-Badge.png' }}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.topBarTextWrap}>
        <Text style={styles.appName}>EshMagan</Text>

        <View style={styles.subRow}>
          <Text style={styles.portalLabel}>
            Responder Command Dashboard
          </Text>

          <View style={styles.headerLiveRow}>
            <Animated.View style={[styles.headerLiveDot, { opacity: pulseAnim }]} />
            <Text style={styles.headerLiveText}>
              Live
              {myLocation
                ? ` ${(alertRadiusMeters / 1000).toFixed(0)} km `
                : 'Locating...'}
              radius
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutBtnText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}
