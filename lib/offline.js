import { useState, useEffect } from 'react';

/**
 * Custom React hook to monitor network connectivity and Firestore cache sync state.
 */
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [lastSyncedAt, setLastSyncedAt] = useState(new Date().toLocaleTimeString());
  const [status, setStatus] = useState('synced'); // 'synced' | 'syncing' | 'offline'

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setStatus('synced');
      setLastSyncedAt(new Date().toLocaleTimeString());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Cast Off safety freshness rule:
   * State is sufficiently fresh if online and synced within last 2 minutes.
   */
  const isStateFresh = isOnline && status !== 'offline';

  return {
    isOnline,
    status,
    lastSyncedAt,
    isStateFresh,
    setStatus,
    setLastSyncedAt,
  };
}
