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
  const maxImbalance = ferryConfig?.maxImbalance || 1000;

  for (const bay of BAY_LIST) {
    const res = options[bay];
    const lines = [];

    if (res.valid) {
      lines.push({ type: 'success', text: `${getWeightFormatted(vehicle)} fits remaining capacity` });
      const imb = res.postPlacementState.imbalance;
      
      if (imb <= maxImbalance) {
        if (bay === bestBay) {
          lines.push({ type: 'success', text: `Keeps left/right spread to ${imb} kg (Best Balance)` });
        } else {
          lines.push({ type: 'success', text: `Left/right spread would be ${imb} kg` });
        }
      } else {
        lines.push({ type: 'warning', text: `⚠ Increases left/right spread to ${imb} kg (Worsens balance)` });
      }
    } else {
      if (res.reasons.includes('TOTAL_CAPACITY_EXCEEDED')) {
        lines.push({ type: 'error', text: 'Total deck capacity exceeded' });
      }
      if (res.reasons.includes(`${bay}_BAY_OVER_LIMIT`)) {
        lines.push({ type: 'error', text: `${bay} bay weight limit exceeded` });
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

/**
 * Scans ALL waiting vehicles across ALL 3 bays and finds the single
 * vehicle+bay combination that produces the minimum left/right imbalance.
 *
 * This removes trial-and-error from the master — the system tells them
 * exactly which vehicle to load next and where.
 *
 * @param {Array} waitingVehicles - Vehicles still in queue (WAITING / READY)
 * @param {Array} loadedVehicles  - Vehicles currently on deck
 * @param {Object} ferryConfig    - Ferry safety constraints
 * @returns {Object|null} { vehicle, bay, resultingImbalance } or null if nothing fits
 */
export function suggestOptimalNextLoad(
  waitingVehicles = [],
  loadedVehicles = [],
  ferryConfig = DEFAULT_FERRY
) {
  let bestCombo = null;
  let minImbalance = Infinity;

  // Prioritise EMERGENCY vehicles first
  const sorted = [...waitingVehicles].sort((a, b) => {
    if (a.priority === 'EMERGENCY' && b.priority !== 'EMERGENCY') return -1;
    if (a.priority !== 'EMERGENCY' && b.priority === 'EMERGENCY') return 1;
    return 0;
  });

  for (const vehicle of sorted) {
    for (const bay of BAY_LIST) {
      const result = evaluatePlacement(vehicle, bay, loadedVehicles, ferryConfig);
      if (result.valid) {
        const imb = result.postPlacementState.imbalance;
        if (imb < minImbalance) {
          minImbalance = imb;
          bestCombo = { vehicle, bay, resultingImbalance: imb };
        }
        // If this is an emergency vehicle and it fits somewhere, recommend it immediately
        if (vehicle.priority === 'EMERGENCY') {
          return { vehicle, bay, resultingImbalance: imb };
        }
      }
    }
  }

  return bestCombo;
}

