'use client';

import React from 'react';
import { ShieldAlert, X, Check } from 'lucide-react';
import { getEffectiveWeight } from '../../safety/validateDeck.js';

export default function HazardModal({ vehicle, onClose, onConfirm }) {
  if (!vehicle) return null;

  const effWeight = getEffectiveWeight(vehicle);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-base">
            <ShieldAlert className="w-6 h-6 animate-pulse text-amber-400" />
            HAZARDOUS CARGO CONFIRMATION
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4 text-xs text-amber-200 space-y-2">
          <div className="font-bold text-sm text-white">
            {vehicle.vehicleType} #{vehicle.checkInCode}
          </div>
          <div>Declared: {vehicle.declaredWeight} kg</div>
          <div>Effective Weight: <strong className="text-white">{effWeight} kg</strong></div>
          <p className="mt-2 text-amber-300 font-medium border-t border-amber-500/20 pt-2">
            Hazardous cargo requires explicit master verification before deck placement.
          </p>
        </div>

        <div className="text-[11px] text-slate-400 italic mb-5">
          Note: Hazard compatibility rules are configurable and should be replaced with actual maritime regulatory rules before production deployment.
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800"
          >
            HOLD
          </button>
          <button
            onClick={() => {
              onConfirm(vehicle.id);
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1 shadow-lg"
          >
            <Check className="w-4 h-4" />
            CONFIRM HAZARD
          </button>
        </div>
      </div>
    </div>
  );
}
