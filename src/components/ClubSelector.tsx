import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, CheckCircle2, X, Building2, MapPin } from 'lucide-react';
import { Club } from '../utils/clubLogic';
import { ClubLogo } from './ClubLogo';

interface ClubSelectorProps {
  selectedClubId: string;
  clubs: Club[];
  onChange: (clubId: string) => void;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
}

export const ClubSelector: React.FC<ClubSelectorProps> = ({
  selectedClubId,
  clubs,
  onChange,
  label = 'Auswahl vom Verein',
  required = true,
  error,
  helperText
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLocationFilter, setActiveLocationFilter] = useState<string>('Alle');

  // Currently selected club
  const selectedClub = useMemo(() => {
    return clubs.find((c) => c.id === selectedClubId) || clubs[0];
  }, [clubs, selectedClubId]);

  // Unique list of locations for fast filtering
  const locations = useMemo(() => {
    const locSet = new Set<string>();
    clubs.forEach((c) => {
      if (c.location && c.location.trim()) {
        locSet.add(c.location.trim());
      }
    });
    return ['Alle', ...Array.from(locSet).sort()];
  }, [clubs]);

  // Filtered clubs based on search input & location chip
  const filteredClubs = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return clubs.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q) ||
        (c.location && c.location.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q));

      const matchesLocation =
        activeLocationFilter === 'Alle' ||
        (c.location && c.location.trim().toLowerCase() === activeLocationFilter.toLowerCase());

      return matchesSearch && matchesLocation;
    });
  }, [clubs, searchTerm, activeLocationFilter]);

  const handleSelect = (clubId: string) => {
    onChange(clubId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="space-y-1.5">
      {/* Label & Instructions */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-800">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          {clubs.length} Mitgliedsvereine
        </span>
      </div>

      {/* Touch-Friendly iOS Trigger Card (Min Height 56px, Big Tap Target) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full text-left p-3 rounded-xl border bg-white shadow-2xs hover:border-red-400 hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group ${
          error
            ? 'border-rose-400 ring-2 ring-rose-100'
            : 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600'
        }`}
        style={{ minHeight: '56px' }}
        aria-label="Verein auswählen"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Crisp Club Logo */}
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white p-1 border shrink-0 flex items-center justify-center shadow-2xs transition-transform group-hover:scale-105"
            style={{
              borderColor: selectedClub?.color ? `${selectedClub.color}40` : '#cbd5e1',
              backgroundColor: '#ffffff'
            }}
          >
            <ClubLogo club={selectedClub} size="sm" className="w-full h-full object-contain" />
          </div>

          {/* Club Name & Location - Fully wrapped, never truncated */}
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2">
              {selectedClub ? selectedClub.name : 'Bitte Verein auswählen...'}
            </div>
            {selectedClub && (
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                <span className="font-semibold text-red-700 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                  {selectedClub.shortName}
                </span>
                {selectedClub.location && (
                  <span className="flex items-center gap-0.5 text-slate-600">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {selectedClub.location}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Change prompt button */}
        <div className="shrink-0 flex items-center gap-1.5 pl-2">
          <span className="hidden sm:inline-block text-[11px] font-bold text-red-700 bg-red-50 group-hover:bg-red-100 px-2.5 py-1 rounded-lg border border-red-200 transition-colors">
            Verein wechseln
          </span>
          <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-red-100/60 flex items-center justify-center text-slate-600 group-hover:text-red-700 transition-colors">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* Hidden synchronized select for browser autocomplete & form fallback */}
      <select
        value={selectedClubId}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      >
        {clubs.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.shortName})
          </option>
        ))}
      </select>

      {helperText && !error && (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      )}

      {error && (
        <p className="text-[11px] font-medium text-rose-600">{error}</p>
      )}

      {/* Full-Screen / Bottom Sheet Search Modal (Optimized for iOS touch & Safari) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/65 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[88vh] sm:max-h-[82vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Mitgliedsverein auswählen
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tippe auf deinen Karnevals- oder Fastnachtsverein ({clubs.length} Vereine)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                aria-label="Fertig / Schließen"
              >
                <span>Fertig</span>
                <X className="w-4 h-4 ml-0.5" />
              </button>
            </div>

            {/* Search Bar - 16px font-size to 100% prevent iOS Safari auto-zoom */}
            <div className="p-3 sm:p-4 border-b border-slate-100 space-y-2.5 bg-white shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Verein, Ort oder Kürzel suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: '16px' }}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 bg-slate-50 focus:bg-white text-slate-900 font-medium placeholder-slate-400 transition-all"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Fast Location Chips */}
              {locations.length > 2 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {locations.slice(0, 8).map((loc) => {
                    const isActive = activeLocationFilter === loc;
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setActiveLocationFilter(loc)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-red-700 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Scrollable Club List (High tap target 58px+, Smooth momentum scrolling) */}
            <div
              className="p-3 sm:p-4 overflow-y-auto space-y-2 divide-y divide-slate-100"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {filteredClubs.length === 0 ? (
                <div className="text-center py-8 px-4 text-slate-500">
                  <p className="text-sm font-semibold text-slate-700">Kein Verein gefunden</p>
                  <p className="text-xs mt-1">Kein Treffer für „{searchTerm}“</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setActiveLocationFilter('Alle');
                    }}
                    className="mt-3 text-xs font-bold text-red-700 underline"
                  >
                    Suchfilter zurücksetzen
                  </button>
                </div>
              ) : (
                filteredClubs.map((club) => {
                  const isSelected = club.id === selectedClubId;
                  const clubColor = club.color || '#b91c1c';

                  return (
                    <button
                      key={club.id}
                      type="button"
                      onClick={() => handleSelect(club.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer group pt-3 ${
                        isSelected
                          ? 'bg-red-50/70 border-2 border-red-500 shadow-xs'
                          : 'hover:bg-slate-50 border-2 border-transparent'
                      }`}
                      style={{ minHeight: '58px' }}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Club Logo */}
                        <div
                          className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white p-1 border shrink-0 flex items-center justify-center shadow-2xs transition-transform group-hover:scale-105"
                          style={{
                            borderColor: `${clubColor}30`,
                            background: `linear-gradient(135deg, #ffffff 60%, ${clubColor}15 100%)`
                          }}
                        >
                          <ClubLogo club={club} size="sm" className="w-full h-full object-contain" />
                        </div>

                        {/* Name and details */}
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-red-700 transition-colors leading-snug">
                            {club.name}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                            <span
                              className="font-bold px-1.5 py-0.2 rounded text-[10px]"
                              style={{
                                backgroundColor: `${clubColor}15`,
                                color: clubColor
                              }}
                            >
                              {club.shortName}
                            </span>
                            {club.location && (
                              <span className="flex items-center gap-0.5 text-slate-600">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {club.location}
                              </span>
                            )}
                            {club.category && (
                              <span className="text-slate-400 hidden sm:inline">• {club.category}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Selected Indicator */}
                      <div className="shrink-0 pl-2">
                        {isSelected ? (
                          <div className="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-red-400 transition-colors" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Bottom Dismiss / Status Bar */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center shrink-0">
              <span className="text-[11px] text-slate-500">
                Tippe auf deinen Verein, um ihn direkt auszuwählen.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
