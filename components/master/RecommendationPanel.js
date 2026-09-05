'use client';

import React from 'react';
import { suggestPlacement } from '../../safety/suggestPlacement.js';
import { getEffectiveWeight } from '../../safety/validateDeck.js';
import { VEHICLE_TYPES, BAYS } from '../../lib/constants.js';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Scale, ArrowRight, ShieldAlert } from 'lucide-react';

export default function RecommendationPanel({
  selectedVehicle,
  loadedVehicles = [],
  ferryConfig,
  onAssignBay,
  onOpenVerifyModal,
  onOpenHazardModal,
  isViewOnly = false,
}) {
  if (!selectedVehicle) {
    return (
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-6 shadow-xl text-center flex flex-col items-center justify-center min-h-[320px]">
        <div className="bg-slate-700/50 p-4 rounded-full text-slate-400 mb-3 border border-slate-600">
          <Scale className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">RECOMMENDATION ENGINE</h3>
        <p className="text-xs text-slate-400 max-w-xs">
          Select any vehicle from the waiting queue to evaluate 3-bay deck safety and view placement rationale.
        </p>
      </div>
    );
  }

  // Calculate safety recommendations for selected vehicle across all 3 bays
  const evaluation = suggestPlacement(selectedVehicle, loadedVehicles, ferryConfig);
  const typeMeta = VEHICLE_TYPES[selectedVehicle.vehicleType] || VEHICLE_TYPES.CAR;
  const effWeight = getEffectiveWeight(selectedVehicle);
  const isEmergency = selectedVehicle.priority === 'EMERGENCY';

  return (
    <div className="bg-slate-800/90 rounded-2xl border border-slate-700 p-5 shadow-xl flex flex-col h-full">
      {/* Selected Vehicle Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-700 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{typeMeta.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-white">
                {typeMeta.label.toUpperCase()} #{selectedVehicle.checkInCode?.replace('FERRY-', '') || selectedVehicle.id}
              </h3>
              {isEmergency && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  EMERGENCY
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300 mt-1">
              <span>
                Weight: <strong className="text-white">{effWeight.toLocaleString()} kg</strong>
              </span>
              {selectedVehicle.verifiedWeight ? (
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ✓ Verified by Master
                </span>
              ) : (
                <span className="text-slate-400 bg-slate-700/60 px-2 py-0.5 rounded border border-slate-600">
                  (Declared by Driver)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Weight & Hazard Quick Actions */}
        {!isViewOnly && (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onOpenVerifyModal && onOpenVerifyModal(selectedVehicle)}
              className="text-xs font-semibold text-sky-400 hover:text-white bg-sky-500/10 hover:bg-sky-500 px-3 py-1.5 rounded-lg border border-sky-500/30 transition-all flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5" />
              {selectedVehicle.verifiedWeight ? 'Adjust Weight' : 'Verify Weight'}
            </button>

            {selectedVehicle.hazardous && (
              <button
                onClick={() => onOpenHazardModal && onOpenHazardModal(selectedVehicle)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                  selectedVehicle.hazardConfirmed
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                {selectedVehicle.hazardConfirmed ? '✓ Hazard Confirmed' : 'Confirm Hazard'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Emergency Safety Alert if No Safe Placement */}
      {isEmergency && !evaluation.recommended && (
        <div className="bg-rose-950/50 border-2 border-rose-500/60 rounded-xl p-3.5 mb-4 text-xs text-rose-200">
          <div className="flex items-center gap-2 font-bold text-rose-300 mb-1">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            🚑 EMERGENCY VEHICLE — NO SAFE PLACEMENT
          </div>
          <p>
            Adding this vehicle to the current deck load would violate safety bounds (capacity or balance limit).
            Priority changes queue order, not safety constraints.
          </p>
        </div>
      )}

      {/* Recommended Placement Summary */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Safety Engine Recommendation
        </div>
        <div className="flex items-center justify-between bg-slate-900/90 p-3.5 rounded-xl border border-slate-700">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">RECOMMENDED:</span>
            {evaluation.recommended ? (
              <span className="bg-emerald-500 text-slate-950 font-black text-sm px-3 py-1 rounded-lg">
                {evaluation.recommended} BAY
              </span>
            ) : (
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-xs px-2.5 py-1 rounded-lg">
                NO SAFE BAY AVAILABLE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3-Bay Rationale Breakdown */}
      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Placement Rationale by Bay
        </div>

        {[BAYS.LEFT, BAYS.CENTER, BAYS.RIGHT].map(bay => {
          const opt = evaluation.options[bay];
          const lines = evaluation.rationale[bay] || [];
          const isRec = evaluation.recommended === bay;
          const isValid = opt?.valid;

          return (
            <div
              key={bay}
              className={`p-3.5 rounded-xl border transition-all ${
                isRec
                  ? 'bg-emerald-950/20 border-emerald-500/50'
                  : isValid
                  ? 'bg-slate-900/60 border-slate-700/80'
                  : 'bg-rose-950/10 border-rose-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white tracking-wide">
                    {bay} BAY
                  </span>
                  {isRec && (
                    <span className="bg-emerald-400 text-slate-950 text-[9px] font-extrabold px-2 py-0.5 rounded">
                      BEST BALANCE
                    </span>
                  )}
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isValid
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {isValid ? 'VALID' : 'INVALID'}
                </span>
              </div>

              {/* Rationale Bullet Lines */}
              <div className="space-y-1 text-xs">
                {lines.map((line, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    {line.type === 'success' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    {line.type === 'warning' && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    {line.type === 'error' && (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <span className={
                      line.type === 'success'
                        ? 'text-emerald-300'
                        : line.type === 'warning'
                        ? 'text-amber-300'
                        : 'text-rose-300'
                    }>
                      {line.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button to Load into Bay */}
              {!isViewOnly && (
                <button
                  disabled={!isValid}
                  onClick={() => onAssignBay && onAssignBay(selectedVehicle.id, bay)}
                  className={`w-full mt-3 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
                    isRec
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-950/40'
                      : isValid
                      ? 'bg-slate-700 hover:bg-slate-600 text-white'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  LOAD {bay}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
