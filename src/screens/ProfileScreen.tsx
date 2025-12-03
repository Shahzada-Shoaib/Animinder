import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useApp} from '../context/AppContext';
import AddAnimalModal from '../components/AddAnimalModal';
import auth from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {Colors} from '../utils/colors';
import {Shadows} from '../utils/shadows';

const ProfileScreen = () => {
  const {currentUser, userAnimals, addAnimal, removeAnimal} = useApp();
  const [modalVisible, setModalVisible] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await GoogleSignin.signOut();
              await auth().signOut();
            } catch (error) {
              console.log('Logout Error:', error);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}>
            <Icon name="log-out-outline" size={18} color={Colors.white} style={styles.logoutIcon} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
          
          {currentUser.photoURL ? (
            <Image
              source={{uri: currentUser.photoURL}}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImageText}>
                {currentUser.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.email}>{currentUser.email}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Pets</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}>
              <Icon name="add-circle" size={20} color={Colors.white} style={styles.addButtonIcon} />
              <Text style={styles.addButtonText}>Add Pet</Text>
            </TouchableOpacity>
          </View>

          {userAnimals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No pets added yet</Text>
              <Text style={styles.emptySubtext}>
                Add your first pet to start matching!
              </Text>
            </View>
          ) : (
            <View style={styles.animalsGrid}>
              {userAnimals.map(animal => (
                <View key={animal.id} style={styles.animalCard}>
                  <Image
                    source={{uri: animal.image}}
                    style={styles.animalImage}
                  />
                  <View style={styles.animalInfo}>
                    <Text style={styles.animalName}>{animal.name}</Text>
                    <Text style={styles.animalBreed}>{animal.breed}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeAnimal(animal.id)}
                    activeOpacity={0.7}>
                    <Icon name="trash-outline" size={18} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <AddAnimalModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={addAnimal}
        userId={currentUser.id}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.primary + '20',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: Colors.primary + '20',
  },
  profileImageText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.white,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  logoutButton: {
    position: 'absolute',
    top: 16,
    right: 24,
    backgroundColor: Colors.gray300,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.small,
  },
  logoutIcon: {
    marginRight: 6,
  },
  logoutButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.small,
  },
  addButtonIcon: {
    marginRight: 6,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  animalsGrid: {
    gap: 16,
  },
  animalCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.small,
  },
  animalImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    borderWidth: 2,
    borderColor: Colors.gray200,
  },
  animalInfo: {
    flex: 1,
  },
  animalName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  animalBreed: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: Colors.error,
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
});

export default ProfileScreen;

