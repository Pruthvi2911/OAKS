'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export function getMasterSessionId() {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('master_session_id');
  if (!sid) {
    sid = `master-session-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('master_session_id', sid);
  }
  return sid;
}

export default function MultiMasterGuard({
  activeMasterSessionId,
  onClaimMasterRole,
  children,
}) {
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [isViewOnly, setIsViewOnly] = useState(false);

  useEffect(() => {
    const sid = getMasterSessionId();
    setCurrentSessionId(sid);

    if (
      activeMasterSessionId &&
      activeMasterSessionId !== sid &&
      activeMasterSessionId !== 'unlocked'
    ) {
      setIsViewOnly(true);
    } else {
      setIsViewOnly(false);
    }
  }, [activeMasterSessionId]);

  return (
    <div className="relative">
      {/* Banner if another master is controlling crossing */}
      {isViewOnly && (
        <div className="bg-amber-950/90 border-b-2 border-amber-500 p-3 px-6 text-amber-200 text-xs font-bold sticky top-0 z-30 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
            <span>
              ⚠ ANOTHER MASTER IS ACTIVE — This crossing is currently being managed from another device/tab.
            </span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded uppercase font-black">
              VIEW ONLY
            </span>
          </div>

          <button
            onClick={() => {
              onClaimMasterRole && onClaimMasterRole(currentSessionId);
              setIsViewOnly(false);
            }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-lg font-black text-xs transition-all shadow"
          >
            CLAIM CONTROL
          </button>
        </div>
      )}

      {/* Render children passing viewOnly flag */}
      {typeof children === 'function' ? children({ isViewOnly }) : children}
    </div>
  );
}
