'use client';

import React from 'react';
import { VEHICLE_TYPES } from '../../lib/constants.js';
import { calculateDynamicQueuePosition } from '../../utils/queueSorting.js';
import { Ticket, Clock, ShieldAlert, Siren, CheckCircle2 } from 'lucide-react';

export default function TicketCard({ ticket, queueList = [], onNewCheckIn }) {
  if (!ticket) return null;

  const typeMeta = VEHICLE_TYPES[ticket.vehicleType] || VEHICLE_TYPES.CAR;
  const queueInfo = calculateDynamicQueuePosition(queueList, ticket.id);
  const isEmergency = ticket.priority === 'EMERGENCY';

  return (
    <div className="bg-slate-900 border-2 border-sky-500/40 rounded-2xl p-6 shadow-2xl max-w-md w-full mx-auto space-y-6">
      
      {/* Ticket Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-sky-400 font-extrabold text-sm tracking-wider">
          <Ticket className="w-5 h-5" />
          RIVER FERRY BOARDING TICKET
        </div>
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
          ticket.status === 'LOADED'
            ? 'bg-emerald-500 text-slate-950'
            : isEmergency
            ? 'bg-rose-500 text-white animate-pulse'
            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
        }`}>
          {ticket.status === 'LOADED' ? 'BOARDED' : ticket.status}
        </span>
      </div>

      {/* Check-In Code Big Display */}
      <div className="text-center bg-slate-950 p-6 rounded-xl border border-slate-800">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
          CHECK-IN CODE
        </div>
        <div className="text-4xl font-black text-sky-400 tracking-wider font-mono">
          {ticket.checkInCode}
        </div>
      </div>

      {/* Queue Position & Wait Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 text-center">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">
            QUEUE POSITION
          </div>
          <div className="text-2xl font-black text-white">
            {queueInfo.position ? `#${queueInfo.position}` : 'BOARDING'}
          </div>
        </div>

        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 text-center">
          <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">
            ESTIMATED WAIT
          </div>
          <div className="text-2xl font-black text-emerald-400 flex items-center justify-center gap-1">
            <Clock className="w-4 h-4" />
            {queueInfo.estimatedWaitMinutes > 0 ? `~${queueInfo.estimatedWaitMinutes}m` : 'NEXT'}
          </div>
        </div>
      </div>

      {/* Vehicle Summary Box */}
      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">VEHICLE TYPE:</span>
          <span className="font-bold text-white flex items-center gap-1.5">
            <span className="text-base">{typeMeta.icon}</span>
            {typeMeta.label}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400">DECLARED WEIGHT:</span>
          <span className="font-bold text-white">{ticket.declaredWeight} kg</span>
        </div>

        {ticket.hazardous && (
          <div className="flex items-center justify-between text-amber-300 font-bold border-t border-slate-700/60 pt-2">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              HAZARDOUS CARGO:
            </span>
            <span>YES</span>
          </div>
        )}

        {isEmergency && (
          <div className="flex items-center justify-between text-rose-300 font-bold border-t border-slate-700/60 pt-2">
            <span className="flex items-center gap-1">
              <Siren className="w-4 h-4 text-rose-400" />
              PRIORITY VEHICLE:
            </span>
            <span>EMERGENCY</span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={onNewCheckIn}
        className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
      >
        Check-In Another Vehicle
      </button>

    </div>
  );
}
