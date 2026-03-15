// src/navigation/WebNavigator.js
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import LoginScreen from '../screens/auth/LoginScreen';
import ResidentHomeScreen from '../screens/resident/ResidentHomeScreen';
import AlertScreen from '../screens/resident/AlertScreen';
import EvacuationScreen from '../screens/resident/EvacuationScreen';
import ARModeScreen from '../screens/resident/ARModeScreen';
import SafetyTipsScreen from '../screens/resident/SafetyTipsScreen';
import ResidentAlertsScreen from '../screens/resident/ResidentAlertsScreen';
import ResidentMapScreen from '../screens/resident/ResidentMapScreen';
import ResidentProfileScreen from '../screens/resident/ResidentProfileScreen';
import MunicipalityDashboard from '../screens/municipality/MunicipalityDashboard';
import IncidentDetailsScreen from '../screens/municipality/IncidentDetailsScreen';
import ResponderCommandView from '../screens/responder/ResponderCommandView';

export const NavigationContext = React.createContext(null);

export default function WebNavigator({ user, loading }) {
  const [screen, setScreen] = useState(null);
  const [params, setParams] = useState({});

  const navigate = (screenName, screenParams = {}) => {
    setScreen(screenName);
    setParams(screenParams);
  };

  const goBack = () => {
    if (!user) { setScreen('Login'); return; }
    if (user.role === 'Municipality') { setScreen('MunicipalityDashboard'); return; }
    if (user.role === 'Responder') { setScreen('ResponderCommand'); return; }
    setScreen('ResidentHome');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617' }}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  const getDefaultScreen = () => {
    if (!user) return 'Login';
    if (user.role === 'Municipality') return 'MunicipalityDashboard';
    if (user.role === 'Responder') return 'ResponderCommand';
    return 'ResidentHome';
  };

  const currentScreen = screen || getDefaultScreen();
  const nav = { navigate, goBack, params, currentScreen };

  const screens = {
    Login: <LoginScreen navigation={nav} />,
    ResidentHome: <ResidentHomeScreen navigation={nav} />,
    ResidentMap: <ResidentMapScreen navigation={nav} />,
    ResidentAlerts: <ResidentAlertsScreen navigation={nav} />,
    ResidentProfile: <ResidentProfileScreen navigation={nav} />,
    Alert: <AlertScreen navigation={nav} route={{ params }} />,
    Evacuation: <EvacuationScreen navigation={nav} route={{ params }} />,
    ARMode: <ARModeScreen navigation={nav} route={{ params }} />,
    SafetyTips: <SafetyTipsScreen navigation={nav} route={{ params }} />,
    MunicipalityDashboard: <MunicipalityDashboard navigation={nav} route={{ params }} />,
    IncidentDetails: <IncidentDetailsScreen navigation={nav} route={{ params }} />,
    ResponderCommand: <ResponderCommandView navigation={nav} route={{ params }} />,
  };

  return (
    <NavigationContext.Provider value={nav}>
      <View style={{ flex: 1 }}>
        {screens[currentScreen] || screens['Login']}
      </View>
    </NavigationContext.Provider>
  );
}
