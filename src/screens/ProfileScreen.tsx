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
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {useApp} from '../context/AppContext';
import AddAnimalModal from '../components/AddAnimalModal';
import MyPetsSection from '../components/MyPetsSection';
import {Animal} from '../types';
import auth from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {Colors} from '../utils/colors';
import {Shadows} from '../utils/shadows';
import {uploadUserImage} from '../services/imageUploadService';
import {saveUser} from '../services/firestoreService';

const ProfileScreen = () => {
  const {currentUser, userAnimals, addAnimal: contextAddAnimal, removeAnimal, setCurrentUser} = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
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

  // Wrapped removeAnimal function with confirmation dialog
  const handleRemoveAnimal = (animalId: string) => {
    const animal = userAnimals.find(a => a.id === animalId);
    const animalName = animal?.name || 'this pet';
    
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to delete ${animalName}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeAnimal(animalId),
        },
      ],
    );
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const androidVersion = Platform.Version;
        
        if (androidVersion >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: 'Photo Permission',
              message: 'App needs access to your photos',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'App needs access to your storage to pick photos',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn('Permission error:', err);
        return false;
      }
    }
    return true;
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera access to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Camera permission error:', err);
        return false;
      }
    }
    return true;
  };

  const handleProfileImageUpload = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const hasPermission = await requestCameraPermission();
            if (!hasPermission) {
              Alert.alert('Permission Required', 'Please grant camera permission to take photos');
              return;
            }

            try {
              const result = await launchCamera({
                mediaType: 'photo',
                quality: 0.8,
                maxWidth: 800,
                maxHeight: 800,
                saveToPhotos: true,
              });

              if (result.didCancel) return;
              if (result.errorCode) {
                Alert.alert('Error', result.errorMessage || 'Could not open camera');
                return;
              }

              if (result.assets && result.assets[0]?.uri) {
                await uploadAndUpdateProfileImage(result.assets[0].uri);
              }
            } catch (error) {
              console.error('Camera error:', error);
              Alert.alert('Error', 'Could not open camera');
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const hasPermission = await requestStoragePermission();
            if (!hasPermission) {
              Alert.alert('Permission Required', 'Please grant storage permission to select photos');
              return;
            }

            try {
              const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
                maxWidth: 800,
                maxHeight: 800,
                selectionLimit: 1,
              });

              if (result.didCancel) return;
              if (result.errorCode) {
                Alert.alert('Error', result.errorMessage || 'Could not pick image');
                return;
              }

              if (result.assets && result.assets[0]?.uri) {
                await uploadAndUpdateProfileImage(result.assets[0].uri);
              }
            } catch (error) {
              console.error('Gallery error:', error);
              Alert.alert('Error', 'Could not open gallery');
            }
          },
        },
        {text: 'Cancel', style: 'cancel'},
      ],
    );
  };

  const uploadAndUpdateProfileImage = async (imageUri: string) => {
    try {
      setUploadingProfileImage(true);
      
      // Upload image to Hostinger
      const imageUrl = await uploadUserImage(imageUri);
      
      // Update user in Firebase
      const updatedUser = {
        ...currentUser,
        photoURL: imageUrl,
      };
      
      await saveUser(currentUser.id, updatedUser);
      
      // Update context
      setCurrentUser(updatedUser);
      
      Alert.alert('Success', 'Profile photo updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile image:', error);
      Alert.alert(
        'Upload Failed',
        error.message || 'Failed to update profile photo. Please try again.',
      );
    } finally {
      setUploadingProfileImage(false);
    }
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
          
          <TouchableOpacity
            onPress={handleProfileImageUpload}
            disabled={uploadingProfileImage}
            activeOpacity={0.8}
            style={styles.profileImageContainer}>
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
            {uploadingProfileImage && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="small" color={Colors.white} />
              </View>
            )}
            <View style={styles.editIconContainer}>
              <Icon name="camera" size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.email}>{currentUser.email}</Text>
        </View>

        <MyPetsSection
          onAddPet={() => setModalVisible(true)}
          onRemovePet={handleRemoveAnimal}
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
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    ...Shadows.small,
  },
});

export default ProfileScreen;

