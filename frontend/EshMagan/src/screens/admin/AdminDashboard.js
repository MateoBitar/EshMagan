import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  useWindowDimensions,
  Image,
} from "react-native";
import {
  gqlFetch,
  API_BASE,
  GET_ADMINS,
  GET_RESPONDERS,
  GET_ALL_MUNICIPALITIES,
  CREATE_ADMIN,
  DEACTIVATE_ADMIN,
  CREATE_RESPONDER,
  UPDATE_RESPONDER,
  DEACTIVATE_RESPONDER,
  CREATE_MUNICIPALITY,
  UPDATE_MUNICIPALITY,
  DEACTIVATE_MUNICIPALITY,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import stylesFactory from "../../styles/screens/AdminDashboard.styles";

const TABS = ["Admins", "Responders", "Municipalities"];

const KNOWN_DOMAINS = [
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
  "live.com", "msn.com", "protonmail.com", "proton.me", "mail.com",
  "aol.com", "ymail.com", "googlemail.com", "me.com", "mac.com", "eshmagan.com",
  "hotmail.fr", "hotmail.co.uk", "yahoo.fr", "yahoo.co.uk", "yahoo.com.au",
  "edu.lb", "ul.edu.lb", "balamand.edu.lb", "usj.edu.lb", "lau.edu.lb",
];

function validateEmail(email) {
  if (!email) return null;
  const match = email.match(/^[^\s@]+@([^\s@]+)$/);
  if (!match) return "Enter a valid email address";
  const domain = match[1].toLowerCase();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return "Enter a valid email address";
  const isKnown = KNOWN_DOMAINS.some((d) => domain === d || domain.endsWith("." + d));
  if (!isKnown) return `Unrecognized provider — is "${domain}" correct?`;
  return null;
}

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return "+" + digits;
  if (digits.length <= 5) return "+" + digits.slice(0, 3) + " " + digits.slice(3);
  if (digits.length <= 8) return "+" + digits.slice(0, 3) + " " + digits.slice(3, 5) + " " + digits.slice(5);
  return "+" + digits.slice(0, 3) + " " + digits.slice(3, 5) + " " + digits.slice(5, 8) + " " + digits.slice(8);
}

function normalizeUnitNumber(raw) {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const withoutPrefix = cleaned.replace(/^UNIT-?/, "");
  if (!withoutPrefix) return "UNIT-";
  return `UNIT-${withoutPrefix}`;
}

function normalizeMunicipalityCode(raw) {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const withoutPrefix = cleaned.replace(/^MUN-?/, "");
  if (!withoutPrefix) return "MUN-";
  return `MUN-${withoutPrefix}`;
}

function passwordChecks(password) {
  return {
    min: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^a-zA-Z0-9]/.test(password),
  };
}

function validateCreationPassword(password) {
  if (!password) return "Password is required";
  const checks = passwordChecks(password);
  if (!checks.min) return "Password must be at least 8 characters";
  if (!checks.upper) return "Password must include an uppercase letter";
  if (!checks.number) return "Password must include a number";
  if (!checks.symbol) return "Password must include a symbol";
  return null;
}

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <Text style={{ fontSize: 11, color: "#DC2626", marginTop: -10, marginBottom: 12 }}>
      {msg}
    </Text>
  );
}

const verifyAdminCredentials = async (email, password) => {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_email: email,
      user_password: password,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Incorrect email or password. Please try again.");
  }

  return res.json();
};

