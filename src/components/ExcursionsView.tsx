import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  Search, 
  X, 
  Trash2, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  ChevronRight, 
  Edit2, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { Excursion, UserProfile, Club, EXCURSION_CATEGORIES } from '../utils/clubLogic';
import { ClubLogo } from './ClubLogo';
import { CalendarExportActions } from './CalendarExportActions';

interface ExcursionsViewProps {
  excursions: Excursion[];
  currentUser: UserProfile;
  clubs: Club[];
  onAddExcursion: (newExcursion: Excursion) => void;
  onRegisterAttendees: (excursionId: string, attendeeNames: string[]) => void;
  onCancelRegistration: (excursionId: string, registrationId: string) => void;
  onEditExcursion?: (excursionId: string, updated: Partial<Excursion>) => void;
  onDeleteExcursion?: (excursionId: string) => void;
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
  initialCreateDate?: string;
}

// Preset popular carnival meeting spots in Narrenkreis Bruchsal
const PRESET_MEETING_POINTS = [
  { name: 'Bruchsal Bürgerzentrum / Otto-Oppenheimer-Platz', lat: 49.1246, lng: 8.5983, details: 'Am Otto-Oppenheimer-Platz vor dem Bürgerzentrum' },
  { name: 'Schloss Bruchsal Ehrenhof', lat: 49.1293, lng: 8.5985, details: 'Haupteingang Schloss Bruchsal / Schlossgarten' },
  { name: 'Rathaus Bruchsal Marktplatz', lat: 49.1252, lng: 8.5976, details: 'Marktplatz Brunnen / Narrenbaum' },
  { name: 'Philippsburg Festhalle', lat: 49.2361, lng: 8.4533, details: 'Festhalle Philippsburg, Einsteinstraße' },
  { name: 'Odenheim Katzbachhalle', lat: 49.1833, lng: 8.7500, details: 'Parkplatz Katzbachhalle Odenheim' },
  { name: 'Untergrombach Bundschuhhalle', lat: 49.0850, lng: 8.5580, details: 'Parkplatz Bundschuhhalle Obergrombacher Straße' },
  { name: 'Heidelsheim Historischer Marktplatz', lat: 49.1000, lng: 8.6500, details: 'Marktplatz vor dem Torwächterhaus' }
];

