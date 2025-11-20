import React, {useState} from 'react';
import {View, Text, StyleSheet, SafeAreaView, Alert, StatusBar} from 'react-native';
import {useApp} from '../context/AppContext';
import SwipeCard from '../components/SwipeCard';
import {Colors} from '../utils/colors';
import GoogleLogin from '../components/GoogleLogin';

const HomeScreen = () => {
  const {animals, likeAnimal, passAnimal} = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const handleChat = () => {
    if (currentIndex < animals.length) {
      const animal = animals[currentIndex];
      Alert.alert(
        'Chat Feature',
        `Chat with ${animal.name}'s owner coming soon! 💬`,
        [{text: 'OK'}],
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Animinder</Text>
          <Text style={styles.logoEmoji}>🐾</Text>
        </View>
        <View style={styles.counterBadge}>
          <Text style={styles.counterText}>
            {animals.length - currentIndex} left
          </Text>
        </View>
      </View>

      <GoogleLogin />
      {/* Cards Container */}
      <View style={styles.cardContainer}>
        {currentIndex >= animals.length ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🎉</Text>
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
  logoEmoji: {
    fontSize: 24,
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
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 80,
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

