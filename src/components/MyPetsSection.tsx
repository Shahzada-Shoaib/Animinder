import React, {useState, useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {useApp} from '../context/AppContext';
import {Animal} from '../types';
import {Colors} from '../utils/colors';
import {Shadows} from '../utils/shadows';

interface MyPetsSectionProps {
  onAddPet: () => void;
  onRemovePet: (animalId: string) => void;
  onAnimalAdded?: (callback: (animal: Animal) => void) => void;
}

const MyPetsSection: React.FC<MyPetsSectionProps> = ({
  onAddPet,
  onRemovePet,
  onAnimalAdded,
}) => {
  const {currentUser} = useApp();
  const [userAnimals, setUserAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const optimisticAnimalsRef = useRef<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Fetch user's animals from Firebase
  useEffect(() => {
    const currentUser = auth().currentUser;
    
    if (!currentUser) {
      setUserAnimals([]);
      setLoading(false);
      return;
    }

    const userId = currentUser.uid;
    const animalsCollection = firestore().collection('animals');

    // Real-time listener for user's animals
    const unsubscribe = animalsCollection
      .where('ownerId', '==', userId)
      .onSnapshot(
        (snapshot) => {
          const animals: Animal[] = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            const animalId = data.id || doc.id;
            // Mark as synced from Firebase
            optimisticAnimalsRef.current.delete(animalId);
            
            animals.push({
              id: animalId,
              ownerId: data.ownerId || '',
              name: data.name || '',
              type: data.type || '',
              age: data.age || 0,
              breed: data.breed || '',
              image: data.image || '',
              bio: data.bio || '',
            });
          });
          
          // Merge with optimistic updates that haven't synced yet
          setUserAnimals(prev => {
            const optimisticAnimals = prev.filter(a => optimisticAnimalsRef.current.has(a.id));
            const merged = [...animals, ...optimisticAnimals];
            // Remove duplicates (keep Firebase version if exists)
            const unique = merged.reduce((acc, animal) => {
              if (!acc.find(a => a.id === animal.id)) {
                acc.push(animal);
              }
              return acc;
            }, [] as Animal[]);
            return unique;
          });
          
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching user animals:', error);
          setUserAnimals([]);
          setLoading(false);
        },
      );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  // Function to optimistically add animal to UI
  const handleOptimisticAdd = React.useCallback((animal: Animal) => {
    const currentUser = auth().currentUser;
    if (!currentUser || animal.ownerId !== currentUser.uid) return;

    // Mark as optimistic update
    optimisticAnimalsRef.current.add(animal.id);
    
    // Optimistically add to UI immediately
    setUserAnimals(prev => {
      // Check if already exists
      if (prev.find(a => a.id === animal.id)) {
        return prev;
      }
      return [...prev, animal];
    });
  }, []);

  // Expose optimistic add function to parent component
  useEffect(() => {
    if (onAnimalAdded) {
      onAnimalAdded(handleOptimisticAdd);
    }
  }, [onAnimalAdded, handleOptimisticAdd]);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Pets</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAddPet}
          activeOpacity={0.8}>
          <Icon name="add-circle" size={20} color={Colors.white} style={styles.addButtonIcon} />
          <Text style={styles.addButtonText}>Add Pet</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loading pets...</Text>
        </View>
      ) : userAnimals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No pets added yet</Text>
          <Text style={styles.emptySubtext}>
            Add your first pet to start matching!
          </Text>
        </View>
      ) : (
        <View style={styles.animalsGrid}>
          {userAnimals.map(animal => (
            <View key={animal.id} style={styles.animalCard}>
              {imageErrors.has(animal.id) ? (
                <View style={[styles.animalImage, styles.animalImageError]}>
                  <Icon name="image-outline" size={30} color={Colors.gray400} />
                </View>
              ) : (
                <Image
                  source={{uri: animal.image}}
                  style={styles.animalImage}
                  onError={() => setImageErrors(prev => new Set(prev).add(animal.id))}
                />
              )}
              <View style={styles.animalInfo}>
                <Text style={styles.animalName}>{animal.name}</Text>
                <Text style={styles.animalBreed}>{animal.breed}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onRemovePet(animal.id)}
                activeOpacity={0.7}>
                <Icon name="trash-outline" size={18} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.small,
  },
  addButtonIcon: {
    marginRight: 6,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
  animalsGrid: {
    gap: 16,
  },
  animalCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.small,
  },
  animalImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    borderWidth: 2,
    borderColor: Colors.gray200,
  },
  animalImageError: {
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animalInfo: {
    flex: 1,
  },
  animalName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  animalBreed: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: Colors.error,
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
});

export default MyPetsSection;

