import { StyleSheet, Platform } from 'react-native';

export default StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF1D6',
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
    paddingVertical: 7,
  },

  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EC7742',
  },

  headerTextWrap: {
    flex: 1,
    marginLeft: 2,
  },

  headerTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  headerSub: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },

  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 28,
    paddingTop: 6,
  },

  emptyWrap: {
    marginTop: 70,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },

  emptyDesc: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },

  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    backgroundColor: '#fff',
  },

  cardUnread: {
    borderColor: '#EC7742',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  cardRead: {
    borderColor: '#e2e8f0',
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#EC7742',
    marginRight: 10,
    marginTop: 6,
  },

  message: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },

  messageUnread: {
    color: '#0f172a',
    fontWeight: '800',
  },

  messageRead: {
    color: '#334155',
    fontWeight: '600',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  badgeUnread: {
    backgroundColor: 'rgba(236,119,66,0.14)',
  },

  badgeRead: {
    backgroundColor: '#e2e8f0',
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },

  badgeTextUnread: {
    color: '#c2410c',
  },

  badgeTextRead: {
    color: '#475569',
  },

  fireId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },

  dateText: {
    marginTop: 10,
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
});