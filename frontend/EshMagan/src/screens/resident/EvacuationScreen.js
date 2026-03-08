// src/screens/resident/EvacuationScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import styles from '../../styles/screens/EvacuationScreen.styles';

const ROUTES = [
  { id: 'primary', name: 'Primary Route', distance: '8.4 km', time: '12 min', status: 'clear', description: 'Via Highway 75 to Haifa Bay Safe Zone' },
  { id: 'alternative', name: 'Alternative Route', distance: '11.2 km', time: '18 min', status: 'caution', description: 'Via coastal road - potential traffic delays' },
  { id: 'emergency', name: 'Emergency Route', distance: '6.1 km', time: '15 min', status: 'clear', description: 'Mountain pass - steep terrain but fastest' },
];

const STEPS = [
  { instruction: 'Head north on Herzl Street', distance: '0.5 km', time: '2 min' },
  { instruction: 'Turn right onto Highway 75', distance: '5.2 km', time: '6 min' },
  { instruction: 'Take exit 3 toward Haifa Bay', distance: '1.8 km', time: '2 min' },
  { instruction: 'Arrive at Safe Zone Assembly Point', distance: '0.9 km', time: '2 min' },
];

export default function EvacuationScreen() {
  const navigation = useNavigation();
  const [selectedRoute, setSelectedRoute] = useState('primary');
  const [voiceOn, setVoiceOn] = useState(false);
  const dot = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(dot, { toValue: 1.3, duration: 800, useNativeDriver: true }),
      Animated.timing(dot, { toValue: 1, duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);

  const current = ROUTES.find(r => r.id === selectedRoute);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>🧭 Live Navigation</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>Evacuation Route</Text>
        <Text style={styles.headerSub}>To nearest safe zone</Text>
      </View>

      {/* Mock Map */}
      <View style={styles.mapArea}>
        <View style={styles.mapOverlay}>
          <Text style={{ color: '#60a5fa', fontSize: 14 }}>🧭</Text>
          <Text style={styles.mapOverlayText}>{current?.distance} • {current?.time}</Text>
        </View>
        <Animated.View style={{ position: 'absolute', bottom: 48, left: 32, transform: [{ scale: dot }] }}>
          <View style={styles.locationDot} />
        </Animated.View>
        <View style={styles.destinationDot}>
          <Text style={{ fontSize: 14 }}>📍</Text>
        </View>
        <Text style={styles.mapLabel}>Map View (react-native-maps)</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Route Options */}
        <View style={styles.routesSection}>
          <View style={styles.routesHeaderRow}>
            <Text style={styles.routesTitle}>Available Routes</Text>
            <TouchableOpacity style={styles.arModeBtn} onPress={() => navigation.navigate('ARMode')}>
              <Text style={styles.arModeBtnText}>⚡ AR Mode</Text>
            </TouchableOpacity>
          </View>
          {ROUTES.map(route => (
            <TouchableOpacity
              key={route.id}
              onPress={() => setSelectedRoute(route.id)}
              style={[styles.routeCard, selectedRoute === route.id ? styles.routeCardActive : styles.routeCardInactive]}
            >
              <View style={styles.routeCardTop}>
                <Text style={styles.routeName}>🛣️ {route.name}</Text>
                <View style={route.status === 'clear' ? styles.routeStatusClear : styles.routeStatusCaution}>
                  <Text style={route.status === 'clear' ? styles.routeStatusClearText : styles.routeStatusCautionText}>
                    {route.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.routeMeta}>{route.distance} • {route.time}</Text>
              <Text style={styles.routeDesc}>{route.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Directions */}
        <View style={styles.directionsSection}>
          <View style={styles.directionsHeaderRow}>
            <Text style={styles.directionsTitle}>Turn-by-Turn Directions</Text>
            <TouchableOpacity
              onPress={() => setVoiceOn(!voiceOn)}
              style={[styles.voiceBtn, voiceOn ? styles.voiceBtnOn : styles.voiceBtnOff]}
            >
              <Text style={voiceOn ? styles.voiceBtnTextOn : styles.voiceBtnTextOff}>
                🔊 {voiceOn ? 'Voice On' : 'Voice Off'}
              </Text>
            </TouchableOpacity>
          </View>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepCol}>
                <View style={[styles.stepNum, i === 0 ? styles.stepNumActive : styles.stepNumInactive]}>
                  <Text style={i === 0 ? styles.stepNumTextActive : styles.stepNumTextInactive}>{i + 1}</Text>
                </View>
                {i < STEPS.length - 1 && <View style={styles.stepLine} />}
              </View>
              <View style={styles.stepCard}>
                <Text style={styles.stepInstruction}>{step.instruction}</Text>
                <Text style={styles.stepMeta}>{step.distance} • {step.time}</Text>
              </View>
            </View>
          ))}
          <View style={styles.safeZoneBox}>
            <View style={styles.safeZoneRow}>
              <Text style={{ fontSize: 20 }}>📍</Text>
              <View>
                <Text style={styles.safeZoneTitle}>Safe Zone</Text>
                <Text style={styles.safeZoneName}>Haifa Bay Assembly Point</Text>
                <Text style={styles.safeZoneSub}>Emergency services and shelter available</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startBtn}>
          <Text style={{ fontSize: 18 }}>🧭</Text>
          <Text style={styles.startBtnText}>Start Navigation</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
