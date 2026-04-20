import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');
const isDesktop = Platform.OS === 'web' && width >= 1100;

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

const accordionOpenMaxHeight = isDesktop
  ? Math.max(220, height - 450)
  : 220;

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },

  container: {
    flex: 1,
    backgroundColor: C.bg,
    flexDirection: 'column',
  },

  topBar: {
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(236,119,66,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  logoImage: {
    width: 50,
    height: 50,
  },

  appName: {
    color: C.text,
    fontSize: 20,
    fontWeight: '800',
  },

  portalLabel: {
    color: C.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.scarlet,
    backgroundColor: 'transparent',
  },

  logoutBtnText: {
    color: C.scarlet,
    fontSize: 12,
    fontWeight: '700',
  },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(236,119,66,0.2)',
  },

  tab: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    flexDirection: 'row',
  },

  tabActive: {
    borderBottomColor: C.tangerine,
  },

  tabInactive: {
    borderBottomColor: 'transparent',
  },

  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },

  tabTextActive: {
    color: C.tangerine,
  },

  tabTextInactive: {
    color: C.textDim,
  },

  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  tabBadgeActive: {
    backgroundColor: C.tangerine,
  },

  tabBadgeInactive: {
    backgroundColor: 'rgba(236,119,66,0.15)',
  },

  tabBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },

  tabBadgeTextActive: {
    color: '#fff',
  },

  tabBadgeTextInactive: {
    color: C.textMuted,
  },

  contentContainer: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },

  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
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
    gap: 10,
    paddingBottom: 10,
  },

  mapTabContainer: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: '86.5vh',
    maxHeight: '86.5vh',
  },

  mapLayout: {
    flex: 1,
    flexDirection: isDesktop ? 'row' : 'column',
    gap: 12,
    minHeight: 0,
  },

  mapPane: {
    flex: isDesktop ? 7 : 0,
    width: '100%',
    height: isDesktop ? undefined : 300,
    minHeight: isDesktop ? 680 : 300,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: 'hidden',
    position: 'relative',
  },

  sidePanel: {
    flex: isDesktop ? 3 : 1,
    width: '100%',
    minWidth: 0,
    minHeight: 0,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },

  sidePanelHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },

  sidePanelTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
  },

  sidePanelSubtitle: {
    color: C.textMuted,
    fontSize: 12,
    marginTop: 4,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  statCard: {
    flex: 1,
    backgroundColor: C.snow,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 14,
    padding: 12,
  },

  statCardValue: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
  },

  statCardLabel: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 2,
  },

  accordionScroll: {
    flex: 1,
    minHeight: 0,
  },

  accordionScrollContent: {
    padding: 12,
    paddingBottom: 20,
  },

  accordionSection: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: C.snow,
    flexShrink: 0,
  },

  accordionHeader: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bg,
    flexShrink: 0,
  },

  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  accordionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },

  accordionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },

  accordionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  accordionCount: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(236,119,66,0.12)',
    borderWidth: 1,
    borderColor: C.cardBorder,
  },

  accordionCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textMuted,
  },

  accordionChevron: {
    fontSize: 14,
    fontWeight: '800',
    color: C.textMuted,
    marginLeft: 10,
    bottom: 4,
  },

  accordionBodyWrapper: {
    maxHeight: accordionOpenMaxHeight,
    overflow: 'hidden',
  },

  accordionBodyScroll: {
    flexGrow: 0,
  },

  accordionBodyScrollContent: {
    padding: 10,
    gap: 8,
  },

  entityItem: {
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 12,
    padding: 12,
    backgroundColor: C.card,
  },

  entityItemActive: {
    borderColor: C.tangerine,
    backgroundColor: C.bg,
  },

  entityItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  entityItemTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    marginRight: 10,
  },

  entityItemSub: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 4,
  },

  entityItemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },

  entityItemBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  emptyWrap: {
    flex: 1,
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

  mapLoadingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
  },

  mapLoadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
    marginLeft: 8,
  },

  mapLegend: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 14,
    padding: 10,
    zIndex: 20,
  },

  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },

  legendText: {
    fontSize: 11,
    color: C.text,
  },

  legendNote: {
    fontSize: 10,
    color: C.textMuted,
    marginTop: 2,
  },

  tabContent: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },

  alertScrollContent: {
    padding: 16,
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

  notificationTapHint: {
    color: C.tangerine,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 'auto',
  },

  mapPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ddd',
    position: 'relative',
  },

  recenterButton: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  recenterButtonText: {
    fontWeight: '700',
    color: '#0f172a',
  },

  mapLoadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ddd',
  },

  mapFallbackContainer: {
    flex: 1,
    backgroundColor: '#e8e0d8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapFallbackText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 8,
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
});