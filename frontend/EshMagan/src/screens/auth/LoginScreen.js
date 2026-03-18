// src/screens/auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/screens/LoginScreen.styles';

const TRUST_BADGES = [
  { bg: '#dcfce7', emoji: '🔒', title: 'Data Encrypted', sub: 'AES-256', titleColor: '#15803d', subColor: '#16a34a' },
  { bg: '#dbeafe', emoji: '🛡️', title: 'GDPR Compliant', sub: 'Consent Active', titleColor: '#1d4ed8', subColor: '#2563eb' },
];

const PRIVACY_ITEMS = [
  'Location tracking for emergency alerts and evacuation guidance',
  'Identity verification for secure access to critical systems',
  'End-to-end encrypted data transmission',
  'Municipality-only access to sensitive fire prediction data',
];

export default function LoginScreen({ navigation }) {
  let nav = navigation;
  if (Platform.OS !== 'web') {
    try { const { useNavigation } = require('@react-navigation/native'); nav = useNavigation(); } catch {}
  }
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const canLogin = email && password;

  const handleLogin = async () => {
    if (!canLogin) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      if (Platform.OS === 'web') {
        window.alert('Login Failed: ' + (e.message || 'Invalid credentials. Please try again.'));
      } else {
        Alert.alert('Login Failed', e.message || 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🔥</Text>
            </View>
            <Text style={styles.appName}>EshMagan</Text>
            <Text style={styles.tagline}>Wildfire Alert & Preparedness System</Text>
            <Text style={styles.subtitle}>Protecting communities through intelligent fire detection</Text>
          </View>

          <View style={styles.card}>

            {/* Email */}
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="your.email@example.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            {/* Password */}
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              style={styles.input}
            />

            {/* Privacy notice — read only, already agreed at registration */}
            <View style={styles.privacyBox}>
              <View style={styles.privacyHeader}>
                <Text style={{ fontSize: 18 }}>🛡️</Text>
                <Text style={styles.privacyTitle}>Privacy & Data Protection</Text>
              </View>
              {PRIVACY_ITEMS.map((item, i) => (
                <View key={i} style={styles.privacyItem}>
                  <Text style={styles.privacyCheck}>✓</Text>
                  <Text style={styles.privacyItemText}>{item}</Text>
                </View>
              ))}
              {/* Pre-agreed consent — locked, not interactive */}
              <View style={[styles.consentRow, { opacity: 0.7 }]}>
                <View style={[styles.checkbox, styles.checkboxChecked]}>
                  <Text style={styles.checkboxTick}>✓</Text>
                </View>
                <Text style={styles.consentText}>
                  Consent given at registration — you've already agreed to location tracking, identity verification, and data processing for emergency response purposes.
                </Text>
              </View>
            </View>

            {/* Trust Badges */}
            <View style={styles.trustBadges}>
              {TRUST_BADGES.map(badge => (
                <View key={badge.title} style={styles.trustBadge}>
                  <View style={[styles.trustIcon, { backgroundColor: badge.bg }]}><Text>{badge.emoji}</Text></View>
                  <View>
                    <Text style={[styles.trustLabel, { color: badge.titleColor }]}>{badge.title}</Text>
                    <Text style={[styles.trustSub, { color: badge.subColor }]}>{badge.sub}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={!canLogin || loading}
              style={[styles.loginBtn, canLogin ? styles.loginBtnActive : styles.loginBtnDisabled]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginBtnText}>🔐  Secure Login to EshMagan</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation?.navigate ? navigation.navigate('Register') : navigation?.navigate?.('Register')}
              style={{ alignItems: 'center', marginTop: 8, marginBottom: 4 }}
            >
              <Text style={{ fontSize: 13, color: '#64748b' }}>
                New resident? <Text style={{ color: '#dc2626', fontWeight: '600' }}>Create Account</Text>
              </Text>
            </TouchableOpacity>
            <Text style={styles.footer}>Emergency services operating under secure protocols • Available 24/7</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
