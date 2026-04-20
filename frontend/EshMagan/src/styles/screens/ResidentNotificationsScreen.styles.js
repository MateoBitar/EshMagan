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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(236,119,66,0.2)',
    backgroundColor: '#FFF1D6',
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },

  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },

  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EC7742',
  },

  headerTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  contentContainer: {
    flex: 1,
    minHeight: '93.5vh',
    maxHeight: '93.5vh',
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: C.bg,
  },

  sectionHeader: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
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

  loadingContainer: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: C.textMuted,
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

  notificationCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },

  notificationCardUnread: {
    borderColor: C.tangerine + '50',
    backgroundColor: C.bg,
  },

  notificationCardRead: {
    borderColor: C.cardBorder,
    backgroundColor: C.card,
  },

  notificationCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  notificationUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.tangerine,
    marginTop: 4,
  },

  notificationInfo: {
    flex: 1,
  },

  notificationMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },

  notificationMessageUnread: {
    color: C.text,
    fontWeight: '600',
  },

  notificationMessageRead: {
    color: C.textMuted,
    fontWeight: '400',
  },

  notificationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  notificationStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },

  notificationStatusBadgeUnread: {
    backgroundColor: C.tangerine + '20',
  },

  notificationStatusBadgeRead: {
    backgroundColor: C.cardBorder,
  },

  notificationStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },

  notificationStatusTextUnread: {
    color: C.tangerine,
  },

  notificationStatusTextRead: {
    color: C.textDim,
  },

  notificationFireId: {
    color: C.textDim,
    fontSize: 11,
  },

  notificationDateText: {
    color: C.textDim,
    fontSize: 11,
    marginTop: 8,
  },
});

export default styles;