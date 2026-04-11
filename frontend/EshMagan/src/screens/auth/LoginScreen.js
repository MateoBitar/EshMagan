// src/screens/auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView,
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

const KNOWN_DOMAINS = [
  'gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com',
  'live.com','msn.com','protonmail.com','proton.me','mail.com',
  'aol.com','ymail.com','googlemail.com','me.com','mac.com', 'eshmagan.com',
  'hotmail.fr','hotmail.co.uk','yahoo.fr','yahoo.co.uk','yahoo.com.au',
  'edu.lb','ul.edu.lb','balamand.edu.lb','usj.edu.lb','lau.edu.lb',
];

function validateEmail(email) {
  if (!email) return null;
  const match = email.match(/^[^\s@]+@([^\s@]+)$/);
  if (!match) return 'Enter a valid email address';
  const domain = match[1].toLowerCase();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return 'Enter a valid email address';
  const isKnown = KNOWN_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
  if (!isKnown) return `Unrecognized provider — is "${domain}" correct?`;
  return null;
}

export default function LoginScreen({ navigation }) {
  let nav = navigation;
  if (Platform.OS !== 'web') {
    try { const { useNavigation } = require('@react-navigation/native'); nav = useNavigation(); } catch {}
  }

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const emailError = validateEmail(email);
  const canLogin = email && password && !emailError;

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoginError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (e) {
      setLoginError(
        e.message?.includes('Invalid credentials')
          ? 'Incorrect email or password. Please try again.'
          : e.message || 'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ maxWidth: 480, width: '100%', alignSelf: 'center' }}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoEmoji}>🔥</Text>
              </View>
              <Text style={styles.appName}>EshMagan</Text>
              <Text style={styles.tagline}>Wildfire Alert & Preparedness System</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <TextInput
                value={email}
                onChangeText={v => {
                  setEmail(v.toLowerCase().trim());
                  setLoginError('');
                }}
                placeholder="your.email@example.com"
                placeholderTextColor="rgba(0,0,0,0.25)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.input,
                  email.length > 0 && emailError ? { borderColor: '#DC2626' } : {},
                ]}
              />
              {email.length > 0 && emailError && (
                <Text style={{ fontSize: 11, color: '#DC2626', marginTop: -12, marginBottom: 12 }}>
                  {emailError}
                </Text>
              )}

              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput
                value={password}
                onChangeText={v => {
                  setPassword(v);
                  setLoginError('');
                }}
                placeholder="••••••••"
                placeholderTextColor="rgba(0,0,0,0.25)"
                secureTextEntry
                style={[styles.input, loginError ? { borderColor: '#DC2626' } : {}]}
              />

              {loginError ? (
                <View
                  style={{
                    backgroundColor: '#FFF1D6',
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 16,
                    borderLeftWidth: 3,
                    borderLeftColor: '#DC2626',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Text style={{ fontSize: 14 }}>⚠️</Text>
                  <Text style={{ fontSize: 13, color: '#DC2626', fontWeight: '600', flex: 1 }}>
                    {loginError}
                  </Text>
                </View>
              ) : null}

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

              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading || !canLogin}
                style={[
                  styles.loginBtn,
                  styles.loginBtnActive,
                  (!canLogin || loading) ? { opacity: 0.7 } : null,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginBtnText}>🔐  Secure Login to EshMagan</Text>
                )}
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

            <Text style={styles.footer}>
              Services operating under secure protocols • Available 24/7
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
