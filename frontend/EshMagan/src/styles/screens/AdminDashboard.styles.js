import { StyleSheet, Platform } from "react-native";

export default function stylesFactory(width, height) {
  const isWeb = Platform.OS === "web";
  const isSmall = width < 430;

  const C = {
    bg: "#FFF1D6",
    card: "#FFFFFF",
    cardBorder: "rgba(236,119,66,0.18)",
    scarlet: "#DC2626",
    tangerine: "#EC7742",
    gold: "#F9C04E",
    snow: "#F8FAFC",
    text: "#000000",
    textMuted: "#4b2e1a",
    textDim: "rgba(0,0,0,0.4)",
  };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: C.bg,
      paddingHorizontal: 0,
      paddingTop: 0,
      maxHeight: "100vh",
      minHeight: "100vh",
    },

    topBar: {
      backgroundColor: C.bg,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(236,119,66,0.2)",
      paddingHorizontal: isSmall ? 12 : 16,
      paddingVertical: 14,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      marginBottom: 10,
      marginTop: isWeb ? 0 : Platform.OS === "android" ? 0 : 35,
    },

    topBarLogoWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
      minWidth: 0,
    },

    topBarLogoIcon: {
      width: 50,
      height: 50,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },

    topBarLogoImage: {
      width: 50,
      height: 50,
    },

    topBarTitle: {
      color: C.text,
      fontSize: 20,
      fontWeight: "800",
    },

    topBarSubtitle: {
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
      backgroundColor: "transparent",
      minWidth: 0,
      alignItems: "center",
    },

    logoutBtnText: {
      color: C.scarlet,
      fontWeight: "700",
      fontSize: 12,
    },

    searchInput: {
      borderWidth: 1,
      borderColor: C.cardBorder,
      backgroundColor: C.card,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginHorizontal: isSmall ? 12 : 16,
      marginTop: 12,
      marginBottom: 16,
      color: C.text,
      width: "auto",
    },

    input: {
      borderWidth: 1,
      borderColor: "#dbe2ea",
      backgroundColor: C.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 10,
      color: C.text,
      width: "100%",
    },

    section: {
      marginHorizontal: isSmall ? 12 : 16,
      marginBottom: 16,
      backgroundColor: C.card,
      borderRadius: 18,
      padding: isSmall ? 10 : 12,
      borderWidth: 1,
      borderColor: C.cardBorder,
      alignSelf: "stretch",
    },

    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      gap: 10,
      flexWrap: "wrap",
    },

    sectionTitle: {
      fontSize: isSmall ? 18 : 20,
      fontWeight: "800",
      color: C.text,
    },

    addBtn: {
      backgroundColor: C.tangerine,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
      alignItems: "center",
      minWidth: 90,
    },

    addBtnText: {
      color: "#F8FAFC",
      fontWeight: "700",
      fontSize: 14,
    },

    tableWrapper: {
      minWidth: isWeb ? Math.max(width - 60, 980) : 920,
      width: "100%",
    },

    tableHeader: {
      flexDirection: "row",
      backgroundColor: C.bg,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      borderBottomWidth: 1,
      borderBottomColor: C.cardBorder,
      paddingVertical: 12,
      paddingHorizontal: 8,
    },

    headerCell: {
      flex: 1,
      color: C.textMuted,
      fontWeight: "800",
      fontSize: isSmall ? 12 : 13,
      paddingHorizontal: 6,
    },

    cell: {
      flex: 1,
      color: C.text,
      fontSize: isSmall ? 12 : 13,
      paddingHorizontal: 6,
    },

    headerActionsCell: {
      flex: 0.9,
      color: C.textMuted,
      fontWeight: "800",
      fontSize: isSmall ? 12 : 13,
      paddingHorizontal: 6,
      textAlign: "center",
    },

    actionsCell: {
      flex: 0.9,
      flexDirection: "row",
      gap: 8,
      justifyContent: "center",
      alignItems: "center",
    },

    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.card,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(236,119,66,0.12)",
      paddingVertical: 12,
      paddingHorizontal: 8,
    },

    cellId: {
      flex: 0.4,
      fontWeight: "700",
    },

    cellSmall: {
      flex: 0.4,
    },

    cellMedium: {
      flex: 1,
    },

    cellLarge: {
      flex: 2,
    },

    updateBtn: {
      backgroundColor: C.gold,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 8,
      minWidth: 84,
      alignItems: "center",
    },

    deactivateBtn: {
      backgroundColor: C.scarlet,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 8,
      minWidth: 94,
      alignItems: "center",
    },

    reactivateBtn: {
      backgroundColor: C.tangerine,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 8,
      minWidth: 94,
      alignItems: "center",
    },

    actionBtnText: {
      color: "#F8FAFC",
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
    },

    loadingText: {
      textAlign: "center",
      color: C.textMuted,
      paddingVertical: 16,
      fontSize: 14,
    },

    emptyText: {
      textAlign: "center",
      color: C.tangerine,
      paddingVertical: 16,
      fontSize: 14,
      fontWeight: "600",
    },

    errorText: {
      color: C.scarlet,
      fontSize: 15,
      fontWeight: "600",
      marginTop: 20,
    },

    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.45)",
      padding: 16,
    },

    modalBox: {
      width: isWeb ? Math.min(width * 0.55, 520) : Math.min(width - 24, 520),
      backgroundColor: C.bg,
      borderRadius: 18,
      padding: isSmall ? 16 : 20,
      borderWidth: 1,
      borderColor: C.cardBorder,
      maxHeight: height * 0.85,
    },

    modalTitle: {
      fontSize: isSmall ? 20 : 22,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: 16,
      color: C.text,
    },

    modalActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
      gap: 10,
    },

    cancelBtn: {
      flex: 1,
      backgroundColor: "#000000",
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
    },

    cancelBtnText: {
      color: "#F8FAFC",
      fontWeight: "700",
      textAlign: "center",
      fontSize: 15,
    },

    saveBtn: {
      flex: 1,
      backgroundColor: C.scarlet,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
    },

    saveBtnText: {
      color: "#F8FAFC",
      fontWeight: "800",
      textAlign: "center",
      fontSize: 15,
    },

    // Add these inside StyleSheet.create({ ... })

    fieldError: {
      fontSize: 11,
      color: "#DC2626",
      marginTop: -10,
      marginBottom: 12,
    },

    tabsRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 14,
      marginLeft: 15,
    },

    tabButtonBase: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
    },

    tabButtonActive: {
      backgroundColor: "#EC7742",
      borderColor: "#EC7742",
    },

    tabButtonInactive: {
      backgroundColor: "#fff",
      borderColor: "#e2e8f0",
    },

    tabButtonTextBase: {
      fontWeight: "700",
    },

    tabButtonTextActive: {
      color: "#fff",
    },

    tabButtonTextInactive: {
      color: "#334155",
    },

    tableHeightWrap: {
      maxHeight: height * 0.6,
      minHeight: 0,
    },

    tableList: {
      maxHeight: height * 0.6 - 50,
    },

    inputError: {
      borderColor: "#DC2626",
    },

    passwordRulesRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: -6,
      marginBottom: 12,
      flexWrap: "wrap",
    },

    passwordRuleItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    passwordRuleDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },

    passwordRuleDotActive: {
      backgroundColor: "#EC7742",
    },

    passwordRuleDotInactive: {
      backgroundColor: "rgba(0,0,0,0.15)",
    },

    passwordRuleText: {
      fontSize: 10,
    },

    passwordRuleTextActive: {
      color: "#EC7742",
    },

    passwordRuleTextInactive: {
      color: "rgba(0,0,0,0.35)",
    },

    regionLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: "#0f172a",
      marginBottom: 8,
    },

    regionDropdownButton: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    regionDropdownButtonClosed: {
      marginBottom: 12,
    },

    regionDropdownButtonOpen: {
      marginBottom: 8,
    },

    regionDropdownText: {
      color: "#0f172a",
      flex: 1,
    },

    regionDropdownPlaceholder: {
      color: "rgba(0,0,0,0.35)",
    },

    regionDropdownChevron: {
      color: "#64748b",
      fontSize: 16,
    },

    regionDropdownMenu: {
      borderWidth: 1,
      borderColor: "#dbe2ea",
      borderRadius: 12,
      backgroundColor: "#ffffff",
      marginBottom: 12,
      maxHeight: 220,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 4,
      overflow: "hidden",
    },

    regionDropdownScroll: {
      maxHeight: 220,
    },

    regionDropdownEmpty: {
      padding: 12,
      color: "#64748b",
    },

    regionOption: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: "#ffffff",
      borderBottomWidth: 1,
      borderBottomColor: "#f1f5f9",
    },

    regionOptionLast: {
      borderBottomWidth: 0,
    },

    regionOptionSelected: {
      backgroundColor: "#FFF1D6",
    },

    regionOptionText: {
      color: "#334155",
      fontWeight: "500",
    },

    regionOptionTextSelected: {
      color: "#EC7742",
      fontWeight: "700",
    },

    fullFlex: {
      flex: 1,
    },

    modalActionsSpaced: {
      gap: 12,
    },

    modalActionButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 44,
    },

    modalActionText: {
      textAlign: "center",
      lineHeight: 20,
    },

    confirmDescription: {
      fontSize: 13,
      color: "#475569",
      marginBottom: 12,
    },

    confirmErrorBox: {
      backgroundColor: "#FFF1D6",
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
      borderLeftWidth: 3,
      borderLeftColor: "#DC2626",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    warningIcon: {
      width: 14,
      height: 14,
    },

    confirmErrorText: {
      fontSize: 13,
      color: "#DC2626",
      fontWeight: "600",
      flex: 1,
    },
  });
}