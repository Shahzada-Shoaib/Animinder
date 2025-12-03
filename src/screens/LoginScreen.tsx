import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Colors } from '../utils/colors';
import { Shadows } from '../utils/shadows';

interface LoginScreenProps {
  onSkip?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onSkip }) => {
  const signInWithGoogle = async (): Promise<void> => {
    try {
      // 1. Check Google Play Services
      await GoogleSignin.hasPlayServices();

      // 2. Sign in with Google
      await GoogleSignin.signIn();

      // 3. Get User Google Token (idToken)
      const tokens = await GoogleSignin.getTokens();
      const idToken = tokens.idToken;

      if (!idToken) {
        console.log('SignIn Result:', await GoogleSignin.getCurrentUser());
        Alert.alert('Error', 'Failed to get Google ID token. Please check console for details.');
        return;
      }

      // 4. Convert to Firebase Credential
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // 5. Sign-in Firebase
      await auth().signInWithCredential(googleCredential);
      
      // Success message is handled by auth state change
    } catch (error: any) {
      console.log('Google Login Error:', error);
      
      // Handle specific error cases
      if (error.code === 'SIGN_IN_CANCELLED') {
        // User cancelled, don't show alert
        return;
      } else if (error.code === 'IN_PROGRESS') {
        Alert.alert('In Progress', 'Sign in is already in progress');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        Alert.alert('Error', 'Google Play Services not available');
      } else {
        Alert.alert('Error', error.message || 'Failed to sign in with Google');
      }
    }
  };

  const handleSkip = () => {
    // Skip button - allow access to main app without login
    // The app will work with dummy user data
    if (onSkip) {
      onSkip();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo/Icon Area */}
        <View style={styles.logoContainer}>
          <Icon name="paw" size={80} color={Colors.primary} style={styles.logoIcon} />
          <Text style={styles.appName}>Animinder</Text>
          <Text style={styles.tagline}>Find your pet's perfect match</Text>
        </View>

        {/* Login Buttons */}
        <View style={styles.buttonContainer}>
          {/* Google Login Button */}
          <TouchableOpacity
            style={[styles.googleButton, Shadows.medium]}
            onPress={signInWithGoogle}
            activeOpacity={0.8}>
            <View style={styles.googleButtonContent}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>

          {/* Skip Button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Text */}
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoIcon: {
    marginBottom: 20,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  googleButton: {
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4285F4',
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    backgroundColor: '#F1F3F4',
    borderRadius: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});

export default LoginScreen;

