import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles, { RESPONDER_STATUS_COLORS, C } from '../../../styles/screens/ResponderCommandView.styles';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'Active' },
  { label: 'Stand by', value: 'Standby' },
  { label: 'Unavailable', value: 'Unavailable' },
];

export default function StatusBar({ myResponder, myStatus, actionLoading, handleUpdateMyStatus, hasActiveAssignments }) {
  if (!myResponder) return null;

  return (
    <View style={styles.statusBar}>
      <View style={styles.statusInfo}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: RESPONDER_STATUS_COLORS[myStatus] || C.slate },
          ]}
        />
        <View style={styles.statusTextWrap}>
          <Text style={styles.statusLabel}>Unit Status</Text>
          <Text style={styles.statusUnitText}>
            {myResponder.responder_id} - {myResponder.unit_nb}
          </Text>
        </View>
      </View>

      <View style={styles.statusActions}>
        {STATUS_OPTIONS.map(option => {
          const active = myStatus === option.value;
          const statusColor = RESPONDER_STATUS_COLORS[option.value] || C.slate;
          const blocked = hasActiveAssignments && option.value === 'Unavailable';

          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleUpdateMyStatus(option.value)}
              disabled={actionLoading === 'status' || active || blocked}
              style={[
                styles.statusButton,
                active
                  ? {
                    backgroundColor: statusColor + '33',
                    borderColor: statusColor,
                  }
                  : styles.statusButtonInactive,
                blocked && styles.statusButtonLocked,
              ]}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  active
                    ? { color: statusColor, fontWeight: '800' }
                    : styles.statusButtonTextInactive,
                  blocked && styles.statusButtonTextLocked,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
