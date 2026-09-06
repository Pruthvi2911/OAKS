// Default Ferry Configuration (Fallback when Firestore is disconnected or seeding)
export const DEFAULT_FERRY = {
  id: 'ferry-01',
  name: 'River Ferry 01',
  maxWeight: 10000,
  maxLeftWeight: 4000,
  maxCenterWeight: 3500,
  maxRightWeight: 4000,
  maxImbalance: 1000,
};

// Deck Bays
export const BAYS = {
  LEFT: 'LEFT',
  CENTER: 'CENTER',
  RIGHT: 'RIGHT',
};

export const BAY_LIST = [BAYS.LEFT, BAYS.CENTER, BAYS.RIGHT];

// Vehicle Types & Default Estimates (kg)
export const VEHICLE_TYPES = {
  TRUCK: { label: 'Truck / Heavy Vehicle', icon: '🚚', defaultWeight: 3400 },
  VAN: { label: 'Van / Minibus', icon: '🚐', defaultWeight: 2100 },
  CAR: { label: 'Passenger Car', icon: '🚗', defaultWeight: 1500 },
  AMBULANCE: { label: 'Ambulance / Emergency', icon: '🚑', defaultWeight: 2600 },
  MOTORCYCLE: { label: 'Motorcycle / Quad', icon: '🏍️', defaultWeight: 400 },
};

// Vehicle Status Lifecycle
export const VEHICLE_STATUS = {
  WAITING: 'WAITING',
  READY: 'READY',
  BOARDING: 'BOARDING',
  LOADED: 'LOADED',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW',
  REJECTED: 'REJECTED',
};

// Crossing Status Lifecycle
export const CROSSING_STATUS = {
  LOADING: 'LOADING',
  READY: 'READY',
  CAST_OFF: 'CAST_OFF',
  COMPLETED: 'COMPLETED',
};

// Priority Levels
export const PRIORITY_LEVELS = {
  EMERGENCY: 'EMERGENCY',
  NORMAL: 'NORMAL',
};

// Indian State / Union Territory RTO Codes for Number Plate Entry
export const INDIAN_STATE_CODES = [
  'AN', 'AP', 'AR', 'AS', 'BR', 'CG', 'CH', 'DD', 'DL', 'DN',
  'GA', 'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD',
  'MH', 'ML', 'MN', 'MP', 'MZ', 'NL', 'OD', 'PB', 'PY', 'RJ',
  'SK', 'TN', 'TR', 'TS', 'UK', 'UP', 'WB',
];

// Safety Reason Code Constants for evaluatePlacement
export const SAFETY_REASONS = {
  FITS_CAPACITY: 'FITS_CAPACITY',
  REDUCES_IMBALANCE: 'REDUCES_IMBALANCE',
  TOTAL_CAPACITY_EXCEEDED: 'TOTAL_CAPACITY_EXCEEDED',
  LEFT_BAY_OVER_LIMIT: 'LEFT_BAY_OVER_LIMIT',
  CENTER_BAY_OVER_LIMIT: 'CENTER_BAY_OVER_LIMIT',
  RIGHT_BAY_OVER_LIMIT: 'RIGHT_BAY_OVER_LIMIT',
  IMBALANCE_TOO_HIGH: 'IMBALANCE_TOO_HIGH',
  HAZARD_REQUIRES_CONFIRMATION: 'HAZARD_REQUIRES_CONFIRMATION',
};

/**
 * Standard Firestore Queue Document Schema Constructor
 * Used across local state & remote Firestore to guarantee 100% field consistency
 */
export function createQueueEntryDoc({
  id = null,
  checkInCode,
  vehicleType,
  declaredWeight,
  verifiedWeight = null,
  hazardous = false,
  priority = PRIORITY_LEVELS.NORMAL,
  status = VEHICLE_STATUS.WAITING,
  bay = null,
  crossingId = null,
  createdAt = new Date().toISOString(),
}) {
  return {
    ...(id ? { id } : {}),
    checkInCode,
    vehicleType,
    declaredWeight: Number(declaredWeight),
    verifiedWeight: verifiedWeight !== null ? Number(verifiedWeight) : null,
    hazardous: Boolean(hazardous),
    priority,
    status,
    bay,
    crossingId,
    createdAt,
  };
}
