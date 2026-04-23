import React from 'react';
import { Image, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ResidentHomeScreen from '../screens/resident/ResidentHomeScreen';
import ResidentMapScreen from '../screens/resident/ResidentMapScreen';
import ResidentAlertsScreen from '../screens/resident/ResidentAlertsScreen';
import ResidentProfileScreen from '../screens/resident/ResidentProfileScreen';

const ICONS = {
  ResidentHome: Platform.select({
    web: { uri: '/home.png' },
    android: { uri: 'home' },
    ios: { uri: 'home' },
    default: { uri: 'home' },
  }),
  ResidentMap: Platform.select({
    web: { uri: '/map.png' },
    android: { uri: 'map' },
    ios: { uri: 'map' },
    default: { uri: 'map' },
  }),
  ResidentAlerts: Platform.select({
    web: { uri: '/bell.png' },
    android: { uri: 'bell' },
    ios: { uri: 'bell' },
    default: { uri: 'bell' },
  }),
  ResidentProfile: Platform.select({
    web: { uri: '/person.png' },
    android: { uri: 'person' },
    ios: { uri: 'person' },
    default: { uri: 'person' },
  }),
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
          backgroundColor: '#FFF1D6',
          borderTopWidth: 2,
          borderTopColor: '#FFF1D6',
          paddingBottom: 10,
          paddingTop: 5,
          height: 65,
        },
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: '#585858',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
        },
        tabBarLabel: LABELS[route.name] || route.name,
        tabBarIcon: ({ focused }) => (
          <Image
            source={ICONS[route.name]}
            resizeMode="contain"
            style={{
              width: 20,
              height: 20,
              tintColor: focused ? '#DC2626' : '#585858',
            }}
          />
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