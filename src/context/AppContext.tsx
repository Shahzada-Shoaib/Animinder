import React, {createContext, useState, useContext, ReactNode, useEffect} from 'react';
import {Animal, User, Match} from '../types';
import auth from '@react-native-firebase/auth';
import {saveUser, getUser, saveAnimal, getUserAnimals, deleteAnimal, getAllAnimals} from '../services/firestoreService';
import {saveLike, getUserLikes, checkMutualLike} from '../services/likeService';
import {saveMatch, getUserMatches} from '../services/matchService';

// Dummy data for MVP
const dummyAnimals: Animal[] = [
  {
    id: '1',
    name: 'Max',
    type: 'Dog',
    age: 3,
    breed: 'Golden Retriever',
    image: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400',
    bio: 'Friendly and loves to play fetch!',
    ownerId: 'user2',
  },
  {
    id: '2',
    name: 'Luna',
    type: 'Cat',
    age: 2,
    breed: 'Persian',
    image: 'https://images.unsplash.com/photo-1573865526739-10c1dd4937f1?w=400',
    bio: 'Sweet and cuddly, loves afternoon naps.',
    ownerId: 'user3',
  },
  {
    id: '3',
    name: 'Charlie',
    type: 'Dog',
    age: 5,
    breed: 'Labrador',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400',
    bio: 'Energetic and great with kids!',
    ownerId: 'user4',
  },
  {
    id: '4',
    name: 'Bella',
    type: 'Cat',
    age: 1,
    breed: 'Siamese',
    image: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=400',
    bio: 'Playful kitten looking for a companion.',
    ownerId: 'user5',
  },
];

