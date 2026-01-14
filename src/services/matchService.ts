import firestore from '@react-native-firebase/firestore';
import {Match} from '../types';

const matchesCollection = firestore().collection('matches');

/**
 * Save match to Firestore
 */
export const saveMatch = async (matchData: Match): Promise<void> => {
  try {
    await matchesCollection.add({
      userId1: matchData.userId1,
      userId2: matchData.userId2,
      animal1Id: matchData.animal1Id,
      animal1: matchData.animal1,
      animal2Id: matchData.animal2Id,
      animal2: matchData.animal2,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    console.log('Match saved:', matchData.userId1, '↔', matchData.userId2);
  } catch (error) {
    console.error('Error saving match:', error);
    throw error;
  }
};

/**
 * Get all matches for a user
 */
export const getUserMatches = async (userId: string): Promise<Match[]> => {
  try {
    const snapshot1 = await matchesCollection
      .where('userId1', '==', userId)
      .get();

    const snapshot2 = await matchesCollection
      .where('userId2', '==', userId)
      .get();

    const matches: Match[] = [];

    snapshot1.forEach(doc => {
      const data = doc.data();
      matches.push({
        id: doc.id,
        userId1: data.userId1 || '',
        userId2: data.userId2 || '',
        animal1Id: data.animal1Id || '',
        animal1: data.animal1,
        animal2Id: data.animal2Id || '',
        animal2: data.animal2,
        timestamp: data.createdAt ? data.createdAt.toDate() : new Date(),
      });
    });

    snapshot2.forEach(doc => {
      const data = doc.data();
      matches.push({
        id: doc.id,
        userId1: data.userId1 || '',
        userId2: data.userId2 || '',
        animal1Id: data.animal1Id || '',
        animal1: data.animal1,
        animal2Id: data.animal2Id || '',
        animal2: data.animal2,
        timestamp: data.createdAt ? data.createdAt.toDate() : new Date(),
      });
    });

    // Sort by timestamp (newest first)
    matches.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return matches;
  } catch (error) {
    console.error('Error getting user matches:', error);
    throw error;
  }
};

/**
 * Get real-time matches for a user
 */
export const getUserMatchesRealtime = (
  userId: string,
  callback: (matches: Match[]) => void,
): (() => void) => {
  let matchesMap = new Map<string, Match>();
  let isFirstLoad1 = true;
  let isFirstLoad2 = true;
  
  const processMatches = () => {
    const allMatches = Array.from(matchesMap.values());
    allMatches.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    console.log(`[Matches Realtime] Processing ${allMatches.length} matches for user ${userId}`);
    callback(allMatches);
  };

  const handleSnapshot = (
    snapshot: any,
    isFirstLoad: boolean,
    queryName: string,
  ) => {
    console.log(`[Matches Realtime] ${queryName} query: ${snapshot.docs.length} documents, isFirstLoad: ${isFirstLoad}`);
    
    // On first load, process all documents
    if (isFirstLoad) {
      // Clear existing matches for this query to avoid duplicates
      const currentDocIds = new Set<string>();
      snapshot.forEach((doc: any) => {
        currentDocIds.add(doc.id);
        const data = doc.data();
        const match: Match = {
          id: doc.id,
          userId1: data.userId1 || '',
          userId2: data.userId2 || '',
          animal1Id: data.animal1Id || '',
          animal1: data.animal1,
          animal2Id: data.animal2Id || '',
          animal2: data.animal2,
          timestamp: data.createdAt ? data.createdAt.toDate() : new Date(),
        };
        console.log(`[Matches Realtime] Initial load - ${queryName} match: ${doc.id}`, {
          userId1: match.userId1,
          userId2: match.userId2,
          animal1: match.animal1?.name,
          animal2: match.animal2?.name,
        });
        matchesMap.set(doc.id, match);
      });
      
      // Remove documents that are no longer in the query
      matchesMap.forEach((match, id) => {
        if (queryName === 'userId1' && match.userId1 === userId && !currentDocIds.has(id)) {
          matchesMap.delete(id);
        } else if (queryName === 'userId2' && match.userId2 === userId && !currentDocIds.has(id)) {
          matchesMap.delete(id);
        }
      });
    } else {
      // Handle document changes (added, modified, removed)
      snapshot.docChanges().forEach((change: any) => {
        if (change.type === 'removed') {
          console.log(`[Matches Realtime] Removed match: ${change.doc.id}`);
          matchesMap.delete(change.doc.id);
        } else {
          const data = change.doc.data();
          const match: Match = {
            id: change.doc.id,
            userId1: data.userId1 || '',
            userId2: data.userId2 || '',
            animal1Id: data.animal1Id || '',
            animal1: data.animal1,
            animal2Id: data.animal2Id || '',
            animal2: data.animal2,
            timestamp: data.createdAt ? data.createdAt.toDate() : new Date(),
          };
          console.log(`[Matches Realtime] ${change.type} match: ${change.doc.id}`, {
            userId1: match.userId1,
            userId2: match.userId2,
            animal1: match.animal1?.name,
            animal2: match.animal2?.name,
          });
          matchesMap.set(change.doc.id, match);
        }
      });
    }
    processMatches();
  };

  const unsubscribe1 = matchesCollection
    .where('userId1', '==', userId)
    .onSnapshot(
      snapshot => {
        handleSnapshot(snapshot, isFirstLoad1, 'userId1');
        isFirstLoad1 = false;
      },
      error => {
        console.error('Error listening to matches (userId1):', error);
        callback([]);
      },
    );

  const unsubscribe2 = matchesCollection
    .where('userId2', '==', userId)
    .onSnapshot(
      snapshot => {
        handleSnapshot(snapshot, isFirstLoad2, 'userId2');
        isFirstLoad2 = false;
      },
      error => {
        console.error('Error listening to matches (userId2):', error);
        callback([]);
      },
    );

  return () => {
    unsubscribe1();
    unsubscribe2();
  };
};

