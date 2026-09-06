'use client';

import React, { useState } from 'react';
import { VEHICLE_TYPES, PRIORITY_LEVELS, INDIAN_STATE_CODES, createQueueEntryDoc } from '../../lib/constants.js';
import { addQueueEntry } from '../../lib/queue.js';
import TicketCard from '../../components/driver/TicketCard.js';
import { Anchor, ShieldAlert, Siren, ArrowRight } from 'lucide-react';

export default function DriverCheckInPage() {
  const [vehicleType, setVehicleType] = useState('CAR');
  const [declaredWeight, setDeclaredWeight] = useState(VEHICLE_TYPES.CAR.defaultWeight);
  const [hazardous, setHazardous] = useState(false);
  const [priority, setPriority] = useState(PRIORITY_LEVELS.NORMAL);

  // Number plate fields: KA · 01 · AB · 1234
  const [plateState, setPlateState] = useState('KA');
  const [plateRTO, setPlateRTO] = useState('');
  const [plateSeries, setPlateSeries] = useState('');
  const [plateNumber, setPlateNumber] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [plateError, setPlateError] = useState('');

  // Auto-fill weight estimate when vehicle type changes
  const handleTypeChange = (newType) => {
    setVehicleType(newType);
    if (VEHICLE_TYPES[newType]) {
      setDeclaredWeight(VEHICLE_TYPES[newType].defaultWeight);
    }
  };

  // Validate and build number plate string
  const buildPlate = () => {
    const rto = plateRTO.trim().padStart(2, '0');
    const series = plateSeries.trim().toUpperCase();
    const num = plateNumber.trim().padStart(4, '0');
    if (!plateState) return null;
    if (!/^\d{1,2}$/.test(plateRTO.trim())) return null;
    if (!/^[A-Z]{1,2}$/i.test(plateSeries.trim())) return null;
    if (!/^\d{1,4}$/.test(plateNumber.trim())) return null;
    return `${plateState} ${rto} ${series} ${num}`;
  };

  // Submit Handler — shows ticket immediately, writes to Firestore in background
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const plate = buildPlate();
    if (!plate) {
      setPlateError('Enter a valid number plate — e.g. KA 01 AB 1234');
      return;
    }
    setPlateError('');
    setIsSubmitting(true);

    // Build ticket doc locally using number plate as the check-in code
    const localEntry = {
      id: `veh-${Date.now()}`,
      ...createQueueEntryDoc({
        checkInCode: plate,
        vehicleType,
        declaredWeight: Number(declaredWeight),
        hazardous,
        priority,
        status: 'WAITING',
      }),
    };

    // Show ticket immediately — don't block UI on network
    setCreatedTicket(localEntry);
    setIsSubmitting(false);

    // Write to Firestore in background
    addQueueEntry({
      checkInCode: plate,
      vehicleType,
      declaredWeight: Number(declaredWeight),
      hazardous,
      priority,
      status: 'WAITING',
    }).catch((err) => {
      console.warn('Background Firestore check-in write warning:', err.message);
    });
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
            Enter your vehicle registration number and details to join the boarding queue.
          </p>
        </div>

        {/* Display Ticket Card if created */}
        {createdTicket ? (
          <TicketCard
            ticket={createdTicket}
            onNewCheckIn={() => {
              setCreatedTicket(null);
              setPlateRTO(''); setPlateSeries(''); setPlateNumber('');
            }}
          />
        ) : (
          /* Check-In Form */
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5"
          >
            {/* ── Number Plate Input ── */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                Vehicle Registration Number
              </label>
              {/* Live preview */}
              <div className="text-center bg-slate-950 border border-slate-700 rounded-xl py-2 mb-3 font-mono font-black text-lg tracking-[0.25em] text-white">
                {[plateState, plateRTO || '00', plateSeries.toUpperCase() || 'AA', plateNumber || '0000'].join(' ')}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {/* State Code */}
                <select
                  value={plateState}
                  onChange={(e) => setPlateState(e.target.value)}
                  className="col-span-1 bg-slate-800 border border-slate-700 rounded-xl px-2 py-2.5 text-white text-xs font-bold focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                >
                  {INDIAN_STATE_CODES.map((code) => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
                {/* RTO District (2 digits) */}
                <input
                  type="text"
                  maxLength={2}
                  placeholder="01"
                  value={plateRTO}
                  onChange={(e) => setPlateRTO(e.target.value.replace(/\D/g, ''))}
                  className="col-span-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono font-bold text-sm text-center focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
                {/* Series (1-2 letters) */}
                <input
                  type="text"
                  maxLength={2}
                  placeholder="AB"
                  value={plateSeries}
                  onChange={(e) => setPlateSeries(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
                  className="col-span-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono font-bold text-sm text-center focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
                {/* Sequential Number (up to 4 digits) */}
                <input
                  type="text"
                  maxLength={4}
                  placeholder="1234"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.replace(/\D/g, ''))}
                  className="col-span-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono font-bold text-sm text-center focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">Format: State · RTO Code · Series · Number (e.g. KA 01 AB 1234)</p>
              {plateError && (
                <p className="text-[11px] text-rose-400 font-bold mt-1">⚠ {plateError}</p>
              )}
            </div>

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
