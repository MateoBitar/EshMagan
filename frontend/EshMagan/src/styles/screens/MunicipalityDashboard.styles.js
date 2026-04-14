import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');
const isDesktop = Platform.OS === 'web' && width >= 1100;

const C = {
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
  safeArea: { flex: 1, backgroundColor: C.bg, minHeight: '100vh' },

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
    width: 40,
    height: 40,
    backgroundColor: C.scarlet,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: C.scarlet,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },

  logoIconText: { fontSize: 20 },
  appName: { color: C.text, fontSize: 16, fontWeight: '800' },
  portalLabel: { color: C.textMuted, fontSize: 12, marginTop: 2 },

  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.scarlet,
    backgroundColor: 'transparent',
  },

  logoutBtnText: { color: C.scarlet, fontSize: 12, fontWeight: '700' },

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

  tabActive: { borderBottomColor: C.tangerine },
  tabInactive: { borderBottomColor: 'transparent' },
  tabText: { fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: C.tangerine },
  tabTextInactive: { color: C.textDim },

  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  tabBadgeActive: { backgroundColor: C.tangerine },
  tabBadgeInactive: { backgroundColor: 'rgba(236,119,66,0.15)' },
  tabBadgeText: { fontSize: 9, fontWeight: '700' },
  tabBadgeTextActive: { color: '#fff' },
  tabBadgeTextInactive: { color: C.textMuted },

  mapTabContainer: {
    flex: 1,
    backgroundColor: C.bg,
    padding: 16,
    minHeight: '87.5vh',
    maxHeight: '87.5vh',
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

  sidePanelTitle: { color: C.text, fontSize: 15, fontWeight: '800' },
  sidePanelSubtitle: { color: C.textMuted, fontSize: 12, marginTop: 4 },

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

  statCardValue: { color: C.text, fontSize: 18, fontWeight: '800' },
  statCardLabel: { color: C.textMuted, fontSize: 11, marginTop: 2 },

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

  accordionTitle: { fontSize: 14, fontWeight: '700', color: C.text },

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

  accordionCountText: { fontSize: 11, fontWeight: '800', color: C.textMuted },
  accordionChevron: { fontSize: 14, fontWeight: '800', color: C.textMuted, marginLeft: 10, bottom: 4 },

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

  emptyTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  emptyDesc: { fontSize: 12, color: C.textMuted, marginTop: 4, textAlign: 'center' },

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

  legendText: { fontSize: 11, color: C.text },
  legendNote: { fontSize: 10, color: C.textMuted, marginTop: 2 },

  tabContent: { flex: 1, backgroundColor: C.bg },

  alertScrollContent: { padding: 16 },

  alertCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    backgroundColor: C.card,
    borderColor: C.cardBorder,
  },

  alertCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  alertIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  alertTypeName: { fontSize: 13, fontWeight: '700', color: C.text },
  alertTime: { fontSize: 11, color: C.textMuted },

  alertRoleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginLeft: 10,
  },

  alertRoleBadgeText: { fontSize: 10, fontWeight: '800' },
  alertMessage: { fontSize: 13, lineHeight: 19, color: C.text },
  alertFireId: { fontSize: 11, color: C.textMuted, marginTop: 6 },
  alertExpires: { fontSize: 10, color: C.textMuted, marginTop: 3 },

  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  unreadBannerText: { fontSize: 12, fontWeight: '700', color: C.textMuted },

  markAllReadBtn: {
    backgroundColor: C.tangerine,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  markAllReadBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  notifScrollContent: { padding: 16 },

  notifCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },

  notifCardUnread: {
    borderColor: C.tangerine,
    backgroundColor: C.bg,
  },

  notifCardRead: {
    borderColor: C.cardBorder,
    backgroundColor: C.card,
  },

  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    marginRight: 10,
  },

  notifDotUnread: { backgroundColor: C.tangerine },
  notifDotRead: { backgroundColor: C.slate },

  notifMessage: { fontSize: 13, lineHeight: 18, color: C.text },

  notifFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  notifStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  notifStatusBadgeUnread: { backgroundColor: C.tangerine + '20' },
  notifStatusBadgeRead: { backgroundColor: C.cardBorder },

  notifStatusText: { fontSize: 10, fontWeight: '800' },
  notifStatusTextUnread: { color: C.tangerine },
  notifStatusTextRead: { color: C.textMuted },

  notifTimeText: { fontSize: 11, color: C.textMuted },
  notifFireId: { fontSize: 10, color: C.textMuted, marginTop: 4 },

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
});