// src/screens/resident/ResidentMapScreen.js
import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1e293b' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  desc: { color: '#64748b', textAlign: 'center', fontSize: 14 },
  codeBox: { marginTop: 16, backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12 },
  code: { fontSize: 12, color: '#475569', fontFamily: 'monospace' },
});

export default function ResidentMapScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🗺️</Text>
          <Text style={styles.title}>Interactive Map</Text>
          <Text style={styles.desc}>Install react-native-maps to see live fire zones, evacuation routes, and responder locations.</Text>
          <View style={styles.codeBox}>
            <Text style={styles.code}>npm install react-native-maps</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
