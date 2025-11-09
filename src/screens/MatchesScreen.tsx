import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import {useApp} from '../context/AppContext';

const MatchesScreen = () => {
  const {matches} = useApp();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Matches 💕</Text>

      <ScrollView style={styles.scrollView}>
        {matches.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No matches yet</Text>
            <Text style={styles.emptySubtext}>
              Keep swiping to find perfect companions!
            </Text>
          </View>
        ) : (
          <View style={styles.matchesList}>
            {matches.map(match => (
              <View key={match.id} style={styles.matchCard}>
                <View style={styles.matchHeader}>
                  <Text style={styles.matchTitle}>It's a Match!</Text>
                  <Text style={styles.matchDate}>
                    {new Date(match.timestamp).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.animalsContainer}>
                  <View style={styles.animalContainer}>
                    <Image
                      source={{uri: match.animal1.image}}
                      style={styles.animalImage}
                    />
                    <Text style={styles.animalName}>{match.animal1.name}</Text>
                  </View>

                  <Text style={styles.heart}>❤️</Text>

                  <View style={styles.animalContainer}>
                    <Image
                      source={{uri: match.animal2.image}}
                      style={styles.animalImage}
                    />
                    <Text style={styles.animalName}>{match.animal2.name}</Text>
                  </View>
                </View>
              </View>
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
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    color: '#FF6B6B',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
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
    color: '#FF6B6B',
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
  animalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  heart: {
    fontSize: 30,
  },
});

export default MatchesScreen;

