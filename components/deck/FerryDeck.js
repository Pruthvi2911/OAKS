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

                {/* Vehicles List in Bay (with overflow-x-hidden) */}
                <div className="space-y-2.5 min-h-[220px] max-h-[380px] overflow-y-auto overflow-x-hidden pr-1">
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
                          className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between min-w-0 ${
                            isSelected
                              ? 'bg-slate-700 border-sky-400 ring-1 ring-sky-400/50'
                              : 'bg-slate-800/90 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-2xl shrink-0">{typeMeta.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-sm text-white truncate">
                                  #{veh.checkInCode?.replace('FERRY-', '') || veh.id}
                                </span>
                                {veh.priority === 'EMERGENCY' && (
                                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0">
                                    PRIORITY
                                  </span>
                                )}
                                {veh.hazardous && (
                                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5 shrink-0">
                                    <ShieldAlert className="w-2.5 h-2.5" />
                                    HAZARD
                                  </span>
                                )}
                              </div>

                              {/* Stacked Verified Badge under weight */}
                              <div className="text-xs text-slate-300 mt-0.5">
                                <div className="font-medium">{effWeight.toLocaleString()} kg</div>
                                <div className="mt-0.5">
                                  {veh.verifiedWeight ? (
                                    <span className="text-emerald-400 font-semibold block text-[10px]">
                                      ✓ Verified
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 italic block text-[10px]">
                                      (Declared)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {!isViewOnly && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUnloadVehicle && onUnloadVehicle(veh.id);
                              }}
                              title="Unload from deck"
                              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors shrink-0 ml-2"
                            >
                              <Trash2 className="w-4 h-4" />
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
