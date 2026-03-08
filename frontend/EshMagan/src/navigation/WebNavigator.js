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

// Navigation context so any screen can call navigate()
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
    if (user.role === 'municipality') setScreen('MunicipalityDashboard');
    else if (user.role === 'responder') setScreen('ResponderCommand');
    else setScreen('ResidentHome');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617' }}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  // Determine current screen
  const currentScreen = screen || (
    !user ? 'Login'
    : user.role === 'municipality' ? 'MunicipalityDashboard'
    : user.role === 'responder' ? 'ResponderCommand'
    : 'ResidentHome'
  );

  const nav = { navigate, goBack, params };

  const screens = {
    Login: <LoginScreen navigation={nav} />,
    ResidentHome: <ResidentHomeScreen navigation={nav} />,
    Alert: <AlertScreen navigation={nav} route={{ params }} />,
    Evacuation: <EvacuationScreen navigation={nav} route={{ params }} />,
    ARMode: <ARModeScreen navigation={nav} route={{ params }} />,
    SafetyTips: <SafetyTipsScreen navigation={nav} route={{ params }} />,
    ResidentAlerts: <ResidentAlertsScreen navigation={nav} route={{ params }} />,
    ResidentMap: <ResidentMapScreen navigation={nav} route={{ params }} />,
    ResidentProfile: <ResidentProfileScreen navigation={nav} route={{ params }} />,
    MunicipalityDashboard: <MunicipalityDashboard navigation={nav} route={{ params }} />,
    IncidentDetails: <IncidentDetailsScreen navigation={nav} route={{ params }} />,
    ResponderCommand: <ResponderCommandView navigation={nav} route={{ params }} />,
  };

  return (
    <NavigationContext.Provider value={nav}>
      {screens[currentScreen] || screens['Login']}
    </NavigationContext.Provider>
  );
}
