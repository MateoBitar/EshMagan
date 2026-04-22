// src/screens/resident/ResidentProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { global } from '../../styles/global';
import { gqlFetch } from '../../services/api';
import styles from '../../styles/screens/ResidentProfileScreen.styles';
import logoSource from '../../images/logoSource';

const GET_RESIDENT_BY_ID = `
  query GetResidentById($resident_id: ID!) {
    getResidentById(resident_id: $resident_id) {
      resident_id
      resident_fname
      resident_lname
      resident_dob
      user {
        user_id
        user_email
        user_phone
        user_role
        isactive
      }
    }
  }
`;

const UPDATE_RESIDENT_PROFILE = `
  mutation UpdateResidentProfile($resident_id: ID!, $input: UpdateResidentInput!) {
    updateResident(resident_id: $resident_id, input: $input) {
      resident_id
      resident_fname
      resident_lname
      resident_dob
      user {
        user_id
        user_email
        user_phone
        user_role
        isactive
      }
    }
  }
`;

const UPDATE_USER_PROFILE = `
  mutation UpdateUserProfile($user_id: ID!, $input: UpdateUserInput!) {
    updateUser(user_id: $user_id, input: $input) {
      user_id
      user_email
      user_phone
      user_role
      isactive
    }
  }
`;

const DEACTIVATE_RESIDENT = `
  mutation DeactivateResident($resident_id: ID!) {
    deactivateResident(resident_id: $resident_id)
  }
`;

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

function SettingRow({
  emoji,
  label,
  value,
  badgeStyle,
  badgeTextStyle,
  isLast = false,
}) {
  return (
    <View style={[styles.settingRow, isLast && styles.settingRowLast]}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingEmoji}>{emoji}</Text>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>

      <View style={[styles.settingBadge, badgeStyle]}>
        <Text style={[styles.settingBadgeText, badgeTextStyle]}>{value}</Text>
      </View>
    </View>
  );
}