export default function AdminDashboard({ navigation }) {
  const { width, height } = useWindowDimensions();
  const styles = stylesFactory(width, height);
  const { logout, user } = useAuth();

  const [activeTab, setActiveTab] = useState("Admins");
  const [search, setSearch] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("");
  const [mode, setMode] = useState("add");
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmType, setConfirmType] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  const [adminsData, setAdminsData] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [adminsError, setAdminsError] = useState(null);

  const [respondersData, setRespondersData] = useState([]);
  const [respondersLoading, setRespondersLoading] = useState(true);
  const [respondersError, setRespondersError] = useState(null);

  const [municipalitiesData, setMunicipalitiesData] = useState([]);
  const [municipalitiesLoading, setMunicipalitiesLoading] = useState(true);
  const [municipalitiesError, setMunicipalitiesError] = useState(null);

  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [creatingResponder, setCreatingResponder] = useState(false);
  const [updatingResponder, setUpdatingResponder] = useState(false);
  const [creatingMunicipality, setCreatingMunicipality] = useState(false);
  const [updatingMunicipality, setUpdatingMunicipality] = useState(false);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);

  const fetchAdmins = async () => {
    setAdminsLoading(true);
    try {
      const data = await gqlFetch(GET_ADMINS);
      setAdminsData(data?.getAllAdmins || []);
      setAdminsError(null);
    } catch (err) {
      setAdminsError(err);
    } finally {
      setAdminsLoading(false);
    }
  };

  const fetchResponders = async () => {
    setRespondersLoading(true);
    try {
      const data = await gqlFetch(GET_RESPONDERS);
      setRespondersData(data?.getAllResponders || []);
      setRespondersError(null);
    } catch (err) {
      setRespondersError(err);
    } finally {
      setRespondersLoading(false);
    }
  };

  const fetchMunicipalities = async () => {
    setMunicipalitiesLoading(true);
    try {
      const data = await gqlFetch(GET_ALL_MUNICIPALITIES);
      setMunicipalitiesData(data?.getAllMunicipalities || []);
      setMunicipalitiesError(null);
    } catch (err) {
      setMunicipalitiesError(err);
    } finally {
      setMunicipalitiesLoading(false);
    }
  };

  const doRefetch = async () => {
    await Promise.all([fetchAdmins(), fetchResponders(), fetchMunicipalities()]);
  };

  useEffect(() => {
    doRefetch();
  }, []);

  const regionOptions = useMemo(() => {
    const responderRegions = (respondersData || [])
      .map((r) => (r.assigned_region || "").trim())
      .filter(Boolean);

    const municipalityRegions = (municipalitiesData || [])
      .map((m) => (m.region_name || "").trim())
      .filter(Boolean);

    return [...new Set([...responderRegions, ...municipalityRegions])].sort((a, b) =>
      a.localeCompare(b)
    );
  }, [respondersData, municipalitiesData]);

  const isBusy =
    creatingAdmin ||
    creatingResponder ||
    updatingResponder ||
    creatingMunicipality ||
    updatingMunicipality ||
    confirmLoading;

  const handleLogout = async () => {
    try {
      await logout();
      if (navigation?.navigate && !navigation?.dispatch) navigation.navigate("Login");
    } catch (err) {
      Alert.alert("Logout Error", err.message || "Failed to logout");
    }
  };

  const openAddModal = (type) => {
    setModalType(type);
    setMode("add");
    setSelectedItem(null);
    setRegionDropdownOpen(false);

    if (type === "Admins") {
      setFormData({
        admin_fname: "",
        admin_lname: "",
        user_email: "",
        user_password: "",
        user_phone: "",
      });
    }

    if (type === "Responders") {
      setFormData({
        unit_nb: "UNIT-",
        assigned_region: "",
        unit_latitude: "",
        unit_longitude: "",
        user_email: "",
        user_password: "",
        user_phone: "",
      });
    }

    if (type === "Municipalities") {
      setFormData({
        municipality_name: "",
        region_name: "",
        municipality_code: "MUN-",
        municipality_latitude: "",
        municipality_longitude: "",
        user_email: "",
        user_password: "",
        user_phone: "",
      });
    }

    setModalVisible(true);
  };

  const openUpdateModal = (type, item) => {
    setModalType(type);
    setMode("update");
    setSelectedItem(item);
    setRegionDropdownOpen(false);

    if (type === "Responders") {
      setFormData({
        unit_nb: item.unit_nb || "UNIT-",
        assigned_region: item.assigned_region || "",
        unit_latitude: item.unit_location?.latitude?.toString?.() || "",
        unit_longitude: item.unit_location?.longitude?.toString?.() || "",
        user_email: item.user?.user_email || "",
        user_phone: item.user?.user_phone || "",
      });
    }

    if (type === "Municipalities") {
      setFormData({
        municipality_name: item.municipality_name || "",
        region_name: item.region_name || "",
        municipality_code: item.municipality_code || "MUN-",
        municipality_latitude: item.municipality_location?.latitude?.toString?.() || "",
        municipality_longitude: item.municipality_location?.longitude?.toString?.() || "",
        user_email: item.user?.user_email || "",
        user_phone: item.user?.user_phone || "",
      });
    }

    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType("");
    setMode("add");
    setSelectedItem(null);
    setFormData({});
    setRegionDropdownOpen(false);
  };

  const openDeactivateConfirm = (item, type) => {
    setConfirmTarget(item);
    setConfirmType(type);
    setConfirmEmail(user?.email ? user.email.toLowerCase().trim() : "");
    setConfirmPassword("");
    setConfirmError("");
    setConfirmVisible(true);
  };

  const closeDeactivateConfirm = () => {
    setConfirmVisible(false);
    setConfirmTarget(null);
    setConfirmType("");
    setConfirmEmail(user?.email ? user.email.toLowerCase().trim() : "");
    setConfirmPassword("");
    setConfirmError("");
  };

  const handleChange = (field, value) => {
    let nextValue = value;

    if (field === "user_email") nextValue = value.toLowerCase().trim();
    if (field === "user_phone") nextValue = formatPhone(value);
    if (field === "unit_nb") nextValue = normalizeUnitNumber(value);
    if (field === "municipality_code") nextValue = normalizeMunicipalityCode(value);

    setFormData((prev) => ({ ...prev, [field]: nextValue }));
  };

  const required = (value, label) => {
    if (value === undefined || value === null || String(value).trim() === "") {
      throw new Error(`${label} is required`);
    }
    return String(value).trim();
  };

  const requiredNumber = (value, label) => {
    const num = parseFloat(String(value).trim());
    if (Number.isNaN(num)) throw new Error(`${label} must be a valid number`);
    return num;
  };

  const handleSave = async () => {
    try {
      const emailError = validateEmail(formData.user_email || "");
      if (mode === "add" && emailError) throw new Error(emailError);

      if (mode === "add") {
        const passwordError = validateCreationPassword(formData.user_password || "");
        if (passwordError) throw new Error(passwordError);
      }

      if (modalType === "Admins" && mode === "add") {
        setCreatingAdmin(true);
        try {
          await gqlFetch(CREATE_ADMIN, {
            input: {
              admin_fname: required(formData.admin_fname, "Admin first name"),
              admin_lname: required(formData.admin_lname, "Admin last name"),
              user_email: required(formData.user_email, "Email"),
              user_password: required(formData.user_password, "Password"),
              user_phone: required(formData.user_phone, "Phone"),
            },
          });
        } finally {
          setCreatingAdmin(false);
        }
      }

      if (modalType === "Responders") {
        if (mode === "add") {
          setCreatingResponder(true);
          try {
            const unitLatitude = requiredNumber(formData.unit_latitude, "Unit latitude");
            const unitLongitude = requiredNumber(formData.unit_longitude, "Unit longitude");

            await gqlFetch(CREATE_RESPONDER, {
              input: {
                unit_nb: required(formData.unit_nb, "Unit number"),
                assigned_region: required(formData.assigned_region, "Assigned region"),
                responder_status: "Unavailable",
                unit_location: {
                  latitude: unitLatitude,
                  longitude: unitLongitude,
                },
                last_known_location: {
                  latitude: unitLatitude,
                  longitude: unitLongitude,
                },
                user_email: required(formData.user_email, "Email"),
                user_password: required(formData.user_password, "Password"),
                user_phone: required(formData.user_phone, "Phone"),
              },
            });
          } finally {
            setCreatingResponder(false);
          }
        } else {
          setUpdatingResponder(true);
          try {
            const unitLatitude = requiredNumber(formData.unit_latitude, "Unit latitude");
            const unitLongitude = requiredNumber(formData.unit_longitude, "Unit longitude");

            await gqlFetch(UPDATE_RESPONDER, {
              responder_id: selectedItem.responder_id,
              input: {
                unit_nb: required(formData.unit_nb, "Unit number"),
                assigned_region: required(formData.assigned_region, "Assigned region"),
                unit_location: {
                  latitude: unitLatitude,
                  longitude: unitLongitude,
                },
                last_known_location: {
                  latitude: unitLatitude,
                  longitude: unitLongitude,
                },
              },
            });
          } finally {
            setUpdatingResponder(false);
          }
        }
      }

      if (modalType === "Municipalities") {
        if (mode === "add") {
          setCreatingMunicipality(true);
          try {
            const municipalityLatitude = requiredNumber(formData.municipality_latitude, "Municipality latitude");
            const municipalityLongitude = requiredNumber(formData.municipality_longitude, "Municipality longitude");

            await gqlFetch(CREATE_MUNICIPALITY, {
              input: {
                municipality_name: required(formData.municipality_name, "Municipality name"),
                region_name: required(formData.region_name, "Region name"),
                municipality_code: required(formData.municipality_code, "Municipality code"),
                municipality_location: {
                  latitude: municipalityLatitude,
                  longitude: municipalityLongitude,
                },
                user_email: required(formData.user_email, "Email"),
                user_password: required(formData.user_password, "Password"),
                user_phone: required(formData.user_phone, "Phone"),
              },
            });
          } finally {
            setCreatingMunicipality(false);
          }
        } else {
          setUpdatingMunicipality(true);
          try {
            const municipalityLatitude = requiredNumber(formData.municipality_latitude, "Municipality latitude");
            const municipalityLongitude = requiredNumber(formData.municipality_longitude, "Municipality longitude");

            await gqlFetch(UPDATE_MUNICIPALITY, {
              municipality_id: selectedItem.municipality_id,
              input: {
                municipality_name: required(formData.municipality_name, "Municipality name"),
                region_name: required(formData.region_name, "Region name"),
                municipality_code: required(formData.municipality_code, "Municipality code"),
                municipality_location: {
                  latitude: municipalityLatitude,
                  longitude: municipalityLongitude,
                },
              },
            });
          } finally {
            setUpdatingMunicipality(false);
          }
        }
      }

      await doRefetch();
      closeModal();
      Alert.alert("Success", `${modalType.slice(0, -1)} saved successfully.`);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message || "Operation failed");
    }
  };

  const handleConfirmDeactivate = async () => {
    const normalizedEmail = confirmEmail.toLowerCase().trim();
    const emailError = validateEmail(normalizedEmail);

    if (emailError) {
      setConfirmError(emailError);
      return;
    }

    if (!confirmPassword) {
      setConfirmError("Password is required");
      return;
    }

    try {
      setConfirmLoading(true);
      setConfirmError("");

      await verifyAdminCredentials(normalizedEmail, confirmPassword);

      if (confirmType === "Admins") {
        await gqlFetch(DEACTIVATE_ADMIN, { admin_id: confirmTarget.admin_id });
      }

      if (confirmType === "Responders") {
        await gqlFetch(DEACTIVATE_RESPONDER, { responder_id: confirmTarget.responder_id });
      }

      if (confirmType === "Municipalities") {
        await gqlFetch(DEACTIVATE_MUNICIPALITY, { municipality_id: confirmTarget.municipality_id });
      }

      await doRefetch();
      closeDeactivateConfirm();
      Alert.alert("Success", `${confirmType.slice(0, -1)} deactivated.`);
    } catch (err) {
      setConfirmError(
        err.message?.includes("Invalid credentials")
          ? "Incorrect email or password. Please try again."
          : err.message || "Verification failed."
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  const filterData = (data) => {
    const list = data || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  };

  const admins = useMemo(() => filterData(adminsData), [adminsData, search]);
  const responders = useMemo(() => filterData(respondersData), [respondersData, search]);
  const municipalities = useMemo(() => filterData(municipalitiesData), [municipalitiesData, search]);

  const currentData =
    activeTab === "Admins" ? admins : activeTab === "Responders" ? responders : municipalities;

  const currentLoading =
    activeTab === "Admins"
      ? adminsLoading
      : activeTab === "Responders"
        ? respondersLoading
        : municipalitiesLoading;

  const currentHeaders =
    activeTab === "Admins"
      ? ["ID", "First Name", "Last Name", "Email", "Phone"]
      : activeTab === "Responders"
        ? ["ID", "Unit #", "Region", "Status", "Email", "Phone"]
        : ["ID", "Name", "Region", "Code", "Email", "Phone"];

  const renderAdminRow = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.cell, styles.cellId]}>{item.admin_id}</Text>
      <Text style={[styles.cell, styles.cellSmall]}>{item.admin_fname}</Text>
      <Text style={[styles.cell, styles.cellSmall]}>{item.admin_lname}</Text>
      <Text style={[styles.cell, styles.cellMedium]}>{item.user?.user_email || "-"}</Text>
      <Text style={[styles.cell, styles.cellSmall]}>{item.user?.user_phone || "-"}</Text>
      <View style={styles.actionsCell}>
        <TouchableOpacity
          style={styles.deactivateBtn}
          onPress={() => openDeactivateConfirm(item, "Admins")}
        >
          <Text style={styles.actionBtnText}>Deactivate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderResponderRow = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.cell, styles.cellId]}>{item.responder_id}</Text>
      <Text style={[styles.cell, styles.cellSmall]}>{item.unit_nb}</Text>
      <Text style={[styles.cell, styles.cellSmall]}>{item.assigned_region}</Text>
      <Text style={[styles.cell, styles.cellSmall]}>{item.responder_status}</Text>
      <Text style={[styles.cell, styles.cellMedium]}>{item.user?.user_email || "-"}</Text>
      <Text style={[styles.cell, styles.cellSmall]}>{item.user?.user_phone || "-"}</Text>
      <View style={styles.actionsCell}>
        <TouchableOpacity
          style={styles.deactivateBtn}
          onPress={() => openDeactivateConfirm(item, "Responders")}
        >
          <Text style={styles.actionBtnText}>Deactivate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.updateBtn}
          onPress={() => openUpdateModal("Responders", item)}
        >
          <Text style={styles.actionBtnText}>Update</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMunicipalityRow = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.cell, styles.cellId]}>{item.municipality_id}</Text>
      <Text style={[styles.cell, styles.cellSmall]}>{item.municipality_name}</Text>
      <Text style={[styles.cell, styles.cellSmall]}>{item.region_name}</Text>
      <Text style={[styles.cell, styles.cellSmall]}>{item.municipality_code}</Text>
      <Text style={[styles.cell, styles.cellMedium]}>{item.user?.user_email || "-"}</Text>
      <Text style={[styles.cell, styles.cellSmall]}>{item.user?.user_phone || "-"}</Text>
      <View style={styles.actionsCell}>
        <TouchableOpacity
          style={styles.deactivateBtn}
          onPress={() => openDeactivateConfirm(item, "Municipalities")}
        >
          <Text style={styles.actionBtnText}>Deactivate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.updateBtn}
          onPress={() => openUpdateModal("Municipalities", item)}
        >
          <Text style={styles.actionBtnText}>Update</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCurrentRow =
    activeTab === "Admins"
      ? renderAdminRow
      : activeTab === "Responders"
        ? renderResponderRow
        : renderMunicipalityRow;

  const currentError = adminsError || respondersError || municipalitiesError;
  const emailError = mode === "add" ? validateEmail(formData.user_email || "") : null;
  const passwordError = mode === "add" ? validateCreationPassword(formData.user_password || "") : null;

  const renderTabContent = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{activeTab}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openAddModal(activeTab)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tableWrapper}>
          <View style={styles.tableHeader}>
            {currentHeaders.map((header) => {
              let style;

              if (header === "ID") {
                style = [styles.headerCell, styles.cellId];
              } else if (header === "Email") {
                style = [styles.headerCell, styles.cellMedium];
              } else {
                style = [styles.headerCell, styles.cellSmall];
              }

              return (
                <Text key={header} style={style}>
                  {header}
                </Text>
              );
            })}
            <Text style={styles.headerActionsCell}>Actions</Text>
          </View>

          {currentLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : currentData.length === 0 ? (
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} found</Text>
          ) : (
            <FlatList
              data={currentData}
              keyExtractor={(item) => item.admin_id || item.responder_id || item.municipality_id}
              renderItem={renderCurrentRow}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );

  const renderModalContent = () => {
    if (modalType === "Admins") {
      const checks = passwordChecks(formData.user_password || "");
      return (
        <>
          <Text style={styles.modalTitle}>Add Admin</Text>

          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={formData.admin_fname || ""}
            onChangeText={(t) => handleChange("admin_fname", t)}
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={formData.admin_lname || ""}
            onChangeText={(t) => handleChange("admin_lname", t)}
          />

          <TextInput
            style={[styles.input, formData.user_email?.length > 0 && emailError ? { borderColor: "#DC2626" } : null]}
            placeholder="Email"
            value={formData.user_email || ""}
            onChangeText={(t) => handleChange("user_email", t)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <FieldError msg={formData.user_email?.length > 0 ? emailError : null} />

          <TextInput
            style={[styles.input, formData.user_password?.length > 0 && passwordError ? { borderColor: "#DC2626" } : null]}
            placeholder="Password"
            value={formData.user_password || ""}
            onChangeText={(t) => handleChange("user_password", t)}
            secureTextEntry
          />
          {formData.user_password?.length > 0 && (
            <>
              <FieldError msg={passwordError} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: -6, marginBottom: 12, flexWrap: "wrap" }}>
                {[
                  { check: checks.min, label: "8+ chars" },
                  { check: checks.upper, label: "Uppercase" },
                  { check: checks.number, label: "Number" },
                  { check: checks.symbol, label: "Symbol" },
                ].map((item) => (
                  <View key={item.label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.check ? "#EC7742" : "rgba(0,0,0,0.15)" }} />
                    <Text style={{ fontSize: 10, color: item.check ? "#EC7742" : "rgba(0,0,0,0.35)" }}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Phone"
            value={formData.user_phone || ""}
            onChangeText={(t) => handleChange("user_phone", t)}
            keyboardType="phone-pad"
          />
        </>
      );
    }

    if (modalType === "Responders") {
      const checks = passwordChecks(formData.user_password || "");
      return (
        <>
          <Text style={styles.modalTitle}>{mode === "add" ? "Add Responder" : "Update Responder"}</Text>

          <TextInput
            style={styles.input}
            placeholder="Unit Number"
            value={formData.unit_nb || ""}
            onChangeText={(t) => handleChange("unit_nb", t)}
          />

          <Text style={{ fontSize: 12, fontWeight: "700", color: "#0f172a", marginBottom: 8 }}>
            Assigned Region
          </Text>

          <TouchableOpacity
            onPress={() => setRegionDropdownOpen((prev) => !prev)}
            style={[
              styles.input,
              {
                minHeight: 48,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: regionDropdownOpen ? 8 : 12,
              },
            ]}
          >
            <Text
              style={{
                color: formData.assigned_region ? "#0f172a" : "rgba(0,0,0,0.35)",
                flex: 1,
              }}
              numberOfLines={1}
            >
              {formData.assigned_region || "Select a region"}
            </Text>

            <Text style={{ color: "#64748b", fontSize: 16 }}>
              {regionDropdownOpen ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          {regionDropdownOpen && (
            <View
              style={{
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
              }}
            >
              <ScrollView
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 220 }}
              >
                {regionOptions.length === 0 ? (
                  <Text style={{ padding: 12, color: "#64748b" }}>No existing regions found</Text>
                ) : (
                  regionOptions.map((region, index) => (
                    <TouchableOpacity
                      key={region}
                      onPress={() => {
                        handleChange("assigned_region", region);
                        setRegionDropdownOpen(false);
                      }}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        backgroundColor:
                          formData.assigned_region === region ? "#FFF1D6" : "#ffffff",
                        borderBottomWidth: index === regionOptions.length - 1 ? 0 : 1,
                        borderBottomColor: "#f1f5f9",
                      }}
                    >
                      <Text
                        style={{
                          color:
                            formData.assigned_region === region ? "#EC7742" : "#334155",
                          fontWeight: formData.assigned_region === region ? "700" : "500",
                        }}
                      >
                        {region}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}

          <TextInput
            style={styles.input}
            placeholder="Or type a new region"
            value={formData.assigned_region || ""}
            onChangeText={(t) => handleChange("assigned_region", t)}
          />

          <TextInput
            style={styles.input}
            placeholder="Unit Latitude"
            value={formData.unit_latitude || ""}
            onChangeText={(t) => handleChange("unit_latitude", t)}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Unit Longitude"
            value={formData.unit_longitude || ""}
            onChangeText={(t) => handleChange("unit_longitude", t)}
            keyboardType="numeric"
          />

          {mode === "add" ? (
            <>
              <TextInput
                style={[styles.input, formData.user_email?.length > 0 && emailError ? { borderColor: "#DC2626" } : null]}
                placeholder="Email"
                value={formData.user_email || ""}
                onChangeText={(t) => handleChange("user_email", t)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <FieldError msg={formData.user_email?.length > 0 ? emailError : null} />

              <TextInput
                style={[styles.input, formData.user_password?.length > 0 && passwordError ? { borderColor: "#DC2626" } : null]}
                placeholder="Password"
                value={formData.user_password || ""}
                onChangeText={(t) => handleChange("user_password", t)}
                secureTextEntry
              />
              {formData.user_password?.length > 0 && (
                <>
                  <FieldError msg={passwordError} />
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: -6, marginBottom: 12, flexWrap: "wrap" }}>
                    {[
                      { check: checks.min, label: "8+ chars" },
                      { check: checks.upper, label: "Uppercase" },
                      { check: checks.number, label: "Number" },
                      { check: checks.symbol, label: "Symbol" },
                    ].map((item) => (
                      <View key={item.label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.check ? "#EC7742" : "rgba(0,0,0,0.15)" }} />
                        <Text style={{ fontSize: 10, color: item.check ? "#EC7742" : "rgba(0,0,0,0.35)" }}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={formData.user_phone || ""}
                onChangeText={(t) => handleChange("user_phone", t)}
                keyboardType="phone-pad"
              />
            </>
          ) : (
            <>
              <TextInput style={styles.input} value={formData.user_email || ""} editable={false} />
              <TextInput style={styles.input} value={formData.user_phone || ""} editable={false} />
            </>
          )}
        </>
      );
    }

    if (modalType === "Municipalities") {
      const checks = passwordChecks(formData.user_password || "");
      return (
        <>
          <Text style={styles.modalTitle}>{mode === "add" ? "Add Municipality" : "Update Municipality"}</Text>

          <TextInput
            style={styles.input}
            placeholder="Municipality Name"
            value={formData.municipality_name || ""}
            onChangeText={(t) => handleChange("municipality_name", t)}
          />
          <TextInput
            style={styles.input}
            placeholder="Region Name"
            value={formData.region_name || ""}
            onChangeText={(t) => handleChange("region_name", t)}
          />
          <TextInput
            style={styles.input}
            placeholder="Municipality Code"
            value={formData.municipality_code || ""}
            onChangeText={(t) => handleChange("municipality_code", t)}
          />
          <TextInput
            style={styles.input}
            placeholder="Municipality Latitude"
            value={formData.municipality_latitude || ""}
            onChangeText={(t) => handleChange("municipality_latitude", t)}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Municipality Longitude"
            value={formData.municipality_longitude || ""}
            onChangeText={(t) => handleChange("municipality_longitude", t)}
            keyboardType="numeric"
          />

          {mode === "add" ? (
            <>
              <TextInput
                style={[styles.input, formData.user_email?.length > 0 && emailError ? { borderColor: "#DC2626" } : null]}
                placeholder="Email"
                value={formData.user_email || ""}
                onChangeText={(t) => handleChange("user_email", t)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <FieldError msg={formData.user_email?.length > 0 ? emailError : null} />

              <TextInput
                style={[styles.input, formData.user_password?.length > 0 && passwordError ? { borderColor: "#DC2626" } : null]}
                placeholder="Password"
                value={formData.user_password || ""}
                onChangeText={(t) => handleChange("user_password", t)}
                secureTextEntry
              />
              {formData.user_password?.length > 0 && (
                <>
                  <FieldError msg={passwordError} />
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: -6, marginBottom: 12, flexWrap: "wrap" }}>
                    {[
                      { check: checks.min, label: "8+ chars" },
                      { check: checks.upper, label: "Uppercase" },
                      { check: checks.number, label: "Number" },
                      { check: checks.symbol, label: "Symbol" },
                    ].map((item) => (
                      <View key={item.label} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.check ? "#EC7742" : "rgba(0,0,0,0.15)" }} />
                        <Text style={{ fontSize: 10, color: item.check ? "#EC7742" : "rgba(0,0,0,0.35)" }}>{item.label}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={formData.user_phone || ""}
                onChangeText={(t) => handleChange("user_phone", t)}
                keyboardType="phone-pad"
              />
            </>
          ) : (
            <>
              <TextInput style={styles.input} value={formData.user_email || ""} editable={false} />
              <TextInput style={styles.input} value={formData.user_phone || ""} editable={false} />
            </>
          )}
        </>
      );
    }

    return null;
  };

  if (currentError) {
    return (
      <View style={styles.container}>
        <Text style={styles.mainTitle}>Admin Dashboard</Text>
        <Text style={styles.errorText}>
          {currentError?.message || "Failed to load dashboard data."}
        </Text>
      </View>
    );
  }

  const confirmEmailError = validateEmail(confirmEmail);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.topBarLogoWrap}>
          <View style={styles.topBarLogoIcon}>
            <Image
              source={Platform.OS === 'web'
                ? { uri: '/EshMagan_Logo-Badge.png' }
                : { uri: 'eshmagan_logo_badge' }}
              style={styles.topBarLogoImage}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.topBarTitle}>EshMagan</Text>
            <Text style={styles.topBarSubtitle}>Admin Dashboard</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: activeTab === tab ? "#EC7742" : "#fff",
              borderWidth: 1,
              borderColor: activeTab === tab ? "#EC7742" : "#e2e8f0",
            }}
          >
            <Text style={{ color: activeTab === tab ? "#fff" : "#334155", fontWeight: "700" }}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder={`Search ${activeTab.toLowerCase()}...`}
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: height * 0.8, minHeight: height * 0.8 }}>
        {renderTabContent()}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {renderModalContent()}

            <View style={[styles.modalActions, { gap: 12 }]}>
              <TouchableOpacity
                style={[styles.cancelBtn, { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 44 }]}
                onPress={closeModal}
                disabled={isBusy}
              >
                <Text style={[styles.cancelBtnText, { textAlign: "center", lineHeight: 20 }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 44 }]}
                onPress={handleSave}
                disabled={isBusy}
              >
                <Text style={[styles.saveBtnText, { textAlign: "center", lineHeight: 20 }]}>
                  {isBusy ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirm Deactivation</Text>
            <Text style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>
              Enter your admin email and password to confirm deactivation.
            </Text>

            <TextInput
              style={[styles.input, confirmEmail.length > 0 && confirmEmailError ? { borderColor: "#DC2626" } : null]}
              placeholder="Admin Email"
              value={confirmEmail}
              onChangeText={(v) => {
                setConfirmEmail(v.toLowerCase().trim());
                setConfirmError("");
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <FieldError msg={confirmEmail.length > 0 ? confirmEmailError : null} />

            <TextInput
              style={[styles.input, confirmError ? { borderColor: "#DC2626" } : null]}
              placeholder="Password"
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                setConfirmError("");
              }}
              secureTextEntry
            />

            {confirmError ? (
              <View
                style={{
                  backgroundColor: "#FFF1D6",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 16,
                  borderLeftWidth: 3,
                  borderLeftColor: "#DC2626",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 14 }}>⚠️</Text>
                <Text style={{ fontSize: 13, color: "#DC2626", fontWeight: "600", flex: 1 }}>
                  {confirmError}
                </Text>
              </View>
            ) : null}

            <View style={[styles.modalActions, { gap: 12 }]}>
              <TouchableOpacity
                style={[styles.cancelBtn, { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 44 }]}
                onPress={closeDeactivateConfirm}
                disabled={confirmLoading}
              >
                <Text style={[styles.cancelBtnText, { textAlign: "center", lineHeight: 20 }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 44 }]}
                onPress={handleConfirmDeactivate}
                disabled={confirmLoading}
              >
                <Text style={[styles.saveBtnText, { textAlign: "center", lineHeight: 20 }]}>
                  {confirmLoading ? "Verifying..." : "Confirm"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}