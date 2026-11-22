import React, { useState } from 'react';
import { Calendar, Download, ExternalLink, Smartphone, Check } from 'lucide-react';
import { Excursion } from '../utils/clubLogic';
import { getGoogleCalendarUrl, downloadIcsForEvent } from '../utils/calendarExport';

interface CalendarExportActionsProps {
  excursion: Excursion;
  variant?: 'compact' | 'buttons' | 'dropdown';
  className?: string;
}

export const CalendarExportActions: React.FC<CalendarExportActionsProps> = ({
  excursion,
  variant = 'compact',
  className = ''
}) => {
  const [downloaded, setDownloaded] = useState(false);

  const handleIcsDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadIcsForEvent(excursion);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleGoogleCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getGoogleCalendarUrl(excursion);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'buttons') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={handleGoogleCalendar}
          className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-sky-400 bg-white hover:bg-sky-50/50 text-slate-700 hover:text-sky-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          title="Zu Google Kalender hinzufügen"
        >
          <Calendar className="w-3.5 h-3.5 text-sky-600" />
          <span>Google Kalender</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </button>

        <button
          type="button"
          onClick={handleIcsDownload}
          className="px-3 py-1.5 rounded-lg border border-slate-300 hover:border-amber-400 bg-white hover:bg-amber-50/50 text-slate-700 hover:text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          title="Für Apple / iOS Kalender (.ics) herunterladen"
        >
          {downloaded ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Geladen (.ics)</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-amber-600" />
              <span>Apple / iOS Kalender</span>
              <Download className="w-3 h-3 text-slate-400" />
            </>
          )}
        </button>
      </div>
    );
  }

  // Default compact format: sleek pills
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="text-[10px] text-slate-400 font-medium">Kalender:</span>
      <button
        type="button"
        onClick={handleGoogleCalendar}
        className="px-2 py-1 rounded-md border border-slate-200 hover:border-sky-400 bg-white hover:bg-sky-50 text-[11px] font-semibold text-slate-700 hover:text-sky-700 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
        title="In Google Kalender öffnen"
      >
        <Calendar className="w-3 h-3 text-sky-600" />
        <span>Google</span>
      </button>

      <button
        type="button"
        onClick={handleIcsDownload}
        className="px-2 py-1 rounded-md border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50 text-[11px] font-semibold text-slate-700 hover:text-amber-800 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
        title="Für Apple / iOS Kalender (.ics) herunterladen"
      >
        <Smartphone className="w-3 h-3 text-amber-600" />
        <span>{downloaded ? '✓ .ics' : 'iOS / iCal'}</span>
      </button>
    </div>
  );
};
