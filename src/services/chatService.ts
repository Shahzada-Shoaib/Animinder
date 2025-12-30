import firestore from '@react-native-firebase/firestore';
import {Message, Chat, User} from '../types';
import {AppState} from 'react-native';
import {showMessageNotification} from './notificationService';

const chatsCollection = firestore().collection('chats');
const messagesCollection = firestore().collection('messages');
const usersCollection = firestore().collection('users');

/**
 * Generate consistent chat ID from two user IDs
 */
export const getChatId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

/**
 * Create or get existing chat between two users
 */
export const createOrGetChat = async (
  userId1: string,
  userId2: string,
): Promise<Chat> => {
  const chatId = getChatId(userId1, userId2);
  const chatDoc = await chatsCollection.doc(chatId).get();

  if (chatDoc.exists()) {
    const data = chatDoc.data();
    if (!data) {
      // If data is null, delete and recreate
      await chatsCollection.doc(chatId).delete();
    } else {
      // Return existing chat
      return {
        id: chatId,
        userId1: data.userId1 || userId1,
        userId2: data.userId2 || userId2,
        lastMessage: data.lastMessage || undefined,
        lastMessageTime: data.lastMessageTime
          ? data.lastMessageTime.toDate()
          : undefined,
        unreadCount1: data.unreadCount1 || 0,
        unreadCount2: data.unreadCount2 || 0,
      };
    }
  }

  // Create new chat
  await chatsCollection.doc(chatId).set({
    userId1,
    userId2,
    lastMessage: '',
    lastMessageTime: firestore.FieldValue.serverTimestamp(),
    unreadCount1: 0,
    unreadCount2: 0,
  });

  return {
    id: chatId,
    userId1,
    userId2,
    unreadCount1: 0,
    unreadCount2: 0,
  };
};

/**
 * Send a message
 */
