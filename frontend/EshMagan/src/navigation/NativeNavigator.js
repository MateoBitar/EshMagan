// src/navigation/NativeNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { global, colors } from '../styles/global';

import LoginScreen from '../screens/auth/LoginScreen';
import ResidentNavigator from './ResidentNavigator';
import AdminDashboard from '../screens/admin/AdminDashboard';
import MunicipalityDashboard from '../screens/municipality/MunicipalityDashboard';
import ResponderCommandView from '../screens/responder/ResponderCommandView';
import NotificationScreen from '../screens/resident/ResidentNotificationsScreen';
import EvacuationScreen from '../screens/resident/EvacuationScreen';
import ARModeScreen from '../screens/resident/ARModeScreen';
import SafetyTipsScreen from '../screens/resident/SafetyTipsScreen';
import IncidentDetailsScreen from '../screens/municipality/IncidentDetailsScreen';

const Stack = createNativeStackNavigator();

export default function NativeNavigator({ user, loading }) {
  if (loading) {
    return (
      <View style={global.loaderScreen}>
        <ActivityIndicator size="large" color={colors.loaderAccent} />
      </View>
    );
  }

  const normalizedRole = user?.role?.toLowerCase?.() || '';

  const getInitialRoute = () => {
    if (!user) return 'Login';
    if (normalizedRole === 'admin') return 'AdminDashboard';
    if (normalizedRole === 'municipality') return 'MunicipalityDashboard';
    if (normalizedRole === 'responder') return 'ResponderCommand';
    return 'ResidentTabs';
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
            {normalizedRole === 'admin' && (
              <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            )}

            {(normalizedRole === 'resident') && (
              <Stack.Screen name="ResidentTabs" component={ResidentNavigator} />
            )}

            {normalizedRole === 'municipality' && (
              <Stack.Screen name="MunicipalityDashboard" component={MunicipalityDashboard} />
            )}

            {normalizedRole === 'responder' && (
              <Stack.Screen name="ResponderCommand" component={ResponderCommandView} />
            )}

            <Stack.Screen name="ResidentNotifications" component={NotificationScreen} options={{ animation: 'fade' }} />
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