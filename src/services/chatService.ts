import firestore from '@react-native-firebase/firestore';
import {Message, Chat, User} from '../types';

const chatsCollection = firestore().collection('chats');
const usersCollection = firestore().collection('users');

// Helper to get messages subcollection for a chat
const getMessagesCollection = (chatId: string) => {
  return chatsCollection.doc(chatId).collection('messages');
};

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
 * Send a message (using subcollections and transactions for reliability)
 */
export const sendMessage = async (
  chatId: string,
  senderId: string,
  receiverId: string,
  text: string,
): Promise<void> => {
  try {
    const chatRef = chatsCollection.doc(chatId);
    const messagesRef = getMessagesCollection(chatId);

    // Use transaction to ensure atomic updates
    await firestore().runTransaction(async (transaction) => {
      const chatDoc = await transaction.get(chatRef);
      
      if (!chatDoc.exists()) {
        throw new Error('Chat does not exist');
      }

      const chatData = chatDoc.data();
      if (!chatData) {
        throw new Error('Chat data is null');
      }

      // Add message to subcollection
      const messageRef = messagesRef.doc();
      transaction.set(messageRef, {
        chatId,
        senderId,
        receiverId,
        text,
        timestamp: firestore.FieldValue.serverTimestamp(),
        read: false,
      });

      // Update chat document with last message and unread count
      const isUser1 = chatData.userId1 === senderId;
      const updateData: any = {
        lastMessage: text,
        lastMessageTime: firestore.FieldValue.serverTimestamp(),
      };

      // Atomically increment unread count for receiver
      if (isUser1) {
        const currentCount = chatData.unreadCount2 || 0;
        updateData.unreadCount2 = currentCount + 1;
      } else {
        const currentCount = chatData.unreadCount1 || 0;
        updateData.unreadCount1 = currentCount + 1;
      }

      transaction.update(chatRef, updateData);
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Get real-time messages for a chat with pagination support
 * @param chatId - The chat ID
 * @param callback - Callback function to receive messages
 * @param limit - Maximum number of messages to fetch (default: 50)
 */
export const getChatMessages = (
  chatId: string,
  callback: (messages: Message[]) => void,
  limit: number = 50,
): () => void => {
  const messagesRef = getMessagesCollection(chatId);
  
  // Query last N messages, ordered by timestamp descending
  // We'll reverse them in the callback to show oldest first
  const unsubscribe = messagesRef
    .orderBy('timestamp', 'desc')
    .limit(limit)
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
        // Reverse to show oldest messages first (ascending order)
        callback(messages.reverse());
      },
      error => {
        console.error('Error listening to messages:', error);
      },
    );

  return unsubscribe;
};

/**
 * Load more messages (for pagination)
 * @param chatId - The chat ID
 * @param lastMessageTimestamp - Timestamp of the last loaded message
 * @param limit - Number of messages to load (default: 50)
 */
export const loadMoreMessages = async (
  chatId: string,
  lastMessageTimestamp: Date,
  limit: number = 50,
): Promise<Message[]> => {
  try {
    const messagesRef = getMessagesCollection(chatId);
    const lastTimestamp = firestore.Timestamp.fromDate(lastMessageTimestamp);

    const snapshot = await messagesRef
      .orderBy('timestamp', 'desc')
      .startAfter(lastTimestamp)
      .limit(limit)
      .get();

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

    // Reverse to show oldest first
    return messages.reverse();
  } catch (error) {
    console.error('Error loading more messages:', error);
    throw error;
  }
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
 * Mark messages as read (using subcollections and transactions)
 */
export const markMessagesAsRead = async (
  chatId: string,
  userId: string,
): Promise<void> => {
  try {
    const messagesRef = getMessagesCollection(chatId);
    const chatRef = chatsCollection.doc(chatId);

    // Use transaction for atomic updates
    await firestore().runTransaction(async (transaction) => {
      // Get unread messages
      const unreadSnapshot = await messagesRef
        .where('receiverId', '==', userId)
        .where('read', '==', false)
        .get();

      // Mark all unread messages as read
      unreadSnapshot.forEach(doc => {
        transaction.update(doc.ref, {read: true});
      });

      // Reset unread count in chat document
      const chatDoc = await transaction.get(chatRef);
      const chatData = chatDoc.data();

      if (chatData) {
        const isUser1 = chatData.userId1 === userId;
        const updateData: any = {};

        if (isUser1) {
          updateData.unreadCount1 = 0;
        } else {
          updateData.unreadCount2 = 0;
        }

        transaction.update(chatRef, updateData);
      }
    });
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

