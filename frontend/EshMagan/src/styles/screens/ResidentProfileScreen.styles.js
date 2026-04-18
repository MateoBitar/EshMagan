// src/styles/screens/ResidentProfileScreen.styles.js
import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF1D6',
    minHeight: '100vh',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    minHeight: '100vh',
  },

  header: {
    width: '50%',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: 24,
  },

  headerRow: {
    position: 'relative',
    height: 42,
    justifyContent: 'center',
  },

  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 3,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingRight: 12,
  },

  backHitSlop: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  },

  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EC7742',
  },

  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 42,
  },

  navSpacer: {
    width: 60,
    height: 42,
    alignSelf: 'flex-end',
  },

  avatarCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    width: '50%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },

  logoIcon: { 
    width: 60, 
    height: 60, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 5
  },

  logoImage: { 
    width: 60,
    height: 60 
  },

  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },

  userEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },

  roleBadge: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  },

  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
    textTransform: 'capitalize',
  },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '50%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },

  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },

  infoHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },

  editBtn: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fdba74',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },

  editBtnText: {
    color: '#ea580c',
    fontWeight: '700',
    fontSize: 12,
  },

  infoRow: {
    marginBottom: 14,
  },

  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 14,
    color: '#0f172a',
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    color: '#0f172a',
  },

  lastInput: {
    marginBottom: 16,
  },

  formActions: {
    flexDirection: 'row',
    gap: 10,
  },

  primaryBtn: {
    flex: 1,
    backgroundColor: '#EC7742',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },

  primaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  secondaryBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },

  secondaryBtnText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },

  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    width: '50%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },

  settingRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  settingRowLast: {
    borderBottomWidth: 0,
  },

  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  settingEmoji: {
    fontSize: 18,
  },

  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },

  settingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },

  settingBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },

  badgeSuccess: {
    backgroundColor: '#dcfce7',
  },

  badgeSuccessText: {
    color: '#16a34a',
  },

  badgeInfo: {
    backgroundColor: '#dbeafe',
  },

  badgeInfoText: {
    color: '#2563eb',
  },

  badgeDanger: {
    backgroundColor: '#fef2f2',
  },

  badgeDangerText: {
    color: '#dc2626',
  },

  bottomActionsWrap: {
    width: '50%',
    marginLeft: 'auto',
    marginRight: 'auto',
  },

  bottomActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },

  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  signOutBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc2626',
  },

  logoutBtn: {
    backgroundColor: '#dc2626',
    borderWidth: 1,
    borderColor: '#dc2626',
  },

  signOutText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 14,
  },

  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff1d6',
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },

  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});