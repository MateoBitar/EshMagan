// src/styles/screens/ResidentProfileScreen.styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc', minHeight: '100vh' },
  scrollContent: { padding: 20, paddingBottom: 40, minHeight: '100vh' },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 20 },
  avatarCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 16, boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)' },
  avatarCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarEmoji: { fontSize: 40 },
  userName: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  userEmail: { fontSize: 13, color: '#64748b', marginTop: 2 },
  roleBadge: { marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#fef2f2', borderRadius: 8 },
  roleText: { fontSize: 12, fontWeight: '600', color: '#dc2626', textTransform: 'capitalize' },
  settingsCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 16, boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingLabel: { fontSize: 14, fontWeight: '500', color: '#0f172a' },
  settingBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  settingBadgeText: { fontSize: 12, fontWeight: '600' },
  logoutBtn: { height: 50, borderRadius: 14, borderWidth: 2, borderColor: '#fecaca', backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  logoutText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
});