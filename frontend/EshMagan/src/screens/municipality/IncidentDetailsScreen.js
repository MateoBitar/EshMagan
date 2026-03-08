// src/screens/municipality/IncidentDetailsScreen.js
import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery } from '@apollo/client';
import { GET_FIRE } from '../../services/api';

export default function IncidentDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { fireId } = route.params || {};
  const { data, loading } = useQuery(GET_FIRE, { variables: { id: fireId }, skip: !fireId });
  const fire = data?.fire;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', padding: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 10 }}>
          <Text style={{ color: '#64748b', fontSize: 14 }}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>Incident Details</Text>
        {fire && <Text style={{ fontSize: 12, color: '#94a3b8' }}>{fire.id?.slice(0, 16)}...</Text>}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#dc2626" />
        </View>
      ) : !fire ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 32, marginBottom: 12 }}>🔍</Text>
          <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center' }}>Fire incident not found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Main Info */}
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 2, borderColor: '#fecaca' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <View style={{ width: 48, height: 48, backgroundColor: '#fef2f2', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24 }}>🔥</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>{fire.fire_location || 'Unknown Location'}</Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>{fire.fire_source || 'Manual Report'}</Text>
              </View>
            </View>
            {[
              { label: 'Status', value: fire.fire_status },
              { label: 'Severity', value: fire.fire_severitylevel },
              { label: 'Detected', value: fire.created_at ? new Date(fire.created_at).toLocaleString() : 'N/A' },
            ].map(({ label, value }) => (
              <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 13, color: '#64748b' }}>{label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a' }}>{value || 'N/A'}</Text>
              </View>
            ))}
          </View>

          {/* Responders */}
          {fire.fire_assignments?.length > 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>
                👥 Assigned Responders ({fire.fire_assignments.length})
              </Text>
              {fire.fire_assignments.map(a => (
                <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                  <Text style={{ fontSize: 20 }}>🚒</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a' }}>{a.responder?.responder_name || 'Unknown'}</Text>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>{a.responder?.responder_type} • {a.assignment_status}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Alerts */}
          {fire.alerts?.length > 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>
                🔔 Triggered Alerts ({fire.alerts.length})
              </Text>
              {fire.alerts.map(alert => (
                <View key={alert.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a' }}>{alert.alert_type?.replace(/_/g, ' ')}</Text>
                    <Text style={{ fontSize: 11, color: '#ea580c', fontWeight: '600' }}>{alert.alert_priority}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>{alert.alert_message || 'No message'}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
