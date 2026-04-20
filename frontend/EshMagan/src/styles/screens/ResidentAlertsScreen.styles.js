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
    backgroundColor: 'rgba(22,163,74,0.08)',
    borderColor: 'rgba(22,163,74,0.18)',
  },

  alertsInfoBoxLocating: {
    backgroundColor: 'rgba(236,119,66,0.08)',
    borderColor: 'rgba(236,119,66,0.18)',
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
    minHeight: 0,
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

  listWrap: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },

  listScroll: {
    flex: 1,
  },

  listContent: {
    gap: 2,
    paddingBottom: 20,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(236,119,66,0.15)',
  },

  emptyStateEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },

  emptyStateText: {
    color: C.green,
    fontSize: 13,
    fontWeight: '600',
  },

  emptyStateSubtext: {
    color: C.textDim,
    fontSize: 11,
    marginTop: 4,
  },

  alertCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },

  alertCardExpired: {
    opacity: 0.7,
  },

  alertCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },

  alertCardIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
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
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },

  alertCardTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  alertCardTypeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  alertCardExpiredBadge: {
    backgroundColor: 'rgba(148,163,184,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  alertCardExpiredText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.slate,
    letterSpacing: 0.4,
  },

  alertCardMessage: {
    color: C.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    marginBottom: 10,
  },

  alertCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },

  alertCardMeta: {
    color: C.textDim,
    fontSize: 11,
    fontWeight: '500',
  },
});
