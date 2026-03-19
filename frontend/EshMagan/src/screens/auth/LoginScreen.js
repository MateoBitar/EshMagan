// src/screens/auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/screens/LoginScreen.styles';

const TRUST_BADGES = [
  { emoji: '🔒', title: 'AES-256', sub: 'Encrypted' },
  { emoji: '🛡️', title: 'GDPR', sub: 'Compliant' },
];

const PRIVACY_ITEMS = [
  'Location tracking for emergency alerts and evacuation guidance',
  'Identity verification for secure access to critical systems',
  'End-to-end encrypted data transmission',
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
          <View style={{ flex: 1, maxWidth: 480, width: '100%', alignSelf: 'center' }}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🔥</Text>
            </View>
            <Text style={styles.appName}>EshMagan</Text>
            <Text style={styles.tagline}>Wildfire Alert & Preparedness System</Text>
          </View>

          <View style={styles.card}>

            {/* Email */}
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="your.email@example.com"
              placeholderTextColor="rgba(0,0,0,0.25)"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            {/* Password */}
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="rgba(0,0,0,0.25)"
              secureTextEntry
              style={styles.input}
            />

            {/* Privacy box — tangerine bg, white text */}
            <View style={styles.privacyBox}>
              <View style={styles.privacyHeader}>
                <Text style={{ fontSize: 14 }}>🛡️</Text>
                <Text style={styles.privacyTitle}>Privacy & Data Protection</Text>
              </View>
              {PRIVACY_ITEMS.map((item, i) => (
                <View key={i} style={styles.privacyItem}>
                  <Text style={styles.privacyCheck}>✓</Text>
                  <Text style={styles.privacyItemText}>{item}</Text>
                </View>
              ))}
              <View style={styles.consentRow}>
                <View style={[styles.checkbox, styles.checkboxChecked]}>
                  <Text style={styles.checkboxTick}>✓</Text>
                </View>
                <Text style={styles.consentText}>
                  Consent given at registration — you've already agreed to data processing for emergency response.
                </Text>
              </View>
            </View>

            {/* Trust badges — FFF1D6 background behind icons */}
            <View style={styles.trustBadges}>
              {TRUST_BADGES.map(badge => (
                <View key={badge.title} style={styles.trustBadge}>
                  <View style={styles.trustIcon}>
                    <Text style={{ fontSize: 14 }}>{badge.emoji}</Text>
                  </View>
                  <View>
                    <Text style={styles.trustLabel}>{badge.title}</Text>
                    <Text style={styles.trustSub}>{badge.sub}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={!canLogin || loading}
              style={[styles.loginBtn, styles.loginBtnActive]}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginBtnText}>🔐  Secure Login to EshMagan</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => nav?.navigate ? nav.navigate('Register') : nav?.navigate?.('Register')}
              style={{ alignItems: 'center', marginTop: 14 }}
            >
              <Text style={{ fontSize: 13, color: 'rgba(0,0,0,0.5)' }}>
                New resident?{'  '}
                <Text style={{ color: '#DC2626', fontWeight: '700' }}>Create Account</Text>
              </Text>
            </TouchableOpacity>

          </View>

          <Text style={styles.footer}>Services operating under secure protocols • Available 24/7</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
