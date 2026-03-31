import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles, { RESPONDER_STATUS_COLORS, C } from '../../../styles/screens/ResponderCommandView.styles';

export default function StatusBar({ myResponder, myStatus, actionLoading, handleUpdateMyStatus }) {
  if (!myResponder) return null;

  return (
    <View style={styles.statusBar}>
      <View
        style={[
          styles.statusDot,
          { backgroundColor: RESPONDER_STATUS_COLORS[myStatus] || C.slate },
        ]}
      />
      <Text style={styles.statusUnitText}>{myResponder.unit_nb}</Text>
      <View style={styles.statusSpacer} />
      {['Active', 'Standby', 'Unavailable'].map(s => (
        <TouchableOpacity
          key={s}
          onPress={() => handleUpdateMyStatus(s)}
          disabled={actionLoading === 'status'}
          style={[
            styles.statusButton,
            myStatus === s
              ? {
                  backgroundColor: RESPONDER_STATUS_COLORS[s] + '30',
                  borderColor: RESPONDER_STATUS_COLORS[s],
                }
              : styles.statusButtonInactive,
          ]}
        >
          <Text
            style={[
              styles.statusButtonText,
              myStatus === s
                ? { fontWeight: '700', color: RESPONDER_STATUS_COLORS[s] }
                : styles.statusButtonTextInactive,
            ]}
          >
            {s}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