export const ExcursionsView: React.FC<ExcursionsViewProps> = ({
  excursions,
  currentUser,
  clubs,
  onAddExcursion,
  onRegisterAttendees,
  onCancelRegistration,
  onEditExcursion,
  onDeleteExcursion,
  isCreateOpen,
  onCloseCreate,
  initialCreateDate
}) => {
  const [selectedExcursionId, setSelectedExcursionId] = useState<string | null>(excursions[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Alle');
  const [internalCreateModalOpen, setInternalCreateModalOpen] = useState(false);
  const isCreateModalOpen = isCreateOpen !== undefined ? isCreateOpen : internalCreateModalOpen;

  // Edit & Delete modal states
  const [editingExcursion, setEditingExcursion] = useState<Excursion | null>(null);
  const [deleteConfirmExcursion, setDeleteConfirmExcursion] = useState<Excursion | null>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editCategory, setEditCategory] = useState<Excursion['category']>('Fastnachtsumzug');
  const [editLocationName, setEditLocationName] = useState('');
  const [editMeetingPointDetails, setEditMeetingPointDetails] = useState('');
  const [editCoordinates, setEditCoordinates] = useState({ lat: 49.1246, lng: 8.5983 });
  const [editMaxParticipants, setEditMaxParticipants] = useState(50);
  const [editComment, setEditComment] = useState('');

  const handleOpenEdit = (exc: Excursion) => {
    setEditingExcursion(exc);
    setEditTitle(exc.title);
    setEditDate(exc.date);
    setEditTime(exc.time);
    setEditEndTime(exc.endTime || '');
    setEditCategory(exc.category);
    setEditLocationName(exc.locationName);
    setEditMeetingPointDetails(exc.meetingPointDetails || '');
    setEditCoordinates(exc.coordinates || { lat: 49.1246, lng: 8.5983 });
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
        coordinates: editCoordinates,
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
    if (selectedExcursionId === deleteConfirmExcursion.id) {
      const remaining = excursions.filter(e => e.id !== deleteConfirmExcursion.id);
      setSelectedExcursionId(remaining[0]?.id || null);
    }
    setDeleteConfirmExcursion(null);
  };

  const handleCloseCreateModal = () => {
    if (onCloseCreate) onCloseCreate();
    setInternalCreateModalOpen(false);
    setNewTitle('');
    setNewLocationName('');
    setNewMeetingDetails('');
    setNewComment('');
  };

  const handleOpenCreateModal = () => {
    setInternalCreateModalOpen(true);
  };

  // Create Excursion form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('2026-10-24');
  const [newTime, setNewTime] = useState('14:11');
  const [newEndTime, setNewEndTime] = useState('18:00');
  const [newLocationName, setNewLocationName] = useState('');
  const [newMeetingDetails, setNewMeetingDetails] = useState('');
  const [newCoordinates, setNewCoordinates] = useState({ lat: 49.1246, lng: 8.5983 });
  const [newCategory, setNewCategory] = useState<Excursion['category']>('Fastnachtsumzug');
  const [newComment, setNewComment] = useState('');
  const [newMaxCapacity, setNewMaxCapacity] = useState(100);

  // Sync date when initialCreateDate changes
  useEffect(() => {
    if (initialCreateDate) {
      setNewDate(initialCreateDate);
    }
  }, [initialCreateDate]);

  const categories = ['Alle', ...EXCURSION_CATEGORIES];

  const filteredExcursions = excursions.filter(exc => {
    const matchesCategory = categoryFilter === 'Alle' || exc.category === categoryFilter;
    const matchesSearch = !searchQuery.trim() ||
      exc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exc.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exc.organizerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedExcursion = excursions.find(e => e.id === selectedExcursionId) || filteredExcursions[0];
  const userClub = clubs.find(c => c.id === currentUser.clubId);

  const handleCreateExcursionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newLocationName.trim()) return;

    const newExc: Excursion = {
      id: `exc-${Date.now()}`,
      title: newTitle.trim(),
      date: newDate,
      time: newTime,
      endTime: newEndTime || undefined,
      locationName: newLocationName.trim(),
      meetingPointDetails: newMeetingDetails.trim(),
      coordinates: newCoordinates,
      category: newCategory,
      comment: newComment.trim(),
      organizerId: currentUser.id,
      organizerName: currentUser.name,
      organizerClubId: currentUser.clubId,
      maxParticipants: Number(newMaxCapacity) || 12,
      registrations: []
    };

    onAddExcursion(newExc);
    setSelectedExcursionId(newExc.id);
    handleCloseCreateModal();

    // Reset fields
    setNewTitle('');
    setNewLocationName('');
    setNewMeetingDetails('');
    setNewComment('');
  };

  const handleSelectPreset = (preset: typeof PRESET_MEETING_POINTS[0]) => {
    setNewLocationName(preset.name);
    setNewMeetingDetails(preset.details);
    setNewCoordinates({ lat: preset.lat, lng: preset.lng });
  };

  return (
    <div className="space-y-6">
      {/* Search and Top Filter */}
      <div className="flex items-center gap-2 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Veranstaltungen & Termine filtern..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              categoryFilter === cat
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid: Left List (cards) + Right Detail (Map + Teilnehmerliste + Multi-Club Registration) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: List of excursions (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>{filteredExcursions.length} geplante Ausflüge</span>
            <span>Klicke zur Detailansicht</span>
          </div>

          {filteredExcursions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Keine Ausflüge für diesen Filter gefunden.</p>
            </div>
          ) : (
            filteredExcursions.map((exc) => {
              const organizerClub = clubs.find(c => c.id === exc.organizerClubId);
              const isSelected = selectedExcursion?.id === exc.id;

              return (
                <div
                  key={exc.id}
                  onClick={() => setSelectedExcursionId(exc.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-sky-500 bg-white shadow-md ring-2 ring-sky-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md">
                      {exc.category}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-slate-500 font-medium">
                      {exc.date.split('-').reverse().join('.')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1">
                    {exc.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{exc.locationName}</span>
                    <span className="text-slate-300">·</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono tabular-nums">{exc.time} Uhr</span>
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <ClubLogo club={organizerClub} size="xs" />
                      <span className="text-[11px] font-medium text-slate-700 truncate max-w-[140px]">
                        {organizerClub?.shortName || organizerClub?.name}
                      </span>
                    </div>

                    <span className="text-xs font-semibold text-sky-700 flex items-center gap-0.5">
                      <span>Termin ansehen</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <div className="pt-2 mt-2 border-t border-dashed border-slate-100 flex flex-wrap items-center justify-between gap-1.5">
                    <CalendarExportActions excursion={exc} variant="compact" />

                    {(onEditExcursion || onDeleteExcursion) && (
                      <div className="flex items-center gap-1">
                        {onEditExcursion && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(exc);
                            }}
                            className="px-2 py-1 text-slate-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors border border-slate-200 bg-white shadow-2xs flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                            title="Veranstaltung bearbeiten"
                          >
                            <Edit2 className="w-3 h-3 text-sky-600" />
                            <span>Bearbeiten</span>
                          </button>
                        )}
                        {onDeleteExcursion && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmExcursion(exc);
                            }}
                            className="px-2 py-1 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200 bg-white shadow-2xs flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                            title="Veranstaltung löschen"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                            <span>Löschen</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right column: Selected Excursion Details (7 cols) */}
        <div className="lg:col-span-7">
          {selectedExcursion ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-6 p-6">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md">
                      {selectedExcursion.category}
                    </span>
                    <span className="text-xs text-slate-500">
                      Organisiert von <strong className="text-slate-800">{selectedExcursion.organizerName}</strong>
                    </span>
                  </div>
                  <ClubLogo 
                    club={clubs.find(c => c.id === selectedExcursion.organizerClubId)} 
                    size="sm" 
                    showName={true}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">
                    {selectedExcursion.title}
                  </h2>

                  {(onEditExcursion || onDeleteExcursion) && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {onEditExcursion && (
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(selectedExcursion)}
                          className="px-2.5 py-1.5 text-slate-700 hover:text-sky-700 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          title="Veranstaltung bearbeiten"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-sky-600" />
                          <span>Bearbeiten</span>
                        </button>
                      )}
                      {onDeleteExcursion && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmExcursion(selectedExcursion)}
                          className="px-2.5 py-1.5 text-slate-700 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          title="Veranstaltung löschen"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Löschen</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Timing & Location Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-sky-600 shrink-0">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Datum & Uhrzeit</span>
                    <span className="font-semibold text-slate-900 font-mono tabular-nums">
                      {selectedExcursion.date.split('-').reverse().join('.')} um {selectedExcursion.time} Uhr
                      {selectedExcursion.endTime ? ` bis ${selectedExcursion.endTime}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-rose-600 shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Treffpunkt & Ort</span>
                      <span className="font-semibold text-slate-900 block">
                        {selectedExcursion.locationName}
                      </span>
                      {selectedExcursion.meetingPointDetails && (
                        <span className="text-xs text-slate-500 block mt-0.5">
                          {selectedExcursion.meetingPointDetails}
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      selectedExcursion.locationName + (selectedExcursion.meetingPointDetails ? ' ' + selectedExcursion.meetingPointDetails : '')
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs shrink-0 transition-colors self-start sm:self-auto cursor-pointer"
                    title="In Google Maps öffnen und Route planen"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-rose-600" />
                    <span>Google Maps Route</span>
                  </a>
                </div>
              </div>

              {/* Kalender Export (Google & iOS) */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-50 to-amber-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Termin in deinen persönlichen Kalender eintragen
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Direkt in Google Kalender speichern oder als .ics für iPhone / iOS Kalender laden
                  </span>
                </div>
                <CalendarExportActions excursion={selectedExcursion} variant="buttons" />
              </div>

              {/* Kleines Kommentarfeld */}
              {selectedExcursion.comment && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Hinweise & Ausrüstung (Kommentar)</span>
                  </div>
                  <p className="text-xs text-amber-950 whitespace-pre-line leading-relaxed">
                    {selectedExcursion.comment}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <p className="text-sm text-slate-500">Wähle einen Ausflug aus der Liste links aus.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create New Excursion / Event Modal with Map coordinate picker */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Neue Veranstaltung / Ausflug planen
                </h3>
              </div>
              <button
                onClick={handleCloseCreateModal}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExcursionSubmit} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Titel des Ausflugs / Aktivität *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="z.B. Großer Fastnachtsumzug Bruchsal oder Rathaussturm"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategorie *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    {EXCURSION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Datum *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Uhrzeit (Start) *
                    </label>
                    <input
                      type="time"
                      required
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Endzeit (ca.)
                    </label>
                    <input
                      type="time"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ort & Treffpunkt Bezeichnung *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="z.B. Bürgerzentrum Bruchsal oder Marktplatz Philippsburg"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Genaue Treffpunkt-Details (z.B. Kasse, Schranke, Gleis)
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Haupteingang Bürgerzentrum, Aufstellung Wagen 14"
                    value={newMeetingDetails}
                    onChange={(e) => setNewMeetingDetails(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                {/* Kleines Kommentarfeld */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kleines Kommentarfeld (Wichtige Hinweise & Infos)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="z.B. Närrische Kleidung, Wurfmaterial erwünscht, Startaufstellung ab 13:30 Uhr..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
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
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors"
                >
                  Veranstaltung erstellen & veröffentlichen
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
                  <h3 className="text-base font-bold text-slate-900">Veranstaltung bearbeiten</h3>
                  <p className="text-xs text-slate-500">Passe die Daten dieses Termins an</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingExcursion(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
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
                  placeholder="z.B. Bruchsal Bürgerzentrum / Otto-Oppenheimer-Platz"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Treffpunkt-Details
                </label>
                <input
                  type="text"
                  value={editMeetingPointDetails}
                  onChange={(e) => setEditMeetingPointDetails(e.target.value)}
                  placeholder="z.B. Haupteingang vor dem Brunnen"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium text-slate-900"
                />
              </div>


              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Närrischer Hinweis / Kommentar
                </label>
                <textarea
                  rows={2}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Hinweise zu Häs, Verpflegung, Wurfmaterial..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium text-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingExcursion(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Änderungen speichern</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmExcursion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Termin wirklich löschen?</h3>
                <p className="text-xs text-slate-500">Diese Aktion kann nicht rückgängig gemacht werden</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">{deleteConfirmExcursion.title}</p>
              <p className="text-slate-500">
                {deleteConfirmExcursion.date.split('-').reverse().join('.')} um {deleteConfirmExcursion.time} Uhr · {deleteConfirmExcursion.locationName}
              </p>
              {deleteConfirmExcursion.registrations.length > 0 && (
                <p className="text-rose-600 font-medium pt-1">
                  Achtung: Es liegen bereits Anmeldungen von {deleteConfirmExcursion.registrations.length} Vereinsgruppen vor!
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmExcursion(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Termin löschen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
