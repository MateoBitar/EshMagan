// src/navigation/RootNavigator.js
import React from 'react';
import { Platform, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ResidentNavigator from './ResidentNavigator';
import MunicipalityDashboard from '../screens/municipality/MunicipalityDashboard';
import AdminDashboard from '../screens/admin/AdminDashboard';
import ResponderCommandView from '../screens/responder/ResponderCommandView';
import AlertScreen from '../screens/resident/AlertScreen';
import EvacuationScreen from '../screens/resident/EvacuationScreen';
import ARModeScreen from '../screens/resident/ARModeScreen';
import SafetyTipsScreen from '../screens/resident/SafetyTipsScreen';
import IncidentDetailsScreen from '../screens/municipality/IncidentDetailsScreen';
import WebNavigator from './WebNavigator';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (Platform.OS === 'web') {
    return <WebNavigator user={user} loading={loading} />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617' }}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  const normalizedRole = user?.role?.toLowerCase?.() || '';
  const isMunicipality = normalizedRole === 'municipality';
  const isResponder = normalizedRole === 'responder';
  const isResident = normalizedRole === 'resident';
  const isAdmin = normalizedRole === 'admin';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            {isResident && <Stack.Screen name="ResidentHome" component={ResidentNavigator} />}
            {isMunicipality && <Stack.Screen name="MunicipalityDashboard" component={MunicipalityDashboard} />}
            {isResponder && <Stack.Screen name="ResponderCommand" component={ResponderCommandView} />}
            {isAdmin && <Stack.Screen name="AdminDashboard" component={AdminDashboard} />}
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
