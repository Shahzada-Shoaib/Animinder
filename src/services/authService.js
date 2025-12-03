// import { GoogleSignin } from '@react-native-google-signin/google-signin';
// import auth from '@react-native-firebase/auth';

// export async function googleLogin() {
//   try {
//     await GoogleSignin.hasPlayServices();

//     const { idToken } = await GoogleSignin.signIn();

//     const googleCredential = auth.GoogleAuthProvider.credential(idToken);

//     return await auth().signInWithCredential(googleCredential);

//   } catch (error) {
//     console.log("Google Login Error:", error);
//     throw error;
//   }
// }
