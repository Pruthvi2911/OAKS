'use client';

import React from 'react';
import { VEHICLE_TYPES, PRIORITY_LEVELS } from '../../lib/constants.js';
import { getEffectiveWeight } from '../../safety/validateDeck.js';
import { ShieldAlert, Siren, Clock } from 'lucide-react';

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
    <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-xl flex flex-col h-full w-full">
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

      {/* Queue List Container with overflow-x-hidden */}
      <div className="flex flex-col gap-3 p-1 flex-1 overflow-y-auto overflow-x-hidden max-h-[560px]">
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
                className={`flex items-center justify-between p-3.5 rounded-xl border relative transition-all cursor-pointer min-w-0 ${
                  isSelected
                    ? 'bg-sky-950/60 border-sky-400 ring-2 ring-sky-400/40 shadow-lg'
                    : isEmergency
                    ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400'
                    : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {/* Left Section: Queue # + Icon + Info Stack */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span className="text-2xl">{typeMeta.icon}</span>
                    <span className="text-[10px] font-black text-slate-500">#{index + 1}</span>
                  </div>

                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    {/* Priority / Hazard tags */}
                    {(isEmergency || veh.hazardous) && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {isEmergency && (
                          <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap flex items-center gap-1 animate-pulse">
                            <Siren className="w-3 h-3" />
                            PRIORITY
                          </span>
                        )}
                        {veh.hazardous && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            HAZARD
                          </span>
                        )}
                      </div>
                    )}

                    {/* Number plate — monospace, no truncation, wraps naturally */}
                    <span className="font-mono font-bold text-sm text-white leading-tight break-all">
                      {veh.checkInCode || veh.id}
                    </span>

                    {/* Weight row */}
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-slate-200">
                        {effWeight.toLocaleString()} kg
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                        {veh.verifiedWeight ? '✓ Verified' : 'Declared'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section: Vertical Action Column */}
                <div className="border-l border-white/10 pl-3 ml-2 flex flex-col gap-2 shrink-0 items-start">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectVehicle && onSelectVehicle(veh);
                    }}
                    className={`text-xs font-bold text-left w-full transition-colors ${
                      isSelected ? 'text-sky-400 font-extrabold' : 'text-slate-300 hover:text-sky-400'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>

                  {!isViewOnly && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkNoShow && onMarkNoShow(veh.id);
                      }}
                      className="text-xs text-slate-400 hover:text-amber-400 text-left w-full transition-colors font-medium"
                    >
                      No-Show
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
