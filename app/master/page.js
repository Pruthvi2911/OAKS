'use client';

import React, { useState, useEffect } from 'react';
import { DEFAULT_FERRY } from '../../lib/constants.js';
import { INITIAL_MOCK_CROSSING } from '../../lib/mockData.js';
import { getEffectiveWeight } from '../../safety/validateDeck.js';
import { useConnectionStatus } from '../../lib/offline.js';
import {
  subscribeToFerryConfig,
  subscribeToActiveCrossing,
  subscribeToQueue,
} from '../../lib/sync.js';
import {
  seedInitialDatabase,
  assignVehicleToBay,
  unloadVehicleFromDeck,
  updateVerifiedWeight,
  confirmHazardousCargo,
  markVehicleNoShow,
  updateQueueEntry,
} from '../../lib/queue.js';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase.js';
import MasterHeader from '../../components/master/MasterHeader.js';
import FerryDeck from '../../components/deck/FerryDeck.js';
import QueuePanel from '../../components/master/QueuePanel.js';
import RecommendationPanel from '../../components/master/RecommendationPanel.js';
import WeightVerifyModal from '../../components/master/WeightVerifyModal.js';
import HazardModal from '../../components/master/HazardModal.js';
import MultiMasterGuard, { getMasterSessionId } from '../../components/master/MultiMasterGuard.js';
import CastOffButton from '../../components/master/CastOffButton.js';
import { suggestOptimalNextLoad } from '../../safety/suggestPlacement.js';
import { VEHICLE_TYPES } from '../../lib/constants.js';
import { RefreshCw, Zap } from 'lucide-react';

