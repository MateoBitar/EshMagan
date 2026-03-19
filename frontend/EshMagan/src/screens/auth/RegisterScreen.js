// src/screens/auth/RegisterScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  SafeAreaView, Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../services/api';
import { requestLocationPermission, startLocationTracking } from '../../services/location.service';
import styles from '../../styles/screens/LoginScreen.styles';

const PRIVACY_ITEMS = [
  'Location tracking for emergency alerts and evacuation guidance',
  'Identity verification for secure access to critical systems',
  'End-to-end encrypted data transmission',
  'Municipality-only access to sensitive fire prediction data',
];

async function getPlaceName(latitude, longitude) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    const addr = data.address || {};
    return (
      addr.university || addr.building || addr.amenity ||
      addr.neighbourhood || addr.suburb || addr.village ||
      addr.town || addr.city || addr.county ||
      data.display_name?.split(',')[0] || 'Unknown location'
    );
  } catch { return 'Location detected'; }
}

export default function RegisterScreen({ navigation }) {
  let nav = navigation;
  if (Platform.OS !== 'web') {
    try { const { useNavigation } = require('@react-navigation/native'); nav = useNavigation(); } catch {}
  }

  const { login } = useAuth();
  const [form, setForm] = useState({
    user_email: '', user_password: '', confirmPassword: '',
    user_phone: '', resident_fname: '', resident_lname: '',
    resident_dob: '', resident_idnb: '',
  });
  const [idPhoto, setIdPhoto] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [placeName, setPlaceName] = useState('');

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const personalInfoDone = !!(form.resident_fname && form.resident_lname && form.resident_dob && form.resident_idnb && form.user_phone);
  const accountDone = !!(form.user_email && form.user_password && form.confirmPassword);
  const canRegister = agreed && locationGranted && idPhoto && personalInfoDone && accountDone;

  const handleWebFilePick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setPhotoLoading(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUri = ev.target.result;
        setIdPhoto({ uri: dataUri, base64: dataUri.split(',')[1], type: file.type || 'image/jpeg', fileName: file.name });
        setPhotoLoading(false);
      };
      reader.onerror = () => { window.alert('Failed to read file'); setPhotoLoading(false); };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handlePickPhoto = async (fromCamera = false) => {
    setPhotoLoading(true);
    try {
      const { launchCamera, launchImageLibrary } = require('react-native-image-picker');
      const options = { mediaType: 'photo', quality: 0.7, includeBase64: true, maxWidth: 1024, maxHeight: 1024 };
      const result = fromCamera ? await launchCamera(options) : await launchImageLibrary(options);
      if (result.didCancel || result.errorCode) return;
      const asset = result.assets?.[0];
      if (asset) setIdPhoto({ uri: asset.uri, base64: asset.base64, type: asset.type || 'image/jpeg', fileName: asset.fileName });
    } catch (e) { Alert.alert('Error', 'Failed to pick photo: ' + e.message); }
    finally { setPhotoLoading(false); }
  };

  const showPhotoPicker = () => {
    if (Platform.OS === 'web') { handleWebFilePick(); return; }
    Alert.alert('ID Photo', 'Choose how to add your ID photo', [
      { text: 'Take Photo', onPress: () => handlePickPhoto(true) },
      { text: 'Choose from Gallery', onPress: () => handlePickPhoto(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleConsentToggle = async () => {
    if (agreed) return;
    setLocationLoading(true);
    try {
      const location = await requestLocationPermission();
      setCurrentLocation(location);
      setLocationGranted(true);
      setAgreed(true);
      getPlaceName(location.latitude, location.longitude).then(setPlaceName);
    } catch (e) {
      const msg = 'Location permission is required to use EshMagan.';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Permission Required', msg);
    } finally { setLocationLoading(false); }
  };

  const handleRegister = async () => {
    if (!canRegister) return;
    if (form.user_password !== form.confirmPassword) {
      const msg = 'Passwords do not match';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
      return;
    }
    if (form.user_password.length < 8) {
      const msg = 'Password must be at least 8 characters';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Error', msg);
      return;
    }
    setLoading(true);
    try {
      const idPicData = idPhoto?.base64 ? `data:${idPhoto.type};base64,${idPhoto.base64}` : 'pending';
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: form.user_email, user_password: form.user_password,
          user_phone: form.user_phone, user_role: 'Resident',
          resident_fname: form.resident_fname, resident_lname: form.resident_lname,
          resident_dob: form.resident_dob, resident_idnb: form.resident_idnb,
          resident_idpic: idPicData,
          last_known_location: currentLocation || { latitude: 0, longitude: 0 },
          home_location: currentLocation || { latitude: 0, longitude: 0 },
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Registration failed'); }
      nav?.navigate ? nav.navigate('Login') : nav?.goBack?.();
    } catch (e) {
      const msg = e.message || 'Registration failed. Please try again.';
      Platform.OS === 'web' ? window.alert('Registration Failed: ' + msg) : Alert.alert('Registration Failed', msg);
    } finally { setLoading(false); }
  };

  const CheckItem = ({ label, done }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{
        width: 18, height: 18, borderRadius: 9, borderWidth: 2,
        borderColor: done ? '#EC7742' : 'rgba(236,119,66,0.3)',
        backgroundColor: done ? '#EC7742' : 'transparent',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {done && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text>}
      </View>
      <Text style={{ fontSize: 12, color: done ? '#EC7742' : 'rgba(0,0,0,0.35)', fontWeight: done ? '600' : '400' }}>
        {label}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ maxWidth: 480, width: '100%', alignSelf: 'center' }}>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}><Text style={styles.logoEmoji}>🔥</Text></View>
              <Text style={styles.appName}>EshMagan</Text>
              <Text style={styles.tagline}>Create Your Resident Account</Text>
            </View>

            <View style={styles.card}>

              {/* Personal Info */}
              <Text style={styles.sectionTitle}>Personal Information</Text>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>FIRST NAME</Text>
                  <TextInput value={form.resident_fname} onChangeText={v => set('resident_fname', v)} placeholder="Jane" placeholderTextColor="rgba(0,0,0,0.25)" style={styles.input} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>LAST NAME</Text>
                  <TextInput value={form.resident_lname} onChangeText={v => set('resident_lname', v)} placeholder="Doe" placeholderTextColor="rgba(0,0,0,0.25)" style={styles.input} />
                </View>
              </View>

              <Text style={styles.inputLabel}>DATE OF BIRTH</Text>
              <TextInput value={form.resident_dob} onChangeText={v => set('resident_dob', v)} placeholder="YYYY-MM-DD" placeholderTextColor="rgba(0,0,0,0.25)" style={styles.input} />

              <Text style={styles.inputLabel}>PHONE NUMBER</Text>
              <TextInput value={form.user_phone} onChangeText={v => set('user_phone', v)} placeholder="+961 70 000 000" placeholderTextColor="rgba(0,0,0,0.25)" keyboardType="phone-pad" style={styles.input} />

              <Text style={styles.inputLabel}>NATIONAL ID NUMBER</Text>
              <TextInput value={form.resident_idnb} onChangeText={v => set('resident_idnb', v)} placeholder="e.g. 123456789" placeholderTextColor="rgba(0,0,0,0.25)" style={styles.input} />

              {/* ID Photo */}
              <Text style={styles.inputLabel}>ID PHOTO</Text>
              <TouchableOpacity
                onPress={showPhotoPicker}
                disabled={photoLoading}
                style={{
                  borderWidth: 2,
                  borderColor: idPhoto ? '#EC7742' : 'rgba(236,119,66,0.4)',
                  borderStyle: idPhoto ? 'solid' : 'dashed',
                  borderRadius: 12, height: idPhoto ? 180 : 100,
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16, overflow: 'hidden',
                  backgroundColor: idPhoto ? '#FFF1D6' : '#ffffff',
                }}
              >
                {photoLoading ? <ActivityIndicator color="#EC7742" /> :
                  idPhoto ? (
                    <>
                      <Image source={{ uri: idPhoto.uri }} style={{ width: '100%', height: '100%', borderRadius: 10 }} resizeMode="cover" />
                      <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Tap to change</Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={{ fontSize: 28, marginBottom: 6 }}>📷</Text>
                      <Text style={{ fontSize: 13, color: '#EC7742', fontWeight: '600' }}>Tap to add ID photo</Text>
                      <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', marginTop: 2 }}>Camera or gallery</Text>
                    </>
                  )
                }
              </TouchableOpacity>

              {/* Account Credentials */}
              <Text style={[styles.sectionTitle, { marginTop: 4 }]}>Account Credentials</Text>

              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput value={form.user_email} onChangeText={v => set('user_email', v)} placeholder="your.email@example.com" placeholderTextColor="rgba(0,0,0,0.25)" keyboardType="email-address" autoCapitalize="none" style={styles.input} />

              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput value={form.user_password} onChangeText={v => set('user_password', v)} placeholder="Min. 8 characters" placeholderTextColor="rgba(0,0,0,0.25)" secureTextEntry style={styles.input} />

              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <TextInput value={form.confirmPassword} onChangeText={v => set('confirmPassword', v)} placeholder="Repeat your password" placeholderTextColor="rgba(0,0,0,0.25)" secureTextEntry style={styles.input} />

              {/* Privacy & Location Consent — tangerine bg like login */}
              <View style={styles.privacyBox}>
                <View style={styles.privacyHeader}>
                  <Text style={{ fontSize: 14 }}>🛡️</Text>
                  <Text style={styles.privacyTitle}>Privacy & Location Consent</Text>
                </View>
                {PRIVACY_ITEMS.map((item, i) => (
                  <View key={i} style={styles.privacyItem}>
                    <Text style={styles.privacyCheck}>✓</Text>
                    <Text style={styles.privacyItemText}>{item}</Text>
                  </View>
                ))}
                <TouchableOpacity onPress={handleConsentToggle} style={styles.consentRow} disabled={agreed || locationLoading}>
                  <View style={[styles.checkbox, agreed ? styles.checkboxChecked : styles.checkboxUnchecked]}>
                    {locationLoading
                      ? <ActivityIndicator size="small" color="#EC7742" />
                      : agreed && <Text style={styles.checkboxTick}>✓</Text>
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.consentText}>
                      I consent to location tracking, identity verification, and data processing for emergency response.
                    </Text>
                    {locationGranted ? (
                      <Text style={{ fontSize: 11, color: '#FFF1D6', marginTop: 4, fontWeight: '600' }}>
                        📍 {placeName || 'Detecting location...'}
                      </Text>
                    ) : !locationLoading && (
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                        Tap to request your device location
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Checklist */}
              <View style={{ backgroundColor: '#FFF1D6', borderRadius: 12, padding: 12, marginBottom: 16, gap: 8, borderWidth: 1, borderColor: 'rgba(236,119,66,0.25)' }}>
                <CheckItem label="Personal info & phone filled" done={personalInfoDone} />
                <CheckItem label="ID photo added" done={!!idPhoto} />
                <CheckItem label="Account credentials set" done={accountDone} />
                <CheckItem label="Location & consent granted" done={agreed && locationGranted} />
              </View>

              {/* Register Button — always red */}
              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                style={[styles.loginBtn, styles.loginBtnActive]}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>🔐  Create My Account</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => nav?.navigate ? nav.navigate('Login') : nav?.goBack?.()}
                style={{ alignItems: 'center', marginTop: 14 }}
              >
                <Text style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)' }}>
                  Already have an account?{'  '}
                  <Text style={{ color: '#DC2626', fontWeight: '700' }}>Sign In</Text>
                </Text>
              </TouchableOpacity>

            </View>

            <Text style={styles.footer}>Resident registration only • For other roles contact your municipality</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
