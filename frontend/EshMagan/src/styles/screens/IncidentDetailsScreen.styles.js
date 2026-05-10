import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');
const isDesktop = Platform.OS === 'web' && width >= 900;

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
  purple: '#7c3aed',
  rose: '#e11d48',
  slate: '#94a3b8',
  text: '#000000',
  textMuted: '#4b2e1a',
  textDim: 'rgba(0,0,0,0.45)',
  line: 'rgba(236,119,66,0.12)',
};

export default StyleSheet.create({
  // ── Layout ─────────────────────────────────────────────────────────────────

  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
    ...(Platform.OS === 'web'
      ? {
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
      }
      : {}),
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(236,119,66,0.2)',
    backgroundColor: C.bg,
    zIndex: 10,
    ...(Platform.OS === 'web'
      ? {
        flexShrink: 0,
      }
      : {}),
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },

  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  backButtonText: {
    fontSize: 14,
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

  pageScroll: {
    flex: 1,
    minHeight: 0,
    backgroundColor: C.bg,
    ...(Platform.OS === 'web'
      ? {
        maxHeight: 'calc(100vh - 67px)',
        overflow: 'hidden',
      }
      : {}),
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },

  desktopLayout: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 14,
    alignItems: 'flex-start',
    flexWrap: Platform.OS === 'web' ? 'nowrap' : 'wrap',
  },

  leftColumn: {
    width: Platform.OS === 'web' ? '62%' : '100%',
    minWidth: Platform.OS === 'web' ? 0 : '100%',
    gap: 14,
  },

  rightColumn: {
    width: Platform.OS === 'web' ? '38%' : '100%',
    minWidth: Platform.OS === 'web' ? 0 : '100%',
    gap: 7,
    paddingRight: Platform.OS === 'web' ? 10 : 0,
  },

  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },

  emptyText: {
    fontSize: 15,
    color: C.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },

  // ── Map card ───────────────────────────────────────────────────────────────

  mapCard: {
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 18,
    overflow: 'hidden',
  },

  mapCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  mapCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },

  mapCardSub: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 3,
  },

  severityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  severityChipText: {
    fontSize: 11,
    fontWeight: '800',
  },

  mapViewport: {
    width: '100%',
    height: isDesktop ? 515 : 340,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.10)',
  },

  mapPlaceholder: {
    width: '100%',
    height: isDesktop ? 480 : 340,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.cardBorder,
  },

  mapPlaceholderText: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: '600',
  },

  mapLegendRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    flexWrap: 'wrap',
  },

  mapLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  mapLegendSwatch: {
    width: 16,
    height: 10,
    borderRadius: 4,
    borderWidth: 1.5,
  },

  mapLegendLabel: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '600',
  },

  // ── Side card (generic) ────────────────────────────────────────────────────

  sideCard: {
    backgroundColor: C.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 16,
  },

  sideCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
    marginBottom: 14,
  },

  // ── Detail rows ────────────────────────────────────────────────────────────

  detailList: {
    gap: 2,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },

  detailLabel: {
    fontSize: 13,
    color: C.textMuted,
  },

  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    flexShrink: 1,
    textAlign: 'right',
  },

  // ── Quick facts chips ──────────────────────────────────────────────────────

  quickFactsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },

  infoMiniCard: {
    minWidth: isDesktop ? '48%' : '47%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  infoMiniCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
    marginBottom: 6,
  },

  infoMiniCardValue: {
    fontSize: 14,
    fontWeight: '800',
  },

  // ── Carousel ───────────────────────────────────────────────────────────────

  carouselCard: {
    width: '100%',
    height: isDesktop ? 160 : undefined,
    backgroundColor: C.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 16,
    overflow: 'hidden',
  },

  carouselHeader: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 10,
  },

  carouselTitle: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
  },

  carouselBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexShrink: 0,
  },

  carouselBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  carouselTrack: {
    gap: 10,
    paddingRight: 4,
    minHeight: 90,
    alignItems: 'center',
  },

  carouselState: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  carouselStateText: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '700',
  },

  metricCard: {
    width: 160,
    height: 90,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    justifyContent: 'space-between',
  },

  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
  },

  metricValue: {
    fontSize: 16,
    fontWeight: '900',
  },

  metricSub: {
    fontSize: 10,
    lineHeight: 14,
    color: C.textMuted,
  },

  // ── Actions ────────────────────────────────────────────────────────────────

  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 2,
  },

  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },

  actionButtonVerify: {
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderColor: 'rgba(16,185,129,0.40)',
  },

  actionButtonDispatch: {
    backgroundColor: 'rgba(37,99,235,0.10)',
    borderColor: 'rgba(37,99,235,0.40)',
  },

  actionButtonExtinguish: {
    backgroundColor: 'rgba(220,38,38,0.10)',
    borderColor: 'rgba(220,38,38,0.40)',
  },

  actionButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: C.text,
  },

  // ── Accordion ─────────────────────────────────────────────────────────────

  accordionHeader: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
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
    fontSize: 13,
    fontWeight: '800',
    color: C.textMuted,
    marginLeft: 10,
  },

  accordionBodyWrapper: {
    maxHeight: 320,
    overflow: 'hidden',
    marginTop: 10,
  },

  accordionBodyScroll: {
    flexGrow: 0,
  },

  accordionBodyScrollContent: {
    paddingTop: 2,
    gap: 8,
  },

  // ── Entity items (responders) ──────────────────────────────────────────────

  entityItem: {
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#fff',
  },

  entityItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
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

  assignmentActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },

  assignmentStatusButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: '#fff',
  },

  assignmentStatusButtonActive: {
    backgroundColor: C.tangerine,
    borderColor: C.tangerine,
  },

  assignmentStatusButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textMuted,
  },

  assignmentStatusButtonTextActive: {
    color: '#fff',
  },

  emptyAccordionState: {
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 14,
    backgroundColor: '#fff',
    padding: 14,
  },

  emptyAccordionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: C.text,
  },

  emptyAccordionDesc: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: C.textMuted,
  },

  // ── Alerts list ────────────────────────────────────────────────────────────

  alertsList: {
    gap: 10,
  },

  alertItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 14,
    backgroundColor: '#fff',
  },

  alertItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 10,
  },

  alertItemType: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    textTransform: 'capitalize',
  },

  alertItemPriority: {
    fontSize: 11,
    color: C.tangerine,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  alertItemMsg: {
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 18,
  },

  // ── FireLab ────────────────────────────────────────────────────────────────

  firelabCard: {
    backgroundColor: C.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 16,
    overflow: 'hidden',
  },

  firelabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },

  firelabTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
  },

  firelabSub: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 3,
    fontWeight: '600',
  },

  firelabBadge: {
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.22)',
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  firelabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: C.purple,
  },

  govTabsTrack: {
    gap: 8,
    paddingRight: 8,
    paddingBottom: 10,
  },

  govTab: {
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  govTabActive: {
    borderColor: 'rgba(236,119,66,0.45)',
    backgroundColor: 'rgba(236,119,66,0.12)',
  },

  govTabText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.textMuted,
  },

  govTabTextActive: {
    color: C.tangerine,
  },

  firelabLoading: {
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  firelabLoadingText: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '700',
  },

  firelabEmpty: {
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginTop: 4,
  },

  firelabEmptyText: {
    fontSize: 12,
    lineHeight: 18,
    color: C.textMuted,
    fontWeight: '600',
  },

  firelabRetryBtn: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(236,119,66,0.36)',
    backgroundColor: 'rgba(236,119,66,0.10)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  firelabRetryBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.tangerine,
  },

  firelabDaysGrid: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: 10,
    marginTop: 4,
  },

  firelabDayCard: {
    flex: 1,
    minWidth: isDesktop ? 0 : '100%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#fff',
  },

  firelabDayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
    marginBottom: 8,
  },

  firelabDaySub: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 6,
    fontWeight: '600',
  },

  firelabRiskCode: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 3,
  },

  firelabRiskLabel: {
    fontSize: 11,
    fontWeight: '800',
  },

  firelabAreaList: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingTop: 12,
  },

  firelabAreaListTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: C.text,
    marginBottom: 10,
  },

  firelabAreaScroll: {
    maxHeight: 220,
  },

  firelabAreaScrollContent: {
    gap: 8,
  },

  firelabAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  firelabAreaName: {
    flex: 1,
    fontSize: 12,
    color: C.text,
    fontWeight: '700',
  },

  firelabAreaChip: {
    minWidth: 26,
    height: 24,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },

  firelabAreaCode: {
    fontSize: 10,
    fontWeight: '900',
  },

  firelabNotice: {
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.28)',
    backgroundColor: 'rgba(245,158,11,0.10)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  firelabNoticeText: {
    fontSize: 12,
    lineHeight: 17,
    color: C.textMuted,
    fontWeight: '700',
  },
});