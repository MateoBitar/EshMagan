// App.js
import React from 'react';
import { Platform } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

// Only load Apollo on native (Android/iOS) — not on web
let AppContent;

if (Platform.OS === 'web') {
  AppContent = () => (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
} else {
  const { ApolloProvider } = require('@apollo/client');
  const { apolloClient } = require('./src/services/api');
  AppContent = () => (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ApolloProvider>
  );
}

export default function App() {
  return <AppContent />;
}
