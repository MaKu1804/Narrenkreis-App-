import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  List, 
  Grid3X3,
  CheckCircle,
  FileText,
  Download,
  Smartphone,
  ExternalLink,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Search
} from 'lucide-react';
import { Excursion, Club, UserProfile, EXCURSION_CATEGORIES } from '../utils/clubLogic';
import { ClubLogo } from './ClubLogo';
import { CalendarExportActions } from './CalendarExportActions';
import { downloadAllEventsAsIcs, getGoogleCalendarUrl } from '../utils/calendarExport';

interface CalendarViewProps {
  excursions: Excursion[];
  clubs: Club[];
  currentUser: UserProfile;
  onSelectExcursion?: (excursionId: string) => void;
  onOpenCreateExcursion?: (defaultDate?: string) => void;
  onAddExcursion?: (newExcursion: Excursion) => void;
  onEditExcursion?: (excursionId: string, updated: Partial<Excursion>) => void;
  onDeleteExcursion?: (excursionId: string) => void;
  onRegisterAttendees?: (excursionId: string, attendeeNames: string[]) => void;
  onCancelRegistration?: (excursionId: string, registrationId: string) => void;
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
  initialCreateDate?: string;
}

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const FILTER_CATEGORIES = ['Alle', ...EXCURSION_CATEGORIES];

