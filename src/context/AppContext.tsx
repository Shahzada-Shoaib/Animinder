import React, {createContext, useState, useContext, ReactNode} from 'react';
import {Animal, User, Match} from '../types';

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
  animals: Animal[];
  matches: Match[];
  likedAnimals: string[];
  addAnimal: (animal: Animal) => void;
  removeAnimal: (animalId: string) => void;
  likeAnimal: (animalId: string) => void;
  passAnimal: (animalId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({children}: {children: ReactNode}) => {
  // Current user with their animals
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
    animals: [],
  });

  // All animals available for swiping
  const [animals, setAnimals] = useState<Animal[]>(dummyAnimals);

  // Matched animals
  const [matches, setMatches] = useState<Match[]>([]);

  // Liked animal IDs
  const [likedAnimals, setLikedAnimals] = useState<string[]>([]);

  // Add animal to current user's profile
  const addAnimal = (animal: Animal) => {
    setCurrentUser(prev => ({
      ...prev,
      animals: [...prev.animals, animal],
    }));
  };

  // Remove animal from current user's profile
  const removeAnimal = (animalId: string) => {
    setCurrentUser(prev => ({
      ...prev,
      animals: prev.animals.filter(a => a.id !== animalId),
    }));
  };

  // Like an animal (swipe right)
  const likeAnimal = (animalId: string) => {
    setLikedAnimals(prev => [...prev, animalId]);
    
    // Check if it's a match (in MVP, we'll simulate 50% match rate)
    const isMatch = Math.random() > 0.5;
    if (isMatch) {
      const animal = animals.find(a => a.id === animalId);
      if (animal && currentUser.animals.length > 0) {
        const newMatch: Match = {
          id: `match-${Date.now()}`,
          animal1: currentUser.animals[0], // Use user's first animal
          animal2: animal,
          timestamp: new Date(),
        };
        setMatches(prev => [...prev, newMatch]);
      }
    }
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
        animals,
        matches,
        likedAnimals,
        addAnimal,
        removeAnimal,
        likeAnimal,
        passAnimal,
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

