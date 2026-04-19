import React from 'react';
import { View, Text, TouchableOpacity, Animated, Image, Platform } from 'react-native';
import styles from '../../../styles/screens/ResponderCommandView.styles';

export default function DashboardHeader({ myLocation, alertRadiusMeters, pulseAnim, logout }) {
  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.topBar}>
      <View style={styles.logoIcon}>
        <Image
          source={
            Platform.OS === 'web'
              ? { uri: '/EshMagan_Logo-Badge.png' }
              : { uri: 'eshmagan_logo_badge' }
          }
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.topBarTextWrap}>
        <Text style={styles.appName}>EshMagan</Text>

        <View style={[styles.subRow, !isWeb && styles.subRowMobile]}>
          <Text style={styles.portalLabel}>Responder Command Dashboard</Text>

          <View style={[styles.headerLiveRow, !isWeb && styles.headerLiveRowMobile]}>
            <Animated.View style={[styles.headerLiveDot, { opacity: pulseAnim }]} />
            <Text style={styles.headerLiveText}>
              Live
              {myLocation
                ? ` ${(alertRadiusMeters / 1000).toFixed(0)} km `
                : ' Locating... '}
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