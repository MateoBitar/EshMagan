import { StyleSheet, Platform } from "react-native";

export default function stylesFactory(width, height) {
  const isWeb = Platform.OS === "web";
  const isSmall = width < 430;
  const isTablet = width >= 768;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#F8FAFC",
      paddingHorizontal: isSmall ? 10 : 16,
      paddingTop: isSmall ? 10 : 16,
    },

    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
      gap: 12,
      flexWrap: "wrap",
    },

    topBarLogoWrap: { 
      flexDirection: 'row',
       alignItems: 'center', 
       gap: 10 
    },

    topBarLogoIcon: { 
      width: 50,
      height: 50,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center'
    },

    topBarLogoImage: { 
      width: 50, 
      height: 50 
    },

    topBarTitle: { 
      color: '#000', 
      fontSize: 20, 
      fontWeight: '800' 
    },

    topBarSubtitle: { 
      color: 'rgba(0,0,0,0.8)', 
      fontSize: 12 
    },

    logoutBtn: {
      backgroundColor: "#DC2626",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      minWidth: 100,
      alignItems: "center",
    },

    logoutBtnText: {
      color: "#F8FAFC",
      fontWeight: "700",
      fontSize: 14,
    },

    searchInput: {
      borderWidth: 1,
      borderColor: "#F9C04E",
      backgroundColor: "#FFF1D6",
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 18,
      color: "#000000",
      width: "100%",
    },

    input: {
      borderWidth: 1,
      borderColor: "#F9C04E",
      backgroundColor: "#F8FAFC",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 10,
      color: "#000000",
      width: "100%",
    },

    section: {
      marginBottom: 24,
      backgroundColor: "#FFF1D6",
      borderRadius: 16,
      padding: isSmall ? 10 : 12,
      borderWidth: 1,
      borderColor: "#F9C04E",
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
      fontWeight: "700",
      color: "#000000",
    },

    addBtn: {
      backgroundColor: "#EC7742",
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
      minWidth: isWeb ? Math.max(width - 40, 980) : 920,
      width: "100%",
    },

    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#DC2626",
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 8,
    },

    headerCell: {
      flex: 1,
      color: "#F8FAFC",
      fontWeight: "800",
      fontSize: isSmall ? 12 : 13,
      paddingHorizontal: 6,
    },

    cell: {
      flex: 1,
      color: "#000000",
      fontSize: isSmall ? 12 : 13,
      paddingHorizontal: 6,
    },

    headerActionsCell: {
      flex: 0.9,
      color: "#F8FAFC",
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
      backgroundColor: "#F8FAFC",
      borderBottomWidth: 1,
      borderBottomColor: "#FFF1D6",
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
      backgroundColor: "#F9C04E",
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 8,
      minWidth: 84,
      alignItems: "center",
    },

    deactivateBtn: {
      backgroundColor: "#DC2626",
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 8,
      minWidth: 94,
      alignItems: "center",
    },

    reactivateBtn: {
      backgroundColor: "#EC7742",
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
      color: "#000000",
      paddingVertical: 16,
      fontSize: 14,
    },

    emptyText: {
      textAlign: "center",
      color: "#EC7742",
      paddingVertical: 16,
      fontSize: 14,
      fontWeight: "600",
    },

    errorText: {
      color: "#DC2626",
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
      backgroundColor: "#FFF1D6",
      borderRadius: 18,
      padding: isSmall ? 16 : 20,
      borderWidth: 1,
      borderColor: "#F9C04E",
      maxHeight: height * 0.85,
    },

    modalTitle: {
      fontSize: isSmall ? 20 : 22,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: 16,
      color: "#000000",
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
      backgroundColor: "#DC2626",
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
  });
}
