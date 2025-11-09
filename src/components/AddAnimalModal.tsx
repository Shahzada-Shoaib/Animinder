import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {Animal} from '../types';
import Button from './Button';

interface AddAnimalModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (animal: Animal) => void;
  userId: string;
}

const AddAnimalModal: React.FC<AddAnimalModalProps> = ({
  visible,
  onClose,
  onAdd,
  userId,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [age, setAge] = useState('');
  const [breed, setBreed] = useState('');
  const [bio, setBio] = useState('');
  const [imageUri, setImageUri] = useState<string>('');

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // Android 13+ uses READ_MEDIA_IMAGES
        const androidVersion = Platform.Version;
        
        if (androidVersion >= 33) {
          // Android 13+
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
          // Android 12 and below
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
    return true; // iOS handles permissions automatically
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
    return true; // iOS handles permissions automatically
  };

  const handlePickImage = async () => {
    // Show options: Camera or Gallery
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: () => openCamera(),
        },
        {
          text: 'Gallery',
          onPress: () => openGallery(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      {cancelable: true},
    );
  };

  const openCamera = async () => {
    // Request camera permission first
    const hasCameraPermission = await requestCameraPermission();
    if (!hasCameraPermission) {
      Alert.alert(
        'Permission Required',
        'Please grant camera permission to take photos',
        [
          {
            text: 'OK',
            onPress: () => console.log('Camera permission denied'),
          },
        ],
      );
      return;
    }

    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
        saveToPhotos: true,
        includeBase64: false,
        cameraType: 'back',
      });

      if (result.didCancel) {
        console.log('User cancelled camera');
        return;
      }

      if (result.errorCode) {
        console.log('Camera Error: ', result.errorCode, result.errorMessage);
        
        if (result.errorCode === 'camera_unavailable') {
          Alert.alert('Error', 'Camera is not available on this device');
        } else if (result.errorCode === 'permission') {
          Alert.alert('Error', 'Camera permission denied. Please enable it in Settings.');
        } else {
          Alert.alert('Error', result.errorMessage || 'Could not open camera');
        }
        return;
      }

      if (result.assets && result.assets[0]?.uri) {
        setImageUri(result.assets[0].uri);
        console.log('Camera photo URI:', result.assets[0].uri);
        Alert.alert('Success', 'Photo captured successfully!');
      } else {
        Alert.alert('Error', 'No image was captured');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Could not open camera. Please try gallery or check permissions in Settings.');
    }
  };

  const openGallery = async () => {
    // Request storage permission first
    const hasStoragePermission = await requestStoragePermission();
    if (!hasStoragePermission) {
      Alert.alert(
        'Permission Required',
        'Please grant storage permission to select photos',
        [
          {
            text: 'OK',
            onPress: () => console.log('Storage permission denied'),
          },
        ],
      );
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

      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (result.errorCode) {
        console.log('ImagePicker Error: ', result.errorCode, result.errorMessage);
        
        if (result.errorCode === 'permission') {
          Alert.alert('Error', 'Storage permission denied. Please enable it in Settings.');
        } else {
          Alert.alert('Error', result.errorMessage || 'Could not pick image');
        }
        return;
      }

      if (result.assets && result.assets[0]?.uri) {
        setImageUri(result.assets[0].uri);
        console.log('Gallery photo URI:', result.assets[0].uri);
        Alert.alert('Success', 'Photo selected successfully!');
      } else {
        Alert.alert('Error', 'No image was selected');
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Could not open gallery. Please check permissions in Settings.');
    }
  };

  const handleAdd = () => {
    if (!name.trim() || !type.trim() || !age || !breed.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const ageNumber = parseInt(age, 10);
    if (isNaN(ageNumber) || ageNumber <= 0 || ageNumber > 30) {
      Alert.alert('Error', 'Please enter valid age (1-30)');
      return;
    }

    const newAnimal: Animal = {
      id: `animal-${Date.now()}`,
      name: name.trim(),
      type: type.trim(),
      age: ageNumber,
      breed: breed.trim(),
      image: imageUri || 'https://via.placeholder.com/400',
      bio: bio.trim(),
      ownerId: userId,
    };

    onAdd(newAnimal);
    
    // Reset form
    setName('');
    setType('');
    setAge('');
    setBreed('');
    setBio('');
    setImageUri('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}>
          <TouchableOpacity 
            activeOpacity={1}
            onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.title}>Add Your Pet</Text>
              
              {/* Image Picker Section */}
              <TouchableOpacity 
                style={styles.imagePicker} 
                onPress={handlePickImage}>
                {imageUri ? (
                  <Image source={{uri: imageUri}} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imageIcon}>📷</Text>
                    <Text style={styles.imageText}>Tap to add photo</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <ScrollView 
                style={styles.form}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Type (Dog, Cat, Bird, etc.)"
                  value={type}
                  onChangeText={setType}
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Age"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Breed"
                  value={breed}
                  onChangeText={setBreed}
                  placeholderTextColor="#999"
                />
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  placeholder="Bio (Optional)"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  placeholderTextColor="#999"
                />
              </ScrollView>

              <View style={styles.buttonContainer}>
                <Button title="Cancel" onPress={onClose} variant="secondary" />
                <View style={styles.spacer} />
                <Button title="Add Pet" onPress={handleAdd} />
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: 340,
    maxHeight: '85%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  imagePicker: {
    width: '100%',
    height: 150,
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 15,
  },
  imageIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  imageText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  form: {
    marginBottom: 15,
    maxHeight: 300,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  spacer: {
    width: 10,
  },
});

export default AddAnimalModal;