interface AppContextType {
  currentUser: User;
  userAnimals: Animal[];
  animals: Animal[];
  matches: Match[];
  likedAnimals: string[];
  newMatch: Match | null;
  addAnimal: (animal: Animal) => void;
  removeAnimal: (animalId: string) => void;
  likeAnimal: (animalId: string) => void;
  passAnimal: (animalId: string) => void;
  clearNewMatch: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({children}: {children: ReactNode}) => {
  // Current user (without animals array)
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
  });

  // Current user's animals (separate state)
  const [userAnimals, setUserAnimals] = useState<Animal[]>([]);

  // Load user's animals from Firestore
  const loadUserAnimals = async (userId: string) => {
    try {
      if (userId && userId !== 'user1') {
        const animals = await getUserAnimals(userId);
        setUserAnimals(animals);
      } else {
        setUserAnimals([]);
      }
    } catch (error) {
      console.error('Error loading user animals:', error);
      setUserAnimals([]);
    }
  };

  // Load all animals for swiping (dummy + DB, excluding current user's animals and already liked)
  const loadAllAnimals = async (excludeUserId?: string, excludeLikedIds: string[] = []) => {
    try {
      // Get all animals from Firestore (excluding current user's)
      const dbAnimals = await getAllAnimals(excludeUserId);
      
      // Combine dummy animals with DB animals
      // Filter out duplicates and current user's animals from dummy list too
      const excludeUserIds = excludeUserId ? [excludeUserId] : [];
      const filteredDummy = dummyAnimals.filter(
        animal => !excludeUserIds.includes(animal.ownerId)
      );
      
      // Combine and remove duplicates by ID
      const allAnimalsMap = new Map<string, Animal>();
      
      // Add dummy animals first
      filteredDummy.forEach(animal => {
        allAnimalsMap.set(animal.id, animal);
      });
      
      // Add DB animals (will overwrite if same ID, but that's fine)
      dbAnimals.forEach(animal => {
        allAnimalsMap.set(animal.id, animal);
      });
      
      // Filter out already liked animals (use parameter or state)
      const likedIds = excludeLikedIds.length > 0 ? excludeLikedIds : likedAnimals;
      const combinedAnimals = Array.from(allAnimalsMap.values()).filter(
        animal => !likedIds.includes(animal.id)
      );
      
      setAnimals(combinedAnimals);
      
      console.log(`Loaded ${combinedAnimals.length} animals for swiping (${filteredDummy.length} dummy + ${dbAnimals.length} from DB, ${likedIds.length} already liked)`);
    } catch (error) {
      console.error('Error loading all animals:', error);
      // Fallback to dummy animals only
      const filteredDummy = excludeUserId 
        ? dummyAnimals.filter(animal => animal.ownerId !== excludeUserId)
        : dummyAnimals;
      const likedIds = excludeLikedIds.length > 0 ? excludeLikedIds : likedAnimals;
      const filtered = filteredDummy.filter(
        animal => !likedIds.includes(animal.id)
      );
      setAnimals(filtered);
    }
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async firebaseUser => {
      if (firebaseUser) {
        // User is logged in
        try {
          // Try to get user data from Firestore
          const userData = await getUser(firebaseUser.uid);
          
          if (userData) {
            // User exists in Firestore, use that data
            setCurrentUser(userData);
            // Load user's animals separately
            await loadUserAnimals(firebaseUser.uid);
            // Load user's likes
            const likedIds = await loadUserLikes(firebaseUser.uid);
            // Load user's matches
            await loadUserMatches(firebaseUser.uid);
            // Load all animals for swiping (excluding current user's and already liked)
            await loadAllAnimals(firebaseUser.uid, likedIds);
          } else {
            // New user, create user data from Firebase auth
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'User',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || undefined,
              createdAt: new Date(),
            };
            
            // Save to Firestore
            await saveUser(firebaseUser.uid, newUser);
            setCurrentUser(newUser);
            // Load user's animals (will be empty for new user)
            await loadUserAnimals(firebaseUser.uid);
            // Load user's likes (will be empty for new user)
            const likedIds = await loadUserLikes(firebaseUser.uid);
            // Load user's matches (will be empty for new user)
            await loadUserMatches(firebaseUser.uid);
            // Load all animals for swiping (excluding current user's and already liked)
            await loadAllAnimals(firebaseUser.uid, likedIds);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          // Fallback to Firebase auth data if Firestore fails
          setCurrentUser(prev => ({
            ...prev,
            id: firebaseUser.uid,
            name: firebaseUser.displayName || prev.name,
            email: firebaseUser.email || prev.email,
            photoURL: firebaseUser.photoURL || undefined,
          }));
          setUserAnimals([]);
          setLikedAnimals([]);
          setMatches([]);
          // Load all animals (excluding current user)
          await loadAllAnimals(firebaseUser.uid);
        }
      } else {
        // User is logged out, reset to dummy data
        setCurrentUser({
          id: 'user1',
          name: 'John Doe',
          email: 'john@example.com',
        });
        setUserAnimals([]);
        setLikedAnimals([]);
        setMatches([]);
        setNewMatch(null);
        // Load all animals (no user to exclude)
        await loadAllAnimals();
      }
    });

    return () => unsubscribe();
  }, []);

  // All animals available for swiping (dummy + DB, excluding current user's)
  const [animals, setAnimals] = useState<Animal[]>(dummyAnimals);

  // Matched animals
  const [matches, setMatches] = useState<Match[]>([]);

  // New match for modal
  const [newMatch, setNewMatch] = useState<Match | null>(null);

  // Liked animal IDs
  const [likedAnimals, setLikedAnimals] = useState<string[]>([]);

  // Load user's likes from Firestore
  const loadUserLikes = async (userId: string): Promise<string[]> => {
    try {
      if (userId && userId !== 'user1') {
        const likes = await getUserLikes(userId);
        const likedIds = likes.map(like => like.likedAnimalId);
        setLikedAnimals(likedIds);
        return likedIds;
      } else {
        setLikedAnimals([]);
        return [];
      }
    } catch (error) {
      console.error('Error loading user likes:', error);
      setLikedAnimals([]);
      return [];
    }
  };

  // Load user's matches from Firestore
  const loadUserMatches = async (userId: string) => {
    try {
      if (userId && userId !== 'user1') {
        const userMatches = await getUserMatches(userId);
        setMatches(userMatches);
      } else {
        setMatches([]);
      }
    } catch (error) {
      console.error('Error loading user matches:', error);
      setMatches([]);
    }
  };

  // Add animal to current user's profile
  const addAnimal = async (animal: Animal) => {
    // Update local state
    setUserAnimals(prev => [...prev, animal]);
    
    // Save to Firestore animals collection if user is logged in
    if (currentUser.id && currentUser.id !== 'user1') {
      try {
        await saveAnimal(animal.id, animal);
        // Reload all animals to update the swipe list (this animal won't show since it's current user's)
        await loadAllAnimals(currentUser.id);
      } catch (error) {
        console.error('Error saving animal to Firestore:', error);
        // Revert local state on error
        setUserAnimals(prev => prev.filter(a => a.id !== animal.id));
      }
    }
  };

  // Remove animal from current user's profile
  const removeAnimal = async (animalId: string) => {
    // Update local state
    setUserAnimals(prev => prev.filter(a => a.id !== animalId));
    
    // Delete from Firestore animals collection if user is logged in
    if (currentUser.id && currentUser.id !== 'user1') {
      try {
        await deleteAnimal(animalId);
        // Reload all animals to update the swipe list
        await loadAllAnimals(currentUser.id);
      } catch (error) {
        console.error('Error removing animal from Firestore:', error);
        // Reload animals from Firestore on error
        await loadUserAnimals(currentUser.id);
        await loadAllAnimals(currentUser.id);
      }
    }
  };

  // Like an animal (swipe right)
  const likeAnimal = async (animalId: string) => {
    const animal = animals.find(a => a.id === animalId);
    if (!animal || !currentUser.id || currentUser.id === 'user1') {
      return;
    }

    try {
      // 1. Save like to Firestore
      await saveLike(currentUser.id, animalId, animal.ownerId);
      
      // 2. Update local state
      setLikedAnimals(prev => [...prev, animalId]);
      
      // 3. Check for mutual like
      const mutualLike = await checkMutualLike(
        currentUser.id,
        animal.ownerId,
        userAnimals,
      );
      
      // 4. If mutual like, create match
      if (mutualLike.isMatch && mutualLike.matchedAnimalId) {
        const matchedAnimal = userAnimals.find(
          a => a.id === mutualLike.matchedAnimalId,
        );
        
        if (matchedAnimal) {
          const newMatch: Match = {
            id: `match-${Date.now()}`,
            userId1: currentUser.id,
            userId2: animal.ownerId,
            animal1Id: matchedAnimal.id,
            animal1: matchedAnimal,
            animal2Id: animal.id,
            animal2: animal,
            timestamp: new Date(),
          };
          
          // Save match to Firestore
          await saveMatch(newMatch);
          
          // Update local state
          setMatches(prev => [...prev, newMatch]);
          setNewMatch(newMatch);
        }
      }
      
      // 5. Remove from swipe deck (already liked)
      setAnimals(prev => prev.filter(a => a.id !== animalId));
    } catch (error) {
      console.error('Error liking animal:', error);
    }
  };

  // Clear new match (after modal is shown)
  const clearNewMatch = () => {
    setNewMatch(null);
  };

  // Pass an animal (swipe left)
  const passAnimal = (animalId: string) => {
    // Just remove from the deck for now
    console.log('Passed animal:', animalId);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        userAnimals,
        animals,
        matches,
        likedAnimals,
        newMatch,
        addAnimal,
        removeAnimal,
        likeAnimal,
        passAnimal,
        clearNewMatch,
      }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

