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
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {Animal} from '../types';
import {Colors} from '../utils/colors';
import {Shadows} from '../utils/shadows';
import {uploadPetImage} from '../services/imageUploadService';

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
  const [uploading, setUploading] = useState(false);
  
  // Validation states
  const [errors, setErrors] = useState<{
    name?: string;
    type?: string;
    age?: string;
    breed?: string;
  }>({});
  
  // Helper functions for validation
  const validateName = (value: string) => {
    if (!value.trim()) {
      return 'Name is required';
    }
    if (value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return '';
  };
  
  const validateType = (value: string) => {
    if (!value.trim()) {
      return 'Type is required';
    }
    return '';
  };
  
  const validateAge = (value: string) => {
    if (!value.trim()) {
      return 'Age is required';
    }
    const ageNumber = parseInt(value, 10);
    if (isNaN(ageNumber)) {
      return 'Age must be a number';
    }
    if (ageNumber <= 0 || ageNumber > 30) {
      return 'Age must be between 1 and 30';
    }
    return '';
  };
  
  const validateBreed = (value: string) => {
    if (!value.trim()) {
      return 'Breed is required';
    }
    return '';
  };

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
        // Removed success alert - image preview is enough feedback
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
        // Removed success alert - image preview is enough feedback
      } else {
        Alert.alert('Error', 'No image was selected');
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Could not open gallery. Please check permissions in Settings.');
    }
  };

  const handleAdd = async () => {
    // Validate all fields
    const nameError = validateName(name);
    const typeError = validateType(type);
    const ageError = validateAge(age);
    const breedError = validateBreed(breed);
    
    if (nameError || typeError || ageError || breedError) {
      setErrors({
        name: nameError || undefined,
        type: typeError || undefined,
        age: ageError || undefined,
        breed: breedError || undefined,
      });
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    const ageNumber = parseInt(age, 10);

    // If image is selected, upload it first
    let imageUrl = 'https://via.placeholder.com/400'; // Default placeholder
    
    if (imageUri) {
      try {
        setUploading(true);
        
        // Upload image to Hostinger
        imageUrl = await uploadPetImage(imageUri);
        
        console.log('Image uploaded successfully, URL:', imageUrl);
      } catch (error: any) {
        console.error('Image upload error:', error);
        
        // Show error and ask user what to do
        Alert.alert(
          'Upload Failed',
          error.message || 'Failed to upload image. Would you like to continue without the image?',
          [
            {
              text: 'Try Again',
              onPress: () => {
                setUploading(false);
              },
            },
            {
              text: 'Continue Without Image',
              style: 'cancel',
              onPress: () => {
                // Continue with placeholder image
                proceedWithAdd(imageUrl, ageNumber);
              },
            },
          ],
        );
        return;
      } finally {
        setUploading(false);
      }
    }

    proceedWithAdd(imageUrl, ageNumber);
  };

  const proceedWithAdd = (imageUrl: string, ageNumber: number) => {
    const newAnimal: Animal = {
      id: `animal-${Date.now()}`,
      name: name.trim(),
      type: type.trim(),
      age: ageNumber,
      breed: breed.trim(),
      image: imageUrl, // Use uploaded URL instead of local URI
      bio: bio.trim(),
      ownerId: userId,
    };

    onAdd(newAnimal);
    
    // Reset form
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setType('');
    setAge('');
    setBreed('');
    setBio('');
    setImageUri('');
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
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
          onPress={handleClose}>
          <TouchableOpacity 
            style={styles.modalWrapper}
            activeOpacity={1}
            onPress={e => e.stopPropagation()}>
            <ScrollView 
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollContent}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerIconContainer}>
                  <Icon name="paw" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.title}>Add Your Pet</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={handleClose}
                  activeOpacity={0.7}>
                  <Icon name="close" size={20} color={Colors.textSecondary} />
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
                        <Icon name="camera" size={20} color={Colors.white} />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <View style={styles.imageIconContainer}>
                      <Icon name="camera" size={32} color={Colors.primary} />
                    </View>
                    <Text style={styles.imageText}>Tap to add photo</Text>
                    <Text style={styles.imageSubtext}>Camera or Gallery</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Pet Name</Text>
                  <View style={[styles.inputContainer, errors.name && styles.inputContainerError]}>
                    <Icon name="paw" size={18} color={errors.name ? Colors.error : Colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter pet name"
                      value={name}
                      onChangeText={(text) => {
                        setName(text);
                        if (text.trim()) {
                          setErrors(prev => ({...prev, name: validateName(text)}));
                        } else {
                          setErrors(prev => ({...prev, name: undefined}));
                        }
                      }}
                      onBlur={() => setErrors(prev => ({...prev, name: validateName(name)}))}
                      placeholderTextColor={Colors.textLight}
                    />
                  </View>
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Type</Text>
                  <View style={[styles.inputContainer, errors.type && styles.inputContainerError]}>
                    <Icon name="apps" size={18} color={errors.type ? Colors.error : Colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Dog, Cat, Bird, etc."
                      value={type}
                      onChangeText={(text) => {
                        setType(text);
                        if (text.trim()) {
                          setErrors(prev => ({...prev, type: validateType(text)}));
                        } else {
                          setErrors(prev => ({...prev, type: undefined}));
                        }
                      }}
                      onBlur={() => setErrors(prev => ({...prev, type: validateType(type)}))}
                      placeholderTextColor={Colors.textLight}
                    />
                  </View>
                  {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                    <Text style={styles.label}>Age</Text>
                    <View style={[styles.inputContainer, errors.age && styles.inputContainerError]}>
                      <Icon name="calendar" size={18} color={errors.age ? Colors.error : Colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Years"
                        value={age}
                        onChangeText={(text) => {
                          // Only allow numbers
                          const numericText = text.replace(/[^0-9]/g, '');
                          setAge(numericText);
                          if (numericText.trim()) {
                            setErrors(prev => ({...prev, age: validateAge(numericText)}));
                          } else {
                            setErrors(prev => ({...prev, age: undefined}));
                          }
                        }}
                        onBlur={() => setErrors(prev => ({...prev, age: validateAge(age)}))}
                        keyboardType="numeric"
                        placeholderTextColor={Colors.textLight}
                      />
                    </View>
                    {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
                  </View>

                  <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                    <Text style={styles.label}>Breed</Text>
                    <View style={[styles.inputContainer, errors.breed && styles.inputContainerError]}>
                      <Icon name="star" size={18} color={errors.breed ? Colors.error : Colors.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Breed"
                        value={breed}
                        onChangeText={(text) => {
                          setBreed(text);
                          if (text.trim()) {
                            setErrors(prev => ({...prev, breed: validateBreed(text)}));
                          } else {
                            setErrors(prev => ({...prev, breed: undefined}));
                          }
                        }}
                        onBlur={() => setErrors(prev => ({...prev, breed: validateBreed(breed)}))}
                        placeholderTextColor={Colors.textLight}
                      />
                    </View>
                    {errors.breed && <Text style={styles.errorText}>{errors.breed}</Text>}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Bio (Optional)</Text>
                    <Text style={styles.characterCount}>{bio.length}/500</Text>
                  </View>
                  <View style={[styles.inputContainer, styles.bioContainer]}>
                    <TextInput
                      style={[styles.input, styles.bioInput]}
                      placeholder="Tell us about your pet..."
                      value={bio}
                      onChangeText={(text) => {
                        if (text.length <= 500) {
                          setBio(text);
                        }
                      }}
                      multiline
                      numberOfLines={4}
                      placeholderTextColor={Colors.textLight}
                      maxLength={500}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleClose}
                  activeOpacity={0.7}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.addButton, uploading && styles.addButtonDisabled]}
                  onPress={handleAdd}
                  disabled={uploading}
                  activeOpacity={0.8}>
                  {uploading ? (
                    <>
                      <ActivityIndicator size="small" color={Colors.white} style={styles.addButtonIcon} />
                      <Text style={styles.addButtonText}>Uploading...</Text>
                    </>
                  ) : (
                    <>
                      <Icon name="checkmark" size={18} color={Colors.white} style={styles.addButtonIcon} />
                      <Text style={styles.addButtonText}>Add Pet</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingTop: 0,
  },
  modalWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: '100%',
    maxHeight: '100%',
    ...Shadows.large,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.gray200,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary + '25',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  imagePicker: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 14,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    borderRadius: 12,
    backgroundColor: Colors.gray100,
  },
  imageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary + '20',
  },
  imageText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  imageSubtext: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  form: {
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  characterCount: {
    fontSize: 11,
    color: Colors.textLight,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    ...Shadows.small,
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 11,
    color: Colors.error,
    marginTop: 3,
    marginLeft: 4,
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 6,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 12,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  bioContainer: {
    alignItems: 'flex-start',
    minHeight: 80,
  },
  bioInput: {
    paddingTop: 10,
    paddingBottom: 10,
    textAlignVertical: 'top',
    minHeight: 80,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1.5,
    borderTopColor: Colors.gray200,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.gray300,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  addButton: {
    flex: 1.2,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    ...Shadows.small,
  },
  addButtonIcon: {
    marginRight: 5,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
});

export default AddAnimalModal;

