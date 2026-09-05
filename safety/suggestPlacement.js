import { BAY_LIST, DEFAULT_FERRY } from '../lib/constants.js';
import { evaluatePlacement } from './validateDeck.js';

/**
 * Evaluates placement of a vehicle across ALL 3 bays (LEFT, CENTER, RIGHT),
 * scores valid bays according to resulting weight balance, and recommends the safest/best-balanced option.
 *
 * @param {Object} vehicle - Candidate vehicle object
 * @param {Array} currentVehicles - Vehicles currently loaded on deck
 * @param {Object} ferryConfig - Ferry safety constraints
 * @returns {Object} { recommended: String|null, options: Object, rationale: Object }
 */
export function suggestPlacement(
  vehicle,
  currentVehicles = [],
  ferryConfig = DEFAULT_FERRY
) {
  const options = {};
  let bestBay = null;
  let minImbalance = Infinity;

  for (const bay of BAY_LIST) {
    const evalResult = evaluatePlacement(vehicle, bay, currentVehicles, ferryConfig);
    options[bay] = evalResult;

    if (evalResult.valid) {
      const imb = evalResult.postPlacementState.imbalance;
      if (imb < minImbalance) {
        minImbalance = imb;
        bestBay = bay;
      }
    }
  }

  // Create human-readable rationale explanations for UI presentation
  const rationale = {};
  for (const bay of BAY_LIST) {
    const res = options[bay];
    const lines = [];

    if (res.valid) {
      lines.push({ type: 'success', text: `${getWeightFormatted(vehicle)} fits remaining capacity` });
      if (bay === bestBay) {
        lines.push({ type: 'success', text: `Keeps left/right spread to ${res.postPlacementState.imbalance} kg (Best Balance)` });
      } else {
        lines.push({ type: 'warning', text: `Imbalance spread would be ${res.postPlacementState.imbalance} kg` });
      }
    } else {
      if (res.reasons.includes('TOTAL_CAPACITY_EXCEEDED')) {
        lines.push({ type: 'error', text: 'Total deck capacity exceeded' });
      }
      if (res.reasons.includes(`${bay}_BAY_OVER_LIMIT`)) {
        lines.push({ type: 'error', text: `${bay} bay weight limit exceeded` });
      }
      if (res.reasons.includes('IMBALANCE_TOO_HIGH')) {
        lines.push({ type: 'error', text: `Exceeds max allowed imbalance threshold (${ferryConfig.maxImbalance || 1000} kg)` });
      }
    }

    if (vehicle.hazardous && !vehicle.hazardConfirmed) {
      lines.push({ type: 'warning', text: 'Hazardous cargo requires master confirmation' });
    }

    rationale[bay] = lines;
  }

  return {
    recommended: bestBay,
    options,
    rationale,
    minImbalance: bestBay ? minImbalance : null,
  };
}

function getWeightFormatted(vehicle) {
  const w = vehicle.verifiedWeight ?? vehicle.declaredWeight;
  return `${w} kg`;
}
