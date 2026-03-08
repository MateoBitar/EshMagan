// src/screens/resident/ResidentHomeScreen.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@apollo/client';
import { GET_FIRES } from '../../services/api';
import styles from '../../styles/screens/ResidentHomeScreen.styles';

const QUICK_ACTIONS = [
  { emoji: '🧭', label: 'Evacuation Routes', screen: 'Evacuation', color: '#3b82f6' },
  { emoji: '📖', label: 'Safety Tips', screen: 'SafetyTips', color: '#8b5cf6' },
  { emoji: '📞', label: 'Emergency Contacts', screen: null, color: '#f97316' },
  { emoji: '⚠️', label: 'Report Fire', screen: null, color: '#ef4444' },
];

const EMERGENCY_CONTACTS = [
  { name: 'Fire Emergency', number: '102', emoji: '🔥', color: '#ef4444' },
  { name: 'Police', number: '100', emoji: '🚔', color: '#3b82f6' },
  { name: 'Medical Emergency', number: '101', emoji: '🚑', color: '#10b981' },
];

const RISK_COLORS = {
  critical: '#dc2626', high: '#ea580c', moderate: '#d97706', low: '#16a34a',
};

export default function ResidentHomeScreen() {
  const navigation = useNavigation();
  const { data, loading } = useQuery(GET_FIRES, { pollInterval: 30000 });

  const fires = data?.fires || [];
  const activeFires = fires.filter(f => f.fire_status === 'Active' || f.fire_status === 'detected');
  const hasActiveThreat = activeFires.length > 0;

  const riskStatus = hasActiveThreat
    ? { message: '⚠️ Active Fire Threat', desc: `${activeFires.length} fire(s) detected nearby` }
    : { message: '✅ You Are Safe', desc: 'No active fire threats in your area' };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header Banner */}
        <View style={hasActiveThreat ? styles.headerBannerDanger : styles.headerBannerSafe}>
          <View style={styles.headerRow}>
            <View style={styles.headerLogoWrap}>
              <View style={styles.headerLogoIcon}>
                <Text style={styles.headerLogoEmoji}>🔥</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>EshMagan</Text>
                <Text style={styles.headerSub}>Resident Portal</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Alert')}>
              <Text style={styles.bellEmoji}>🔔</Text>
            </TouchableOpacity>
          </View>

          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={hasActiveThreat ? styles.statusIconWrapDanger : styles.statusIconWrapSafe}>
                <Text style={styles.statusEmoji}>{hasActiveThreat ? '🚨' : '🛡️'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusMsg}>{riskStatus.message}</Text>
                <Text style={styles.statusDesc}>{loading ? 'Checking status...' : riskStatus.desc}</Text>
              </View>
              {loading && <ActivityIndicator color="#dc2626" size="small" />}
            </View>
            <View style={styles.locationRow}>
              <Text>📍</Text>
              <Text style={styles.locationText}>Your Location: Haifa, Northern District</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {QUICK_ACTIONS.map(action => (
              <TouchableOpacity
                key={action.label}
                onPress={() => action.screen && navigation.navigate(action.screen)}
                style={[styles.actionBtn, { backgroundColor: action.color, shadowColor: action.color }]}
              >
                <Text style={styles.actionEmoji}>{action.emoji}</Text>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nearby Fires */}
        <View style={styles.firesSection}>
          <View style={styles.firesHeaderRow}>
            <Text style={styles.sectionTitle}>Nearby Fire Events</Text>
            <View style={styles.firesCount}>
              <Text style={styles.firesCountText}>{fires.length} total</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color="#dc2626" style={{ marginTop: 20 }} />
          ) : fires.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyText}>No active fires in your area</Text>
            </View>
          ) : (
            fires.slice(0, 5).map(fire => {
              const riskColor = RISK_COLORS[fire.fire_severitylevel?.toLowerCase()] || '#94a3b8';
              return (
                <TouchableOpacity
                  key={fire.id}
                  onPress={() => navigation.navigate('IncidentDetails', { fireId: fire.id })}
                  style={styles.fireCard}
                >
                  <View style={styles.fireCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fireLocation}>{fire.fire_location || 'Unknown Location'}</Text>
                      <Text style={styles.fireId}>ID: {fire.id?.slice(0, 8)}</Text>
                    </View>
                    <View style={[styles.fireBadge, { backgroundColor: riskColor + '20', borderColor: riskColor }]}>
                      <Text style={[styles.fireBadgeText, { color: riskColor }]}>{fire.fire_severitylevel || 'Unknown'}</Text>
                    </View>
                  </View>
                  <View style={styles.fireCardBottom}>
                    <Text style={styles.fireStatus}>📌 {fire.fire_status} • {fire.fire_source || 'Manual'}</Text>
                    <Text style={styles.fireArrow}>›</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Emergency Contacts */}
        <View style={styles.contactsSection}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          {EMERGENCY_CONTACTS.map(contact => (
            <TouchableOpacity
              key={contact.name}
              onPress={() => Linking.openURL(`tel:${contact.number}`)}
              style={styles.contactCard}
            >
              <View style={styles.contactLeft}>
                <View style={[styles.contactIcon, { backgroundColor: contact.color + '20' }]}>
                  <Text style={styles.contactEmoji}>{contact.emoji}</Text>
                </View>
                <Text style={styles.contactName}>{contact.name}</Text>
              </View>
              <View style={styles.contactRight}>
                <Text style={styles.contactNumber}>{contact.number}</Text>
                <View style={styles.contactPhoneBtn}>
                  <Text>📞</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
