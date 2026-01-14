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
 * Checks if owner has liked any of the current user's animals
 * Profile-based matching: If owner liked ANY animal owned by current user, it's a match
 */
export const checkMutualLike = async (
  likerUserId: string,
  ownerId: string,
  userAnimals: Animal[],
): Promise<{isMatch: boolean; matchedAnimalId?: string}> => {
  try {
    console.log('[checkMutualLike] Checking mutual like:', {
      likerUserId,
      ownerId,
      userAnimalsCount: userAnimals.length,
    });

    // Get all likes by the owner (the person whose animal was just liked)
    const ownerLikes = await likesCollection
      .where('likerUserId', '==', ownerId)
      .get();

    console.log('[checkMutualLike] Owner likes count:', ownerLikes.docs.length);

    // Get current user's animal IDs (from Firestore)
    const userAnimalIds = userAnimals.map(a => a.id);
    console.log('[checkMutualLike] User animal IDs from Firestore:', userAnimalIds);

    // Check if owner has liked any of current user's animals
    // Profile-based: If owner liked ANY animal where ownerId = current user, it's a match
    for (const likeDoc of ownerLikes.docs) {
      const likeData = likeDoc.data();
      console.log('[checkMutualLike] Checking owner like:', {
        likedAnimalId: likeData.likedAnimalId,
        likedAnimalOwnerId: likeData.ownerId,
        currentUserId: likerUserId,
        isOwnerCurrentUser: likeData.ownerId === likerUserId,
        isInUserAnimals: userAnimalIds.includes(likeData.likedAnimalId),
      });

      // Profile-based matching: If the liked animal's ownerId matches current user,
      // it means owner liked current user's animal (regardless of whether it's in userAnimals array)
      // This handles both Firestore animals and any other animals owned by current user
      if (likeData.ownerId === likerUserId) {
        console.log('[checkMutualLike] ✅ MATCH FOUND! (Profile-based)', {
          matchedAnimalId: likeData.likedAnimalId,
          reason: 'Owner liked current user\'s animal',
        });
        return {
          isMatch: true,
          matchedAnimalId: likeData.likedAnimalId,
        };
      }
      
      // Also check if the liked animal ID is in current user's animals list
      // (for cases where we have the animal in our list)
      if (userAnimalIds.includes(likeData.likedAnimalId)) {
        console.log('[checkMutualLike] ✅ MATCH FOUND! (Animal ID match)', {
          matchedAnimalId: likeData.likedAnimalId,
          reason: 'Liked animal ID found in user animals',
        });
        return {
          isMatch: true,
          matchedAnimalId: likeData.likedAnimalId,
        };
      }
    }

    console.log('[checkMutualLike] ❌ No match found');
    return {isMatch: false};
  } catch (error) {
    console.error('[checkMutualLike] Error checking mutual like:', error);
    return {isMatch: false};
  }
};

