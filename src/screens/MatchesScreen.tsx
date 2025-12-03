import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useApp} from '../context/AppContext';
import {getUserMatches} from '../services/matchService';
import auth from '@react-native-firebase/auth';
import {Colors} from '../utils/colors';

const MatchesScreen = () => {
  const {matches, currentUser} = useApp();

  useEffect(() => {
    const loadMatches = async () => {
      const firebaseUser = auth().currentUser;
      if (firebaseUser && currentUser.id !== 'user1') {
        try {
          const userMatches = await getUserMatches(currentUser.id);
          // Matches are already loaded in AppContext, this is just for refresh
        } catch (error) {
          console.error('Error loading matches:', error);
        }
      }
    };

    loadMatches();
  }, [currentUser.id]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Matches</Text>
        <Icon name="heart" size={28} color={Colors.primary} style={styles.titleIcon} />
      </View>

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
                    {match.timestamp
                      ? new Date(match.timestamp).toLocaleDateString()
                      : 'Today'}
                  </Text>
                </View>

                <View style={styles.animalsContainer}>
                  <View style={styles.animalContainer}>
                    <Image
                      source={{uri: match.animal1?.image || ''}}
                      style={styles.animalImage}
                    />
                    <Text style={styles.animalName}>
                      {match.animal1?.name || 'Unknown'}
                    </Text>
                  </View>

                  <Icon name="heart" size={30} color={Colors.primary} />

                  <View style={styles.animalContainer}>
                    <Image
                      source={{uri: match.animal2?.image || ''}}
                      style={styles.animalImage}
                    />
                    <Text style={styles.animalName}>
                      {match.animal2?.name || 'Unknown'}
                    </Text>
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
  animalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default MatchesScreen;

