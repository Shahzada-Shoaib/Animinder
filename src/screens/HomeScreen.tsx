import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, SafeAreaView, Alert, StatusBar} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import Icon from 'react-native-vector-icons/Ionicons';
import {useApp} from '../context/AppContext';
import SwipeCard from '../components/SwipeCard';
import MatchModal from '../components/MatchModal';
import {Colors} from '../utils/colors';
import {createOrGetChat} from '../services/chatService';
// import GoogleLogin from '../components/GoogleLogin';

const HomeScreen = () => {
  const {animals, likeAnimal, passAnimal, newMatch, clearNewMatch, currentUser} = useApp();
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchModalVisible, setMatchModalVisible] = useState(false);

  useEffect(() => {
    if (newMatch) {
      setMatchModalVisible(true);
    }
  }, [newMatch]);

  const handleSwipeLeft = () => {
    if (currentIndex < animals.length) {
      passAnimal(animals[currentIndex].id);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSwipeRight = () => {
    if (currentIndex < animals.length) {
      likeAnimal(animals[currentIndex].id);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleChat = async () => {
    if (currentIndex < animals.length) {
      const animal = animals[currentIndex];
      
      // Check if user is logged in
      const firebaseUser = auth().currentUser;
      if (!firebaseUser) {
        Alert.alert('Login Required', 'Please login to start chatting', [{text: 'OK'}]);
        return;
      }

      // Don't allow chatting with own animals
      if (animal.ownerId === firebaseUser.uid) {
        Alert.alert('Cannot Chat', "You can't chat with yourself!", [{text: 'OK'}]);
        return;
      }

      try {
        // Create or get chat
        const chat = await createOrGetChat(firebaseUser.uid, animal.ownerId);
        
        // Navigate to chat screen
        const parent = navigation.getParent();
        (parent || navigation).navigate('ChatDetail', {
          chatId: chat.id,
          otherUserId: animal.ownerId,
          otherUserName: `${animal.name}'s owner`,
          otherUserPhoto: undefined,
        });
      } catch (error: any) {
        Alert.alert(
          'Error',
          error?.message || 'Failed to start chat. Please try again.',
          [{text: 'OK'}],
        );
      }
    }
  };

  const handleCloseMatchModal = () => {
    setMatchModalVisible(false);
    clearNewMatch();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Pet Mates</Text>
          <Icon name="paw" size={24} color={Colors.primary} style={styles.logoIcon} />
        </View>
       
      </View>

      {/* <GoogleLogin /> */}
      {/* Cards Container */}
      <View style={styles.cardContainer}>
        {currentIndex >= animals.length ? (
          <View style={styles.emptyContainer}>
            <Icon name="trophy" size={80} color={Colors.primary} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>You've seen all pets!</Text>
            <Text style={styles.emptySubtext}>Check back soon for more friends</Text>
          </View>
        ) : (
          <>
            {animals
              .slice(currentIndex, currentIndex + 2)
              .reverse()
              .map((animal, index, array) => (
                <SwipeCard
                  key={animal.id}
                  animal={animal}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                  onChat={handleChat}
                  isFirst={index === array.length - 1}
                />
              ))}
          </>
        )}
      </View>

      {/* Simple Hint */}
      <View style={styles.instructions}>
        <Text style={styles.swipeHint}>Swipe cards or use buttons on card</Text>
      </View>

      {/* Match Modal */}
      <MatchModal
        visible={matchModalVisible}
        match={newMatch}
        onClose={handleCloseMatchModal}
        currentUserId={currentUser.id}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -1,
    marginRight: 6,
  },
  logoIcon: {
    marginLeft: 6,
  },
  counterBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // paddingBottom: 10,
    // borderWidth: 4,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  instructions: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  swipeHint: {
    fontSize: 13,
    color: Colors.textLight,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

export default HomeScreen;

