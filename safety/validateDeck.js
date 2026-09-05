import { DEFAULT_FERRY, BAYS, SAFETY_REASONS } from '../lib/constants.js';

/**
 * Calculates effective weight of a vehicle.
 * verifiedWeight wins over declaredWeight.
 */
export function getEffectiveWeight(vehicle) {
  if (!vehicle) return 0;
  return vehicle.verifiedWeight !== null && vehicle.verifiedWeight !== undefined
    ? Number(vehicle.verifiedWeight)
    : Number(vehicle.declaredWeight || 0);
}

/**
 * Evaluates placing ONE vehicle into ONE specific bay on the ferry deck.
 *
 * Separation of Hard Constraints vs Recommendation Warnings (Spec Section 11):
 * - HARD CONSTRAINTS (valid = false):
 *   1. Total deck capacity exceeded (totalWeight > maxWeight)
 *   2. Target bay weight limit exceeded (bayWeight > maxBayWeight)
 * - RECOMMENDATION / PREFERENCE WARNINGS (valid = true, but flagged with warning):
 *   1. Left/Right imbalance spread (postImbalance > maxImbalance)
 *      This allows master to stage vehicles across LEFT & RIGHT bays without false blocks.
 *
 * @param {Object} vehicle - Vehicle object to place
 * @param {String} bay - Target bay ('LEFT', 'CENTER', 'RIGHT')
 * @param {Array} currentVehicles - Array of vehicles currently assigned to deck bays
 * @param {Object} ferryConfig - Ferry configuration limits
 * @returns {Object} { valid: boolean, reasons: string[], postPlacementState: Object }
 */
export function evaluatePlacement(
  vehicle,
  bay,
  currentVehicles = [],
  ferryConfig = DEFAULT_FERRY
) {
  const config = { ...DEFAULT_FERRY, ...ferryConfig };
  const reasons = [];

  if (!vehicle || !bay || !BAYS[bay]) {
    return {
      valid: false,
      reasons: ['INVALID_INPUT'],
      postPlacementState: null,
    };
  }

  const candidateWeight = getEffectiveWeight(vehicle);

  // Compute current deck weights per bay
  let leftWeight = 0;
  let centerWeight = 0;
  let rightWeight = 0;

  for (const v of currentVehicles) {
    if (!v.bay || (v.id && vehicle.id && v.id === vehicle.id)) continue;
    const w = getEffectiveWeight(v);
    if (v.bay === BAYS.LEFT) leftWeight += w;
    else if (v.bay === BAYS.CENTER) centerWeight += w;
    else if (v.bay === BAYS.RIGHT) rightWeight += w;
  }

  const preImbalance = Math.abs(leftWeight - rightWeight);

  // Apply candidate vehicle to target bay
  if (bay === BAYS.LEFT) leftWeight += candidateWeight;
  else if (bay === BAYS.CENTER) centerWeight += candidateWeight;
  else if (bay === BAYS.RIGHT) rightWeight += candidateWeight;

  const totalWeight = leftWeight + centerWeight + rightWeight;
  const postImbalance = Math.abs(leftWeight - rightWeight);

  // Hard Safety Constraints (Block placement)
  let valid = true;

  if (totalWeight > config.maxWeight) {
    valid = false;
    reasons.push(SAFETY_REASONS.TOTAL_CAPACITY_EXCEEDED);
  }

  if (leftWeight > config.maxLeftWeight) {
    valid = false;
    reasons.push(SAFETY_REASONS.LEFT_BAY_OVER_LIMIT);
  }

  if (centerWeight > config.maxCenterWeight) {
    valid = false;
    reasons.push(SAFETY_REASONS.CENTER_BAY_OVER_LIMIT);
  }

  if (rightWeight > config.maxRightWeight) {
    valid = false;
    reasons.push(SAFETY_REASONS.RIGHT_BAY_OVER_LIMIT);
  }

  // Hazardous cargo check
  if (vehicle.hazardous && !vehicle.hazardConfirmed) {
    reasons.push(SAFETY_REASONS.HAZARD_REQUIRES_CONFIRMATION);
  }

  // Soft Recommendation Flags (Preference / Balance Quality)
  if (valid) {
    reasons.push(SAFETY_REASONS.FITS_CAPACITY);
    if (postImbalance > config.maxImbalance) {
      reasons.push(SAFETY_REASONS.IMBALANCE_TOO_HIGH); // Soft warning for rationale, does not hard-block valid placement
    } else if (postImbalance <= preImbalance) {
      reasons.push(SAFETY_REASONS.REDUCES_IMBALANCE);
    }
  }

  return {
    valid,
    reasons,
    postPlacementState: {
      totalWeight,
      leftWeight,
      centerWeight,
      rightWeight,
      imbalance: postImbalance,
      preImbalance,
    },
  };
}
