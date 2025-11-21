import firestore from '@react-native-firebase/firestore';
import {Like, Animal} from '../types';

const likesCollection = firestore().collection('likes');

/**
 * Save like to Firestore
 */
export const saveLike = async (
  likerUserId: string,
  likedAnimalId: string,
  ownerId: string,
): Promise<void> => {
  try {
    await likesCollection.add({
      likerUserId,
      likedAnimalId,
      ownerId,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    console.log('Like saved:', likerUserId, '→', likedAnimalId);
  } catch (error) {
    console.error('Error saving like:', error);
    throw error;
  }
};

/**
 * Get all likes by a user
 */
export const getUserLikes = async (userId: string): Promise<Like[]> => {
  try {
    const snapshot = await likesCollection
      .where('likerUserId', '==', userId)
      .get();

    const likes: Like[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      likes.push({
        id: doc.id,
        likerUserId: data.likerUserId || '',
        likedAnimalId: data.likedAnimalId || '',
        ownerId: data.ownerId || '',
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      });
    });

    return likes;
  } catch (error) {
    console.error('Error getting user likes:', error);
    throw error;
  }
};

/**
 * Check if mutual like exists
 */
export const checkMutualLike = async (
  likerUserId: string,
  ownerId: string,
  userAnimals: Animal[],
): Promise<{isMatch: boolean; matchedAnimalId?: string}> => {
  try {
    const ownerLikes = await likesCollection
      .where('likerUserId', '==', ownerId)
      .get();

    const userAnimalIds = userAnimals.map(a => a.id);

    for (const likeDoc of ownerLikes.docs) {
      const likeData = likeDoc.data();
      if (userAnimalIds.includes(likeData.likedAnimalId)) {
        return {
          isMatch: true,
          matchedAnimalId: likeData.likedAnimalId,
        };
      }
    }

    return {isMatch: false};
  } catch (error) {
    console.error('Error checking mutual like:', error);
    return {isMatch: false};
  }
};

