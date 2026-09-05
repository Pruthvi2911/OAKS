'use client';

import React from 'react';
import { Anchor, ShieldAlert, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';

export default function MasterHeader({
  ferryConfig,
  currentCrossing,
  totalWeight,
  imbalance,
  connectionState = { status: 'synced', lastSynced: 'Just now' },
}) {
  const maxWeight = ferryConfig?.maxWeight || 10000;
  const maxImbalance = ferryConfig?.maxImbalance || 1000;
  const weightPercent = Math.min(100, Math.round((totalWeight / maxWeight) * 100));

  const isOverweight = totalWeight > maxWeight;
  const isImbalanced = imbalance > maxImbalance;

  return (
    <header className="bg-slate-800 border-b border-slate-700 p-4 shadow-lg sticky top-0 z-20 w-full">
      <div className="w-full px-2 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Title & Crossing Metadata */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-sky-500/10 p-2.5 rounded-xl border border-sky-500/20 text-sky-400">
            <Anchor className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                {ferryConfig?.name || 'River Ferry 01'} — RUN #{currentCrossing?.id?.replace('crossing-', '') || '42'}
              </h1>
              <span className="bg-slate-700 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-medium border border-slate-600">
                {currentCrossing?.status || 'LOADING'}
              </span>
            </div>
            
            {/* Sync Connection Status */}
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              {connectionState.status === 'synced' && (
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  ● SYNCED ({connectionState.lastSynced})
                </span>
              )}
              {connectionState.status === 'syncing' && (
                <span className="flex items-center gap-1 text-sky-400 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  SYNCING...
                </span>
              )}
              {connectionState.status === 'offline' && (
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  ⚠ OFFLINE (Cached)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Global Deck Gauges */}
        <div className="flex flex-wrap items-center gap-6 w-full md:w-auto justify-between md:justify-end">
          
          {/* Total Capacity Gauge */}
          <div className="flex-1 md:flex-initial min-w-[200px]">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-300">TOTAL DECK WEIGHT</span>
              <span className={isOverweight ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                {totalWeight.toLocaleString()} / {maxWeight.toLocaleString()} kg
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverweight
                    ? 'bg-rose-500'
                    : weightPercent > 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${weightPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Left/Right Imbalance Meter */}
          <div className="min-w-[160px]">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-300">LEFT/RIGHT SPREAD</span>
              <span className={isImbalanced ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                {imbalance.toLocaleString()} / {maxImbalance.toLocaleString()} kg
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border ${
                isImbalanced
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-slate-700/60 text-emerald-400 border-slate-600'
              }`}>
                {isImbalanced ? (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    UNBALANCED
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    BALANCED
                  </>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
