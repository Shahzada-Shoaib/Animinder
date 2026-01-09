import React, {useState, useRef} from 'react';
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
import MyPetsSection from '../components/MyPetsSection';
import {Animal} from '../types';
import auth from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {Colors} from '../utils/colors';
import {Shadows} from '../utils/shadows';

const ProfileScreen = () => {
  const {currentUser, userAnimals, addAnimal: contextAddAnimal, removeAnimal} = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const optimisticAddRef = useRef<((animal: Animal) => void) | null>(null);

  // Wrapped addAnimal function with optimistic update
  const handleAddAnimal = async (animal: Animal) => {
    // Trigger optimistic update in MyPetsSection immediately
    if (optimisticAddRef.current) {
      optimisticAddRef.current(animal);
    }
    
    // Then call the actual addAnimal function
    await contextAddAnimal(animal);
  };

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

        <MyPetsSection
          onAddPet={() => setModalVisible(true)}
          onRemovePet={removeAnimal}
          onAnimalAdded={(callback) => {
            optimisticAddRef.current = callback;
          }}
        />
      </ScrollView>

      <AddAnimalModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddAnimal}
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
});

export default ProfileScreen;