export default function ResidentProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    resident_fname: '',
    resident_lname: '',
    resident_dob: '',
    user_email: '',
    user_phone: '',
  });

  const resolveResidentId = () => {
    if (typeof user === 'string') return user;
    return user?.user_id || user?.id || user?.resident_id || user?.user?.user_id || '';
  };

  const syncForm = data => {
    setForm({
      resident_fname: data?.resident_fname || '',
      resident_lname: data?.resident_lname || '',
      resident_dob: data?.resident_dob || '',
      user_email: data?.user?.user_email || '',
      user_phone: data?.user?.user_phone || '',
    });
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const residentId = resolveResidentId();

      if (!residentId) {
        setProfile(null);
        return;
      }

      const data = await gqlFetch(GET_RESIDENT_BY_ID, {
        resident_id: residentId,
      });

      const resident = data?.getResidentById || null;
      setProfile(resident);

      if (resident) {
        syncForm(resident);
      }
    } catch (e) {
      console.error('Fetch resident profile error:', e);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleCancelEdit = () => {
    if (profile) syncForm(profile);
    setEditMode(false);
  };

  const handleUpdate = async () => {
    if (!profile?.resident_id || !profile?.user?.user_id) {
      Alert.alert('Error', 'Profile identifiers not found.');
      return;
    }

    try {
      setSaving(true);

      const residentInput = {};
      const userInput = {};

      if (form.resident_fname.trim() !== (profile?.resident_fname || '')) {
        residentInput.resident_fname = form.resident_fname.trim();
      }

      if (form.resident_lname.trim() !== (profile?.resident_lname || '')) {
        residentInput.resident_lname = form.resident_lname.trim();
      }

      if (form.resident_dob.trim() !== (profile?.resident_dob || '')) {
        residentInput.resident_dob = form.resident_dob.trim();
      }

      if (form.user_email.trim() !== (profile?.user?.user_email || '')) {
        userInput.user_email = form.user_email.trim();
      }

      if (form.user_phone.trim() !== (profile?.user?.user_phone || '')) {
        userInput.user_phone = form.user_phone.trim();
      }

      if (!Object.keys(residentInput).length && !Object.keys(userInput).length) {
        setEditMode(false);
        return;
      }

      let updatedResident = profile;
      let updatedUser = profile?.user;

      if (Object.keys(residentInput).length) {
        const residentResult = await gqlFetch(UPDATE_RESIDENT_PROFILE, {
          resident_id: profile.resident_id,
          input: residentInput,
        });
        updatedResident = residentResult?.updateResident || updatedResident;
      }

      if (Object.keys(userInput).length) {
        const userResult = await gqlFetch(UPDATE_USER_PROFILE, {
          user_id: profile.user.user_id,
          input: userInput,
        });
        updatedUser = userResult?.updateUser || updatedUser;
      }

      const mergedProfile = {
        ...(updatedResident || profile),
        user: {
          ...(updatedResident?.user || profile?.user || {}),
          ...(updatedUser || {}),
        },
      };

      setProfile(mergedProfile);
      syncForm(mergedProfile);
      setEditMode(false);
    } catch (e) {
      console.error('Update profile error:', e);
      if (Platform.OS === 'web') {
        window.alert('Failed to update profile.');
      } else {
        Alert.alert('Error', 'Failed to update profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) logout();
      return;
    }

    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSignOut = () => {
    const confirmAction = async () => {
      try {
        await gqlFetch(DEACTIVATE_RESIDENT, {
          resident_id: profile?.resident_id,
        });

        if (Platform.OS === 'web') {
          window.alert('Account deactivated successfully.');
        } else {
          Alert.alert('Account Deactivated', 'Your account has been deactivated.');
        }

        logout();
      } catch (e) {
        console.error('Deactivate resident error:', e);
        if (Platform.OS === 'web') {
          window.alert('Failed to deactivate account.');
        } else {
          Alert.alert('Error', 'Failed to deactivate account.');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to deactivate your account?')) {
        confirmAction();
      }
      return;
    }

    Alert.alert(
      'Deactivate Account',
      'Are you sure you want to deactivate your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deactivate', style: 'destructive', onPress: confirmAction },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={global.loaderScreen}>
        <ActivityIndicator size="large" color="#EC7742" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No profile found</Text>
          <Text style={styles.emptyDesc}>
            Resident ID used: {resolveResidentId() || 'EMPTY'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const fullName =
    `${profile.resident_fname || ''} ${profile.resident_lname || ''}`.trim() || 'Resident User';
  const role = profile?.user?.user_role || 'Resident';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation?.goBack?.()}
              style={styles.backButton}
              hitSlop={styles.backHitSlop}
            >
              <Text style={styles.backText}>{'‹ Back'}</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Profile</Text>

            <View style={styles.navSpacer} pointerEvents="none" />
          </View>
        </View>

        <View style={styles.avatarCard}>
          <View style={styles.logoIcon}>
            <Image
              source={logoSource}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.userName}>{fullName}</Text>
          <Text style={styles.userEmail}>{profile?.user?.user_email || '—'}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{role}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoHeaderTitle}>Personal Information</Text>

            {!editMode ? (
              <TouchableOpacity onPress={() => setEditMode(true)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>Edit Info</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {!editMode ? (
            <View>
              <InfoRow label="First Name" value={profile?.resident_fname} />
              <InfoRow label="Last Name" value={profile?.resident_lname} />
              <InfoRow label="Email" value={profile?.user?.user_email} />
              <InfoRow label="Phone" value={profile?.user?.user_phone} />
              <InfoRow label="Role" value={profile?.user?.user_role} />
              <InfoRow label="Active" value={profile?.user?.isactive ? 'Yes' : 'No'} />
              <InfoRow label="Date of Birth" value={profile?.resident_dob} />
            </View>
          ) : (
            <View>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                value={form.resident_fname}
                onChangeText={text => setField('resident_fname', text)}
                placeholder="Enter first name"
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                value={form.resident_lname}
                onChangeText={text => setField('resident_lname', text)}
                placeholder="Enter last name"
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                value={form.user_email}
                onChangeText={text => setField('user_email', text)}
                placeholder="Enter email"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                value={form.user_phone}
                onChangeText={text => setField('user_phone', text)}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
                style={styles.input}
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TextInput
                value={form.resident_dob}
                onChangeText={text => setField('resident_dob', text)}
                placeholder="Enter date of birth"
                style={[styles.input, styles.lastInput]}
                placeholderTextColor="#94a3b8"
              />

              <View style={styles.formActions}>
                <TouchableOpacity
                  onPress={handleUpdate}
                  disabled={saving}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>
                    {saving ? 'Updating...' : 'Update'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCancelEdit}
                  disabled={saving}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.settingsCard}>
          <SettingRow
            emoji="📍"
            label="Location Tracking"
            value="Active"
            badgeStyle={styles.badgeSuccess}
            badgeTextStyle={styles.badgeSuccessText}
          />
          <SettingRow
            emoji="🔔"
            label="Push Notifications"
            value="Enabled"
            badgeStyle={styles.badgeSuccess}
            badgeTextStyle={styles.badgeSuccessText}
          />
          <SettingRow
            emoji="🔒"
            label="Data Encryption"
            value="Active"
            badgeStyle={styles.badgeInfo}
            badgeTextStyle={styles.badgeInfoText}
          />
          <SettingRow
            emoji="🚨"
            label="Emergency Alerts"
            value="On"
            badgeStyle={styles.badgeDanger}
            badgeTextStyle={styles.badgeDangerText}
            isLast
          />
        </View>

        <View style={styles.bottomActionsWrap}>
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.signOutBtn]}
              onPress={handleSignOut}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.logoutBtn]}
              onPress={handleLogout}
            >
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}