// src/navigation/ResidentNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import ResidentHomeScreen from '../screens/resident/ResidentHomeScreen';
import ResidentMapScreen from '../screens/resident/ResidentMapScreen';
import ResidentAlertsScreen from '../screens/resident/ResidentAlertsScreen';
import ResidentProfileScreen from '../screens/resident/ResidentProfileScreen';

const ICONS = {
  ResidentHome: '🏠',
  ResidentMap: '🗺️',
  ResidentAlerts: '🔔',
  ResidentProfile: '👤',
};

const LABELS = {
  ResidentHome: 'Home',
  ResidentMap: 'Map',
  ResidentAlerts: 'Alerts',
  ResidentProfile: 'Profile',
};

const Tab = createBottomTabNavigator();

export default function ResidentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 2,
          borderTopColor: '#e2e8f0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarLabel: LABELS[route.name] || route.name,
        tabBarIcon: () => (
          <Text style={{ fontSize: 20 }}>{ICONS[route.name] || '•'}</Text>
        ),
      })}
    >
      <Tab.Screen name="ResidentHome" component={ResidentHomeScreen} />
      <Tab.Screen name="ResidentMap" component={ResidentMapScreen} />
      <Tab.Screen name="ResidentAlerts" component={ResidentAlertsScreen} />
      <Tab.Screen name="ResidentProfile" component={ResidentProfileScreen} />
    </Tab.Navigator>
  );
}