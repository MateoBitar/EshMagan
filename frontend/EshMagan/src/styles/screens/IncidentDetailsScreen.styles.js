// src/styles/screens/IncidentDetailsScreen.styles.js
import { StyleSheet } from 'react-native';
import { shadows } from '../global';

export default StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc', minHeight: '100vh' },
  topBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', padding: 16 },
  backText: { color: '#64748b', fontSize: 14, marginBottom: 10 },
  topBarTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  topBarId: { fontSize: 12, color: '#94a3b8' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 32, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#64748b', textAlign: 'center' },
  scrollContent: { padding: 16 },
  mainCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 2, borderColor: '#fecaca',
  },
  mainCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  mainCardIcon: { width: 48, height: 48, backgroundColor: '#fef2f2', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mainCardTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  mainCardSub: { fontSize: 12, color: '#94a3b8' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLabel: { fontSize: 13, color: '#64748b' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', ...shadows.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  responderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  responderName: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  responderMeta: { fontSize: 11, color: '#64748b' },
  alertItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  alertItemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  alertItemType: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  alertItemPriority: { fontSize: 11, color: '#ea580c', fontWeight: '600' },
  alertItemMsg: { fontSize: 12, color: '#64748b' },
});
