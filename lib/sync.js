import { db } from './firebase.js';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { DEFAULT_FERRY } from './constants.js';

const FERRIES_COLLECTION = 'ferries';
const CROSSINGS_COLLECTION = 'crossings';
const QUEUE_COLLECTION = 'queueEntries';

/**
 * Realtime listener for Ferry Configuration
 */
export function subscribeToFerryConfig(ferryId = DEFAULT_FERRY.id, onUpdate, onError) {
  const docRef = doc(db, FERRIES_COLLECTION, ferryId);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate({ id: snapshot.id, ...snapshot.data() });
      } else {
        onUpdate(DEFAULT_FERRY);
      }
    },
    (error) => {
      console.warn('Realtime Ferry Config error, falling back to cached/default:', error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Realtime listener for Active Crossing
 */
export function subscribeToActiveCrossing(onUpdate, onError) {
  const q = query(
    collection(db, CROSSINGS_COLLECTION),
    where('status', 'in', ['LOADING', 'READY'])
  );
  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        const activeDoc = snapshot.docs[0];
        onUpdate({ id: activeDoc.id, ...activeDoc.data() });
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn('Realtime Active Crossing error:', error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Realtime listener for Queue Entries
 */
export function subscribeToQueue(onUpdate, onError) {
  const q = collection(db, QUEUE_COLLECTION);
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      onUpdate(items);
    },
    (error) => {
      console.warn('Realtime Queue error:', error.message);
      if (onError) onError(error);
    }
  );
}
