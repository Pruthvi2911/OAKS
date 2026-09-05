'use client';

import React, { useState } from 'react';
import { VEHICLE_TYPES, PRIORITY_LEVELS, createQueueEntryDoc } from '../../lib/constants.js';
import TicketCard from '../../components/driver/TicketCard.js';
import { Anchor, ShieldAlert, Siren, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DriverCheckInPage() {
  const [vehicleType, setVehicleType] = useState('CAR');
  const [declaredWeight, setDeclaredWeight] = useState(VEHICLE_TYPES.CAR.defaultWeight);
  const [hazardous, setHazardous] = useState(false);
  const [priority, setPriority] = useState(PRIORITY_LEVELS.NORMAL);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [localQueue, setLocalQueue] = useState([]);

  // Auto-fill weight estimate when vehicle type changes
  const handleTypeChange = (newType) => {
    setVehicleType(newType);
    if (VEHICLE_TYPES[newType]) {
      setDeclaredWeight(VEHICLE_TYPES[newType].defaultWeight);
    }
  };

  // Submit Handler with Duplicate Protection
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submission

    setIsSubmitting(true);

    // Generate random 4-character code (e.g. 7K42)
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const checkInCode = `FERRY-${randomCode}`;

    const newTicket = createQueueEntryDoc({
      id: `veh-${Date.now()}`,
      checkInCode,
      vehicleType,
      declaredWeight: Number(declaredWeight),
      hazardous,
      priority,
      status: 'WAITING',
    });

    // Simulate network delay to demonstrate duplicate protection button
    setTimeout(() => {
      setLocalQueue((prev) => [...prev, newTicket]);
      setCreatedTicket(newTicket);
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 md:p-6 font-sans">
      <div className="max-w-md w-full mx-auto space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Anchor className="w-4 h-4" />
            River Ferry Terminal Check-In
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            DRIVER SELF CHECK-IN
          </h1>
          <p className="text-xs text-slate-400">
            Enter your vehicle specifications to join the staging boarding queue.
          </p>
        </div>

        {/* Display Ticket Card if created */}
        {createdTicket ? (
          <TicketCard
            ticket={createdTicket}
            queueList={localQueue}
            onNewCheckIn={() => setCreatedTicket(null)}
          />
        ) : (
          /* Check-In Form */
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5"
          >
            {/* Vehicle Type Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                VEHICLE TYPE
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(VEHICLE_TYPES).map(([typeKey, meta]) => {
                  const isSelected = vehicleType === typeKey;
                  return (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => handleTypeChange(typeKey)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-400 text-white ring-1 ring-emerald-400/50'
                          : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-2xl">{meta.icon}</span>
                      <div>
                        <div className="font-bold text-xs">{typeKey}</div>
                        <div className="text-[10px] text-slate-400">{meta.defaultWeight} kg avg</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Estimated Weight Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                ESTIMATED VEHICLE WEIGHT (KG)
              </label>
              <input
                type="number"
                min="100"
                max="20000"
                value={declaredWeight}
                onChange={(e) => setDeclaredWeight(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-lg focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                placeholder="e.g. 2800"
                required
              />
            </div>

            {/* Checkboxes: Hazardous & Emergency */}
            <div className="space-y-3 pt-1">
              
              {/* Hazardous Checkbox */}
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                hazardous ? 'bg-amber-950/30 border-amber-500/50 text-amber-200' : 'bg-slate-800/60 border-slate-700/80 text-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={hazardous}
                  onChange={(e) => setHazardous(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <div className="flex items-center gap-2 text-xs font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  HAZARDOUS CARGO (Chemicals, Fuel, Gas)
                </div>
              </label>

              {/* Priority Checkbox */}
              <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                priority === PRIORITY_LEVELS.EMERGENCY
                  ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-300'
              }`}>
                <input
                  type="checkbox"
                  checked={priority === PRIORITY_LEVELS.EMERGENCY}
                  onChange={(e) =>
                    setPriority(e.target.checked ? PRIORITY_LEVELS.EMERGENCY : PRIORITY_LEVELS.NORMAL)
                  }
                  className="w-4 h-4 rounded border-slate-700 text-rose-500 focus:ring-rose-500"
                />
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Siren className="w-4 h-4 text-rose-400" />
                  EMERGENCY PRIORITY (Ambulance / Fire)
                </div>
              </label>

            </div>

            {/* Submit Button with Duplicate Protection State */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 rounded-xl font-black text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2 ${
                isSubmitting
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/50'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                  CHECKING IN...
                </>
              ) : (
                <>
                  CHECK IN & GET TICKET
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
