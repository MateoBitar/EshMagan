// src/navigation/WebNavigator.js
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { global, colors } from '../styles/global';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ResidentHomeScreen from '../screens/resident/ResidentHomeScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import AlertScreen from '../screens/resident/AlertScreen';
import EvacuationScreen from '../screens/resident/EvacuationScreen';
import ARModeScreen from '../screens/resident/ARModeScreen';
import SafetyTipsScreen from '../screens/resident/SafetyTipsScreen';
import ResidentAlertsScreen from '../screens/resident/ResidentAlertsScreen';
import ResidentMapScreen from '../screens/resident/ResidentMapScreen';
import ResidentProfileScreen from '../screens/resident/ResidentProfileScreen';
import ResidentNotificationsScreen from '../screens/resident/ResidentNotificationsScreen';
import MunicipalityDashboard from '../screens/municipality/MunicipalityDashboard';
import IncidentDetailsScreen from '../screens/municipality/IncidentDetailsScreen';
import ResponderCommandView from '../screens/responder/ResponderCommandView';

export const NavigationContext = React.createContext(null);

const AUTH_SCREENS = ['Login', 'Register'];

export default function WebNavigator({ user, loading }) {
  const [screen, setScreen] = useState(null);
  const [params, setParams] = useState({});

  const normalizedRole = user?.role?.toLowerCase?.() || '';

  const getDefaultScreen = () => {
    if (!user) return 'Login';
    if (normalizedRole === 'municipality') return 'MunicipalityDashboard';
    if (normalizedRole === 'responder') return 'ResponderCommand';
    if (normalizedRole === 'admin') return 'AdminDashboard';
    return 'ResidentHome';
  };

  // Handle login/logout screen reset
  useEffect(() => {
    if (user && AUTH_SCREENS.includes(screen)) {
      setScreen(getDefaultScreen());
    } else if (!user && screen && !AUTH_SCREENS.includes(screen)) {
      setScreen('Login');
    }
  }, [user]);

  const navigate = (screenName, screenParams = {}) => {
    setScreen(screenName);
    setParams(screenParams);
  };

  const goBack = () => {
    if (!user) {
      setScreen('Login');
      return;
    }
    if (normalizedRole === 'municipality') {
      setScreen('MunicipalityDashboard');
      return;
    }
    if (normalizedRole === 'responder') {
      setScreen('ResponderCommand');
      return;
    }
    if (normalizedRole === 'admin') {
      setScreen('AdminDashboard');
      return;
    }
    setScreen('ResidentHome');
  };

  if (loading) {
    return (
      <View style={global.loaderScreen}>
        <ActivityIndicator size="large" color={colors.loaderAccent} />
      </View>
    );
  }

  const currentScreen = screen || getDefaultScreen();
  const nav = { navigate, goBack, params, currentScreen };

  const screens = {
    Login: <LoginScreen navigation={nav} />,
    Register: <RegisterScreen navigation={nav} />,
    ResidentHome: <ResidentHomeScreen navigation={nav} />,
    ResidentMap: <ResidentMapScreen navigation={nav} />,
    ResidentAlerts: <ResidentAlertsScreen navigation={nav} />,
    ResidentProfile: <ResidentProfileScreen navigation={nav} />,
    ResidentNotifications: <ResidentNotificationsScreen navigation={nav} />,
    Alert: <AlertScreen navigation={nav} route={{ params }} />,
    Evacuation: <EvacuationScreen navigation={nav} route={{ params }} />,
    ARMode: <ARModeScreen navigation={nav} route={{ params }} />,
    SafetyTips: <SafetyTipsScreen navigation={nav} route={{ params }} />,
    MunicipalityDashboard: <MunicipalityDashboard navigation={nav} route={{ params }} />,
    IncidentDetails: <IncidentDetailsScreen navigation={nav} route={{ params }} />,
    ResponderCommand: <ResponderCommandView navigation={nav} route={{ params }} />,
    AdminDashboard: <AdminDashboard navigation={nav} route={{ params }} />,
  };

  return (
    <NavigationContext.Provider value={nav}>
      <View style={global.fullScreen}>
        {screens[currentScreen] || screens['Login']}
      </View>
    </NavigationContext.Provider>
  );
}
