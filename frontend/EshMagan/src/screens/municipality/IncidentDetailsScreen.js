// src/screens/municipality/IncidentDetailsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { gqlFetch, GET_FIRE, GET_ASSIGNMENTS_BY_FIRE } from '../../services/api';

function getSeverityLabel(level) {
  if (!level) return 'Unknown';
  if (level >= 8) return 'Critical';
  if (level >= 6) return 'High';
  if (level >= 3) return 'Moderate';
  return 'Low';
}

function useFireDetails(fireId) {
  const [fire, setFire] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web' || !fireId) { setLoading(false); return; }
    const fetch = async () => {
      try {
        const fireData = await gqlFetch(GET_FIRE, { fire_id: fireId });
        setFire(fireData?.getFireById || null);
        const assignData = await gqlFetch(GET_ASSIGNMENTS_BY_FIRE, { fire_id: fireId });
        setAssignments(assignData?.getAssignmentsByFireId || []);
      } catch (e) { console.error('Failed to fetch fire details:', e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [fireId]);

  return { fire, assignments, loading };
}

export default function IncidentDetailsScreen({ navigation, route }) {
  let nav = navigation;
  let routeParams = route?.params || {};
  if (Platform.OS !== 'web') {
    try {
      const { useNavigation, useRoute } = require('@react-navigation/native');
      nav = useNavigation();
      routeParams = useRoute().params || {};
    } catch {}
  }

  const { fireId } = routeParams;

  let fire = null, assignments = [], loading = false;
  const webData = useFireDetails(fireId);

  if (Platform.OS !== 'web') {
    try {
      const { useQuery, gql } = require('@apollo/client');
      const QUERY = gql`query GetFireById($fire_id: ID!) {
        getFireById(fire_id: $fire_id) {
          fire_id fire_source fire_location fire_severitylevel
          is_extinguished is_verified spread_prediction created_at updated_at
        }
      }`;
      const ASSIGN_QUERY = gql`query GetAssignmentsByFireId($fire_id: ID!) {
        getAssignmentsByFireId(fire_id: $fire_id) {
          assignment_id assignment_status fire_id responder_id assigned_at
        }
      }`;
      const result = useQuery(QUERY, { variables: { fire_id: fireId }, skip: !fireId });
      const assignResult = useQuery(ASSIGN_QUERY, { variables: { fire_id: fireId }, skip: !fireId });
      fire = result.data?.getFireById;
      assignments = assignResult.data?.getAssignmentsByFireId || [];
      loading = result.loading;
    } catch {}
  } else {
    fire = webData.fire;
    assignments = webData.assignments;
    loading = webData.loading;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', padding: 16 }}>
        <TouchableOpacity onPress={() => nav?.goBack()} style={{ marginBottom: 10 }}>
          <Text style={{ color: '#64748b', fontSize: 14 }}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>Incident Details</Text>
        {fire && <Text style={{ fontSize: 12, color: '#94a3b8' }}>{fire.fire_id}</Text>}
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
              { label: 'Status', value: fire.is_extinguished ? 'Extinguished' : 'Active' },
              { label: 'Verified', value: fire.is_verified ? 'Yes' : 'No' },
              { label: 'Severity', value: getSeverityLabel(fire.fire_severitylevel) + (fire.fire_severitylevel ? ` (${fire.fire_severitylevel}/10)` : '') },
              { label: 'Spread Prediction', value: fire.spread_prediction || 'N/A' },
              { label: 'Detected', value: fire.created_at ? new Date(fire.created_at).toLocaleString() : 'N/A' },
            ].map(({ label, value }) => (
              <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 13, color: '#64748b' }}>{label}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a' }}>{value || 'N/A'}</Text>
              </View>
            ))}
          </View>

          {assignments.length > 0 && (
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>
                👥 Assigned Responders ({assignments.length})
              </Text>
              {assignments.map(a => (
                <View key={a.assignment_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                  <Text style={{ fontSize: 20 }}>🚒</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a' }}>Responder {a.responder_id?.slice(0, 8)}</Text>
                    <Text style={{ fontSize: 11, color: '#64748b' }}>Status: {a.assignment_status} • Assigned: {a.assigned_at ? new Date(a.assigned_at).toLocaleTimeString() : 'N/A'}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
