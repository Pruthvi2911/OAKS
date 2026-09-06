'use client';

import React from 'react';
import { BAYS, VEHICLE_TYPES } from '../../lib/constants.js';
import { getEffectiveWeight } from '../../safety/validateDeck.js';
import { Trash2, ShieldAlert } from 'lucide-react';

export default function FerryDeck({
  loadedVehicles = [],
  ferryConfig,
  recommendedBay = null,
  onUnloadVehicle,
  onSelectDeckVehicle,
  selectedVehicleId = null,
  isViewOnly = false,
}) {
  const bays = [
    { key: BAYS.LEFT, name: 'LEFT BAY', max: ferryConfig?.maxLeftWeight || 4000 },
    { key: BAYS.CENTER, name: 'CENTER BAY', max: ferryConfig?.maxCenterWeight || 3500 },
    { key: BAYS.RIGHT, name: 'RIGHT BAY', max: ferryConfig?.maxRightWeight || 4000 },
  ];

  // Group vehicles by bay
  const vehiclesByBay = {
    [BAYS.LEFT]: loadedVehicles.filter(v => v.bay === BAYS.LEFT),
    [BAYS.CENTER]: loadedVehicles.filter(v => v.bay === BAYS.CENTER),
    [BAYS.RIGHT]: loadedVehicles.filter(v => v.bay === BAYS.RIGHT),
  };

  return (
    <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-5 shadow-xl flex flex-col h-full w-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🚢 FERRY DECK — WHOLE DECK VIEW
          </h2>
          <p className="text-xs text-slate-400">
            Primary operator control surface. Real-time 3-bay loading deck.
          </p>
        </div>
      </div>

      {/* 3 Bays Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
        {bays.map(bay => {
          const bayVehicles = vehiclesByBay[bay.key] || [];
          const currentBayWeight = bayVehicles.reduce(
            (sum, v) => sum + getEffectiveWeight(v),
            0
          );
          const isOverloaded = currentBayWeight > bay.max;
          const isRecommended = recommendedBay === bay.key;
          const weightPercent = Math.min(100, Math.round((currentBayWeight / bay.max) * 100));

          return (
            <div
              key={bay.key}
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                isRecommended
                  ? 'bg-sky-950/40 border-sky-400 ring-2 ring-sky-400/40 shadow-lg shadow-sky-950/50'
                  : isOverloaded
                  ? 'bg-rose-950/30 border-rose-500/50'
                  : 'bg-slate-900/90 border-slate-700/80'
              }`}
            >
              {/* Bay Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-200 tracking-wide">
                      {bay.name}
                    </span>
                    {isRecommended && (
                      <span className="bg-sky-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-bounce">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      isOverloaded ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    {currentBayWeight.toLocaleString()} / {bay.max.toLocaleString()} kg
                  </span>
                </div>

                {/* Bay Capacity Bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3 border border-slate-700">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isOverloaded
                        ? 'bg-rose-500'
                        : weightPercent > 85
                        ? 'bg-amber-500'
                        : 'bg-sky-500'
                    }`}
                    style={{ width: `${weightPercent}%` }}
                  ></div>
                </div>

                {/* Vehicles List in Bay */}
                <div className="space-y-3 min-h-[220px] max-h-[380px] overflow-y-auto overflow-x-hidden pr-1">
                  {bayVehicles.length === 0 ? (
                    <div className="h-44 border-2 border-dashed border-slate-800 rounded-lg flex flex-col items-center justify-center text-slate-500 text-xs gap-1">
                      <span>EMPTY BAY</span>
                      <span className="text-[10px]">No vehicles loaded</span>
                    </div>
                  ) : (
                    bayVehicles.map(veh => {
                      const typeMeta = VEHICLE_TYPES[veh.vehicleType] || VEHICLE_TYPES.CAR;
                      const effWeight = getEffectiveWeight(veh);
                      const isSelected = selectedVehicleId === veh.id;

                      return (
                        <div
                          key={veh.id}
                          onClick={() => onSelectDeckVehicle && onSelectDeckVehicle(veh)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col items-center text-center gap-2 min-w-0 ${
                            isSelected
                              ? 'bg-slate-700 border-sky-400 ring-1 ring-sky-400/50'
                              : 'bg-slate-800/90 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {/* Icon */}
                          <span className="text-3xl leading-none">{typeMeta.icon}</span>

                          {/* Number Plate */}
                          <span className="font-mono font-bold text-xs text-white tracking-wider leading-tight break-all">
                            {veh.checkInCode || veh.id}
                          </span>

                          {/* Priority / Hazard Tags */}
                          <div className="flex flex-col items-center gap-1 w-full">
                            {veh.priority === 'EMERGENCY' && (
                              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-black px-2 py-0.5 rounded w-fit">
                                🚑 EMERGENCY
                              </span>
                            )}
                            {veh.hazardous && (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5 w-fit">
                                <ShieldAlert className="w-2.5 h-2.5" />
                                HAZARD
                              </span>
                            )}
                          </div>

                          {/* Weight */}
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-black text-base text-white">
                              {effWeight.toLocaleString()} kg
                            </span>
                            {veh.verifiedWeight ? (
                              <span className="text-emerald-400 font-semibold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 w-fit">
                                ✓ Verified
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[10px] bg-slate-700/50 px-1.5 py-0.5 rounded w-fit">
                                (Declared)
                              </span>
                            )}
                          </div>

                          {/* Unload Button — full width, prominent */}
                          {!isViewOnly && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUnloadVehicle && onUnloadVehicle(veh.id);
                              }}
                              title="Unload vehicle from deck"
                              className="w-full py-1.5 px-3 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Unload Vehicle
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bay Total Weight Summary Footer */}
              <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-300">
                <span>BAY TOTAL:</span>
                <span className={isOverloaded ? 'text-rose-400 font-bold' : 'text-white'}>
                  {currentBayWeight.toLocaleString()} kg
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
