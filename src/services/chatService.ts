import firestore from '@react-native-firebase/firestore';
import {Message, Chat, User} from '../types';

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
    .orderBy('timestamp', 'asc')
    .onSnapshot(
      snapshot => {
        const messages: Message[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          messages.push({
            id: doc.id,
            chatId: data.chatId || chatId,
            senderId: data.senderId || '',
            receiverId: data.receiverId || '',
            text: data.text || '',
            timestamp: data.timestamp
              ? data.timestamp.toDate()
              : new Date(),
            read: data.read || false,
          });
        });
        callback(messages);
      },
      error => {
        console.error('Error listening to messages:', error);
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

