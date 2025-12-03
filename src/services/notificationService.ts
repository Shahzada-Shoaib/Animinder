import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import {Platform, Alert, AppState} from 'react-native';
import {sendMessage, getReceiverFCMToken} from './chatService';

const usersCollection = firestore().collection('users');

/**
 * Request notification permissions
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification permission granted');
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
    } else {
      // iOS
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification permission granted');
        return true;
      } else {
        console.log('Notification permission denied');
        return false;
      }
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
 * Send notification to receiver when message is sent
 * Note: In production, this should be done via Cloud Functions
 * For now, we'll use a client-side approach (limited)
 */
export const sendNotificationToReceiver = async (
  receiverId: string,
  senderName: string,
  messageText: string,
  chatId: string,
): Promise<void> => {
  try {
    // In a real app, you would call a Cloud Function here
    // For now, we'll just log it
    // The actual notification will be sent via Firestore triggers or Cloud Functions
    console.log('Should send notification to:', receiverId);
    console.log('Message:', messageText);
    console.log('Chat ID:', chatId);

    // TODO: Implement Cloud Function to send FCM notification
    // The Cloud Function should:
    // 1. Get receiver's FCM token from Firestore
    // 2. Send notification using Firebase Admin SDK
    // 3. Handle notification payload with chatId for navigation
  } catch (error) {
    console.error('Error sending notification:', error);
  }
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
  // Handle notification when app is opened from killed state
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('Notification opened app:', remoteMessage);
        if (remoteMessage.data?.chatId) {
          onNotificationPress(remoteMessage.data.chatId);
        }
      }
    });

  // Handle notification when app is in background
  const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp(
    remoteMessage => {
      console.log('Notification opened app from background:', remoteMessage);
      if (remoteMessage.data?.chatId) {
        onNotificationPress(remoteMessage.data.chatId);
      }
    },
  );

  // Handle foreground messages
  const unsubscribeForeground = setupForegroundMessageHandler();

  // Handle token refresh
  const unsubscribeTokenRefresh = messaging().onTokenRefresh(async token => {
    console.log('FCM token refreshed:', token);
    // Token will be saved when user is logged in
  });

  return () => {
    unsubscribeNotificationOpened();
    unsubscribeForeground();
    unsubscribeTokenRefresh();
  };
};

/**
 * Initialize notification service
 */
export const initializeNotifications = async (userId: string): Promise<void> => {
  try {
    // Request permission
    await requestNotificationPermission();
    
    // Get and save token
    await getAndSaveFCMToken(userId);

    // Setup background handler (must be called at app level)
    setupBackgroundMessageHandler();
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

