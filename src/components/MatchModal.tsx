import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import {Match} from '../types';
import {Colors} from '../utils/colors';
import {getUser} from '../services/firestoreService';
import {createOrGetChat} from '../services/chatService';

interface MatchModalProps {
  visible: boolean;
  match: Match | null;
  onClose: () => void;
  currentUserId: string;
}

const MatchModal: React.FC<MatchModalProps> = ({
  visible,
  match,
  onClose,
  currentUserId,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const [isNavigating, setIsNavigating] = useState(false);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const handleContinue = async () => {
    if (!match || isNavigating) return;

    const firebaseUser = auth().currentUser;
    if (!firebaseUser || currentUserId === 'user1') {
      onClose();
      return;
    }

    try {
      setIsNavigating(true);

      // Get the other user's ID
      const otherUserId =
        match.userId1 === currentUserId ? match.userId2 : match.userId1;

      // Fetch the other user's data
      const otherUser = await getUser(otherUserId);

      // Create or get chat
      const chat = await createOrGetChat(currentUserId, otherUserId);

      // Close modal first
      onClose();

      // Navigate to chat screen
      const parent = navigation.getParent();
      (parent || navigation).navigate('ChatDetail', {
        chatId: chat.id,
        otherUserId: otherUserId,
        otherUserName: otherUser?.name || 'User',
        otherUserPhoto: otherUser?.photoURL,
      });
    } catch (error: any) {
      console.error('Error opening chat:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to start chat. Please try again.',
        [{text: 'OK'}],
      );
    } finally {
      setIsNavigating(false);
    }
  };

  if (!match) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{scale: scaleAnim}],
            },
          ]}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>It's a Match!</Text>
            <Icon name="trophy" size={32} color={Colors.primary} style={styles.titleIcon} />
          </View>
          <Text style={styles.subtitle}>You both liked each other</Text>

          <View style={styles.animalsContainer}>
            <View style={styles.animalCard}>
              <Image
                source={{uri: match.animal1.image}}
                style={styles.animalImage}
              />
              <Text style={styles.animalName}>{match.animal1.name}</Text>
            </View>

            <Icon name="heart" size={40} color={Colors.primary} />

            <View style={styles.animalCard}>
              <Image
                source={{uri: match.animal2.image}}
                style={styles.animalImage}
              />
              <Text style={styles.animalName}>{match.animal2.name}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleContinue}
            disabled={isNavigating}>
            <Text style={styles.closeButtonText}>
              {isNavigating ? 'Opening...' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  animalsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 16,
  },
  animalCard: {
    alignItems: 'center',
  },
  animalImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 8,
  },
  animalName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  closeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 20,
    minWidth: 120,
  },
  closeButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default MatchModal;

