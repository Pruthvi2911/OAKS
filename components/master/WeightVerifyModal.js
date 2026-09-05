'use client';

import React, { useState } from 'react';
import { Scale, X, Check } from 'lucide-react';

export default function WeightVerifyModal({ vehicle, onClose, onSave }) {
  const [weightInput, setWeightInput] = useState(
    vehicle?.verifiedWeight || vehicle?.declaredWeight || ''
  );

  if (!vehicle) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = Number(weightInput);
    if (!isNaN(val) && val > 0) {
      onSave(vehicle.id, val);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Scale className="w-5 h-5 text-sky-400" />
            VERIFY VEHICLE WEIGHT
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-slate-300 mb-4">
          Vehicle <strong className="text-white">#{vehicle.checkInCode}</strong> declared{' '}
          <strong className="text-amber-300">{vehicle.declaredWeight} kg</strong>. Enter trusted scale measurement:
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              VERIFIED WEIGHT (KG)
            </label>
            <input
              type="number"
              min="100"
              max="20000"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold text-lg focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
              placeholder="e.g. 3400"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1 shadow-lg"
            >
              <Check className="w-4 h-4" />
              Save Verified Weight
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
