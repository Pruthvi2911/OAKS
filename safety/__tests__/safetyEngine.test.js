import { evaluatePlacement } from '../validateDeck.js';
import { suggestPlacement } from '../suggestPlacement.js';
import { DEFAULT_FERRY, BAYS, SAFETY_REASONS } from '../../lib/constants.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASSED: ${testName}`);
    passed++;
  } else {
    console.error(`  ✕ FAILED: ${testName}`);
    failed++;
  }
}

console.log('====================================================');
console.log('   RURAL FERRY BOARDING TOOL — SAFETY ENGINE TESTS');
console.log('====================================================\n');

// --- Test Case 1: Empty Deck Placement ---
console.log('Test Suite 1: Empty Deck Placement');
const car1 = { id: 'c1', declaredWeight: 1500, verifiedWeight: null };
const res1 = evaluatePlacement(car1, BAYS.CENTER, [], DEFAULT_FERRY);
assert(res1.valid === true, 'Car fits in empty CENTER bay');
assert(res1.postPlacementState.totalWeight === 1500, 'Total weight is 1500 kg');
assert(res1.postPlacementState.imbalance === 0, 'Initial left/right imbalance is 0 kg for CENTER placement');

// --- Test Case 2: Verified Weight Wins over Declared Weight ---
console.log('\nTest Suite 2: Weight Verification Precedence');
const truckVerified = { id: 't1', declaredWeight: 2800, verifiedWeight: 3400 };
const res2 = evaluatePlacement(truckVerified, BAYS.LEFT, [], DEFAULT_FERRY);
assert(res2.postPlacementState.leftWeight === 3400, 'Effective weight uses verified weight (3400 kg)');

// --- Test Case 3: Bay Weight Overload ---
console.log('\nTest Suite 3: Bay Weight Limits');
const heavyTruck = { id: 'ht1', declaredWeight: 4500, verifiedWeight: 4500 };
const res3Left = evaluatePlacement(heavyTruck, BAYS.LEFT, [], DEFAULT_FERRY); // Max Left is 4000
assert(res3Left.valid === false, 'Rejects placement over Left Bay 4,000 kg limit');
assert(res3Left.reasons.includes(SAFETY_REASONS.LEFT_BAY_OVER_LIMIT), 'Contains LEFT_BAY_OVER_LIMIT reason');

const res3Center = evaluatePlacement(heavyTruck, BAYS.CENTER, [], DEFAULT_FERRY); // Max Center is 3500
assert(res3Center.valid === false, 'Rejects placement over Center Bay 3,500 kg limit');
assert(res3Center.reasons.includes(SAFETY_REASONS.CENTER_BAY_OVER_LIMIT), 'Contains CENTER_BAY_OVER_LIMIT reason');

// --- Test Case 4: Total Deck Overload ---
console.log('\nTest Suite 4: Total Capacity Exceeded');
const currentVehiclesFull = [
  { id: 'v1', bay: BAYS.LEFT, declaredWeight: 3800, verifiedWeight: 3800 },
  { id: 'v2', bay: BAYS.CENTER, declaredWeight: 3200, verifiedWeight: 3200 },
  { id: 'v3', bay: BAYS.RIGHT, declaredWeight: 2500, verifiedWeight: 2500 }, // Total = 9,500 kg
];
const extraCar = { id: 'c2', declaredWeight: 1000, verifiedWeight: 1000 };
const res4 = evaluatePlacement(extraCar, BAYS.RIGHT, currentVehiclesFull, DEFAULT_FERRY);
assert(res4.valid === false, 'Rejects placement when total capacity (10,000 kg) is exceeded');
assert(res4.reasons.includes(SAFETY_REASONS.TOTAL_CAPACITY_EXCEEDED), 'Contains TOTAL_CAPACITY_EXCEEDED reason');

// --- Test Case 5: Imbalance Threshold Enforcement ---
console.log('\nTest Suite 5: Maximum Imbalance Constraint (1,000 kg limit)');
const imbalancedVehicles = [
  { id: 'v1', bay: BAYS.LEFT, declaredWeight: 3400, verifiedWeight: 3400 },
  { id: 'v2', bay: BAYS.CENTER, declaredWeight: 2000, verifiedWeight: 2000 },
  { id: 'v3', bay: BAYS.RIGHT, declaredWeight: 1500, verifiedWeight: 1500 },
];
// Left = 3400, Center = 2000, Right = 1500. Current Imbalance = 1900. Max Imbalance allowed = 1000.
const addingToLeft = { id: 'c3', declaredWeight: 1000, verifiedWeight: 1000 };
const res5 = evaluatePlacement(addingToLeft, BAYS.LEFT, imbalancedVehicles, DEFAULT_FERRY);
assert(res5.valid === false, 'Rejects adding to LEFT bay when imbalance exceeds 1,000 kg');
assert(res5.reasons.includes(SAFETY_REASONS.IMBALANCE_TOO_HIGH), 'Contains IMBALANCE_TOO_HIGH reason');

// --- Test Case 6: Recommendation Scoring & Best Bay Selection ---
console.log('\nTest Suite 6: Suggest Placement Rationale & Scoring');
const deckForSuggestion = [
  { id: 'v1', bay: BAYS.LEFT, declaredWeight: 3400, verifiedWeight: 3400 },
  { id: 'v2', bay: BAYS.CENTER, declaredWeight: 1700, verifiedWeight: 1700 },
  { id: 'v3', bay: BAYS.RIGHT, declaredWeight: 2100, verifiedWeight: 2100 },
];
// Left = 3400, Center = 1700, Right = 2100.
// Candidate car = 1500 kg.
// If placed on LEFT: Left = 4900 (EXCEEDS LIMIT 4000). Invalid.
// If placed on CENTER: Center = 3200. Left=3400, Center=3200, Right=2100. Imbalance = 3400 - 2100 = 1300 kg (EXCEEDS IMBALANCE 1000). Invalid.
// If placed on RIGHT: Right = 3600. Left=3400, Center=1700, Right=3600. Imbalance = 3600 - 1700 = 1900 kg.
// Candidate van = 1000 kg.
const candidateVan = { id: 'van1', declaredWeight: 1000, verifiedWeight: 1000 };
const suggestions = suggestPlacement(candidateVan, deckForSuggestion, DEFAULT_FERRY);
assert(suggestions.options.LEFT.valid === false, 'LEFT bay correctly marked invalid (Left > 4000 kg)');
assert(suggestions.recommended !== null, 'Suggests a safe valid placement');

// --- Test Case 7: Ambulance Priority Safety Constraint ---
console.log('\nTest Suite 7: Emergency Vehicle Safety Boundary');
const ambulance = { id: 'amb1', priority: 'EMERGENCY', declaredWeight: 2600, verifiedWeight: 2600 };
const fullDeckForAmb = [
  { id: 'v1', bay: BAYS.LEFT, declaredWeight: 3800, verifiedWeight: 3800 },
  { id: 'v2', bay: BAYS.CENTER, declaredWeight: 3400, verifiedWeight: 3400 },
  { id: 'v3', bay: BAYS.RIGHT, declaredWeight: 2500, verifiedWeight: 2500 },
]; // Total = 9700. Ambulance 2600 makes total = 12300 > 10000.
const ambSuggestion = suggestPlacement(ambulance, fullDeckForAmb, DEFAULT_FERRY);
assert(ambSuggestion.recommended === null, 'Ambulance is NOT recommended when deck is unsafe (No safety bypass)');

console.log('\n====================================================');
console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
