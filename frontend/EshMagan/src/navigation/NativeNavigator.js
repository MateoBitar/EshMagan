// src/navigation/NativeNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from '../screens/auth/LoginScreen';
import ResidentNavigator from './ResidentNavigator';
import MunicipalityDashboard from '../screens/municipality/MunicipalityDashboard';
import ResponderCommandView from '../screens/responder/ResponderCommandView';
import AlertScreen from '../screens/resident/AlertScreen';
import EvacuationScreen from '../screens/resident/EvacuationScreen';
import ARModeScreen from '../screens/resident/ARModeScreen';
import SafetyTipsScreen from '../screens/resident/SafetyTipsScreen';
import IncidentDetailsScreen from '../screens/municipality/IncidentDetailsScreen';

const Stack = createNativeStackNavigator();

export default function NativeNavigator({ user, loading }) {
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617' }}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  const getInitialRoute = () => {
    if (!user) return 'Login';
    if (user.role === 'Municipality') return 'MunicipalityDashboard';
    if (user.role === 'Responder') return 'ResponderCommand';
    return 'ResidentHome';
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            {(user.role === 'resident' || user.role === 'admin') && (
              <Stack.Screen name="ResidentHome" component={ResidentNavigator} />
            )}
            {user.role === 'municipality' && (
              <Stack.Screen name="MunicipalityDashboard" component={MunicipalityDashboard} />
            )}
            {user.role === 'responder' && (
              <Stack.Screen name="ResponderCommand" component={ResponderCommandView} />
            )}
            <Stack.Screen name="Alert" component={AlertScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Evacuation" component={EvacuationScreen} />
            <Stack.Screen name="ARMode" component={ARModeScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="SafetyTips" component={SafetyTipsScreen} />
            <Stack.Screen name="IncidentDetails" component={IncidentDetailsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}