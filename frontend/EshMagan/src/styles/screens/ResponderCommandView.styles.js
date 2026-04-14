import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');
const isDesktop = Platform.OS === 'web' && width >= 1100;
const accordionOpenMaxHeight = isDesktop
  ? Math.max(220, height - 545)
  : 220;

// ─── COLOR PALETTE ────────────────────────────────────────────────────────────
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

const ASSIGNMENT_COLORS = {
  Assigned: '#2563eb',
  EnRoute: '#EC7742',
  OnScene: '#DC2626',
  Completed: '#16a34a',
  Cancelled: '#94a3b8',
};

const RESPONDER_STATUS_COLORS = {
  Active: '#16a34a',
  Standby: '#F9C04E',
  Unavailable: '#94a3b8',
};

export default StyleSheet.create({
  // ─── LAYOUT ─────────────────────────────────────────────────────────────────
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
  },

  container: {
    flex: 1,
    backgroundColor: C.bg,
    flexDirection: 'column',
  },

  // ─── HEADER ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(236,119,66,0.2)',
  },

  headerIcon: {
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

  headerIconInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    opacity: 0.95,
  },

  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: '800',
  },

  headerLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },

  headerLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.green,
    marginRight: 6,
  },

  headerLiveText: {
    color: C.textMuted,
    fontSize: 12,
  },

  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.scarlet,
    backgroundColor: 'transparent',
  },

  logoutButtonText: {
    color: C.scarlet,
    fontSize: 12,
    fontWeight: '700',
  },

  // ─── RESPONDER STATUS BAR ───────────────────────────────────────────────────
  statusBar: {
    backgroundColor: 'rgba(238, 134, 85, 0.06)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(236,119,66,0.16)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },

  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 0,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },

  statusTextWrap: {
    minWidth: 0,
  },

  statusLabel: {
    color: C.textDim,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },

  statusUnitText: {
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
  },

  statusSpacer: {
    flex: 1,
  },

  statusActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },

  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 11,
    borderWidth: 1,
    backgroundColor: C.card,
  },

  statusButtonActive: {},

  statusButtonInactive: {
    backgroundColor: 'rgba(238, 134, 85, 0.00)',
    borderColor: C.cardBorder,
  },

  statusButtonText: {
    fontSize: 12,
  },

  statusButtonTextActive: {
    fontWeight: '700',
  },

  statusButtonTextInactive: {
    fontWeight: '600',
    color: C.textMuted,
  },

  statusButtonLocked: {
    opacity: 0.45,
  },

  statusButtonTextLocked: {
    color: C.textDim,
  },

  // ─── TAB BAR ────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(236,119,66,0.2)',
    backgroundColor: C.bg,
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

  // ─── CONTENT CONTAINERS ─────────────────────────────────────────────────────
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

  // ─── UNITS TAB: MUNICIPALITY-LIKE MAP LAYOUT ───────────────────────────────
  unitsMapTabContainer: {
    flex: 1,
    backgroundColor: C.bg,
    minHeight: 0,
  },

  unitsMapLayout: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 12,
    minHeight: '78.9vh',
    maxHeight: '78.9vh',
  },

  unitsMapPane: {
    flex: Platform.OS === 'web' ? 7 : 0,
    width: '100%',
    height: Platform.OS === 'web' ? undefined : 300,
    minHeight: Platform.OS === 'web' ? 680 : 300,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: 'hidden',
    position: 'relative',
  },

  unitsSidePanel: {
    flex: Platform.OS === 'web' ? 3 : 1,
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

  unitsSidePanelHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },

  unitsSidePanelTitle: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
  },

  unitsSidePanelSubtitle: {
    color: C.textMuted,
    fontSize: 12,
    marginTop: 4,
  },

  unitsStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  unitsStatCard: {
    flex: 1,
    backgroundColor: C.snow,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 14,
    padding: 12,
  },

  unitsStatCardValue: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
  },

  unitsStatCardLabel: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 2,
  },

  unitsAccordionScroll: {
    flex: 1,
    minHeight: 0,
  },

  unitsAccordionScrollContent: {
    padding: 12,
    paddingBottom: 20,
  },

  unitsAccordionSection: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: C.snow,
    flexShrink: 0,
  },

  unitsAccordionHeader: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bg,
    flexShrink: 0,
  },

  unitsAccordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  unitsAccordionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },

  unitsAccordionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },

  unitsAccordionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  unitsAccordionCount: {
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

  unitsAccordionCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textMuted,
  },

  unitsAccordionChevron: {
    fontSize: 14,
    fontWeight: '800',
    color: C.textMuted,
    marginLeft: 10,
    bottom: 4,
  },

  unitsAccordionBodyWrapper: {
    maxHeight: accordionOpenMaxHeight,
    overflow: 'hidden',
  },

  unitsAccordionBodyScroll: {
    flexGrow: 0,
  },

  unitsAccordionBodyScrollContent: {
    padding: 10,
    gap: 8,
  },

  unitsAccordionBodyContent: {
    padding: 10,
  },

  unitsEntityItem: {
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 12,
    padding: 12,
    backgroundColor: C.card,
    marginBottom: 8,
  },

  unitsEntityItemActive: {
    borderColor: C.tangerine,
    backgroundColor: C.bg,
  },

  unitsEntityItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  unitsEntityItemTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    marginRight: 10,
  },

  unitsEntityItemSub: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 4,
  },

  unitsEntityItemMeta: {
    fontSize: 11,
    color: C.textDim,
    marginTop: 6,
  },

  unitsEntityItemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },

  unitsEntityItemBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  unitsEmptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  unitsEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },

  unitsEmptyDesc: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },

  // ─── GENERAL EMPTY STATES ───────────────────────────────────────────────────
  emptyWrap: {
    flex: 1,
    minHeight: '60vh',
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

  // ─── ASSIGNMENT CARDS ───────────────────────────────────────────────────────
  assignmentCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },

  assignmentCardActive: {
    opacity: 1,
  },

  assignmentCardDone: {
    opacity: 0.6,
    borderColor: C.cardBorder,
  },

  assignmentCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  assignmentCardInfo: {
    flex: 1,
  },

  assignmentFireRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },

  assignmentFireEmoji: {
    fontSize: 20,
  },

  assignmentFireSource: {
    color: C.text,
    fontWeight: '800',
    fontSize: 14,
  },

  assignmentFireId: {
    color: C.textDim,
    fontSize: 11,
    marginBottom: 2,
  },

  assignmentFireLocation: {
    color: C.textDim,
    fontSize: 11,
    marginBottom: 2,
  },

  assignmentDispatchedTime: {
    color: C.textDim,
    fontSize: 11,
  },

  assignmentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },

  assignmentStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },

  assignmentActionsDivider: {
    height: 1,
    backgroundColor: C.cardBorder,
    marginBottom: 10,
  },

  assignmentActionsLabel: {
    color: C.textDim,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
  },

  assignmentUnavailableWarning: {
    backgroundColor: 'rgba(148,163,184,0.12)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  assignmentUnavailableEmoji: {
    fontSize: 12,
  },

  assignmentUnavailableText: {
    color: C.slate,
    fontSize: 11,
    fontWeight: '600',
  },

  assignmentActionsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },

  assignmentActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },

  assignmentActionButtonActive: {},

  assignmentActionButtonInactive: {},

  assignmentActionButtonDisabled: {
    opacity: 0.4,
  },

  assignmentActionButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },

  assignmentActionButtonTextActive: {
    color: '#fff',
  },

  assignmentActionButtonTextInactive: {},

  // ─── ALERTS TAB: MUNICIPALITY-LIKE ──────────────────────────────────────────
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

  alertMessage: {
    color: C.text,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },

  alertFireId: {
    color: C.textDim,
    fontSize: 11,
    marginTop: 2,
  },

  alertExpires: {
    color: C.textDim,
    fontSize: 11,
    marginTop: 4,
  },

  alertCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  alertCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  alertCardEmoji: {
    fontSize: 18,
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

  alertCardMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },

  alertCardMeta: {
    color: C.textDim,
    fontSize: 11,
  },

  // ─── NOTIFICATIONS TAB: MUNICIPALITY-LIKE ──────────────────────────────────
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

  // ─── MAP UTILITIES ──────────────────────────────────────────────────────────
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

  mapLoadingText: {
    color: C.textMuted,
    fontSize: 12,
    marginTop: 8,
  },

  mapFallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8e0d8',
    borderRadius: 16,
  },

  mapFallbackText: {
    color: '#64748b',
    fontSize: 13,
  },

  // ─── LOADING ────────────────────────────────────────────────────────────────
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

// Export color constants for use in component
export { C, ASSIGNMENT_COLORS, RESPONDER_STATUS_COLORS };