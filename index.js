/**
 * @format
 */

import 'react-native-gesture-handler';
import '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Register background handler for FCM - must be called outside of React component lifecycle
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background message received:', remoteMessage);
});

// Handle background notification press (when app is in background/killed)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    const chatId = detail.notification?.data?.chatId;
    if (chatId) {
      console.log('Background notification pressed, chatId:', chatId);
      // Navigation will be handled when app opens
    }
  }
});

AppRegistry.registerComponent(appName, () => App);
