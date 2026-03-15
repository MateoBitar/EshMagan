// src/screens/responder/ResponderCommandView.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { gqlFetch, GET_FIRES, GET_RESPONDERS } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/screens/ResponderCommandView.styles';

const STATUS_STYLE = {
  'Active': { bg: '#f0fdf4', text: '#16a34a', emoji: '✅' },
  'Standby': { bg: '#fefce8', text: '#ca8a04', emoji: '⏳' },
  'Unavailable': { bg: '#f8fafc', text: '#94a3b8', emoji: '💤' },
};

const LOG_COLOR = { alert: '#dc2626', update: '#2563eb', info: '#16a34a' };

const MOCK_LOG = [
  { time: '16:45', type: 'update', msg: 'UNIT-02 reports fire containment at 40%' },
  { time: '16:42', type: 'alert', msg: 'Wind speed increased to 22 km/h - high spread risk' },
  { time: '16:38', type: 'info', msg: 'UNIT-01 deployed water cannon on north perimeter' },
  { time: '16:35', type: 'update', msg: 'Evacuation of 12 residents completed successfully' },
];

function useCommandData() {
  const [fires, setFires] = useState([]);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web') { setLoading(false); return; }
    const fetch = async () => {
      try {
        const [fireData, respData] = await Promise.all([
          gqlFetch(GET_FIRES),
          gqlFetch(GET_RESPONDERS),
        ]);
        setFires(fireData?.getAllFires || []);
        setResponders(respData?.getAllResponders || []);
      } catch (e) { console.error('Failed to fetch command data:', e); }
      finally { setLoading(false); }
    };
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, []);

  return { fires, responders, loading };
}

export default function ResponderCommandView({ navigation }) {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('units');
  const [liveFlash, setLiveFlash] = useState(false);
  const webData = useCommandData();

  let fires = [], responders = [], loading = false;

  if (Platform.OS !== 'web') {
    try {
      const { useQuery, gql } = require('@apollo/client');
      const FIRES_QUERY = gql`query GetAllFires { getAllFires { fire_id fire_source fire_location fire_severitylevel is_extinguished created_at } }`;
      const RESP_QUERY = gql`query GetAllResponders { getAllResponders { responder_id unit_nb unit_location assigned_region responder_status last_known_location } }`;
      const firesResult = useQuery(FIRES_QUERY, { pollInterval: 10000 });
      const respResult = useQuery(RESP_QUERY, { pollInterval: 10000 });
      fires = firesResult.data?.getAllFires || [];
      responders = respResult.data?.getAllResponders || [];
      loading = firesResult.loading || respResult.loading;
    } catch {}
  } else {
    fires = webData.fires;
    responders = webData.responders;
    loading = webData.loading;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveFlash(true);
      setTimeout(() => setLiveFlash(false), 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const TABS = [{ id: 'units', label: '🚒 Units' }, { id: 'incidents', label: '🔥 Fires' }, { id: 'log', label: '📋 Log' }];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerIcon}><Text style={{ fontSize: 20 }}>🔥</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Responder Command</Text>
          <View style={styles.liveRow}>
            <View style={[styles.liveDot, { backgroundColor: liveFlash ? '#ef4444' : '#22c55e' }]} />
            <Text style={styles.liveText}>Live Feed Active</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout}><Text style={{ fontSize: 20 }}>🚪</Text></TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id)} style={[styles.tab, activeTab === tab.id ? styles.tabActive : styles.tabInactive]}>
            <Text style={[styles.tabText, activeTab === tab.id ? styles.tabTextActive : styles.tabTextInactive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'units' && (
          <View>
            <Text style={styles.tabSubtitle}>{loading ? 'Loading...' : `${responders.length} units in system`}</Text>
            {loading ? <ActivityIndicator color="#ef4444" /> : responders.length === 0 ? (
              <Text style={{ color: '#475569', textAlign: 'center', marginTop: 32 }}>No responder units found</Text>
            ) : (
              responders.map(r => {
                const s = STATUS_STYLE[r.responder_status] || STATUS_STYLE['Unavailable'];
                return (
                  <View key={r.responder_id} style={styles.unitCard}>
                    <View style={styles.unitCardTop}>
                      <View style={styles.unitLeft}>
                        <View style={styles.unitIcon}><Text style={{ fontSize: 18 }}>🚒</Text></View>
                        <View>
                          <Text style={styles.unitName}>{r.unit_nb || r.responder_id?.slice(0, 8)}</Text>
                          <Text style={styles.unitType}>{r.assigned_region || 'Unassigned'}</Text>
                        </View>
                      </View>
                      <View style={[styles.unitStatusBadge, { backgroundColor: s.bg }]}>
                        <Text style={[styles.unitStatusText, { color: s.text }]}>{s.emoji} {r.responder_status}</Text>
                      </View>
                    </View>
                    <Text style={styles.unitLocation}>📍 {r.unit_location || r.last_known_location || 'Location unavailable'}</Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'incidents' && (
          <View>
            <Text style={styles.tabSubtitle}>{loading ? 'Loading...' : `${fires.length} fire incidents tracked`}</Text>
            {loading ? <ActivityIndicator color="#ef4444" /> : fires.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={{ fontSize: 32, marginBottom: 8 }}>✅</Text>
                <Text style={{ color: '#10b981', fontWeight: '600' }}>No active fire incidents</Text>
              </View>
            ) : (
              fires.map(fire => (
                <View key={fire.fire_id} style={styles.fireCard}>
                  <View style={styles.fireCardTop}>
                    <Text style={styles.fireLocation}>{fire.fire_location || 'Unknown Location'}</Text>
                    <View style={styles.fireSeverityBadge}>
                      <Text style={styles.fireSeverityText}>{fire.fire_severitylevel || 'N/A'}</Text>
                    </View>
                  </View>
                  <Text style={styles.fireMeta}>
                    Status: {fire.is_extinguished ? 'Extinguished' : 'Active'} • Source: {fire.fire_source || 'Manual'}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'log' && (
          <View>
            <Text style={styles.tabSubtitle}>Incident activity log</Text>
            {MOCK_LOG.map((entry, i) => (
              <View key={i} style={styles.logRow}>
                <View style={styles.logDotCol}>
                  <View style={[styles.logDot, { backgroundColor: LOG_COLOR[entry.type] || '#64748b' }]} />
                  {i < MOCK_LOG.length - 1 && <View style={styles.logLine} />}
                </View>
                <View style={styles.logCard}>
                  <View style={styles.logCardTop}>
                    <View style={[styles.logTypeBadge, { backgroundColor: LOG_COLOR[entry.type] + '20' }]}>
                      <Text style={[styles.logTypeText, { color: LOG_COLOR[entry.type] }]}>{entry.type.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.logTime}>{entry.time}</Text>
                  </View>
                  <Text style={styles.logMsg}>{entry.msg}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
