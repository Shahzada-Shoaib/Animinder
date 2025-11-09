import React, {useRef} from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Dimensions,
  View,
} from 'react-native';
import {Animal} from '../types';
import AnimalCard from './AnimalCard';

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
  const rotate = pan.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, {dx: pan.x, dy: pan.y}], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          // Swipe right - Like
          Animated.spring(pan, {
            toValue: {x: width + 100, y: gesture.dy},
            useNativeDriver: true,
          }).start(() => {
            onSwipeRight();
            pan.setValue({x: 0, y: 0});
          });
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          // Swipe left - Pass
          Animated.spring(pan, {
            toValue: {x: -width - 100, y: gesture.dy},
            useNativeDriver: true,
          }).start(() => {
            onSwipeLeft();
            pan.setValue({x: 0, y: 0});
          });
        } else {
          // Return to original position
          Animated.spring(pan, {
            toValue: {x: 0, y: 0},
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
          transform: [{translateX: pan.x}, {translateY: pan.y}, {rotate}],
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
});

export default SwipeCard;

