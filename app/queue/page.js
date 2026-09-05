'use client';

import React, { useState, useEffect } from 'react';
import { DEFAULT_FERRY, VEHICLE_TYPES, PRIORITY_LEVELS } from '../../lib/constants.js';
import { INITIAL_MOCK_CROSSING } from '../../lib/mockData.js';
import { getEffectiveWeight } from '../../safety/validateDeck.js';
import { calculateDynamicQueuePosition } from '../../utils/queueSorting.js';
import { subscribeToQueue, subscribeToActiveCrossing } from '../../lib/sync.js';
import { Anchor, Clock, Siren, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function PublicQueuePage() {
  const [queue, setQueue] = useState([]);
  const [crossing, setCrossing] = useState(INITIAL_MOCK_CROSSING);

  // Subscribe to live Firestore queue & crossing updates
  useEffect(() => {
    const unsubQueue = subscribeToQueue(setQueue);
    const unsubCrossing = subscribeToActiveCrossing((activeCrossing) => {
      if (activeCrossing) setCrossing(activeCrossing);
    });
    return () => {
      unsubQueue();
      unsubCrossing();
    };
  }, []);

  // Compute active deck weight
  const loadedVehicles = queue.filter((v) => v.status === 'LOADED' || v.status === 'BOARDING');
  const deckWeight = loadedVehicles.reduce((sum, v) => sum + getEffectiveWeight(v), 0);
  const maxWeight = DEFAULT_FERRY.maxWeight;

  // Filter and sort active queue entries
  const activeQueue = queue.filter((v) => v.status !== 'COMPLETED' && v.status !== 'NO_SHOW');
  activeQueue.sort((a, b) => {
    if (a.status === 'LOADED' && b.status !== 'LOADED') return -1;
    if (a.status !== 'LOADED' && b.status === 'LOADED') return 1;
    if (a.priority === PRIORITY_LEVELS.EMERGENCY && b.priority !== PRIORITY_LEVELS.EMERGENCY) return -1;
    if (a.priority !== PRIORITY_LEVELS.EMERGENCY && b.priority === PRIORITY_LEVELS.EMERGENCY) return 1;
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans p-4 md:p-8">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        
        {/* Terminal Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-sky-500/10 p-3 rounded-xl border border-sky-500/20 text-sky-400">
              <Anchor className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                RIVER FERRY TERMINAL QUEUE
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Live Boarding Status Board — Crossing #{crossing.id.replace('crossing-', '')}
              </p>
            </div>
          </div>

          <div className="bg-slate-950 px-5 py-3 rounded-xl border border-slate-800 text-center min-w-[200px]">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              NEXT FERRY CAPACITY
            </div>
            <div className="text-xl font-black text-sky-400 font-mono mt-0.5">
              {deckWeight.toLocaleString()} / {maxWeight.toLocaleString()} kg
            </div>
          </div>
        </div>

        {/* Public Queue Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>ACTIVE BOARDING QUEUE</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Clock className="w-3.5 h-3.5" />
              Est. Departure: ~15 mins
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {activeQueue.map((veh, index) => {
              const typeMeta = VEHICLE_TYPES[veh.vehicleType] || VEHICLE_TYPES.CAR;
              const effWeight = getEffectiveWeight(veh);
              const isEmergency = veh.priority === PRIORITY_LEVELS.EMERGENCY;
              const isLoaded = veh.status === 'LOADED';

              return (
                <div
                  key={veh.id}
                  className={`p-4 flex items-center justify-between transition-colors ${
                    isLoaded
                      ? 'bg-emerald-950/20'
                      : isEmergency
                      ? 'bg-rose-950/20'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-base font-black text-slate-400 w-8 text-center">
                      #{index + 1}
                    </span>

                    <span className="text-3xl">{typeMeta.icon}</span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-white">
                          #{veh.checkInCode}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          ({veh.vehicleType})
                        </span>
                        {isEmergency && (
                          <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Siren className="w-3 h-3" />
                            PRIORITY
                          </span>
                        )}
                        {veh.hazardous && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            HAZARD
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 mt-1">
                        Weight: <strong className="text-slate-200">{effWeight.toLocaleString()} kg</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`text-xs font-black px-3 py-1.5 rounded-xl border ${
                        isLoaded
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : isEmergency
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {isLoaded ? 'BOARDING / LOADED' : veh.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
