'use client';

import React, { useState } from 'react';
import { DEFAULT_FERRY } from '../../lib/constants.js';
import { INITIAL_MOCK_CROSSING, INITIAL_MOCK_QUEUE } from '../../lib/mockData.js';
import { getEffectiveWeight } from '../../safety/validateDeck.js';
import MasterHeader from '../../components/master/MasterHeader.js';
import FerryDeck from '../../components/deck/FerryDeck.js';
import QueuePanel from '../../components/master/QueuePanel.js';
import RecommendationPanel from '../../components/master/RecommendationPanel.js';
import WeightVerifyModal from '../../components/master/WeightVerifyModal.js';
import HazardModal from '../../components/master/HazardModal.js';

export default function MasterDashboardPage() {
  const [ferryConfig, setFerryConfig] = useState(DEFAULT_FERRY);
  const [crossing, setCrossing] = useState(INITIAL_MOCK_CROSSING);
  const [queue, setQueue] = useState(INITIAL_MOCK_QUEUE);

  const [selectedVehicleId, setSelectedVehicleId] = useState('veh-22'); // Default selected ready truck #22
  const [verifyModalVehicle, setVerifyModalVehicle] = useState(null);
  const [hazardModalVehicle, setHazardModalVehicle] = useState(null);

  // Filter loaded vehicles on deck vs waiting in queue
  const loadedVehicles = queue.filter(
    (v) => v.status === 'LOADED' || v.status === 'BOARDING'
  );
  const waitingVehicles = queue.filter(
    (v) => v.status === 'WAITING' || v.status === 'READY'
  );

  // Compute live deck totals
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

  // Selected vehicle object
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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      {/* Master Top Header */}
      <MasterHeader
        ferryConfig={ferryConfig}
        currentCrossing={crossing}
        totalWeight={totalWeight}
        imbalance={imbalance}
      />

      {/* Main Control Surface Grid Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Waiting Queue (3/12 cols) */}
        <section className="lg:col-span-3 h-full">
          <QueuePanel
            queueVehicles={waitingVehicles}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={(v) => setSelectedVehicleId(v.id)}
            onMarkNoShow={handleMarkNoShow}
          />
        </section>

        {/* Center Column: Ferry Deck Surface (5/12 cols) */}
        <section className="lg:col-span-5 h-full">
          <FerryDeck
            loadedVehicles={loadedVehicles}
            ferryConfig={ferryConfig}
            onUnloadVehicle={handleUnloadVehicle}
            onSelectDeckVehicle={(v) => setSelectedVehicleId(v.id)}
            selectedVehicleId={selectedVehicleId}
          />
        </section>

        {/* Right Column: Safety Engine Recommendation Panel (4/12 cols) */}
        <section className="lg:col-span-4 h-full">
          <RecommendationPanel
            selectedVehicle={selectedVehicle}
            loadedVehicles={loadedVehicles}
            ferryConfig={ferryConfig}
            onAssignBay={handleAssignBay}
            onOpenVerifyModal={(v) => setVerifyModalVehicle(v)}
            onOpenHazardModal={(v) => setHazardModalVehicle(v)}
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
  );
}
