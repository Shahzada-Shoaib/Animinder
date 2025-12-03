import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {useApp} from '../context/AppContext';
import {Colors} from '../utils/colors';
import {Chat} from '../types';

const ChatsScreen = () => {
  const {chats, currentUser} = useApp();
  const navigation = useNavigation();

  const formatTime = (date?: Date): string => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getOtherUser = (chat: Chat) => {
    if (chat.userId1 === currentUser.id) {
      return chat.user2Data || {name: 'User', photoURL: undefined};
    }
    return chat.user1Data || {name: 'User', photoURL: undefined};
  };

  const getUnreadCount = (chat: Chat): number => {
    if (chat.userId1 === currentUser.id) {
      return chat.unreadCount1;
    }
    return chat.unreadCount2;
  };

  const handleChatPress = (chat: Chat) => {
    const otherUser = getOtherUser(chat);
    navigation.navigate('ChatDetail', {
      chatId: chat.id,
      otherUserId: chat.userId1 === currentUser.id ? chat.userId2 : chat.userId1,
      otherUserName: otherUser.name || 'User',
      otherUserPhoto: otherUser.photoURL,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Chats</Text>
        <Icon name="chatbubble" size={28} color={Colors.primary} style={styles.titleIcon} />
      </View>

      <ScrollView style={styles.scrollView}>
        {chats.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="chatbubble" size={80} color={Colors.primary} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No chats yet</Text>
            <Text style={styles.emptySubtext}>
              Start a conversation with someone!
            </Text>
          </View>
        ) : (
          <View style={styles.chatsList}>
            {chats.map(chat => {
              const otherUser = getOtherUser(chat);
              const unreadCount = getUnreadCount(chat);
              return (
                <TouchableOpacity
                  key={chat.id}
                  style={styles.chatCard}
                  activeOpacity={0.7}
                  onPress={() => handleChatPress(chat)}>
                  {otherUser.photoURL ? (
                    <Image
                      source={{uri: otherUser.photoURL}}
                      style={styles.chatImage}
                    />
                  ) : (
                    <View style={[styles.chatImage, styles.defaultAvatar]}>
                      <Icon name="person" size={30} color={Colors.gray400} />
                    </View>
                  )}
                  <View style={styles.chatInfo}>
                    <Text style={styles.chatName}>{otherUser.name || 'User'}</Text>
                    <Text style={styles.chatMessage} numberOfLines={1}>
                      {chat.lastMessage || 'No messages yet'}
                    </Text>
                  </View>
                  <View style={styles.chatMeta}>
                    {chat.lastMessageTime && (
                      <Text style={styles.chatTime}>
                        {formatTime(chat.lastMessageTime)}
                      </Text>
                    )}
                    {unreadCount > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 8,
  },
  titleIcon: {
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 15,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  chatsList: {
    gap: 10,
    paddingBottom: 20,
  },
  chatCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chatImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  defaultAvatar: {
    backgroundColor: Colors.gray400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  chatMessage: {
    fontSize: 14,
    color: '#666',
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ChatsScreen;

