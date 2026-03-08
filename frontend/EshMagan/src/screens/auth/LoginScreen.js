// src/screens/auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/screens/LoginScreen.styles';

const ROLES = [
  { id: 'resident', name: 'Resident', emoji: '👤', description: 'Access fire alerts and evacuation routes', activeBg: '#fef2f2', activeBorder: '#f87171' },
  { id: 'municipality', name: 'Municipality', emoji: '🛡️', description: 'Monitor and manage fire events', activeBg: '#eff6ff', activeBorder: '#60a5fa' },
  { id: 'responder', name: 'First Responder', emoji: '⚠️', description: 'Real-time command and incident management', activeBg: '#fff7ed', activeBorder: '#fb923c' },
  { id: 'admin', name: 'Admin', emoji: '🔒', description: 'System administration and configuration', activeBg: '#faf5ff', activeBorder: '#c084fc' },
];

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

export default function LoginScreen() {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const canLogin = selectedRole && email && password && agreed;

  const handleLogin = async () => {
    if (!canLogin) return;
    setLoading(true);
    try {
      await login(email, password, selectedRole);
    } catch (e) {
      Alert.alert('Login Failed', e.message || 'Invalid credentials. Please try again.');
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

          {/* Card */}
          <View style={styles.card}>

            {/* Role Selection */}
            <Text style={styles.sectionTitle}>Select Your Role</Text>
            <View style={styles.rolesContainer}>
              {ROLES.map(role => {
                const isSelected = selectedRole === role.id;
                return (
                  <TouchableOpacity
                    key={role.id}
                    onPress={() => setSelectedRole(role.id)}
                    style={[
                      styles.roleCard,
                      isSelected
                        ? { borderColor: role.activeBorder, backgroundColor: role.activeBg }
                        : styles.roleCardDefault,
                    ]}
                  >
                    <View style={[styles.roleIconContainer, isSelected ? { backgroundColor: role.activeBg } : styles.roleIconBgDefault]}>
                      <Text style={styles.roleEmoji}>{role.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roleName}>{role.name}</Text>
                      <Text style={styles.roleDesc}>{role.description}</Text>
                    </View>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

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

            {/* Privacy Consent */}
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
              <TouchableOpacity onPress={() => setAgreed(!agreed)} style={styles.consentRow}>
                <View style={[styles.checkbox, agreed ? styles.checkboxChecked : styles.checkboxUnchecked]}>
                  {agreed && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.consentText}>
                  I acknowledge and consent to location tracking, identity verification, and data processing for emergency response purposes.
                </Text>
              </TouchableOpacity>
            </View>

            {/* Trust Badges */}
            <View style={styles.trustBadges}>
              {TRUST_BADGES.map(badge => (
                <View key={badge.title} style={styles.trustBadge}>
                  <View style={[styles.trustIcon, { backgroundColor: badge.bg }]}>
                    <Text>{badge.emoji}</Text>
                  </View>
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

            <Text style={styles.footer}>Emergency services operating under secure protocols • Available 24/7</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
