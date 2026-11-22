import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, MoreVertical, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallBannerProps {
  onDismiss?: () => void;
  className?: string;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onDismiss, className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already installed, hide banner
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {/* Banner */}
      <div className={`bg-gradient-to-r from-red-900 via-red-800 to-amber-900 text-white px-3.5 py-2.5 rounded-2xl shadow-md border border-red-700/60 flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/20">
            <Smartphone className="w-5 h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-white tracking-wide">
                Als App aufs Handy holen
              </span>
              <span className="text-[10px] font-semibold bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-full">
                Schneller Zugriff
              </span>
            </div>
            <p className="text-[11px] text-amber-100/90 truncate">
              Mit echtem Narrenkreis-Icon auf dem Startbildschirm – ohne Browser-Leiste
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            {installSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-800" />
                <span>Installiert!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-amber-950" />
                <span>App installieren</span>
              </>
            )}
          </button>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              title="Ausblenden"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Guided Modal for iOS Safari & Android Fallback */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-amber-50">
              <div className="flex items-center gap-2.5">
                <img
                  src="/pwa-192x192.png"
                  alt="Narrenkreis Bruchsal"
                  className="w-8 h-8 rounded-lg object-contain bg-white shadow-2xs border border-slate-200"
                />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    App zum Startbildschirm hinzufügen
                  </h3>
                  <p className="text-[11px] text-slate-500">Narrenkreis Bruchsal Portal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              {isIOS ? (
                /* iOS Safari instructions */
                <div className="space-y-3">
                  <p className="font-semibold text-slate-800">
                    So installierst du die App auf deinem iPhone / iPad:
                  </p>
                  <ol className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/90 text-[12px] leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-red-700 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                      <div>
                        Tippe unten in der Leiste von Safari auf das <strong>Teilen-Symbol</strong> <Share className="w-3.5 h-3.5 inline text-sky-600 align-text-bottom" /> (Viereck mit Pfeil nach oben).
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-red-700 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                      <div>
                        Scrolle etwas nach unten und wähle <strong>„Zum Home-Bildschirm“</strong> <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 align-text-bottom" /> aus.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-red-700 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                      <div>
                        Tippe oben rechts auf <strong>„Hinzufügen“</strong>.
                      </div>
                    </li>
                  </ol>
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    ✓ Die Narrenkreis-App erscheint nun direkt mit eigenem Wappen-Symbol zwischen deinen normalen Handy-Apps und startet im Vollbildmodus ohne störende Browser-Leiste!
                  </p>
                </div>
              ) : (
                /* Android / Chrome instructions */
                <div className="space-y-3">
                  <p className="font-semibold text-slate-800">
                    So installierst du die App auf deinem Android-Smartphone:
                  </p>
                  <ol className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/90 text-[12px] leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-red-700 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                      <div>
                        Tippe oben rechts in Chrome auf die <strong>drei Punkte (Menü)</strong> <MoreVertical className="w-3.5 h-3.5 inline text-slate-700 align-text-bottom" />.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-red-700 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                      <div>
                        Wähle <strong>„App installieren“</strong> oder <strong>„Zum Startbildschirm hinzufügen“</strong> aus.
                      </div>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-red-700 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                      <div>
                        Bestätige mit <strong>„Installieren“</strong>.
                      </div>
                    </li>
                  </ol>
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    ✓ Die Narrenkreis-App ist nun wie jede Play Store App auf deinem Homescreen abgelegt und immer griffbereit!
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Verstanden
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
