import { StyleSheet } from 'react-native';

export const C = {
  bg: '#FFF1D6',
  card: '#ffffff',
  cardBorder: 'rgba(236,119,66,0.18)',
  scarlet: '#DC2626',
  tangerine: '#EC7742',
  gold: '#F9C04E',
  green: '#16a34a',
  slate: '#94a3b8',
  text: '#000000',
  textMuted: '#4b2e1a',
  textDim: 'rgba(0,0,0,0.4)',
  line: 'rgba(236,119,66,0.12)',
};

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.bg,
    minHeight: '100vh',
  },

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(236,119,66,0.2)',
    backgroundColor: C.bg,
  },

  topBarRow: {
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
    marginLeft: -2,
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

  emptyEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },

  emptyText: {
    fontSize: 15,
    color: C.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },

  mainCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(236,119,66,0.22)',
  },

  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },

  mainCardIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mainLogoImage: {
    width: 50,
    height: 50,
  },

  mainCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },

  mainCardSub: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    gap: 12,
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

  sectionCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.text,
    marginBottom: 12,
  },

  responderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },

  responderName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },

  responderMeta: {
    fontSize: 11,
    color: C.textMuted,
  },

  alertItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },

  alertItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
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