export const sendMessage = async (
  chatId: string,
  senderId: string,
  receiverId: string,
  text: string,
): Promise<void> => {
  try {
    const messageData = {
      chatId,
      senderId,
      receiverId,
      text,
      timestamp: firestore.FieldValue.serverTimestamp(),
      read: false,
    };

    // Add message to messages collection
    await messagesCollection.add(messageData);

    // Update chat document with last message
    const chatRef = chatsCollection.doc(chatId);
    const chatDoc = await chatRef.get();
    const chatData = chatDoc.data();

    if (chatData) {
      const isUser1 = chatData.userId1 === senderId;
      const updateData: any = {
        lastMessage: text,
        lastMessageTime: firestore.FieldValue.serverTimestamp(),
      };

      // Increment unread count for receiver
      if (isUser1) {
        updateData.unreadCount2 =
          firestore.FieldValue.increment(1);
      } else {
        updateData.unreadCount1 =
          firestore.FieldValue.increment(1);
      }

      await chatRef.update(updateData);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Get real-time messages for a chat
 */
export const getChatMessages = (
  chatId: string,
  callback: (messages: Message[]) => void,
): () => void => {
  const unsubscribe = messagesCollection
    .where('chatId', '==', chatId)
    .onSnapshot(
      snapshot => {
        const messages: Message[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          
          // Skip invalid messages (missing required fields)
          if (!data.text || !data.senderId) {
            console.warn('Skipping invalid message:', doc.id, data);
            return;
          }
          
          // Handle timestamp - it might be null if serverTimestamp() hasn't resolved yet
          let timestamp: Date;
          if (data.timestamp) {
            timestamp = data.timestamp.toDate();
          } else if (data.timestamp === null) {
            // If timestamp is explicitly null, use current time as fallback
            timestamp = new Date();
          } else {
            // If timestamp is undefined, use current time
            timestamp = new Date();
          }
          
          messages.push({
            id: doc.id,
            chatId: data.chatId || chatId,
            senderId: data.senderId,
            receiverId: data.receiverId || '',
            text: data.text,
            timestamp,
            read: data.read || false,
          });
        });
        
        // Sort messages by timestamp to ensure correct order (in case of timing issues)
        messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        callback(messages);
      },
      error => {
        console.error('Error listening to messages:', error);
        // Call callback with empty array on error to prevent UI issues
        callback([]);
      },
    );

  return unsubscribe;
};

/**
 * Get all chats for a user
 */
export const getUserChats = (
  userId: string,
  callback: (chats: Chat[]) => void,
): () => void => {
  const processChats = async () => {
    try {
      // Get chats where user is userId1
      const snapshot1 = await chatsCollection
        .where('userId1', '==', userId)
        .get();

      // Get chats where user is userId2
      const snapshot2 = await chatsCollection
        .where('userId2', '==', userId)
        .get();

      const allChats: Chat[] = [];

      // Process userId1 chats
      snapshot1.forEach(doc => {
        const data = doc.data();
        allChats.push({
          id: doc.id,
          userId1: data.userId1 || '',
          userId2: data.userId2 || '',
          lastMessage: data.lastMessage || undefined,
          lastMessageTime: data.lastMessageTime
            ? data.lastMessageTime.toDate()
            : undefined,
          unreadCount1: data.unreadCount1 || 0,
          unreadCount2: data.unreadCount2 || 0,
        });
      });

      // Process userId2 chats
      snapshot2.forEach(doc => {
        const data = doc.data();
        allChats.push({
          id: doc.id,
          userId1: data.userId1 || '',
          userId2: data.userId2 || '',
          lastMessage: data.lastMessage || undefined,
          lastMessageTime: data.lastMessageTime
            ? data.lastMessageTime.toDate()
            : undefined,
          unreadCount1: data.unreadCount1 || 0,
          unreadCount2: data.unreadCount2 || 0,
        });
      });

      // Remove duplicates
      const uniqueChats = Array.from(
        new Map(allChats.map(chat => [chat.id, chat])).values(),
      );

      // Fetch user data for all chats
      const chatsWithUserData = await Promise.all(
        uniqueChats.map(async chat => {
          const otherUserId =
            chat.userId1 === userId ? chat.userId2 : chat.userId1;
          const userDoc = await usersCollection.doc(otherUserId).get();
          const userData = userDoc.exists()
            ? (userDoc.data() as User)
            : undefined;

          return {
            ...chat,
            user1Data: chat.userId1 === userId ? undefined : userData,
            user2Data: chat.userId2 === userId ? undefined : userData,
          };
        }),
      );

      // Sort by last message time (newest first)
      chatsWithUserData.sort((a, b) => {
        const timeA = a.lastMessageTime?.getTime() || 0;
        const timeB = b.lastMessageTime?.getTime() || 0;
        return timeB - timeA;
      });

      callback(chatsWithUserData);
    } catch (error) {
      console.error('Error processing chats:', error);
    }
  };

  // Listen to userId1 changes
  const unsubscribe1 = chatsCollection
    .where('userId1', '==', userId)
    .onSnapshot(
      () => {
        processChats();
      },
      error => {
        console.error('Error listening to chats (userId1):', error);
      },
    );

  // Listen to userId2 changes
  const unsubscribe2 = chatsCollection
    .where('userId2', '==', userId)
    .onSnapshot(
      () => {
        processChats();
      },
      error => {
        console.error('Error listening to chats (userId2):', error);
      },
    );

  // Initial load
  processChats();

  return () => {
    unsubscribe1();
    unsubscribe2();
  };
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (
  chatId: string,
  userId: string,
): Promise<void> => {
  try {
    // Mark all unread messages as read
    const unreadMessages = await messagesCollection
      .where('chatId', '==', chatId)
      .where('receiverId', '==', userId)
      .where('read', '==', false)
      .get();

    const batch = firestore().batch();
    unreadMessages.forEach(doc => {
      batch.update(doc.ref, {read: true});
    });

    await batch.commit();

    // Reset unread count in chat document
    const chatRef = chatsCollection.doc(chatId);
    const chatDoc = await chatRef.get();
    const chatData = chatDoc.data();

    if (chatData) {
      const isUser1 = chatData.userId1 === userId;
      const updateData: any = {};

      if (isUser1) {
        updateData.unreadCount1 = 0;
      } else {
        updateData.unreadCount2 = 0;
      }

      await chatRef.update(updateData);
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

/**
 * Get receiver's FCM token for sending notifications
 */
export const getReceiverFCMToken = async (
  receiverId: string,
): Promise<string | null> => {
  try {
    const userDoc = await usersCollection.doc(receiverId).get();
    if (userDoc.exists()) {
      const data = userDoc.data();
      return data?.fcmToken || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Listen to all messages for a user and show notifications for new messages
 * This will show notifications when messages arrive, even if user is not viewing that chat
 */
export const setupMessageNotifications = (
  userId: string,
  currentChatId?: string, // Optional: if user is viewing a chat, don't show notification for that chat
): (() => void) => {
  if (!userId || userId === 'user1') {
    return () => {};
  }

  let lastMessageIds = new Set<string>();
  let isInitialLoad = true;

  // Listen to messages without orderBy to avoid index requirement
  // We'll sort in memory if needed
  const unsubscribe = messagesCollection
    .where('receiverId', '==', userId)
    .limit(100) // Listen to recent messages (increased limit)
    .onSnapshot(
      async snapshot => {
        if (isInitialLoad) {
          // On initial load, just store message IDs without showing notifications
          snapshot.forEach(doc => {
            lastMessageIds.add(doc.id);
          });
          isInitialLoad = false;
          return;
        }

        // Check for new messages
        const newMessages: Message[] = [];
        snapshot.forEach(doc => {
          if (!lastMessageIds.has(doc.id)) {
            const data = doc.data();
            if (data.text && data.senderId && data.chatId !== currentChatId) {
              // Only show notification if not viewing this chat
              let timestamp: Date;
              if (data.timestamp) {
                timestamp = data.timestamp.toDate();
              } else {
                timestamp = new Date();
              }

              newMessages.push({
                id: doc.id,
                chatId: data.chatId || '',
                senderId: data.senderId,
                receiverId: data.receiverId || '',
                text: data.text,
                timestamp,
                read: data.read || false,
              });
            }
            lastMessageIds.add(doc.id);
          }
        });

        // Show notifications for new messages
        for (const message of newMessages) {
          // Only show notification if user is not viewing this specific chat
          // Show notification regardless of app state (foreground/background)
          if (message.chatId !== currentChatId) {
            try {
              console.log('New message received, showing notification:', message.text);
              
              // Get sender name
              const senderDoc = await usersCollection.doc(message.senderId).get();
              const senderData = senderDoc.exists() ? (senderDoc.data() as User) : null;
              const senderName = senderData?.name || 'Someone';

              // Show notification
              await showMessageNotification(
                senderName,
                message.text,
                message.chatId,
              );
              console.log('Notification shown successfully');
            } catch (error) {
              console.error('Error showing notification:', error);
            }
          } else {
            console.log('Skipping notification - user is viewing this chat');
          }
        }
      },
      error => {
        console.error('Error listening to messages for notifications:', error);
      },
    );

  return unsubscribe;
};

