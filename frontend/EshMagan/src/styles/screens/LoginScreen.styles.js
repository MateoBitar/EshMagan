// src/styles/screens/LoginScreen.styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF1D6', minHeight: '100vh' },
  keyboardView: { flex: 1, backgroundColor: '#FFF1D6', minHeight: '100vh' },
  scrollContent: { flexGrow: 1, minHeight: '100vh', padding: 20, paddingBottom: 40, backgroundColor: '#FFF1D6' },

  header: { alignItems: 'center', marginTop: 20, marginBottom: 32 },
  logoContainer: { width: 68, height: 68, alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: 68, height: 68 },
  appName: { fontSize: 34, fontWeight: '800', color: '#DC2626', letterSpacing: -1 },
  tagline: { fontSize: 13, color: '#000000', marginTop: 6, fontWeight: '500', opacity: 0.6 },
  subtitle: { fontSize: 12, color: '#000000', marginTop: 4, opacity: 0.5 },

  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 28, borderWidth: 1, borderColor: 'rgba(236,119,66,0.18)', boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.06)' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#000000', marginBottom: 16 },

  rolesContainer: { gap: 12, marginBottom: 24 },
  roleCard: { padding: 16, borderRadius: 16, borderWidth: 2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  roleCardDefault: { borderColor: '#EC7742', backgroundColor: '#FFF1D6' },
  roleIconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  roleIconBgDefault: { backgroundColor: '#FFF1D6' },
  roleEmoji: { fontSize: 22 },
  roleName: { fontSize: 15, fontWeight: '700', color: '#000000' },
  roleDesc: { fontSize: 12, color: '#000000', opacity: 0.6, marginTop: 2 },
  checkmark: { fontSize: 18, color: '#EC7742' },

  inputLabel: { fontSize: 12, fontWeight: '700', color: '#000000', marginBottom: 6, letterSpacing: 0.3 },
  input: { height: 46, borderWidth: 1.5, borderColor: '#EC7742', borderRadius: 10, paddingHorizontal: 14, fontSize: 15, color: '#000000', backgroundColor: '#ffffff', marginBottom: 16 },

  privacyBox: { backgroundColor: '#EC7742', borderRadius: 12, padding: 14, marginBottom: 20 },
  privacyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  privacyTitle: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  privacyItem: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  privacyCheck: { color: '#ffffff', marginTop: 1, fontWeight: '700' },
  privacyItemText: { fontSize: 11, color: 'rgba(255,255,255,0.8)', flex: 1, lineHeight: 18 },
  consentRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 10, marginTop: 10 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { borderColor: '#ffffff', backgroundColor: '#ffffff' },
  checkboxUnchecked: { borderColor: '#ffffff', backgroundColor: 'transparent' },
  checkboxTick: { color: '#EC7742', fontSize: 11, fontWeight: '800' },
  consentText: { fontSize: 11, color: 'rgba(255,255,255,0.8)', flex: 1, lineHeight: 17 },

  trustBadges: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginBottom: 20 },
  trustBadge: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  trustIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#FFF1D6', borderWidth: 1.5, borderColor: '#EC7742', alignItems: 'center', justifyContent: 'center' },
  trustLabel: { fontSize: 11, fontWeight: '700', color: '#000000' },
  trustSub: { fontSize: 10, color: '#EC7742' },

  loginBtn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  loginBtnActive: { backgroundColor: '#DC2626', boxShadow: '0px 4px 12px rgba(220, 38, 38, 0.35)' },
  loginBtnDisabled: { backgroundColor: '#F9C04E' },
  loginBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },

  footer: { fontSize: 11, color: '#EC7742', textAlign: 'center', marginTop: 16, fontWeight: '500', opacity: 0.8 },
});