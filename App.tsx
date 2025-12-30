/**
 * Animinder - Tinder for Animals
 * A pet matching app
 *
 * @format
 */

import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { AppProvider, useApp } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import 'react-native-gesture-handler';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

function AppContent() {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const { setNavigationRef } = useApp();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "688019680147-lgbsnc69jch90e2ee8dopa9fhp7b810g.apps.googleusercontent.com",
    });
    
    // Set navigation ref in context
    if (navigationRef.current) {
      setNavigationRef(navigationRef.current);
    }
  }, [setNavigationRef]);

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </NavigationContainer>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
