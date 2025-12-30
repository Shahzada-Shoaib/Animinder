import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import {Platform, Alert, AppState} from 'react-native';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import {sendMessage, getReceiverFCMToken} from './chatService';

const usersCollection = firestore().collection('users');

/**
 * Request notification permissions
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    // Use notifee for local notifications
    const settings = await notifee.requestPermission();
    const enabled = settings.authorizationStatus >= 1; // 1 = AUTHORIZED, 2 = PROVISIONAL
    
    console.log('Notification permission status:', settings.authorizationStatus);
    
    if (enabled) {
      console.log('Notification permission granted');
      
      // Create Android channel
      if (Platform.OS === 'android') {
        try {
          await notifee.createChannel({
            id: 'messages',
            name: 'Messages',
            importance: AndroidImportance.HIGH,
            sound: 'default',
            vibration: true,
          });
          console.log('Android notification channel created');
        } catch (error) {
          console.error('Error creating Android channel:', error);
        }
      }
      
      return true;
    } else {
      console.log('Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Get FCM token and save to Firestore
 */
export const getAndSaveFCMToken = async (userId: string): Promise<string | null> => {
  try {
    if (!userId || userId === 'user1') {
      return null;
    }

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('Notification permission not granted');
      return null;
    }

    const token = await messaging().getToken();
    if (token) {
      // Save token to user document
      await usersCollection.doc(userId).update({
        fcmToken: token,
      });
      console.log('FCM token saved:', token);
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Delete FCM token (on logout)
 */
export const deleteFCMToken = async (userId: string): Promise<void> => {
  try {
    if (!userId || userId === 'user1') {
      return;
    }
    await messaging().deleteToken();
    await usersCollection.doc(userId).update({
      fcmToken: firestore.FieldValue.delete(),
    });
    console.log('FCM token deleted');
  } catch (error) {
    console.error('Error deleting FCM token:', error);
  }
};

/**
 * Show local notification when message arrives
 * This will be called from chatService when a new message is received
 */
export const showMessageNotification = async (
  senderName: string,
  messageText: string,
  chatId: string,
): Promise<void> => {
  try {
    // Check if permission is granted
    const settings = await notifee.getNotificationSettings();
    if (settings.authorizationStatus < 1) {
      console.log('Notification permission not granted');
      return;
    }

    // Create/ensure Android channel exists
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: 'messages',
        name: 'Messages',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });
    }

    // Display notification
    console.log('Displaying notification:', { senderName, messageText, chatId });
    await notifee.displayNotification({
      title: senderName || 'New Message',
      body: messageText,
      data: { chatId },
      android: {
        channelId: 'messages',
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
        sound: 'default',
        // Remove smallIcon if it doesn't exist - Android will use default
      },
      ios: {
        sound: 'default',
      },
    });
    console.log('Notification displayed successfully');
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

/**
 * Send notification to receiver when message is sent
 * Note: This is kept for backward compatibility but won't do anything
 * Notifications are now shown when messages are received via Firestore listeners
 */
export const sendNotificationToReceiver = async (
  receiverId: string,
  senderName: string,
  messageText: string,
  chatId: string,
): Promise<void> => {
  // Notifications are now handled by chatService when messages arrive
  // This function is kept for backward compatibility
  console.log('Notification will be shown when message is received');
};

/**
 * Setup foreground message handler
 */
export const setupForegroundMessageHandler = (): (() => void) => {
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('Foreground message received:', remoteMessage);
    
    if (remoteMessage.notification) {
      Alert.alert(
        remoteMessage.notification.title || 'New Message',
        remoteMessage.notification.body || '',
        [
          {
            text: 'OK',
            onPress: () => {
              // Handle navigation if needed
              if (remoteMessage.data?.chatId) {
                // Navigation will be handled by the app
                console.log('Navigate to chat:', remoteMessage.data.chatId);
              }
            },
          },
        ],
      );
    }
  });

  return unsubscribe;
};

/**
 * Setup background message handler
 * This must be called outside of React component lifecycle
 */
export const setupBackgroundMessageHandler = (): void => {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background message received:', remoteMessage);
    // Background messages are handled automatically by FCM
  });
};

/**
 * Setup notification handlers for all app states
 */
export const setupNotificationHandlers = (
  onNotificationPress: (chatId: string) => void,
): (() => void) => {
  // Handle foreground notification press (when app is open)
  const unsubscribeForeground = notifee.onForegroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS) {
      const chatId = detail.notification?.data?.chatId as string;
      if (chatId) {
        console.log('Foreground notification pressed, chatId:', chatId);
        onNotificationPress(chatId);
      }
    }
  });

  // Handle background notification press (when app is in background)
  // This is set up in index.js as it needs to be outside React lifecycle

  return () => {
    unsubscribeForeground();
  };
};

/**
 * Initialize notification service
 */
export const initializeNotifications = async (userId: string): Promise<void> => {
  try {
    // Request permission for local notifications
    await requestNotificationPermission();
    
    // Keep FCM token for future use (if needed for push notifications)
    if (userId && userId !== 'user1') {
      await getAndSaveFCMToken(userId);
    }
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

