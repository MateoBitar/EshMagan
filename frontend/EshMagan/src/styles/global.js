// src/styles/global.js
import { StyleSheet } from 'react-native';

export const colors = {
  firePrimary: '#dc2626',
  fireSecondary: '#ef4444',
  fireLight: '#fef2f2',
  fireBorder: '#fecaca',
  darkBg: '#020617',
  darkCard: '#0f172a',
  darkSurface: '#1e293b',
  darkBorder: '#334155',
  darkMuted: '#475569',
  darkText: '#cbd5e1',
  darkSubtext: '#64748b',
  lightBg: '#f8fafc',
  lightCard: '#ffffff',
  lightBorder: '#e2e8f0',
  lightText: '#0f172a',
  lightSubtext: '#64748b',
  lightMuted: '#94a3b8',
  safe: '#10b981',
  safeBg: '#f0fdf4',
  safeBorder: '#bbf7d0',
  warning: '#ca8a04',
  warningBg: '#fefce8',
  info: '#2563eb',
  infoBg: '#eff6ff',
  purple: '#8b5cf6',
  purpleBg: '#faf5ff',
};

export const shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
};

export const global = StyleSheet.create({
  flex1: { flex: 1 },
  row: { flexDirection: 'row' },
  center: { alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 14 },
});
