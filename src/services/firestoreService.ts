import firestore from '@react-native-firebase/firestore';
import {User, Animal} from '../types';

const usersCollection = firestore().collection('users');
const animalsCollection = firestore().collection('animals');

/**
 * Save or update user data in Firestore
 */
export const saveUser = async (userId: string, userData: User): Promise<void> => {
  try {
    const userDoc: any = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      photoURL: userData.photoURL || null,
    };

    if (userData.phone) {
      userDoc.phone = userData.phone;
    }

    if (userData.createdAt) {
      userDoc.createdAt = firestore.Timestamp.fromDate(userData.createdAt);
    } else if (!userData.createdAt) {
      // Set createdAt if not already set (for new users)
      const existingDoc = await usersCollection.doc(userId).get();
      if (!existingDoc.exists) {
        userDoc.createdAt = firestore.FieldValue.serverTimestamp();
      }
    }

    await usersCollection.doc(userId).set(userDoc, {merge: true});
    console.log('User data saved to Firestore:', userId);
  } catch (error) {
    console.error('Error saving user to Firestore:', error);
    throw error;
  }
};

/**
 * Get user data from Firestore
 */
export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await usersCollection.doc(userId).get();
    
    if (!userDoc.exists) {
      console.log('User document does not exist:', userId);
      return null;
    }

    const data = userDoc.data();
    if (!data) {
      return null;
    }

    const user: User = {
      id: data.id || userId,
      name: data.name || '',
      email: data.email || '',
      photoURL: data.photoURL || undefined,
      phone: data.phone || undefined,
      createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
    };

    console.log('User data loaded from Firestore:', userId);
    return user;
  } catch (error) {
    console.error('Error getting user from Firestore:', error);
    throw error;
  }
};

/**
 * Save or update animal data in Firestore
 */
export const saveAnimal = async (animalId: string, animalData: Animal): Promise<void> => {
  try {
    await animalsCollection.doc(animalId).set(
      {
        id: animalData.id,
        ownerId: animalData.ownerId,
        name: animalData.name,
        type: animalData.type,
        age: animalData.age,
        breed: animalData.breed,
        image: animalData.image,
        bio: animalData.bio,
        createdAt: firestore.FieldValue.serverTimestamp(),
      },
      {merge: true},
    );
    console.log('Animal data saved to Firestore:', animalId);
  } catch (error) {
    console.error('Error saving animal to Firestore:', error);
    throw error;
  }
};

/**
 * Get animal data from Firestore
 */
export const getAnimal = async (animalId: string): Promise<Animal | null> => {
  try {
    const animalDoc = await animalsCollection.doc(animalId).get();
    
    if (!animalDoc.exists) {
      console.log('Animal document does not exist:', animalId);
      return null;
    }

    const data = animalDoc.data();
    if (!data) {
      return null;
    }

    const animal: Animal = {
      id: data.id || animalId,
      ownerId: data.ownerId || '',
      name: data.name || '',
      type: data.type || '',
      age: data.age || 0,
      breed: data.breed || '',
      image: data.image || '',
      bio: data.bio || '',
    };

    console.log('Animal data loaded from Firestore:', animalId);
    return animal;
  } catch (error) {
    console.error('Error getting animal from Firestore:', error);
    throw error;
  }
};

/**
 * Get all animals for a specific user (by ownerId)
 */
export const getUserAnimals = async (userId: string): Promise<Animal[]> => {
  try {
    const snapshot = await animalsCollection
      .where('ownerId', '==', userId)
      .get();
    
    const animals: Animal[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      animals.push({
        id: data.id || doc.id,
        ownerId: data.ownerId || '',
        name: data.name || '',
        type: data.type || '',
        age: data.age || 0,
        breed: data.breed || '',
        image: data.image || '',
        bio: data.bio || '',
      });
    });

    console.log(`Loaded ${animals.length} animals for user:`, userId);
    return animals;
  } catch (error) {
    console.error('Error getting user animals from Firestore:', error);
    throw error;
  }
};

/**
 * Get all animals from Firestore (excluding a specific user's animals)
 */
export const getAllAnimals = async (excludeUserId?: string): Promise<Animal[]> => {
  try {
    const snapshot = await animalsCollection.get();
    
    const animals: Animal[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const animal: Animal = {
        id: data.id || doc.id,
        ownerId: data.ownerId || '',
        name: data.name || '',
        type: data.type || '',
        age: data.age || 0,
        breed: data.breed || '',
        image: data.image || '',
        bio: data.bio || '',
      };
      
      // Exclude current user's animals
      if (!excludeUserId || animal.ownerId !== excludeUserId) {
        animals.push(animal);
      }
    });

    console.log(`Loaded ${animals.length} animals from Firestore (excluding user: ${excludeUserId || 'none'})`);
    return animals;
  } catch (error) {
    console.error('Error getting all animals from Firestore:', error);
    throw error;
  }
};

/**
 * Delete animal from Firestore
 */
export const deleteAnimal = async (animalId: string): Promise<void> => {
  try {
    await animalsCollection.doc(animalId).delete();
    console.log('Animal deleted from Firestore:', animalId);
  } catch (error) {
    console.error('Error deleting animal from Firestore:', error);
    throw error;
  }
};

