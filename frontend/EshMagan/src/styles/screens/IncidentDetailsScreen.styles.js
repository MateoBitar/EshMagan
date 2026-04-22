import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width } = Dimensions.get('window');
const isDesktop = Platform.OS === 'web' && width >= 1180;

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
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
    minHeight: '100vh',
  },

  container: {
    flex: 1,
    backgroundColor: C.bg,
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
    marginLeft: -4,
  },

  pageScroll: {
    flex: 1,
    backgroundColor: C.bg,
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

  scrollContent: {
    padding: 16,
    paddingBottom: 26,
  },

  desktopLayout: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: 14,
    alignItems: 'flex-start',
  },

  leftColumn: {
    width: isDesktop ? '62%' : '100%',
  },

  leftColumnStack: {
    marginTop: 14,
    gap: 14,
    width: '100%',
  },

  rightColumn: {
    width: isDesktop ? '38%' : '100%',
    gap: 14,
  },

  predictionMapCard: {
    backgroundColor: C.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 18,
  },

  predictionMapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },

  predictionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },

  predictionSub: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 4,
  },

  predictionChip: {
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.22)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  predictionChipText: {
    color: C.purple,
    fontSize: 11,
    fontWeight: '800',
  },

  mapViewport: {
    width: '100%',
    height: isDesktop ? 500 : 360,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.10)',
    position: 'relative',
  },

  mapCanvas: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },

  fireGlowOuter: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(239,68,68,0.10)',
    left: '26%',
    top: '25%',
  },

  fireGlowMiddle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(244,63,94,0.16)',
    left: '31%',
    top: '32%',
  },

  predictionCone: {
    position: 'absolute',
    width: 240,
    height: 155,
    backgroundColor: 'rgba(251,146,60,0.10)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(239,68,68,0.55)',
    right: '18%',
    top: '31%',
    transform: [{ skewY: '-16deg' }, { rotate: '-8deg' }],
  },

  predictionConeOutline: {
    position: 'absolute',
    width: 180,
    height: 120,
    backgroundColor: 'rgba(248,113,113,0.08)',
    right: '22%',
    top: '35%',
    transform: [{ skewY: '-16deg' }, { rotate: '-8deg' }],
  },

  windInfoBadge: {
    position: 'absolute',
    top: 22,
    right: 22,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 6,
  },

  windInfoBadgeValue: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },

  windInfoBadgeSub: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },

  coordinatesBadge: {
    position: 'absolute',
    left: 18,
    bottom: 18,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 6,
  },

  coordinatesBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },

  directionArrowWrap: {
    position: 'absolute',
    width: 180,
    height: 24,
    left: '39%',
    top: '48%',
    zIndex: 7,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  directionArrowShaft: {
    position: 'absolute',
    left: 0,
    width: 140,
    height: 3,
    backgroundColor: '#2563eb',
    borderRadius: 999,
  },

  directionArrowHead: {
    position: 'absolute',
    right: 0,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 18,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#2563eb',
  },

  fireCore: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 6,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 8,
  },

  fireCoreIcon: {
    fontSize: 34,
  },

  timelineCard: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.18)',
    backgroundColor: 'rgba(168,85,247,0.06)',
    padding: 16,
  },

  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  timelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
  },

  timelineFocus: {
    fontSize: 14,
    fontWeight: '800',
    color: C.purple,
  },

  timelineTrack: {
    height: 12,
    marginTop: 14,
    marginBottom: 10,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    position: 'relative',
  },

  timelineFill: {
    width: '22%',
    height: 12,
    borderRadius: 999,
    backgroundColor: '#111827',
  },

  timelineThumb: {
    position: 'absolute',
    left: '20%',
    top: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },

  timelineScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  timelineTick: {
    fontSize: 11,
    color: C.textMuted,
    fontWeight: '700',
  },

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

  confidenceRingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  confidenceRingOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderColor: C.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },

  confidenceRingInner: {
    width: 102,
    height: 102,
    borderRadius: 51,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  confidenceValue: {
    fontSize: 30,
    fontWeight: '900',
    color: C.purple,
  },

  confidenceLabel: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },

  confidenceDesc: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    color: C.textMuted,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },

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
    fontSize: 14,
    fontWeight: '800',
    color: C.textMuted,
    marginLeft: 10,
    bottom: 4,
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

  rightBottomRow: {
    flexDirection: isDesktop ? 'row' : 'column',
    gap: 14,
  },

  carouselCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 16,
    minWidth: 0,
  },

  carouselTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
    marginBottom: 12,
  },

  carouselTrack: {
    gap: 10,
    paddingRight: 6,
  },

  metricCard: {
    width: 210,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },

  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
    marginBottom: 18,
  },

  metricValue: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
    color: C.text,
  },

  metricSub: {
    fontSize: 11,
    lineHeight: 16,
    color: C.textMuted,
  },

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
});