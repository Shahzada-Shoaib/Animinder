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
import Icon from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {Animal} from '../types';
import {Colors} from '../utils/colors';
import {Shadows} from '../utils/shadows';

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
            style={styles.modalWrapper}
            activeOpacity={1}
            onPress={e => e.stopPropagation()}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerIconContainer}>
                  <Icon name="paw" size={28} color={Colors.primary} />
                </View>
                <Text style={styles.title}>Add Your Pet</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={onClose}
                  activeOpacity={0.7}>
                  <Icon name="close" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              {/* Image Picker Section */}
              <TouchableOpacity 
                style={styles.imagePicker} 
                onPress={handlePickImage}
                activeOpacity={0.8}>
                {imageUri ? (
                  <View style={styles.imageContainer}>
                    <Image source={{uri: imageUri}} style={styles.previewImage} />
                    <View style={styles.imageOverlay}>
                      <View style={styles.editImageButton}>
                        <Icon name="camera" size={24} color={Colors.white} />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <View style={styles.imageIconContainer}>
                      <Icon name="camera" size={40} color={Colors.primary} />
                    </View>
                    <Text style={styles.imageText}>Tap to add photo</Text>
                    <Text style={styles.imageSubtext}>Camera or Gallery</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <ScrollView 
                style={styles.form}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Pet Name</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="paw" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter pet name"
                      value={name}
                      onChangeText={setName}
                      placeholderTextColor={Colors.textLight}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Type</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="apps" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Dog, Cat, Bird, etc."
                      value={type}
                      onChangeText={setType}
                      placeholderTextColor={Colors.textLight}
                    />
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                    <Text style={styles.label}>Age</Text>
                    <View style={styles.inputContainer}>
                      <Icon name="calendar" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Years"
                        value={age}
                        onChangeText={setAge}
                        keyboardType="numeric"
                        placeholderTextColor={Colors.textLight}
                      />
                    </View>
                  </View>

                  <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                    <Text style={styles.label}>Breed</Text>
                    <View style={styles.inputContainer}>
                      <Icon name="star" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Breed"
                        value={breed}
                        onChangeText={setBreed}
                        placeholderTextColor={Colors.textLight}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Bio (Optional)</Text>
                  <View style={[styles.inputContainer, styles.bioContainer]}>
                    <TextInput
                      style={[styles.input, styles.bioInput]}
                      placeholder="Tell us about your pet..."
                      value={bio}
                      onChangeText={setBio}
                      multiline
                      numberOfLines={4}
                      placeholderTextColor={Colors.textLight}
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={onClose}
                  activeOpacity={0.7}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={handleAdd}
                  activeOpacity={0.8}>
                  <Icon name="checkmark" size={20} color={Colors.white} style={styles.addButtonIcon} />
                  <Text style={styles.addButtonText}>Add Pet</Text>
                </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    width: '94%',
    maxWidth: 500,
    maxHeight: '92%',
    ...Shadows.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
    paddingBottom: 18,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.gray200,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary + '25',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  imagePicker: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    marginBottom: 22,
    overflow: 'hidden',
    backgroundColor: Colors.gray100,
    ...Shadows.small,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  editImageButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gray300,
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: Colors.gray100,
  },
  imageIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary + '20',
  },
  imageText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  imageSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  form: {
    marginBottom: 20,
    maxHeight: 380,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 14,
  },
  inputGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    ...Shadows.small,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  bioContainer: {
    alignItems: 'flex-start',
    minHeight: 100,
  },
  bioInput: {
    paddingTop: 14,
    paddingBottom: 14,
    textAlignVertical: 'top',
    minHeight: 100,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 18,
    borderTopWidth: 1.5,
    borderTopColor: Colors.gray200,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.gray300,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  addButton: {
    flex: 1.2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    ...Shadows.small,
  },
  addButtonIcon: {
    marginRight: 6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
});

export default AddAnimalModal;

