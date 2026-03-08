// src/stubs/navigation.js — stub for web build
module.exports = {
  NavigationContainer: ({ children }) => children,
  createNativeStackNavigator: () => ({ Navigator: ({ children }) => children, Screen: () => null }),
  createBottomTabNavigator: () => ({ Navigator: ({ children }) => children, Screen: () => null }),
};
