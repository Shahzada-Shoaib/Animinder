import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useRoute, useNavigation} from '@react-navigation/native';
import {useApp} from '../context/AppContext';
import {Colors} from '../utils/colors';
import {Message} from '../types';
import {getChatMessages, sendMessage, markMessagesAsRead} from '../services/chatService';
import {sendNotificationToReceiver} from '../services/notificationService';

interface RouteParams {
  chatId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto?: string;
}

const ChatDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {chatId, otherUserId, otherUserName, otherUserPhoto} =
    (route.params as RouteParams) || {};
  const {currentUser, setCurrentViewingChatId} = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!chatId) {
      return;
    }

    // Set navigation header
    navigation.setOptions({
      title: otherUserName || 'Chat',
      headerBackTitle: 'Back',
    });

    // Set current viewing chat ID (to avoid showing notifications for this chat)
    setCurrentViewingChatId(chatId);

    // Cleanup: clear viewing chat ID when leaving
    return () => {
      setCurrentViewingChatId(undefined);
    };
  }, [chatId, otherUserName, navigation, setCurrentViewingChatId]);

  useEffect(() => {
    if (!chatId) {
      return;
    }

    // Subscribe to messages
    const unsubscribe = getChatMessages(chatId, (newMessages) => {
      // Merge real messages from Firestore with any pending optimistic messages
      setMessages(prev => {
        // Keep optimistic messages that don't have a matching real message yet
        const optimisticMessages = prev.filter(msg => msg.id.startsWith('temp-'));
        const realMessages = newMessages.filter(msg => !msg.id.startsWith('temp-'));
        
        // Check if any optimistic message has been replaced by a real one
        // Match by text, sender, and similar timestamp (within 5 seconds)
        const replacedOptimisticIds = optimisticMessages
          .filter(optMsg => {
            return realMessages.some(realMsg => 
              realMsg.text === optMsg.text &&
              realMsg.senderId === optMsg.senderId &&
              Math.abs(realMsg.timestamp.getTime() - optMsg.timestamp.getTime()) < 5000
            );
          })
          .map(msg => msg.id);
        
        // Remove replaced optimistic messages and merge with real messages
        const remainingOptimistic = optimisticMessages.filter(
          msg => !replacedOptimisticIds.includes(msg.id)
        );
        
        // Combine real messages with remaining optimistic messages
        const allMessages = [...realMessages, ...remainingOptimistic];
        
        // Sort by timestamp to ensure correct order
        allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        return allMessages;
      });
      
      // Auto-scroll to bottom when new message arrives
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    });

    // Mark messages as read when screen is focused
    if (currentUser.id && currentUser.id !== 'user1') {
      markMessagesAsRead(chatId, currentUser.id);
    }

    return () => {
      unsubscribe();
    };
  }, [chatId, currentUser.id, navigation, otherUserName]);

  // Handle keyboard show event to scroll chat to bottom
  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    });

    return () => {
      showSubscription.remove();
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !chatId || !currentUser.id || currentUser.id === 'user1' || sending) {
      return;
    }

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    // Create optimistic message to show immediately
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticMessage: Message = {
      id: tempId,
      chatId,
      senderId: currentUser.id,
      receiverId: otherUserId,
      text: messageText,
      timestamp: new Date(),
      read: false,
    };

    // Add optimistic message to UI immediately
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Scroll to bottom to show the new message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: true});
    }, 100);

    try {
      await sendMessage(chatId, currentUser.id, otherUserId, messageText);
      
      // Send notification to receiver
      await sendNotificationToReceiver(
        otherUserId,
        currentUser.name || 'Someone',
        messageText,
        chatId,
      );
      
      // The real message from Firestore will replace the optimistic one
      // No need to manually remove it - the onSnapshot listener will handle it
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      // Restore input text on error
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = date.getHours();
    const mins = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
  };

  const renderMessage = ({item}: {item: Message}) => {
    const isSender = item.senderId === currentUser.id;
    
    return (
      <View
        style={[
          styles.messageContainer,
          isSender ? styles.senderMessage : styles.receiverMessage,
        ]}>
        {!isSender && (
          otherUserPhoto ? (
            <Image
              source={{uri: otherUserPhoto}}
              style={styles.messageAvatar}
            />
          ) : (
            <View style={[styles.messageAvatar, styles.defaultAvatar]}>
              <Icon name="person" size={16} color={Colors.gray400} />
            </View>
          )
        )}
        <View
          style={[
            styles.messageBubble,
            isSender ? styles.senderBubble : styles.receiverBubble,
          ]}>
          <Text
            style={[
              styles.messageText,
              isSender ? styles.senderText : styles.receiverText,
            ]}>
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isSender ? styles.senderTime : styles.receiverTime,
            ]}>
            {formatMessageTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({animated: false});
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="chatbubble-outline" size={60} color={Colors.gray400} />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          }
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.gray400}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}>
            <Icon
              name="send"
              size={20}
              color={inputText.trim() && !sending ? '#fff' : Colors.gray400}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: 15,
    paddingBottom: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray400,
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.gray400,
    marginTop: 5,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  senderMessage: {
    justifyContent: 'flex-end',
  },
  receiverMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  defaultAvatar: {
    backgroundColor: Colors.gray400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  senderBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  receiverBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  senderText: {
    color: '#fff',
  },
  receiverText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  senderTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  receiverTime: {
    color: Colors.gray400,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray400,
  },
});

export default ChatDetailScreen;

