// src/styles/screens/ResidentAlertsScreen.styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc', minHeight: '100vh' },
  topBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', padding: 16, paddingTop: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  emptyDesc: { color: '#64748b', textAlign: 'center', fontSize: 14 },
  scrollContent: { padding: 16 },
  alertCard: { borderWidth: 2, borderRadius: 16, padding: 16, marginBottom: 12 },
  alertRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  alertIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  alertHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  alertType: { fontSize: 14, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 },
  alertPriorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  alertPriorityText: { fontSize: 10, fontWeight: '700' },
  alertMsg: { fontSize: 13, color: '#334155', marginBottom: 6 },
  alertFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  alertLocation: { fontSize: 11, color: '#94a3b8' },
  alertTime: { fontSize: 11, color: '#94a3b8' },
});
