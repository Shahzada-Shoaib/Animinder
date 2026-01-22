import React, {useEffect, useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useApp} from '../context/AppContext';
import {getUserMatches} from '../services/matchService';
import {createOrGetChat} from '../services/chatService';
import {getUser} from '../services/firestoreService';
import auth from '@react-native-firebase/auth';
import {Colors} from '../utils/colors';
import {Match} from '../types';

const MatchesScreen = () => {
  const {matches, currentUser, refreshMatches} = useApp();
  const navigation = useNavigation();
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Refresh matches when screen is focused
  useFocusEffect(
    useCallback(() => {
      console.log('[MatchesScreen] Screen focused, refreshing matches');
      if (currentUser.id && currentUser.id !== 'user1') {
        setIsLoading(true);
        refreshMatches();
        // Simulate loading time for better UX
        setTimeout(() => setIsLoading(false), 500);
      } else {
        setIsLoading(false);
      }
    }, [currentUser.id, refreshMatches]),
  );

  useEffect(() => {
    console.log('[MatchesScreen] Matches updated:', matches.length);
  }, [matches]);

  const [navigatingChatId, setNavigatingChatId] = useState<string | null>(null);

  const handleMatchPress = async (match: Match) => {
    if (currentUser.id === 'user1' || navigatingChatId) {
      return;
    }

    try {
      setNavigatingChatId(match.id);
      const otherUserId =
        match.userId1 === currentUser.id ? match.userId2 : match.userId1;

      const otherUser = await getUser(otherUserId);
      const chat = await createOrGetChat(currentUser.id, otherUserId);

      navigation.navigate('ChatDetail', {
        chatId: chat.id,
        otherUserId: otherUserId,
        otherUserName: otherUser?.name || 'User',
        otherUserPhoto: otherUser?.photoURL,
      });
    } catch (error) {
      console.error('Error opening chat:', error);
    } finally {
      setNavigatingChatId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Matches</Text>
        <Icon name="heart" size={28} color={Colors.primary} style={styles.titleIcon} />
      </View>

      <ScrollView style={styles.scrollView}>
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading matches...</Text>
          </View>
        ) : matches.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No matches yet</Text>
            <Text style={styles.emptySubtext}>
              Keep swiping to find perfect companions!
            </Text>
          </View>
        ) : (
          <View style={styles.matchesList}>
            {matches.map(match => (
              <TouchableOpacity
                key={match.id}
                style={styles.matchCard}
                activeOpacity={0.7}
                onPress={() => handleMatchPress(match)}
                disabled={currentUser.id === 'user1' || navigatingChatId === match.id}>
                <View style={styles.matchHeader}>
                  <Text style={styles.matchTitle}>It's a Match!</Text>
                  {navigatingChatId === match.id ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Text style={styles.matchDate}>
                      {match.timestamp
                        ? new Date(match.timestamp).toLocaleDateString()
                        : 'Today'}
                    </Text>
                  )}
                </View>

                <View style={styles.animalsContainer}>
                  <View style={styles.animalContainer}>
                    {imageErrors.has(`animal1-${match.id}`) ? (
                      <View style={styles.animalImageError}>
                        <Icon name="image-outline" size={40} color={Colors.gray400} />
                      </View>
                    ) : (
                      <Image
                        source={{uri: match.animal1?.image || ''}}
                        style={styles.animalImage}
                        onError={() => setImageErrors(prev => new Set(prev).add(`animal1-${match.id}`))}
                      />
                    )}
                    <Text style={styles.animalName}>
                      {match.animal1?.name || 'Unknown'}
                    </Text>
                  </View>

                  <Icon name="heart" size={30} color={Colors.primary} />

                  <View style={styles.animalContainer}>
                    {imageErrors.has(`animal2-${match.id}`) ? (
                      <View style={styles.animalImageError}>
                        <Icon name="image-outline" size={40} color={Colors.gray400} />
                      </View>
                    ) : (
                      <Image
                        source={{uri: match.animal2?.image || ''}}
                        style={styles.animalImage}
                        onError={() => setImageErrors(prev => new Set(prev).add(`animal2-${match.id}`))}
                      />
                    )}
                    <Text style={styles.animalName}>
                      {match.animal2?.name || 'Unknown'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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
    paddingHorizontal: 20,
  },
  loadingState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
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
  matchesList: {
    gap: 15,
    paddingBottom: 20,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  matchDate: {
    fontSize: 14,
    color: '#999',
  },
  animalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  animalContainer: {
    alignItems: 'center',
  },
  animalImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  animalImageError: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    backgroundColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default MatchesScreen;