export const CalendarView: React.FC<CalendarViewProps> = ({
  excursions,
  clubs,
  currentUser,
  onSelectExcursion,
  onOpenCreateExcursion,
  onAddExcursion,
  onEditExcursion,
  onDeleteExcursion,
  onRegisterAttendees,
  onCancelRegistration,
  isCreateOpen,
  onCloseCreate,
  initialCreateDate
}) => {
  // Search & Category filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Alle');

  // Check if there are excursions in future or past to set a sensible initial view
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth() + 1);

  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [showPastEvents, setShowPastEvents] = useState(false);

  const [allDownloaded, setAllDownloaded] = useState(false);

  // Modal states for Create, Edit & Delete
  const [internalCreateModalOpen, setInternalCreateModalOpen] = useState(false);
  const showCreateModal = isCreateOpen !== undefined ? isCreateOpen : internalCreateModalOpen;

  const [editingExcursion, setEditingExcursion] = useState<Excursion | null>(null);
  const [deleteConfirmExcursion, setDeleteConfirmExcursion] = useState<Excursion | null>(null);

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(() => initialCreateDate || new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('10:11');
  const [newEndTime, setNewEndTime] = useState('12:00');
  const [newCategory, setNewCategory] = useState<Excursion['category']>('Narrenkreissitzung');
  const [newLocationName, setNewLocationName] = useState('');
  const [newMeetingPointDetails, setNewMeetingPointDetails] = useState('');
  const [newComment, setNewComment] = useState('');

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editCategory, setEditCategory] = useState<Excursion['category']>('Fastnachtsumzug');
  const [editLocationName, setEditLocationName] = useState('');
  const [editMeetingPointDetails, setEditMeetingPointDetails] = useState('');
  const [editMaxParticipants, setEditMaxParticipants] = useState(50);
  const [editComment, setEditComment] = useState('');

  // Update initial create date if prop changes
  useEffect(() => {
    if (initialCreateDate) {
      setNewDate(initialCreateDate);
    }
  }, [initialCreateDate]);

  const handleOpenEdit = (exc: Excursion) => {
    setEditingExcursion(exc);
    setEditTitle(exc.title);
    setEditDate(exc.date);
    setEditTime(exc.time);
    setEditEndTime(exc.endTime || '');
    setEditCategory(exc.category);
    setEditLocationName(exc.locationName);
    setEditMeetingPointDetails(exc.meetingPointDetails || '');
    setEditMaxParticipants(exc.maxParticipants || 50);
    setEditComment(exc.comment || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExcursion || !editTitle.trim() || !editLocationName.trim()) return;

    if (onEditExcursion) {
      onEditExcursion(editingExcursion.id, {
        title: editTitle.trim(),
        date: editDate,
        time: editTime,
        endTime: editEndTime.trim() || undefined,
        category: editCategory,
        locationName: editLocationName.trim(),
        meetingPointDetails: editMeetingPointDetails.trim(),
        maxParticipants: Number(editMaxParticipants) || 50,
        comment: editComment.trim()
      });
    }

    setEditingExcursion(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmExcursion) return;
    if (onDeleteExcursion) {
      onDeleteExcursion(deleteConfirmExcursion.id);
    }
    setDeleteConfirmExcursion(null);
  };

  const handleOpenCreateModal = (defaultDate?: string) => {
    if (defaultDate) {
      setNewDate(defaultDate);
    }
    if (onOpenCreateExcursion) {
      onOpenCreateExcursion(defaultDate);
    }
    setInternalCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setInternalCreateModalOpen(false);
    if (onCloseCreate) {
      onCloseCreate();
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newLocationName.trim() || !newDate) return;

    const newExcursion: Excursion = {
      id: `exc-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      date: newDate,
      time: newTime,
      endTime: newEndTime.trim() || undefined,
      locationName: newLocationName.trim(),
      meetingPointDetails: newMeetingPointDetails.trim(),
      coordinates: { lat: 49.1246, lng: 8.5983 },
      comment: newComment.trim(),
      organizerId: currentUser.id,
      organizerName: currentUser.name,
      organizerClubId: currentUser.clubId,
      maxParticipants: 50,
      registrations: []
    };

    if (onAddExcursion) {
      onAddExcursion(newExcursion);
    }

    // Switch calendar view to created event's month
    const parts = newDate.split('-');
    if (parts.length === 3) {
      setCurrentYear(parseInt(parts[0], 10));
      setCurrentMonth(parseInt(parts[1], 10));
      setSelectedDayNumber(parseInt(parts[2], 10));
    }

    // Reset create form
    setNewTitle('');
    setNewLocationName('');
    setNewMeetingPointDetails('');
    setNewComment('');
    handleCloseCreateModal();
  };

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Generate calendar grid
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = (new Date(currentYear, currentMonth - 1, 1).getDay() + 6) % 7; // Monday = 0

  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const monthExcursions = excursions.filter(e => e.date.startsWith(monthPrefix));

  const excursionsByDay: Record<number, Excursion[]> = {};
  monthExcursions.forEach(exc => {
    const day = parseInt(exc.date.split('-')[2], 10);
    if (!excursionsByDay[day]) {
      excursionsByDay[day] = [];
    }
    excursionsByDay[day].push(exc);
  });

  const selectedDayExcursions = selectedDayNumber ? (excursionsByDay[selectedDayNumber] || []) : [];

  // Date formatting helper for clear event cards
  const formatExcursionDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const dt = new Date(y, m - 1, d);
      const shortWeekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      const shortWeekday = shortWeekdays[dt.getDay()] || '';
      const monthName = MONTH_NAMES[m - 1] || '';
      const formattedDate = `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`;
      return { formattedDate, shortWeekday, monthName, day: d, month: m, year: y };
    }
    return { formattedDate: dateStr, shortWeekday: '', monthName: '', day: 0, month: 0, year: 0 };
  };

  // Filter predicate
  const matchesFilter = (exc: Excursion) => {
    const matchesCat = categoryFilter === 'Alle' || exc.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCat;
    const club = clubs.find(c => c.id === exc.organizerClubId);
    const matchesQ =
      exc.title.toLowerCase().includes(q) ||
      exc.locationName.toLowerCase().includes(q) ||
      Boolean(exc.organizerName && exc.organizerName.toLowerCase().includes(q)) ||
      Boolean(exc.comment && exc.comment.toLowerCase().includes(q)) ||
      Boolean(exc.meetingPointDetails && exc.meetingPointDetails.toLowerCase().includes(q)) ||
      Boolean(club && (
        club.name.toLowerCase().includes(q) || 
        club.shortName.toLowerCase().includes(q) || 
        Boolean(club.location && club.location.toLowerCase().includes(q))
      ));
    return matchesCat && matchesQ;
  };

  // Chronologically sorted list of ALL matching events (earliest date and time to latest)
  const sortedAllFilteredExcursions = excursions
    .filter(matchesFilter)
    .sort((a, b) => {
      const dateDiff = a.date.localeCompare(b.date);
      if (dateDiff !== 0) return dateDiff;
      return (a.time || '').localeCompare(b.time || '');
    });

  // ISO date string for today in local time (YYYY-MM-DD)
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // If a day was explicitly clicked in the month calendar grid, filter to that day (even if in the past);
  // otherwise show only upcoming/today events below the calendar (past events hidden by default)
  const targetDayDate = selectedDayNumber !== null
    ? `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedDayNumber).padStart(2, '0')}`
    : null;

  const upcomingFilteredExcursions = sortedAllFilteredExcursions.filter(e => e.date >= todayStr);
  const pastEventsCount = sortedAllFilteredExcursions.filter(e => e.date < todayStr).length;

  // Displayed events: if a day was tapped on the calendar, display that day's events (including past);
  // otherwise display only upcoming events (or all if explicitly toggled)
  const displayedListEvents = targetDayDate
    ? sortedAllFilteredExcursions.filter(e => e.date === targetDayDate)
    : (showPastEvents ? sortedAllFilteredExcursions : upcomingFilteredExcursions);

  // Filter bar component (placed directly below the calendar)
  const renderFilterBar = () => (
    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Veranstaltungen, Termine, Vereine oder Orte filtern..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (selectedDayNumber !== null) setSelectedDayNumber(null);
            }}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                if (selectedDayNumber !== null) setSelectedDayNumber(null);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
              title="Suche zurücksetzen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {(categoryFilter !== 'Alle' || searchQuery.trim() || selectedDayNumber !== null) && (
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('Alle');
              setSearchQuery('');
              setSelectedDayNumber(null);
            }}
            className="text-xs text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 font-semibold cursor-pointer shrink-0 self-start sm:self-auto hover:underline"
          >
            Filter zurücksetzen
          </button>
        )}
      </div>

      {/* Horizontale Terminkategorie-Pills (unterhalb des Kalenders) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs -mx-1 px-1">
        {FILTER_CATEGORIES.map((cat) => {
          const isSelected = categoryFilter === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategoryFilter(cat);
                setSelectedDayNumber(null); // Clear day lock so all events of this category are visible!
              }}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer text-xs ${
                isSelected
                  ? 'bg-slate-900 dark:bg-red-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-slate-700'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Reusable Fused Event Card with prominent club logo and border in club colors
  const renderFusedEventCard = (exc: Excursion) => {
    const club = clubs.find(c => c.id === exc.organizerClubId);
    const clubColor = club?.color || '#b91c1c';
    const clubSecondaryColor = club?.secondaryColor || clubColor;
    const { formattedDate, shortWeekday, monthName } = formatExcursionDate(exc.date);

    return (
      <div
        key={exc.id}
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all p-4 sm:p-5 space-y-4 overflow-hidden text-slate-900 dark:text-slate-100"
        style={{
          borderWidth: '2.5px',
          borderStyle: 'solid',
          borderColor: clubColor,
          boxShadow: `0 4px 18px -2px ${clubColor}20`
        }}
      >
        {/* Top Accent Strip in Club Colors */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{
            background: club?.secondaryColor
              ? `linear-gradient(90deg, ${clubColor} 0%, ${clubSecondaryColor} 100%)`
              : clubColor
          }}
        />

        {/* 1. Header: Hervorgehobenes Vereinslogo, Vereinsname, Kategorie & Ticket-Datumsblock */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5 pt-1">
          {/* Linke Seite: Großes hervorgehobenes Vereinswappen & Vereinsdaten */}
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Großes Vereinslogo in hervorgehobenem Badge */}
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white dark:bg-slate-800 p-1.5 shrink-0 shadow-sm flex items-center justify-center relative overflow-hidden transition-transform hover:scale-105"
              style={{
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: clubColor,
                background: `linear-gradient(135deg, rgba(255,255,255,0.9) 65%, ${clubColor}20 100%)`
              }}
              title={club?.name || 'Narrenkreis Bruchsal'}
            >
              <ClubLogo club={club} size="lg" className="w-full h-full object-contain" />
            </div>

            {/* Vereins- & Veranstalter-Angaben */}
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-md shadow-2xs inline-flex items-center gap-1.5"
                  style={{
                    backgroundColor: `${clubColor}15`,
                    color: clubColor,
                    border: `1px solid ${clubColor}35`
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: clubColor }} />
                  {exc.category}
                </span>

                {exc.date < todayStr && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Vergangen
                  </span>
                )}

                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                  {club?.shortName || club?.name || 'Narrenkreis Bruchsal'}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Organisiert von <strong className="font-semibold text-slate-800 dark:text-slate-200">{exc.organizerName || 'Vereinsleitung'}</strong>
                {club?.location ? ` (${club.location})` : ''}
              </p>
            </div>
          </div>

          {/* Rechte Seite: Hervorgehobener Ticket-Datumsblock */}
          <div
            className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center px-3.5 py-2 rounded-xl border shrink-0 bg-slate-50/90 dark:bg-slate-800/90 shadow-2xs"
            style={{ borderColor: `${clubColor}35` }}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              {shortWeekday}, {monthName}
            </span>
            <span className="text-base sm:text-xl font-black font-mono text-slate-900 dark:text-white leading-tight">
              {formattedDate}
            </span>
            <span className="text-xs font-semibold font-mono text-slate-600 dark:text-slate-300 sm:mt-0.5">
              {exc.time} Uhr{exc.endTime ? ` – ${exc.endTime}` : ''}
            </span>
          </div>
        </div>

        {/* 2. Titel & Bearbeiten / Löschen Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
            {exc.title}
          </h3>

          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
            {onEditExcursion && (
              <button
                type="button"
                onClick={() => handleOpenEdit(exc)}
                className="px-2.5 py-1.5 text-slate-700 dark:text-slate-200 hover:text-sky-700 dark:hover:text-sky-400 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Veranstaltung bearbeiten"
              >
                <Edit2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Bearbeiten</span>
              </button>
            )}
            {onDeleteExcursion && (
              <button
                type="button"
                onClick={() => setDeleteConfirmExcursion(exc)}
                className="px-2.5 py-1.5 text-slate-700 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-400 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Veranstaltung löschen"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Löschen</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Detaillierte Infos: Datum & Uhrzeit + Treffpunkt & Ort with Google Maps Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
          {/* Datum & Uhrzeit */}
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 mt-0.5 shadow-2xs">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold block">Datum & Uhrzeit</span>
              <span className="font-semibold text-slate-900 dark:text-white font-mono tabular-nums text-xs sm:text-sm block mt-0.5">
                {formattedDate} um {exc.time} Uhr
                {exc.endTime ? ` bis ${exc.endTime}` : ''}
              </span>
            </div>
          </div>

          {/* Treffpunkt & Ort + Google Maps Navigation */}
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 mt-0.5 shadow-2xs">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold block">Treffpunkt & Ort</span>
                <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm block mt-0.5 truncate">
                  {exc.locationName}
                </span>
                {exc.meetingPointDetails && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                    {exc.meetingPointDetails}
                  </span>
                )}
              </div>
            </div>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                exc.locationName + (exc.meetingPointDetails ? ' ' + exc.meetingPointDetails : '')
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold shadow-2xs shrink-0 transition-colors self-start cursor-pointer"
              title="In Google Maps öffnen und Route planen"
            >
              <ExternalLink className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span className="hidden sm:inline">Google Maps Route</span>
              <span className="sm:hidden">Route</span>
            </a>
          </div>
        </div>

        {/* 4. Kalender Export (Google & Apple/iOS Kalender) */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50 to-amber-50 dark:from-sky-950/40 dark:to-amber-950/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Termin in deinen persönlichen Kalender eintragen
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Direkt in Google Kalender speichern oder als .ics für iPhone / iOS Kalender laden
            </span>
          </div>
          <CalendarExportActions excursion={exc} variant="buttons" />
        </div>

        {/* 5. Hinweise & Ausrüstung (Kommentar / Agenda) */}
        {exc.comment && (
          <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
              <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Hinweise & Ausrüstung (Kommentar)</span>
            </div>
            <p className="text-xs text-amber-950 dark:text-amber-200 whitespace-pre-line leading-relaxed">
              {exc.comment}
            </p>
          </div>
        )}

        {/* 6. Optional: Angemeldete Teilnehmer */}
        {exc.registrations && exc.registrations.length > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-200 font-bold">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Angemeldete Teilnehmer ({exc.registrations.reduce((s, r) => s + r.attendees.length, 0)})</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {exc.registrations.map(reg => (
                <span key={reg.id} className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium">
                  {reg.registeredByUserName} ({reg.clubName}): {reg.attendees.map(a => a.name).join(', ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card: Title, View Switcher, Month Navigation & Global Export Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              aria-label="Vorheriger Monat"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              aria-label="Nächster Monat"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setCurrentYear(now.getFullYear());
                setCurrentMonth(now.getMonth() + 1);
                setSelectedDayNumber(now.getDate());
              }}
              className="px-2.5 py-1 text-xs font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/60 hover:bg-red-200 dark:hover:bg-red-900/60 border border-red-300 dark:border-red-800 rounded-lg transition-colors cursor-pointer ml-1 flex items-center gap-1 shadow-2xs"
              title="Zum heutigen Tag springen"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping inline-block" />
              <span>Heute</span>
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white min-w-max">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </h2>

          {currentYear === today.getFullYear() && currentMonth === (today.getMonth() + 1) && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-300 bg-red-100/90 dark:bg-red-950/70 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-md">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span>Heute: {today.getDate()}. {MONTH_NAMES[today.getMonth()]}</span>
            </span>
          )}

          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            {monthExcursions.length} {monthExcursions.length === 1 ? 'Termin' : 'Termine'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'month' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Monat</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'agenda' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Liste</span>
            </button>
          </div>

          {/* 1. Direkte Übernahme in Google Kalender */}
          <button
            type="button"
            onClick={() => {
              const target = displayedListEvents[0] || sortedAllFilteredExcursions[0] || excursions[0];
              if (target) {
                window.open(getGoogleCalendarUrl(target), '_blank', 'noopener,noreferrer');
              } else {
                window.open('https://calendar.google.com', '_blank', 'noopener,noreferrer');
              }
            }}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-800 dark:hover:text-sky-300 bg-white dark:bg-slate-800 hover:bg-sky-50/70 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Termin direkt in Google Kalender einfügen"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Google Kalender</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>

          {/* 2. Download für Apple / iOS Kalender */}
          <button
            type="button"
            onClick={() => {
              downloadAllEventsAsIcs(excursions);
              setAllDownloaded(true);
              setTimeout(() => setAllDownloaded(false), 3000);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-amber-900 dark:hover:text-amber-300 bg-white dark:bg-slate-800 hover:bg-amber-50/70 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Für Apple / iOS Kalender (.ics) herunterladen"
          >
            {allDownloaded ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400">Geladen (.ics)</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>iOS Kalender</span>
                <Download className="w-3 h-3 text-slate-400" />
              </>
            )}
          </button>

          {/* 3. Neuen Termin anlegen */}
          <button
            onClick={() => handleOpenCreateModal(`${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedDayNumber || 15).padStart(2, '0')}`)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Termin anlegen</span>
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="space-y-6">
          {/* Calendar Grid - Übersichtlich & vollflächig */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-center py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {WEEKDAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 dark:bg-slate-800 gap-px">
              {/* Empty cells before month starts */}
              {Array.from({ length: firstDayOfWeek }).map((_, index) => (
                <div key={`empty-${index}`} className="bg-slate-50/50 dark:bg-slate-900/60 min-h-[75px] sm:min-h-[90px] p-2" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const dayNum = index + 1;
                const isToday =
                  dayNum === today.getDate() &&
                  currentMonth === (today.getMonth() + 1) &&
                  currentYear === today.getFullYear();
                const dayEvents = excursionsByDay[dayNum] || [];
                const isSelected = selectedDayNumber === dayNum;
                const matchingDayEvents = dayEvents.filter(matchesFilter);
                const isFilterActive = categoryFilter !== 'Alle' || Boolean(searchQuery.trim());
                const hasEvents = isFilterActive ? matchingDayEvents.length > 0 : dayEvents.length > 0;
                const displayedEvents = isFilterActive ? matchingDayEvents : dayEvents;

                return (
                  <div
                    key={`day-${dayNum}`}
                    onClick={() => {
                      if (selectedDayNumber === dayNum) {
                        setSelectedDayNumber(null);
                      } else {
                        setSelectedDayNumber(dayNum);
                      }
                    }}
                    className={`bg-white dark:bg-slate-900 min-h-[75px] sm:min-h-[90px] p-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'ring-2 ring-sky-500 ring-inset bg-sky-50/40 dark:bg-sky-950/40'
                        : isToday
                        ? 'ring-2 ring-red-500 ring-inset bg-red-50/70 dark:bg-red-950/40 shadow-2xs'
                        : isFilterActive && !hasEvents && dayEvents.length > 0
                        ? 'opacity-40 hover:opacity-80 hover:bg-slate-50 dark:hover:bg-slate-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-mono tabular-nums w-6 h-6 rounded-full flex items-center justify-center ${
                            isSelected
                              ? 'bg-sky-600 text-white font-bold shadow-2xs'
                              : isToday
                              ? 'bg-red-600 text-white font-black shadow-xs ring-2 ring-red-300 ring-offset-1'
                              : hasEvents
                              ? 'bg-slate-900 dark:bg-slate-700 text-white font-bold'
                              : 'text-slate-700 dark:text-slate-300 font-semibold'
                          }`}
                        >
                          {dayNum}
                        </span>

                        {isToday && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-red-700 bg-red-100 border border-red-300 px-1.5 py-0.2 rounded-md shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                            <span>Heute</span>
                          </span>
                        )}
                      </div>

                      {hasEvents && (
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded-full">
                          {displayedEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Event chips */}
                    <div className="space-y-1">
                      {displayedEvents.slice(0, 2).map((evt) => {
                        const evtClub = clubs.find(c => c.id === evt.organizerClubId);
                        const cColor = evtClub?.color || '#b91c1c';
                        return (
                          <div
                            key={evt.id}
                            className="text-[10px] p-1 rounded bg-slate-50 hover:bg-sky-50 text-slate-800 border truncate font-medium flex items-center gap-1 transition-colors"
                            style={{ borderLeftColor: cColor, borderLeftWidth: '3px' }}
                            title={`${evt.time} Uhr: ${evt.title} (${evtClub?.shortName || ''})`}
                          >
                            <span className="font-mono text-[9px] text-sky-700 font-bold shrink-0">{evt.time}</span>
                            <span className="truncate">{evt.title}</span>
                          </div>
                        );
                      })}
                      {displayedEvents.length > 2 && (
                        <span className="text-[9px] text-slate-500 block text-right font-medium">
                          +{displayedEvents.length - 2} weitere
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Direkt unterhalb des Kalenders: Filterleiste */}
          {renderFilterBar()}

          {/* Header für die Liste mit Veranstaltungen unter dem Kalender */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                {selectedDayNumber !== null
                  ? `Veranstaltungen am ${selectedDayNumber}. ${MONTH_NAMES[currentMonth - 1]} ${currentYear} (${displayedListEvents.length})`
                  : categoryFilter !== 'Alle' || searchQuery.trim()
                  ? `${showPastEvents ? 'Gefilterte Termine' : 'Kommende gefilterte Termine'} chronologisch geordnet (${displayedListEvents.length})`
                  : `${showPastEvents ? 'Alle Veranstaltungen' : 'Kommende Veranstaltungen'} chronologisch geordnet (${displayedListEvents.length})`}
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {selectedDayNumber !== null && (
                <button
                  type="button"
                  onClick={() => setSelectedDayNumber(null)}
                  className="px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Alle Tage anzeigen</span>
                </button>
              )}

              {selectedDayNumber === null && pastEventsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPastEvents(prev => !prev)}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                  title={showPastEvents ? 'Nur noch kommende Termine anzeigen' : 'Auch bereits vergangene Termine in der Liste anzeigen'}
                >
                  {showPastEvents ? 'Vergangene ausblenden' : `${pastEventsCount} vergangene anzeigen`}
                </button>
              )}

              <button
                type="button"
                onClick={() => handleOpenCreateModal(`${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedDayNumber || 15).padStart(2, '0')}`)}
                className="text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Neuer Termin</span>
              </button>
            </div>
          </div>

          {/* Tag-Filter Hinweis-Banner wenn ein Tag angeklickt wurde */}
          {selectedDayNumber !== null && (
            <div className={`flex items-center justify-between p-3 rounded-xl text-xs border ${
              targetDayDate && targetDayDate < todayStr
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                : 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-900/60 text-sky-900 dark:text-sky-200'
            }`}>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 shrink-0" />
                <span>
                  Angezeigt werden Termine für <strong>{selectedDayNumber}. {MONTH_NAMES[currentMonth - 1]} {currentYear}</strong>
                  {targetDayDate && targetDayDate < todayStr && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-200/80 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100">
                      Vergangener Tag
                    </span>
                  )}
                  {categoryFilter !== 'Alle' ? ` (Kategorie: „${categoryFilter}“)` : ''}.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayNumber(null)}
                className="text-xs font-bold underline cursor-pointer shrink-0 ml-2"
              >
                Zurück zu kommenden Terminen
              </button>
            </div>
          )}

          {/* Chronologische Liste der Veranstaltungen unterhalb des Kalenders */}
          {displayedListEvents.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {displayedListEvents.map(renderFusedEventCard)}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {selectedDayNumber !== null
                    ? `Am ${selectedDayNumber}. ${MONTH_NAMES[currentMonth - 1]} ${currentYear} keine Termine gefunden.`
                    : 'Keine Veranstaltungen für diesen Filter gefunden.'}
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                  {categoryFilter !== 'Alle'
                    ? `In der Kategorie „${categoryFilter}“ sind aktuell keine Termine hinterlegt.`
                    : searchQuery.trim()
                    ? `Für die Suche nach „${searchQuery}“ liegen keine Termine vor.`
                    : 'Es sind aktuell keine Termine hinterlegt.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('Alle');
                    setSearchQuery('');
                    setSelectedDayNumber(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Filter zurücksetzen</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Termin anlegen</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Agenda List View: Alle Veranstaltungen chronologisch geordnet */
        <div className="space-y-4">
          {/* Terminkategorien als Filter in Listenansicht */}
          {renderFilterBar()}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 px-1">
            <span>
              {displayedListEvents.length} {displayedListEvents.length === 1 ? 'geplante Veranstaltung' : 'geplante Veranstaltungen'} im Narrenkreis ({showPastEvents ? 'alle' : 'kommende'} chronologisch geordnet)
              {categoryFilter !== 'Alle' ? ` (${categoryFilter})` : ''}
            </span>
            <div className="flex items-center gap-2">
              {pastEventsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPastEvents(prev => !prev)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {showPastEvents ? 'Vergangene ausblenden' : `${pastEventsCount} vergangene anzeigen`}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleOpenCreateModal()}
                className="font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Neuer Termin</span>
              </button>
            </div>
          </div>

          {displayedListEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">Keine Veranstaltungen für diesen Filter gefunden.</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Passe die Filterung an oder erstelle einen neuen Termin für deinen Verein.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('Alle');
                    setSearchQuery('');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Filter zurücksetzen</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCreateModal()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Termin anlegen</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {displayedListEvents.map(renderFusedEventCard)}
            </div>
          )}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Neuen Termin / Veranstaltung anlegen
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseCreateModal}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Titel der Veranstaltung *
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Narrenkreissitzung JHV oder Großer Fastnachtsumzug"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kategorie *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Excursion['category'])}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-900"
                  >
                    {EXCURSION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Datum *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Beginn *
                  </label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Endzeit (optional)
                  </label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Veranstaltungsort / Halle / Treffpunkt *
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Dreschhalle, An der Nachtweide, 76297 Stutensee"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Treffpunkt Details / Parkplatz (optional)
                </label>
                <input
                  type="text"
                  placeholder="z.B. Haupteingang oder Parkplatz vor der Halle"
                  value={newMeetingPointDetails}
                  onChange={(e) => setNewMeetingPointDetails(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Hinweise & Ausrüstung (Kommentar / Agenda)
                </label>
                <textarea
                  rows={3}
                  placeholder={"Agenda:\n- Begrüßung\n- Neuwahlen"}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Termin speichern & veröffentlichen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Excursion Modal */}
      {editingExcursion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Termin / Veranstaltung bearbeiten</h3>
                  <p className="text-xs text-slate-500">Passe die Daten dieses Kalendereintrags an</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingExcursion(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Titel der Veranstaltung *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="z.B. Großer Fastnachtsumzug Bruchsal"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kategorie *
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as Excursion['category'])}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium text-slate-900 bg-white"
                >
                  {EXCURSION_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Datum *
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Beginn *
                  </label>
                  <input
                    type="time"
                    required
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ende (optional)
                  </label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Veranstaltungsort / Halle *
                </label>
                <input
                  type="text"
                  required
                  value={editLocationName}
                  onChange={(e) => setEditLocationName(e.target.value)}
                  placeholder="z.B. Dreschhalle, An der Nachtweide, 76297 Stutensee"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Treffpunkt Details / Parkplatz (optional)
                </label>
                <input
                  type="text"
                  value={editMeetingPointDetails}
                  onChange={(e) => setEditMeetingPointDetails(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Hinweise & Ausrüstung (Kommentar / Agenda)
                </label>
                <textarea
                  rows={3}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-slate-900 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingExcursion(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Änderungen speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmExcursion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Termin wirklich löschen?</h3>
              <p className="text-xs text-slate-500">
                Möchtest du die Veranstaltung <strong>"{deleteConfirmExcursion.title}"</strong> unwiderruflich aus dem Kalender entfernen?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmExcursion(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Unwiderruflich löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
