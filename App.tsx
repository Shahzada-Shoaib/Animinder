/**
 * Animinder - Tinder for Animals
 * A pet matching app
 *
 * @format
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import 'react-native-gesture-handler';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

function App() {

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "688019680147-lgbsnc69jch90e2ee8dopa9fhp7b810g.apps.googleusercontent.com",
    });
  }, []);

  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" />
        <AppNavigator />
      </NavigationContainer>
    </AppProvider>
  );
}

export default App;
