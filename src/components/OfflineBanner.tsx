import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600/90 backdrop-blur-md px-3 py-2 text-xs font-medium text-white shadow-xl border border-amber-500/50">
      <WifiOff className="w-4 h-4 text-amber-200 animate-pulse" />
      <span>Offline Mode — Cached data & downloaded manga ready for reading</span>
    </div>
  );
};
