import React from 'react';
import { View, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Button from './Button';

const GoogleLogin: React.FC = () => {
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
      
      Alert.alert('Success', 'Successfully signed in with Google!');
    } catch (error: any) {
      console.log('Google Login Error:', error);
      
      // Handle specific error cases
      if (error.code === 'SIGN_IN_CANCELLED') {
        Alert.alert('Cancelled', 'Sign in was cancelled');
      } else if (error.code === 'IN_PROGRESS') {
        Alert.alert('In Progress', 'Sign in is already in progress');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        Alert.alert('Error', 'Google Play Services not available');
      } else {
        Alert.alert('Error', error.message || 'Failed to sign in with Google');
      }
    }
  };

  
  // const signOutFromGoogle = async () => {
  //   try {
  //     await GoogleSignin.signOut();
  //     await auth().signOut();
  //     console.log('Signed out successfully');
  //   } catch (error) {
  //     console.log('Signout Error:', error);
  //   }
  // };

  return (
    <View>
      <Button title="Login with Google" onPress={signInWithGoogle} />
      {/* <Button title="Sign Out" onPress={signOutFromGoogle} /> */}
    </View>
  );
};

export default GoogleLogin;
