// src/screens/resident/ResidentMapScreen.js
import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff1d6', minHeight: '100vh' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
});

export default function ResidentMapScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🗺️</Text>
          <Text style={styles.title}>Interactive Map</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
