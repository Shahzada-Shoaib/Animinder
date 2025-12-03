import React, {useRef, useState} from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Dimensions,
  View,
  Text,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Animal} from '../types';
import AnimalCard from './AnimalCard';
import {Colors} from '../utils/colors';

interface SwipeCardProps {
  animal: Animal;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onChat?: () => void;
  isFirst: boolean;
}

const {width} = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;

const SwipeCard: React.FC<SwipeCardProps> = ({
  animal,
  onSwipeLeft,
  onSwipeRight,
  onChat,
  isFirst,
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isSwipingOut, setIsSwipingOut] = useState(false);
  const cardOpacity = useRef(new Animated.Value(1)).current;
  
  const rotate = pan.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });
  
  // Add vertical movement damping for smoother feel
  const panY = pan.y.interpolate({
    inputRange: [-300, 0, 300],
    outputRange: [-60, 0, 60],
    extrapolate: 'clamp',
  });

  // Heart animation for right swipe (like)
  const heartOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD, width / 2],
    outputRange: [0, 0.8, 1],
    extrapolate: 'clamp',
  });

  const heartScale = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD, width / 2],
    outputRange: [0.5, 0.8, 1],
    extrapolate: 'clamp',
  });

  // Cross animation for left swipe (pass)
  const crossOpacity = pan.x.interpolate({
    inputRange: [-width / 2, -SWIPE_THRESHOLD, 0],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp',
  });

  const crossScale = pan.x.interpolate({
    inputRange: [-width / 2, -SWIPE_THRESHOLD, 0],
    outputRange: [1, 0.8, 0.5],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({x: 0, y: 0});
      },
      onPanResponderMove: Animated.event(
        [null, {dx: pan.x, dy: pan.y}],
        {
          useNativeDriver: false,
        }
      ),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        const velocity = gesture.vx || 0;
        const swipeVelocity = 0.5; // Minimum velocity for quick swipe
        
        if (gesture.dx > SWIPE_THRESHOLD || (gesture.dx > 50 && velocity > swipeVelocity)) {
          // Swipe right - Like
          setIsSwipingOut(true);
          // Call callback immediately to update index
          onSwipeRight();
          // Fade out and animate
          Animated.parallel([
            Animated.timing(cardOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(pan, {
              toValue: {x: width + 100, y: gesture.dy * 0.5},
              velocity: {x: velocity, y: gesture.vy || 0},
              tension: 65,
              friction: 8,
              useNativeDriver: true,
            }),
          ]).start(() => {
            pan.setValue({x: 0, y: 0});
            cardOpacity.setValue(1);
            setIsSwipingOut(false);
          });
        } else if (gesture.dx < -SWIPE_THRESHOLD || (gesture.dx < -50 && velocity < -swipeVelocity)) {
          // Swipe left - Pass
          setIsSwipingOut(true);
          // Call callback immediately to update index
          onSwipeLeft();
          // Fade out and animate
          Animated.parallel([
            Animated.timing(cardOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.spring(pan, {
              toValue: {x: -width - 100, y: gesture.dy * 0.5},
              velocity: {x: velocity, y: gesture.vy || 0},
              tension: 65,
              friction: 8,
              useNativeDriver: true,
            }),
          ]).start(() => {
            pan.setValue({x: 0, y: 0});
            cardOpacity.setValue(1);
            setIsSwipingOut(false);
          });
        } else {
          // Return to original position with smooth spring
          Animated.spring(pan, {
            toValue: {x: 0, y: 0},
            velocity: {x: velocity, y: gesture.vy || 0},
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  if (!isFirst) {
    return (
      <View style={styles.cardContainer}>
        <AnimalCard 
          animal={animal}
          onLike={onSwipeRight}
          onPass={onSwipeLeft}
          onChat={onChat}
          showActions={false}
        />
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: cardOpacity,
          transform: [
            {translateX: pan.x}, 
            {translateY: panY}, 
            {rotate}
          ],
        },
      ]}
      {...panResponder.panHandlers}>
      <AnimalCard 
        animal={animal}
        onLike={onSwipeRight}
        onPass={onSwipeLeft}
        onChat={onChat}
        showActions={true}
      />
      
      {/* Heart overlay for right swipe (like) */}
      <Animated.View
        style={[
          styles.overlay,
          styles.heartOverlay,
          {
            opacity: heartOpacity,
            transform: [{scale: heartScale}],
          },
        ]}
        pointerEvents="none">
        <Icon name="heart" size={100} color={Colors.primary} />
        <Text style={[styles.overlayText, styles.heartText]}>LIKE</Text>
      </Animated.View>

      {/* Cross overlay for left swipe (pass) */}
      <Animated.View
        style={[
          styles.overlay,
          styles.crossOverlay,
          {
            opacity: crossOpacity,
            transform: [{scale: crossScale}],
          },
        ]}
        pointerEvents="none">
        <Icon name="close-circle" size={100} color={Colors.gray500} />
        <Text style={[styles.overlayText, styles.crossText]}>PASS</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  heartOverlay: {
    backgroundColor: 'rgba(255, 107, 157, 0.1)',
  },
  crossOverlay: {
    backgroundColor: 'rgba(149, 165, 166, 0.1)',
  },
  overlayText: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heartText: {
    color: Colors.primary,
  },
  crossText: {
    color: Colors.gray500,
  },
});

export default SwipeCard;

