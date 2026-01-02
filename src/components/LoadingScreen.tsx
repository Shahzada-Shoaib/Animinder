import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../utils/colors';

const LoadingScreen: React.FC = () => {
  // Animation values using React Native's built-in Animated API
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation on mount
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Pulse animation - scale from 0.9 to 1.1 (infinite loop)
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [opacity, scale]);

  // Animated styles
  const iconAnimatedStyle = {
    transform: [{ scale }],
    opacity,
  };

  const textAnimatedStyle = {
    opacity,
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
        <Icon name="paw" size={100} color={Colors.primary} />
      </Animated.View>
      
      <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
        <Text style={styles.appName}>Pet Mates</Text>
        <Text style={styles.tagline}>Finding your pet's perfect match...</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default LoadingScreen;

