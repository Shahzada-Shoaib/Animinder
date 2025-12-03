import React from 'react';
import {View, Text, Image, StyleSheet, Dimensions, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Animal} from '../types';
import {Colors} from '../utils/colors';
import {Shadows} from '../utils/shadows';

interface AnimalCardProps {
  animal: Animal;
  onLike?: () => void;
  onPass?: () => void;
  onChat?: () => void;
  showActions?: boolean;
}

const {width, height} = Dimensions.get('window');
const CARD_WIDTH = width * 0.95;
const CARD_HEIGHT = height * 0.72;

const AnimalCard: React.FC<AnimalCardProps> = ({
  animal,
  onLike,
  onPass,
  onChat,
  showActions = true,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image source={{uri: animal.image}} style={styles.image} />
        <View style={styles.gradientOverlay} />
        
        {/* Info Badge on Image */}
        <View style={styles.infoBadge}>
          <Text style={styles.badgeText}>{animal.type} • {animal.breed}</Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.mainInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{animal.name}</Text>
            <View style={styles.ageTag}>
              <Text style={styles.ageText}>{animal.age} years</Text>
            </View>
          </View>
          <Text style={styles.bio} numberOfLines={2}>{animal.bio}</Text>
        </View>
        
        {showActions && (
          <View style={styles.actionsContainer}>
            {/* Pass Button */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.passButton]}
              onPress={onPass}
              activeOpacity={0.8}>
              <Icon name="close" size={30} color={Colors.gray500} />
            </TouchableOpacity>

            {/* Chat Button */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.chatButton]}
              onPress={onChat}
              activeOpacity={0.8}>
              <Icon name="chatbubble" size={30} color={Colors.accent} />
            </TouchableOpacity>

            {/* Like Button */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.likeButton]}
              onPress={onLike}
              activeOpacity={0.8}>
              <Icon name="heart" size={32} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    backgroundColor: Colors.cardBg,
    ...Shadows.card,
  },
  imageContainer: {
    height: '65%',
    position: 'relative',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'transparent',
  },
  infoBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...Shadows.small,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: 0.5,
  },
  infoContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 16,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  mainInfo: {
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
    flex: 1,
  },
  ageTag: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  ageText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  bio: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  passButton: {
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: Colors.gray300,
  },
  chatButton: {
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: Colors.accent,
  },
  likeButton: {
    backgroundColor: Colors.white,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
});

export default AnimalCard;

