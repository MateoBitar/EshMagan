// src/styles/screens/ResidentAlertsScreen.styles.js
import { StyleSheet } from 'react-native';

export const C = {
  bg: '#FFF1D6',
  card: '#ffffff',
  cardBorder: 'rgba(236,119,66,0.18)',
  scarlet: '#DC2626',
  tangerine: '#EC7742',
  gold: '#F9C04E',
  snow: '#F8FAFC',
  green: '#16a34a',
  blue: '#2563eb',
  slate: '#94a3b8',
  text: '#000000',
  textMuted: '#4b2e1a',
  textDim: 'rgba(0,0,0,0.4)',
};

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },

  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '600',
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(236,119,66,0.2)',
    backgroundColor: C.bg,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },

  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  backButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.tangerine,
  },

  headerTextWrap: {
    flex: 1,
  },

  title: {
    color: C.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  subtitle: {
    color: C.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  alertsInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },

  alertsInfoBoxLocated: {
    backgroundColor: 'rgba(238, 134, 85, 0.06)',
    borderColor: 'rgba(236,119,66,0.16)',
  },

  alertsInfoBoxLocating: {
    backgroundColor: 'rgba(238, 134, 85, 0.06)',
    borderColor: 'rgba(236,119,66,0.16)',
  },

  alertsInfoEmoji: {
    fontSize: 16,
  },

  alertsInfoText: {
    flex: 1,
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },

    contentContainer: {
    flex: 1,
    minHeight: '88.5vh',
    maxHeight: '88.5vh',
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },

  sectionHeader: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  tabFill: {
    flex: 1,
    minHeight: 0,
  },

  tabScrollContainer: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },

  tabScrollViewport: {
    flex: 1,
    minHeight: 0,
  },

  tabScrollContent: {
    gap: 2,
    paddingBottom: 20,
  },

  emptyWrap: {
    flex: 1,
    minHeight: '70vh',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },

  emptyDesc: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },

  alertCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },

  alertCardExpired: {
    opacity: 0.5,
  },

  alertCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  alertCardIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoImage: {
    width: 50,
    height: 50,
  },

  alertCardInfo: {
    flex: 1,
  },

  alertCardBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },

  alertCardTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },

  alertCardTypeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  alertCardExpiredBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: C.slate + '20',
  },

  alertCardExpiredText: {
    color: C.slate,
    fontSize: 10,
    fontWeight: '700',
  },

  alertMessage: {
    color: C.text,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },

  alertCardMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },

  alertCardMeta: {
    color: C.textDim,
    fontSize: 11,
  },
});
