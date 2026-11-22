import React, { useState, useRef } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Download, 
  Trash2, 
  Calendar as CalendarIcon, 
  User, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  X, 
  FileCheck,
  Eye,
  AlertTriangle,
  Printer,
  Loader2
} from 'lucide-react';
import { MeetingProtocol, UserProfile, isPraesidiumMember } from '../utils/clubLogic';
import { ProtocolReaderModal } from './ProtocolReaderModal';
import {
  detectProtocolKind,
  getProtocolFormatLabel,
  printProtocolDocument
} from '../utils/protocolDocument';

interface ProtocolsViewProps {
  protocols: MeetingProtocol[];
  currentUser: UserProfile;
  onAddProtocol: (protocol: MeetingProtocol) => void;
  onDeleteProtocol: (protocolId: string) => void;
}

export const ProtocolsView: React.FC<ProtocolsViewProps> = ({
  protocols,
  currentUser,
  onAddProtocol,
  onDeleteProtocol
}) => {
  const isPraesidium = isPraesidiumMember(currentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('Alle');
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);

  // Staged file for upload
  const [stagedFile, setStagedFile] = useState<{
    file: File;
    dataUrl: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  } | null>(null);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDate, setUploadDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [uploadMeetingType, setUploadMeetingType] = useState<MeetingProtocol['meetingType']>('Narrenkreissitzung');
  const [uploadDescription, setUploadDescription] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Preview modal for protocols
  const [previewProtocol, setPreviewProtocol] = useState<MeetingProtocol | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [printError, setPrintError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const meetingTypes: Array<MeetingProtocol['meetingType']> = [
    'Narrenkreissitzung',
    'Jahreshauptversammlung'
  ];

  const filterOptions = ['Alle', ...meetingTypes];

  // Helper to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 1-Klick Drucken & PDF Speichern für Protokolle (inkl. DOCX & PDF)
  const handlePrintProtocol = async (proto: MeetingProtocol) => {
    setPrintError(null);
    setPrintingId(proto.id);
    const res = await printProtocolDocument(proto);
    setPrintingId(null);
    if (!res.ok && res.error) {
      setPrintError(res.error);
    }
  };

  // Process dropped or selected file
  const handleProcessFile = (file: File) => {
    setDragError(null);
    const maxSizeBytes = 15 * 1024 * 1024; // 15MB limit
    if (file.size > maxSizeBytes) {
      setDragError('Die Datei überschreitet die maximale Größe von 15 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        setDragError('Fehler beim Einlesen der Datei.');
        return;
      }

      // Default title from filename (strip extension)
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      setStagedFile({
        file,
        dataUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream'
      });
      setUploadTitle(cleanName);
      setUploadDate(new Date().toISOString().split('T')[0]);
      setUploadDescription('');
    };

    reader.onerror = () => {
      setDragError('Datei konnte nicht gelesen werden.');
    };

    reader.readAsDataURL(file);
  };

  // Drag handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving drop container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleSaveProtocol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stagedFile || !uploadTitle.trim()) return;

    const newProtocol: MeetingProtocol = {
      id: `proto-${Date.now()}`,
      title: uploadTitle.trim(),
      date: uploadDate,
      meetingType: uploadMeetingType,
      description: uploadDescription.trim() || undefined,
      fileName: stagedFile.fileName,
      fileSize: stagedFile.fileSize,
      fileType: stagedFile.fileType,
      fileData: stagedFile.dataUrl,
      uploadedByUserId: currentUser.id,
      uploadedByUserName: currentUser.name,
      uploadedAt: new Date().toISOString()
    };

    onAddProtocol(newProtocol);
    setStagedFile(null);
    setUploadTitle('');
    setUploadDescription('');
    setStatusMessage(`Protokoll „${newProtocol.title}“ erfolgreich hochgeladen!`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleCancelStaging = () => {
    setStagedFile(null);
    setUploadTitle('');
    setUploadDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filtered protocols
  const filteredProtocols = protocols.filter(p => {
    const matchesType = typeFilter === 'Alle' || p.meetingType === typeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      p.fileName.toLowerCase().includes(q) ||
      p.uploadedByUserName.toLowerCase().includes(q) ||
      p.date.includes(q);
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
              Sitzungsprotokolle des Narrenkreis Bruchsal
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Offizielles Archiv für Narrenkreissitzungen, Präsidiumssitzungen und Versammlungen. 
            Lade neue Protokolle bequem per Drag & Drop hoch oder lies archivierte PDF- und Word-Protokolle direkt in der App.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Gespeichert:</span>
            <strong className="text-slate-800 dark:text-slate-100 font-bold tabular-nums">{protocols.length} Protokolle</strong>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}

      {printError && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl text-xs flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{printError}</span>
          </div>
          <button
            type="button"
            onClick={() => setPrintError(null)}
            className="p-1 hover:opacity-75 cursor-pointer"
            aria-label="Hinweis schließen"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* DRAG AND DROP UPLOAD ZONE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Neues Protokoll hochladen (Drag & Drop)</span>
          </span>
          <span className="text-[11px] font-normal text-slate-400">
            PDF, Word, Text oder Bild (max. 15 MB)
          </span>
        </h3>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          accept=".pdf,.doc,.docx,.txt,.odt,.rtf,.png,.jpg,.jpeg"
          className="hidden"
        />

        {!stagedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/50 scale-[1.01] shadow-md ring-4 ring-sky-500/10'
                : 'border-slate-300 dark:border-slate-700 hover:border-sky-400 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-sky-50/30 dark:hover:bg-sky-950/20'
            }`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isDragging ? 'bg-sky-600 text-white' : 'bg-white dark:bg-slate-800 shadow-xs text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700'
            }`}>
              <UploadCloud className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {isDragging ? 'Datei jetzt loslassen zum Hochladen' : 'Datei hierher ziehen & ablegen (Drag & Drop)'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                oder <span className="text-sky-600 dark:text-sky-400 font-semibold underline underline-offset-2">hier klicken</span>, um eine Datei vom Gerät auszuwählen
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>.PDF</span>
              <span aria-hidden="true">·</span>
              <span>.DOCX</span>
              <span aria-hidden="true">·</span>
              <span>.TXT</span>
              <span aria-hidden="true">·</span>
              <span>.JPG / .PNG</span>
            </div>

            {dragError && (
              <div className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{dragError}</span>
              </div>
            )}
          </div>
        ) : (
          /* Staged file configuration form */
          <form onSubmit={handleSaveProtocol} className="p-4 sm:p-5 bg-sky-50/50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/70 rounded-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-sky-200/80 dark:border-sky-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Ausgewählte Datei bereit</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {stagedFile.fileName} · {formatFileSize(stagedFile.fileSize)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCancelStaging}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
                title="Datei verwerfen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Titel des Protokolls *
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Protokoll Narrenkreissitzung Herbst 2026"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Sitzungs-Art *
                </label>
                <select
                  value={uploadMeetingType}
                  onChange={(e) => setUploadMeetingType(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium text-slate-900 dark:text-white"
                >
                  {meetingTypes.map(mt => (
                    <option key={mt} value={mt}>{mt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Sitzungs-Datum *
                </label>
                <input
                  type="date"
                  required
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Kurze Inhaltsangabe / Wichtige Beschlüsse (optional)
                </label>
                <input
                  type="text"
                  placeholder="z.B. Beschlüsse zur Zugaufstellung, Neuwahlen, Ordensmatinee..."
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-200/80 dark:border-sky-800/60">
              <button
                type="button"
                onClick={handleCancelStaging}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Protokoll speichern & ablegen</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Protokolle nach Titel, Datum oder Verfasser suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-xs">
          {filterOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setTypeFilter(opt)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                typeFilter === opt
                  ? 'bg-slate-900 dark:bg-red-700 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* PROTOCOLS LIST */}
      <div className="space-y-3">
        {filteredProtocols.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Keine Protokolle gefunden</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto">
              Für die aktuelle Auswahl liegen noch keine Dokumente vor. Ziehe oben eine Datei in das Drag & Drop Feld, um das erste Protokoll hochzuladen.
            </p>
          </div>
        ) : (
          filteredProtocols.map((proto) => {
            const docKind = detectProtocolKind(proto);
            const formatLabel = getProtocolFormatLabel(docKind);
            const isCanDelete = isPraesidium;
            const isCurrentlyPrinting = printingId === proto.id;

            return (
              <div
                key={proto.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className={`font-bold ${
                        proto.meetingType === 'Narrenkreissitzung'
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-purple-700 dark:text-purple-400'
                      }`}>
                        {proto.meetingType}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Sitzungsdatum:{' '}
                          <strong className="text-slate-700 dark:text-slate-200 font-mono tabular-nums">
                            {new Date(proto.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </strong>
                        </span>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {proto.title}
                    </h3>

                    {proto.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {proto.description}
                      </p>
                    )}
                  </div>

                  {/* Actions: In-App Vorschau, Drucken & Download */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
                    <button
                      type="button"
                      onClick={() => setPreviewProtocol(proto)}
                      className="min-h-[40px] px-3 py-2 bg-red-50 hover:bg-red-100 text-red-800 dark:bg-red-950/50 dark:hover:bg-red-900/60 dark:text-red-300 dark:border-red-800/60 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Protokoll direkt in der Vollbild-Leseansicht öffnen"
                    >
                      <Eye className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                      <span>Öffnen / Lesen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handlePrintProtocol(proto)}
                      disabled={isCurrentlyPrinting}
                      className="min-h-[40px] px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-950 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 dark:text-amber-200 dark:border-amber-800/60 border border-amber-200/90 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
                      title="Protokoll sauber drucken oder als PDF speichern"
                    >
                      {isCurrentlyPrinting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700 dark:text-amber-400" />
                      ) : (
                        <Printer className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                      )}
                      <span className="hidden sm:inline">Drucken</span>
                    </button>

                    <a
                      href={proto.fileData}
                      download={proto.fileName}
                      className="min-h-[40px] px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow flex items-center gap-1.5 transition-all cursor-pointer"
                      title={`${proto.fileName} herunterladen`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </a>

                    {isCanDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          if (isPraesidium) {
                            setDeleteConfirmId(proto.id);
                          }
                        }}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                        title="Protokoll löschen (nur Präsidium)"
                        aria-label="Protokoll löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                      {proto.fileName}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{formatFileSize(proto.fileSize)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {formatLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Hochgeladen von {proto.uploadedByUserName}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FULLSCREEN MOBILE-FIRST PROTOCOL READER */}
      {previewProtocol && (
        <ProtocolReaderModal
          protocol={previewProtocol}
          onClose={() => setPreviewProtocol(null)}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && isPraesidium && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Protokoll dauerhaft löschen?</h3>
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">Nur für Präsidiumsmitglieder</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              Das Dokument wird unwiderruflich aus dem Narrenkreis-Archiv und der Cloud-Datenbank gelöscht. Es wird auch bei einer Aktualisierung der Seite nicht wiederhergestellt.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProtocol(deleteConfirmId);
                  setDeleteConfirmId(null);
                  setStatusMessage('Protokoll dauerhaft gelöscht.');
                  setTimeout(() => setStatusMessage(null), 3000);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
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
