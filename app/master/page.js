'use client';

import React, { useState, useEffect } from 'react';
import { DEFAULT_FERRY } from '../../lib/constants.js';
import { INITIAL_MOCK_CROSSING, INITIAL_MOCK_QUEUE } from '../../lib/mockData.js';
import { getEffectiveWeight } from '../../safety/validateDeck.js';
import { useConnectionStatus } from '../../lib/offline.js';
import MasterHeader from '../../components/master/MasterHeader.js';
import FerryDeck from '../../components/deck/FerryDeck.js';
import QueuePanel from '../../components/master/QueuePanel.js';
import RecommendationPanel from '../../components/master/RecommendationPanel.js';
import WeightVerifyModal from '../../components/master/WeightVerifyModal.js';
import HazardModal from '../../components/master/HazardModal.js';
import MultiMasterGuard, { getMasterSessionId } from '../../components/master/MultiMasterGuard.js';
import CastOffButton from '../../components/master/CastOffButton.js';
import { RefreshCw } from 'lucide-react';

export default function MasterDashboardPage() {
  const connectionState = useConnectionStatus();
  const [ferryConfig, setFerryConfig] = useState(DEFAULT_FERRY);
  const [crossing, setCrossing] = useState(INITIAL_MOCK_CROSSING);
  const [queue, setQueue] = useState(INITIAL_MOCK_QUEUE);

  const [selectedVehicleId, setSelectedVehicleId] = useState('veh-22');
  const [verifyModalVehicle, setVerifyModalVehicle] = useState(null);
  const [hazardModalVehicle, setHazardModalVehicle] = useState(null);

  // Set active master session ID on mount
  useEffect(() => {
    const sid = getMasterSessionId();
    if (!crossing.activeMasterSessionId) {
      setCrossing((prev) => ({ ...prev, activeMasterSessionId: sid }));
    }
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

  // Handlers
  const handleAssignBay = (vehId, targetBay) => {
    setQueue((prev) =>
      prev.map((v) => {
        if (v.id === vehId) {
          return {
            ...v,
            status: 'LOADED',
            bay: targetBay,
            crossingId: crossing.id,
          };
        }
        return v;
      })
    );
  };

  const handleUnloadVehicle = (vehId) => {
    setQueue((prev) =>
      prev.map((v) => {
        if (v.id === vehId) {
          return {
            ...v,
            status: 'WAITING',
            bay: null,
            crossingId: null,
          };
        }
        return v;
      })
    );
  };

  const handleSaveVerifiedWeight = (vehId, verifiedWeightKg) => {
    setQueue((prev) =>
      prev.map((v) => {
        if (v.id === vehId) {
          return {
            ...v,
            verifiedWeight: Number(verifiedWeightKg),
          };
        }
        return v;
      })
    );
  };

  const handleConfirmHazard = (vehId) => {
    setQueue((prev) =>
      prev.map((v) => {
        if (v.id === vehId) {
          return {
            ...v,
            hazardConfirmed: true,
          };
        }
        return v;
      })
    );
  };

  const handleMarkNoShow = (vehId) => {
    setQueue((prev) =>
      prev.map((v) => {
        if (v.id === vehId) {
          return {
            ...v,
            status: 'NO_SHOW',
            bay: null,
          };
        }
        return v;
      })
    );
    if (selectedVehicleId === vehId) {
      setSelectedVehicleId(null);
    }
  };

  // Complete crossing & promote next queue run
  const handleCastOff = () => {
    const currentRunNumber = parseInt(crossing.id.replace('crossing-', '')) || 42;
    const nextCrossingId = `crossing-${currentRunNumber + 1}`;

    // Mark loaded deck vehicles as COMPLETED
    setQueue((prev) =>
      prev.map((v) => {
        if (v.status === 'LOADED' || v.status === 'BOARDING') {
          return {
            ...v,
            status: 'COMPLETED',
          };
        }
        return v;
      })
    );

    // Create new active crossing
    setCrossing({
      id: nextCrossingId,
      ferryId: ferryConfig.id,
      status: 'LOADING',
      activeMasterSessionId: getMasterSessionId(),
      createdAt: new Date().toISOString(),
      castOffAt: null,
      completedAt: null,
    });

    setSelectedVehicleId(null);
  };

  const handleResetData = () => {
    setQueue(INITIAL_MOCK_QUEUE);
    setCrossing(INITIAL_MOCK_CROSSING);
    setSelectedVehicleId('veh-22');
  };

  return (
    <MultiMasterGuard
      activeMasterSessionId={crossing.activeMasterSessionId}
      onClaimMasterRole={(sessionId) =>
        setCrossing((prev) => ({ ...prev, activeMasterSessionId: sessionId }))
      }
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
              <span>ACTIVE SESSION: <strong className="text-slate-200">{getMasterSessionId()}</strong></span>
              {isViewOnly ? (
                <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold border border-amber-500/30">
                  VIEW ONLY
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                  ACTIVE MASTER
                </span>
              )}
            </div>

            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-white flex items-center gap-1.5 hover:bg-slate-800 px-2.5 py-1 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Seed Data
            </button>
          </div>

          {/* Main Control Surface Grid Layout (Full Screen Width Adaptation) */}
          <main className="flex-1 w-full p-4 md:p-6 space-y-6">
            
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
