// src/screens/resident/ARModeScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Animated, Easing, StatusBar, Platform } from 'react-native';
import styles from '../../styles/screens/ARModeScreen.styles';

export default function ARModeScreen({ navigation }) {
  let nav = navigation;
  if (Platform.OS !== 'web') {
    try { const { useNavigation } = require('@react-navigation/native'); nav = useNavigation(); } catch {}
  }

  const [distance, setDistance] = useState(8.4);
  const arrowY = useRef(new Animated.Value(0)).current;
  const sideX = useRef(new Animated.Value(0)).current;
  const safePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      setDistance(prev => Math.max(0, parseFloat((prev - 0.05).toFixed(2))));
    }, 1000);

    Animated.loop(Animated.sequence([
      Animated.timing(arrowY, { toValue: -20, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      Animated.timing(arrowY, { toValue: 0, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(sideX, { toValue: 10, duration: 1500, useNativeDriver: true }),
      Animated.timing(sideX, { toValue: -10, duration: 1500, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(safePulse, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
      Animated.timing(safePulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ])).start();

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.cameraBg} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topHeader}>
          <View style={styles.topHeaderRow}>
            <TouchableOpacity style={styles.exitBtn} onPress={() => nav?.goBack()}>
              <Text style={styles.exitBtnText}>‹ Exit AR</Text>
            </TouchableOpacity>
            <View style={styles.arBadge}>
              <Text style={styles.arBadgeText}>⚡ AR Mode Active</Text>
            </View>
          </View>
          <View style={styles.cameraHint}>
            <Text style={styles.cameraHintText}>📷 Point camera at road ahead</Text>
          </View>
        </View>

        <View style={styles.dangerBanner}>
          <View style={styles.dangerDot} />
          <Text style={styles.dangerText}>Fire zone 2.1 km to the west — stay on route</Text>
        </View>

        <View style={styles.arCenter}>
          <View style={styles.distanceCard}>
            <Text style={styles.distanceLabel}>Distance to Safe Zone</Text>
            <Text style={styles.distanceValue}>{distance.toFixed(1)}</Text>
            <Text style={styles.distanceUnit}>kilometers</Text>
          </View>

          <Animated.View style={{ transform: [{ translateY: arrowY }] }}>
            <View style={styles.arrowCircle}>
              <Text style={styles.arrowText}>↑</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.sideMarkerLeft, { transform: [{ translateX: Animated.multiply(sideX, -1) }] }]}>
            <View style={styles.sideMarkerBar} />
          </Animated.View>
          <Animated.View style={[styles.sideMarkerRight, { transform: [{ translateX: sideX }] }]}>
            <View style={styles.sideMarkerBar} />
          </Animated.View>
        </View>

        <View style={styles.speedCard}>
          <Text style={styles.speedLabel}>Your Speed</Text>
          <Text style={styles.speedValue}>45 <Text style={styles.speedUnit}>km/h</Text></Text>
        </View>

        <View style={styles.compass}>
          <Text style={styles.compassN}>N</Text>
        </View>

        <View style={styles.bottomPanel}>
          <Animated.View style={[styles.safeZoneCard, { transform: [{ scale: safePulse }] }]}>
            <View style={styles.safeZoneIcon}><Text style={{ fontSize: 18 }}>📍</Text></View>
            <View>
              <Text style={styles.safeZoneTitle}>Safe Zone Ahead</Text>
              <Text style={styles.safeZoneSub}>Haifa Bay Assembly Point</Text>
            </View>
          </Animated.View>

          <View style={styles.instructionCard}>
            <View style={styles.instructionIcon}><Text style={{ fontSize: 18 }}>🧭</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.instructionTitle}>Continue Straight</Text>
              <Text style={styles.instructionBody}>Stay on Highway 75 for 5.2 km</Text>
              <Text style={styles.instructionNext}>Next: Turn right in 4.8 km</Text>
            </View>
          </View>

          <View style={styles.tipRow}>
            <Text style={styles.tipText}>ℹ️  Keep phone steady for best AR experience</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
