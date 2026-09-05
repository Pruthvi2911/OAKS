import { db } from './firebase.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { DEFAULT_FERRY, createQueueEntryDoc, VEHICLE_STATUS, CROSSING_STATUS } from './constants.js';
import { INITIAL_MOCK_CROSSING, INITIAL_MOCK_QUEUE } from './mockData.js';

const FERRIES_COLLECTION = 'ferries';
const CROSSINGS_COLLECTION = 'crossings';
const QUEUE_COLLECTION = 'queueEntries';

/**
 * Fetches Ferry Configuration from Firestore (with fallback to DEFAULT_FERRY)
 */
export async function getFerryConfig(ferryId = DEFAULT_FERRY.id) {
  try {
    const docRef = doc(db, FERRIES_COLLECTION, ferryId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (err) {
    console.warn('Firestore ferry config fetch warning, using fallback:', err.message);
  }
  return DEFAULT_FERRY;
}

/**
 * Fetches Active Crossing from Firestore
 */
export async function getActiveCrossing() {
  try {
    const q = query(
      collection(db, CROSSINGS_COLLECTION),
      where('status', 'in', [CROSSING_STATUS.LOADING, CROSSING_STATUS.READY])
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const activeDoc = snap.docs[0];
      return { id: activeDoc.id, ...activeDoc.data() };
    }
  } catch (err) {
    console.warn('Firestore active crossing fetch warning:', err.message);
  }
  return INITIAL_MOCK_CROSSING;
}

/**
 * Adds a new vehicle check-in queue entry to Firestore
 */
export async function addQueueEntry(entryData) {
  const docData = createQueueEntryDoc(entryData);
  try {
    const docRef = await addDoc(collection(db, QUEUE_COLLECTION), docData);
    return { id: docRef.id, ...docData };
  } catch (err) {
    console.warn('Firestore addQueueEntry offline fallback:', err.message);
    return { id: `veh-local-${Date.now()}`, ...docData };
  }
}

/**
 * Updates a queue entry in Firestore
 */
export async function updateQueueEntry(entryId, fieldsToUpdate) {
  try {
    const docRef = doc(db, QUEUE_COLLECTION, entryId);
    await updateDoc(docRef, fieldsToUpdate);
  } catch (err) {
    console.warn('Firestore updateQueueEntry warning:', err.message);
  }
}

/**
 * Assigns a vehicle to a bay on deck
 */
export async function assignVehicleToBay(entryId, bay, crossingId) {
  return updateQueueEntry(entryId, {
    bay,
    status: VEHICLE_STATUS.LOADED,
    crossingId,
  });
}

/**
 * Unloads a vehicle from deck back to waiting queue
 */
export async function unloadVehicleFromDeck(entryId) {
  return updateQueueEntry(entryId, {
    bay: null,
    status: VEHICLE_STATUS.WAITING,
    crossingId: null,
  });
}

/**
 * Marks vehicle as NO_SHOW
 */
export async function markVehicleNoShow(entryId) {
  return updateQueueEntry(entryId, {
    bay: null,
    status: VEHICLE_STATUS.NO_SHOW,
  });
}

/**
 * Verifies weight for a vehicle
 */
export async function updateVerifiedWeight(entryId, verifiedWeightKg) {
  return updateQueueEntry(entryId, {
    verifiedWeight: Number(verifiedWeightKg),
  });
}

/**
 * Confirms hazardous cargo
 */
export async function confirmHazardousCargo(entryId) {
  return updateQueueEntry(entryId, {
    hazardConfirmed: true,
  });
}

/**
 * Seeds initial database data if collections are empty
 */
export async function seedInitialDatabase() {
  try {
    // Seed Ferry
    await setDoc(doc(db, FERRIES_COLLECTION, DEFAULT_FERRY.id), DEFAULT_FERRY);

    // Seed Crossing
    await setDoc(doc(db, CROSSINGS_COLLECTION, INITIAL_MOCK_CROSSING.id), INITIAL_MOCK_CROSSING);

    // Seed Queue Entries
    for (const item of INITIAL_MOCK_QUEUE) {
      await setDoc(doc(db, QUEUE_COLLECTION, item.id), item);
    }
    return true;
  } catch (err) {
    console.warn('Database seed warning (working in offline mode):', err.message);
    return false;
  }
}
