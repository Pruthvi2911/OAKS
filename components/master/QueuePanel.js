'use client';

import React from 'react';
import { VEHICLE_TYPES, PRIORITY_LEVELS } from '../../lib/constants.js';
import { getEffectiveWeight } from '../../safety/validateDeck.js';
import { AlertCircle, ShieldAlert, Siren, Clock, UserCheck } from 'lucide-react';

export default function QueuePanel({
  queueVehicles = [],
  selectedVehicleId = null,
  onSelectVehicle,
  onMarkNoShow,
  isViewOnly = false,
}) {
  // Sort queue dynamically: EMERGENCY priority first, then by createdAt
  const sortedQueue = [...queueVehicles].sort((a, b) => {
    if (a.priority === PRIORITY_LEVELS.EMERGENCY && b.priority !== PRIORITY_LEVELS.EMERGENCY) {
      return -1;
    }
    if (a.priority !== PRIORITY_LEVELS.EMERGENCY && b.priority === PRIORITY_LEVELS.EMERGENCY) {
      return 1;
    }
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });

  return (
    <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            📋 WAITING STAGING QUEUE
          </h2>
          <p className="text-xs text-slate-400">
            {sortedQueue.length} vehicles waiting to board
          </p>
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[520px] pr-1">
        {sortedQueue.length === 0 ? (
          <div className="h-48 border border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs gap-2">
            <Clock className="w-6 h-6 text-slate-500" />
            <span>NO VEHICLES WAITING IN QUEUE</span>
          </div>
        ) : (
          sortedQueue.map((veh, index) => {
            const typeMeta = VEHICLE_TYPES[veh.vehicleType] || VEHICLE_TYPES.CAR;
            const effWeight = getEffectiveWeight(veh);
            const isSelected = selectedVehicleId === veh.id;
            const isEmergency = veh.priority === PRIORITY_LEVELS.EMERGENCY;

            return (
              <div
                key={veh.id}
                onClick={() => onSelectVehicle && onSelectVehicle(veh)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-sky-950/60 border-sky-400 ring-2 ring-sky-400/40 shadow-lg'
                    : isEmergency
                    ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400'
                    : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Queue position index */}
                    <span className="text-xs font-black text-slate-400 w-5 text-center">
                      #{index + 1}
                    </span>

                    {/* Icon */}
                    <span className="text-2xl">{typeMeta.icon}</span>

                    {/* Vehicle Details */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          #{veh.checkInCode?.replace('FERRY-', '') || veh.id}
                        </span>
                        {isEmergency && (
                          <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
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

                      <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                        <span className="font-semibold text-slate-200">
                          {effWeight.toLocaleString()} kg
                        </span>
                        {veh.verifiedWeight ? (
                          <span className="text-emerald-400 font-bold text-[11px]">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">
                            Declared
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions / Status */}
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <span className="bg-sky-500 text-slate-950 text-[11px] font-bold px-2 py-1 rounded-lg">
                        SELECTED
                      </span>
                    )}

                    {!isViewOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkNoShow && onMarkNoShow(veh.id);
                        }}
                        title="Mark No-Show"
                        className="text-slate-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-amber-500/10 text-xs font-semibold"
                      >
                        No-Show
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