export default function MasterDashboardPage() {
  const connectionState = useConnectionStatus();
  const [ferryConfig, setFerryConfig] = useState(DEFAULT_FERRY);
  const [crossing, setCrossing] = useState(INITIAL_MOCK_CROSSING);
  const [queue, setQueue] = useState([]);
  const [isSeeding, setIsSeeding] = useState(false);

  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [verifyModalVehicle, setVerifyModalVehicle] = useState(null);
  const [hazardModalVehicle, setHazardModalVehicle] = useState(null);
  const [sessionId, setSessionId] = useState('');

  // Set active master session ID on mount (client side only)
  useEffect(() => {
    const sid = getMasterSessionId();
    setSessionId(sid);
  }, []);

  // Wire up Firestore realtime listeners on mount
  useEffect(() => {
    // Seed Firestore with initial data (idempotent — won't overwrite existing docs)
    const init = async () => {
      setIsSeeding(true);
      await seedInitialDatabase();
      setIsSeeding(false);
    };
    init();

    const unsubFerry = subscribeToFerryConfig(DEFAULT_FERRY.id, setFerryConfig);
    const unsubCrossing = subscribeToActiveCrossing((activeCrossing) => {
      if (activeCrossing) setCrossing(activeCrossing);
    });
    const unsubQueue = subscribeToQueue(setQueue);

    return () => {
      unsubFerry();
      unsubCrossing();
      unsubQueue();
    };
  }, []);

  // Filter vehicles on deck vs waiting queue
  const loadedVehicles = queue.filter(
    (v) => v.status === 'LOADED' || v.status === 'BOARDING'
  );
  const waitingVehicles = queue.filter(
    (v) => v.status === 'WAITING' || v.status === 'READY'
  );

  // Compute live deck weight totals
  let leftWeight = 0;
  let centerWeight = 0;
  let rightWeight = 0;

  for (const v of loadedVehicles) {
    const w = getEffectiveWeight(v);
    if (v.bay === 'LEFT') leftWeight += w;
    else if (v.bay === 'CENTER') centerWeight += w;
    else if (v.bay === 'RIGHT') rightWeight += w;
  }

  const totalWeight = leftWeight + centerWeight + rightWeight;
  const imbalance = Math.abs(leftWeight - rightWeight);

  const selectedVehicle = queue.find((v) => v.id === selectedVehicleId) || null;

  // --- All mutations now write to Firestore; onSnapshot propagates changes back to state ---

  const handleAssignBay = async (vehId, targetBay) => {
    await assignVehicleToBay(vehId, targetBay, crossing.id);
  };

  const handleUnloadVehicle = async (vehId) => {
    await unloadVehicleFromDeck(vehId);
  };

  const handleSaveVerifiedWeight = async (vehId, verifiedWeightKg) => {
    await updateVerifiedWeight(vehId, verifiedWeightKg);
  };

  const handleConfirmHazard = async (vehId) => {
    await confirmHazardousCargo(vehId);
  };

  const handleMarkNoShow = async (vehId) => {
    await markVehicleNoShow(vehId);
    if (selectedVehicleId === vehId) setSelectedVehicleId(null);
  };

  // Complete crossing & open next run in Firestore
  const handleCastOff = async () => {
    const currentRunNumber = parseInt(crossing.id.replace('crossing-', '')) || 42;
    const nextCrossingId = `crossing-${currentRunNumber + 1}`;

    // Mark all on-deck vehicles COMPLETED
    const markPromises = loadedVehicles.map((v) =>
      updateQueueEntry(v.id, { status: 'COMPLETED', bay: null })
    );
    await Promise.all(markPromises);

    // Create next crossing document — listener will update crossing state automatically
    try {
      await setDoc(doc(db, 'crossings', nextCrossingId), {
        id: nextCrossingId,
        ferryId: ferryConfig.id,
        status: 'LOADING',
        activeMasterSessionId: getMasterSessionId(),
        createdAt: new Date().toISOString(),
        castOffAt: null,
        completedAt: null,
      });
    } catch (err) {
      console.warn('Cast off crossing write warning:', err.message);
    }

    setSelectedVehicleId(null);
  };

  const handleResetData = async () => {
    setIsSeeding(true);
    await seedInitialDatabase();
    setIsSeeding(false);
    setSelectedVehicleId(null);
  };

  return (
    <MultiMasterGuard
      activeMasterSessionId={crossing.activeMasterSessionId}
      onClaimMasterRole={(sid) => {
        setCrossing((prev) => ({ ...prev, activeMasterSessionId: sid }));
        setSessionId(sid);
      }}
    >
      {({ isViewOnly }) => (
        <div className="min-h-screen bg-slate-950 flex flex-col font-sans w-full">
          
          {/* Master Top Header */}
          <MasterHeader
            ferryConfig={ferryConfig}
            currentCrossing={crossing}
            totalWeight={totalWeight}
            imbalance={imbalance}
            connectionState={connectionState}
          />

          {/* Quick Action Toolbar */}
          <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-2 flex items-center justify-between text-xs w-full">
            <div className="flex items-center gap-2 text-slate-400 font-medium">
              <span>
                ACTIVE SESSION:{' '}
                <strong className="text-slate-200" suppressHydrationWarning>
                  {sessionId || 'initializing...'}
                </strong>
              </span>
              {isViewOnly ? (
                <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">
                  VIEW ONLY
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                  ACTIVE MASTER
                </span>
              )}
              {isSeeding && (
                <span className="text-sky-400 animate-pulse ml-3">● Syncing Firestore…</span>
              )}
            </div>

            <button
              onClick={handleResetData}
              disabled={isSeeding}
              className="text-slate-400 hover:text-white flex items-center gap-1.5 hover:bg-slate-800 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Seed Data
            </button>
          </div>

          {/* Main Control Surface Grid Layout */}
          <main className="flex-1 w-full p-4 md:p-6 space-y-4">

            {/* ── Smart Load Suggestion Banner ── */}
            {(() => {
              if (isViewOnly) return null;
              const suggestion = suggestOptimalNextLoad(waitingVehicles, loadedVehicles, ferryConfig);
              if (!suggestion) {
                return waitingVehicles.length === 0 ? null : (
                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 flex items-center gap-3 text-xs text-slate-400">
                    <Zap className="w-4 h-4 text-slate-500 shrink-0" />
                    No safe placement found for any waiting vehicle — deck is at or near capacity.
                  </div>
                );
              }
              const typeMeta = VEHICLE_TYPES[suggestion.vehicle.vehicleType] || VEHICLE_TYPES.CAR;
              const isEmergency = suggestion.vehicle.priority === 'EMERGENCY';
              return (
                <div className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-4 ${
                  isEmergency
                    ? 'bg-rose-950/30 border-rose-500/50'
                    : 'bg-sky-950/30 border-sky-500/40'
                }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Zap className={`w-4 h-4 shrink-0 ${isEmergency ? 'text-rose-400' : 'text-sky-400'}`} />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {isEmergency ? '🚑 EMERGENCY — ' : ''}Best Next Load
                      </div>
                      <div className="text-xs font-bold text-white truncate">
                        {typeMeta.icon} {suggestion.vehicle.checkInCode} — Load into{' '}
                        <span className={`font-black ${isEmergency ? 'text-rose-300' : 'text-sky-300'}`}>
                          {suggestion.bay} BAY
                        </span>
                        <span className="text-slate-400 font-normal ml-2">
                          → {suggestion.resultingImbalance} kg spread
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAssignBay(suggestion.vehicle.id, suggestion.bay)}
                    className={`shrink-0 px-4 py-2 rounded-lg font-black text-xs transition-all ${
                      isEmergency
                        ? 'bg-rose-500 hover:bg-rose-400 text-white'
                        : 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                    }`}
                  >
                    Load Now →
                  </button>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
              {/* Left Column: Waiting Queue (3/12 cols) */}
              <section className="lg:col-span-3 h-full w-full">
                <QueuePanel
                  queueVehicles={waitingVehicles}
                  selectedVehicleId={selectedVehicleId}
                  onSelectVehicle={(v) => setSelectedVehicleId(v.id)}
                  onMarkNoShow={handleMarkNoShow}
                  isViewOnly={isViewOnly}
                />
              </section>

              {/* Center Column: Ferry Deck Surface (5/12 cols) */}
              <section className="lg:col-span-5 h-full w-full">
                <FerryDeck
                  loadedVehicles={loadedVehicles}
                  ferryConfig={ferryConfig}
                  onUnloadVehicle={handleUnloadVehicle}
                  onSelectDeckVehicle={(v) => setSelectedVehicleId(v.id)}
                  selectedVehicleId={selectedVehicleId}
                  isViewOnly={isViewOnly}
                />
              </section>

              {/* Right Column: Safety Engine Recommendation Panel (4/12 cols) */}
              <section className="lg:col-span-4 h-full w-full">
                <RecommendationPanel
                  selectedVehicle={selectedVehicle}
                  loadedVehicles={loadedVehicles}
                  ferryConfig={ferryConfig}
                  onAssignBay={handleAssignBay}
                  onOpenVerifyModal={(v) => setVerifyModalVehicle(v)}
                  onOpenHazardModal={(v) => setHazardModalVehicle(v)}
                  isViewOnly={isViewOnly}
                />
              </section>
            </div>

            {/* Bottom Pre-Departure Cast Off Section */}
            <section className="w-full">
              <CastOffButton
                totalWeight={totalWeight}
                imbalance={imbalance}
                ferryConfig={ferryConfig}
                loadedVehicles={loadedVehicles}
                isOffline={!connectionState.isOnline}
                isViewOnly={isViewOnly}
                onCastOff={handleCastOff}
              />
            </section>

          </main>

          {/* Modals */}
          {verifyModalVehicle && (
            <WeightVerifyModal
              vehicle={verifyModalVehicle}
              onClose={() => setVerifyModalVehicle(null)}
              onSave={handleSaveVerifiedWeight}
            />
          )}

          {hazardModalVehicle && (
            <HazardModal
              vehicle={hazardModalVehicle}
              onClose={() => setHazardModalVehicle(null)}
              onConfirm={handleConfirmHazard}
            />
          )}
        </div>
      )}
    </MultiMasterGuard>
  );
}
