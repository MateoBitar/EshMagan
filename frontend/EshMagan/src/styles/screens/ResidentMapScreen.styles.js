import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');
const isDesktop = Platform.OS === 'web' && width >= 1100;
const accordionOpenMaxHeight = isDesktop
  ? Math.max(220, height - 370)
  : 220;

const C = {
  bg: '#FFF1D6',
  card: '#ffffff',
  cardBorder: 'rgba(236,119,66,0.18)',
  scarlet: '#DC2626',
  tangerine: '#EC7742',
  snow: '#F8FAFC',
  text: '#000000',
  textMuted: '#4b2e1a',
  textDim: 'rgba(0,0,0,0.4)',
};

export default StyleSheet.create({
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

  mapTabContainer: {
    flex: 1,
    backgroundColor: C.bg,
    minHeight: '91.5vh',
    maxHeight: '91.5vh',
  },

  mapLayout: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 12,
  },

  mapPane: {
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

  sidePanel: {
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
    marginBottom: 8,
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
});