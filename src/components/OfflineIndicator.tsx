import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, X } from 'lucide-react';

interface OfflineIndicatorProps {
  onSyncNow?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onSyncNow }) => {
  const [isOffline, setIsOffline] = useState<boolean>(() => !navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsDismissed(false);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 4000);
      if (onSyncNow) {
        onSyncNow();
      }
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setIsDismissed(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onSyncNow]);

  if (showReconnected) {
    return (
      <div 
        role="status"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-[100] bg-emerald-600 text-white py-2 px-4 shadow-md flex items-center justify-center gap-2 text-xs font-semibold animate-in slide-in-from-top duration-300"
      >
        <Wifi className="w-4 h-4 animate-bounce shrink-0" />
        <span>Wieder online – Verbindung hergestellt & Daten synchronisiert!</span>
      </div>
    );
  }

  if (isOffline && !isDismissed) {
    return (
      <div 
        role="alert"
        aria-live="assertive"
        className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-slate-950 py-2.5 px-4 shadow-lg flex items-center justify-between text-xs font-medium border-b border-amber-700/30 backdrop-blur-xs animate-in slide-in-from-top duration-300"
      >
        <div className="flex items-center gap-2.5 max-w-4xl mx-auto w-full">
          <div className="w-7 h-7 rounded-lg bg-black/15 flex items-center justify-center shrink-0">
            <WifiOff className="w-4 h-4 text-slate-950" />
          </div>
          <div className="flex-1 leading-snug">
            <span className="font-extrabold uppercase tracking-wide text-[10px] bg-black/15 px-1.5 py-0.5 rounded mr-1.5">
              Kein Empfang
            </span>
            <span>
              <strong>Offline-Modus aktiv:</strong> Deine Änderungen werden automatisch lokal gespeichert und übertragen, sobald wieder Netz da ist.
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {onSyncNow && (
              <button
                type="button"
                onClick={onSyncNow}
                className="px-2.5 py-1 bg-black/15 hover:bg-black/25 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Verbindung jetzt prüfen"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:inline">Prüfen</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 text-slate-900 hover:text-black hover:bg-black/10 rounded-lg transition-colors cursor-pointer"
              title="Hinweis ausblenden"
              aria-label="Hinweis schließen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
