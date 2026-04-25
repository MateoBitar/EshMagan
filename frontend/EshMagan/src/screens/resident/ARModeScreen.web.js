import React from 'react';
import { View, Text } from 'react-native';

export default function ARModeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '700' }}>
        AR is available only on the mobile app.
      </Text>
    </View>
  );
}