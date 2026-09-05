'use client';

import React from 'react';
import { Anchor, ShieldCheck, AlertTriangle, ArrowRight, Lock } from 'lucide-react';

export default function CastOffButton({
  totalWeight,
  imbalance,
  ferryConfig,
  loadedVehicles = [],
  isOffline = false,
  isViewOnly = false,
  onCastOff,
}) {
  const maxWeight = ferryConfig?.maxWeight || 10000;
  const maxImbalance = ferryConfig?.maxImbalance || 1000;

  // Validation Checks
  const capacityOk = totalWeight > 0 && totalWeight <= maxWeight;
  const balanceOk = imbalance <= maxImbalance;
  const hazardOk = !loadedVehicles.some((v) => v.hazardous && !v.hazardConfirmed);
  const freshStateOk = !isOffline;

  const isSafeToCastOff = capacityOk && balanceOk && hazardOk && freshStateOk && !isViewOnly;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 font-black text-sm text-white">
          <Anchor className="w-5 h-5 text-sky-400" />
          PRE-DEPARTURE SAFETY CHECKLIST
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
          isSafeToCastOff ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
        }`}>
          {isSafeToCastOff ? 'READY FOR CAST OFF' : 'CHECKLIST PENDING'}
        </span>
      </div>

      {/* Safety Rules Checklist items */}
      <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
        <div className={`p-2 rounded-lg border flex items-center gap-2 ${
          capacityOk ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
        }`}>
          <span>{capacityOk ? '✓' : '✕'}</span> Total Capacity ({totalWeight} / {maxWeight} kg)
        </div>

        <div className={`p-2 rounded-lg border flex items-center gap-2 ${
          balanceOk ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
        }`}>
          <span>{balanceOk ? '✓' : '✕'}</span> Deck Balance ({imbalance} / {maxImbalance} kg)
        </div>

        <div className={`p-2 rounded-lg border flex items-center gap-2 ${
          hazardOk ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
        }`}>
          <span>{hazardOk ? '✓' : '⚠'}</span> Hazardous Cargo Confirmed
        </div>

        <div className={`p-2 rounded-lg border flex items-center gap-2 ${
          freshStateOk ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
        }`}>
          <span>{freshStateOk ? '✓' : '✕'}</span> Realtime Server Sync
        </div>
      </div>

      {/* Offline Warning Notice */}
      {isOffline && (
        <div className="bg-rose-950/50 border border-rose-500/50 rounded-xl p-3 text-xs text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>CAST OFF DISABLED:</strong> Network connection lost. State must be synchronized before departure to prevent queue position conflicts.
          </span>
        </div>
      )}

      {/* Cast Off Big Action Button */}
      <button
        disabled={!isSafeToCastOff}
        onClick={onCastOff}
        className={`w-full py-4 rounded-xl font-black text-base tracking-wider transition-all shadow-2xl flex items-center justify-center gap-2 ${
          isSafeToCastOff
            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/50 animate-pulse'
            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
        }`}
      >
        {isViewOnly ? (
          <>
            <Lock className="w-5 h-5" />
            CAST OFF (VIEW ONLY MODE)
          </>
        ) : isOffline ? (
          <>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            CAST OFF DISABLED (OFFLINE)
          </>
        ) : (
          <>
            <Anchor className="w-5 h-5" />
            CAST OFF FERRY RUN
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  );
}
