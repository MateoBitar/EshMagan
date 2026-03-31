// src/styles/screens/ResponderCommandView.styles.js
import { StyleSheet } from 'react-native';

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
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(236,119,66,0.2)',
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.scarlet,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.scarlet,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },

  headerIconEmoji: {
    fontSize: 22,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  headerLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },

  headerLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.green,
  },

  headerLiveText: {
    color: C.textMuted,
    fontSize: 11,
  },

  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.scarlet,
  },

  logoutButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.scarlet,
  },

  // ─── RESPONDER STATUS BAR ───────────────────────────────────────────────────
  statusBar: {
    backgroundColor: 'rgba(236,119,66,0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(236,119,66,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  statusUnitText: {
    color: C.textMuted,
    fontSize: 12,
  },

  statusSpacer: {
    flex: 1,
  },

  statusButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },

  statusButtonActive: {
    // backgroundColor will be dynamic: RESPONDER_STATUS_COLORS[status] + '30'
    // borderColor will be dynamic: RESPONDER_STATUS_COLORS[status]
  },

  statusButtonInactive: {
    backgroundColor: 'transparent',
    borderColor: C.cardBorder,
  },

  statusButtonText: {
    fontSize: 10,
  },

  statusButtonTextActive: {
    fontWeight: '700',
    // color will be dynamic: RESPONDER_STATUS_COLORS[status]
  },

  statusButtonTextInactive: {
    fontWeight: '400',
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
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
  },

  tabActive: {
    borderBottomColor: C.tangerine,
  },

  tabInactive: {
    borderBottomColor: 'transparent',
  },

  tabEmoji: {
    fontSize: 18,
  },

  tabTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },

  tabText: {
    fontSize: 10,
  },

  tabTextActive: {
    fontWeight: '700',
    color: C.tangerine,
  },

  tabTextInactive: {
    fontWeight: '400',
    color: C.textDim,
  },

  tabBadge: {
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },

  tabBadgeAlerts: {
    backgroundColor: C.scarlet,
  },

  tabBadgeOther: {
    backgroundColor: C.tangerine,
  },

  tabBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
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

  // ─── UNITS TAB: WEB LAYOUT ──────────────────────────────────────────────────
  unitsTabContainer: {
    gap: 10,
    flex: 1,
    minHeight: 0,
    maxHeight: '78.9vh'
  },

  unitsWebRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
    flex: 1,
    minHeight: 0,
  },

  unitsMapContainer: {
    flex: 7,
    minHeight: 0,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 0.4,
    borderColor: 'rgba(236,119,66,0.12)',
    padding: 2,
  },

  unitsMapInner: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
  },

  unitsListContainer: {
    flex: 3,
    gap: 10,
    minHeight: 0,
    overflow: 'hidden',
  },

  unitsListScrollContainer: {
    flex: 1,
    minHeight: 0,
  },

  unitsListScrollContent: {
    gap: 10,
    paddingBottom: 10,
  },

  // ─── UNITS TAB: MOBILE LAYOUT ───────────────────────────────────────────────
  unitsMobileContainer: {
    flex: 1,
    minHeight: 0,
  },

  unitsMobileMapContainer: {
    height: 300,
    marginHorizontal: -25,
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  unitsMobileMapInner: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
  },

  unitsMobileListScroll: {
    flex: 1,
    minHeight: 0,
  },

  unitsMobileListContent: {
    gap: 10,
    paddingBottom: 20,
  },

  // ─── UNIT CARDS ─────────────────────────────────────────────────────────────
  unitCardMe: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.2,
    borderColor: C.tangerine,
    shadowColor: C.tangerine,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  unitCardOther: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(236,119,66,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  unitCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },

  unitCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  unitCardIconMe: {
    backgroundColor: C.tangerine + '20',
  },

  unitCardIconOther: {
    // backgroundColor will be dynamic: statusColor + '15'
  },

  unitCardEmoji: {
    fontSize: 18,
  },

  unitCardTextContainer: {
    flex: 1,
  },

  unitCardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  unitCardName: {
    color: C.text,
    fontWeight: '800',
    fontSize: 14,
  },

  unitCardYouBadge: {
    backgroundColor: C.tangerine + '20',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  unitCardYouBadgeText: {
    color: C.tangerine,
    fontSize: 10,
    fontWeight: '700',
  },

  unitCardStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    // backgroundColor will be dynamic: statusColor + '20'
  },

  unitCardStatusText: {
    fontSize: 11,
    fontWeight: '700',
    // color will be dynamic: statusColor
  },

  unitCardDivider: {
    height: 1,
    backgroundColor: C.cardBorder,
    marginVertical: 8,
  },

  unitCardLocation: {
    color: C.textDim,
    fontSize: 11,
  },

  // ─── EMPTY STATES ───────────────────────────────────────────────────────────
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
    color: C.textDim,
    fontSize: 13,
  },

  emptyStateSubtext: {
    color: C.textDim,
    fontSize: 11,
    marginTop: 4,
  },

  // ─── ASSIGNMENT CARDS (MY JOBS) ─────────────────────────────────────────────
  assignmentCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },

  assignmentCardActive: {
    opacity: 1,
    // borderColor will be dynamic: statusColor + '40'
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
    // backgroundColor will be dynamic: statusColor + '20'
    // borderColor will be dynamic: statusColor + '40'
  },

  assignmentStatusText: {
    fontSize: 11,
    fontWeight: '800',
    // color will be dynamic: statusColor
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

  assignmentActionButtonActive: {
    // backgroundColor will be dynamic: btnColor (solid)
    // borderColor will be dynamic: btnColor
  },

  assignmentActionButtonInactive: {
    // backgroundColor will be dynamic: btnColor + '15'
    // borderColor will be dynamic: btnColor + '40'
  },

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

  assignmentActionButtonTextInactive: {
    // color will be dynamic: btnColor
  },

  // ─── ALERTS TAB ─────────────────────────────────────────────────────────────
  alertsInfoBox: {
    backgroundColor: C.card,
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },

  alertsInfoBoxLocating: {
    borderLeftColor: C.gold,
  },

  alertsInfoBoxLocated: {
    borderLeftColor: C.green,
  },

  alertsInfoEmoji: {
    fontSize: 14,
  },

  alertsInfoText: {
    color: C.textMuted,
    fontSize: 11,
    flex: 1,
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
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor will be dynamic: accentColor + '20'
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
    // backgroundColor will be dynamic: accentColor + '20'
  },

  alertCardTypeText: {
    fontSize: 10,
    fontWeight: '700',
    // color will be dynamic: accentColor
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

  alertCardMessage: {
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

  // ─── NOTIFICATIONS TAB ──────────────────────────────────────────────────────
  notificationCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },

  notificationCardUnread: {
    borderColor: C.tangerine + '50',
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
    color: C.textDim,
    fontSize: 10,
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

  // ─── LOADING STATE ──────────────────────────────────────────────────────────
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

  unitsMobileColumn: {
    flex: 1,
    minHeight: 0,
    gap: 10,
  },

  unitsMapContainerMobile: {
    height: 260,
    minHeight: 260,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 0.4,
    borderColor: 'rgba(236,119,66,0.12)',
    padding: 2,
    overflow: 'hidden',
  },

  unitsListContainerMobile: {
    flex: 1,
    minHeight: 0,
  },
});

// Export color constants for use in component
export { C, ASSIGNMENT_COLORS, RESPONDER_STATUS_COLORS };