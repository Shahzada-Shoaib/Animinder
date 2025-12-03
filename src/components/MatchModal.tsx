import React from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Match} from '../types';
import {Colors} from '../utils/colors';

interface MatchModalProps {
  visible: boolean;
  match: Match | null;
  onClose: () => void;
}

const MatchModal: React.FC<MatchModalProps> = ({visible, match, onClose}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

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

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Continue</Text>
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

