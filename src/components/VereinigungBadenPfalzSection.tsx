import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Newspaper,
  FileEdit,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Calendar as CalendarIcon,
  ExternalLink,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  Download,
  BookOpen,
  Mail,
  Send,
  ChevronDown,
  Check,
  UserCheck,
  Phone,
  MapPin,
  Copy,
  Flag,
} from 'lucide-react';
import {
  AenderungStatus,
  Club,
  MeetingProtocol,
  SentEmail,
  UserProfile,
  VEREINIGUNG_LOGO_URL,
  VereinigungEntry,
  VereinigungEntryType,
  canManageVereinigungNews,
  isPraesidiumMember,
  isVereinigungNewsManager,
} from '../utils/clubLogic';
import { ClubLogo } from './ClubLogo';
import { ProtocolReaderModal } from './ProtocolReaderModal';

export type VereinigungSubTab = 'news' | 'aenderungsmitteilung';

interface VereinigungBadenPfalzSectionProps {
  currentUser: UserProfile;
  users: UserProfile[];
  clubs: Club[];
  entries: VereinigungEntry[];
  additionalNotificationEmails?: string[];
  activeSubTab: VereinigungSubTab;
  onSubTabChange: (tab: VereinigungSubTab) => void;
  onSaveEntry: (entry: VereinigungEntry) => void;
  onDeleteEntry: (entryId: string) => void;
  onSendEmail?: (email: SentEmail) => void;
  isCreateOpen: boolean;
  onOpenCreate: () => void;
  onCloseCreate: () => void;
}

const NEWS_CATEGORIES = [
  'Mitteilung',
  'Termin / Tagung',
  'Ehrung / Orden',
  'Verbandsinfo',
] as const;

const OFFICE_ROLE_OPTIONS = [
  'Präsident / Präsidentin',
  '1. Vorsitzender / 1. Vorsitzende',
  '2. Vorsitzender / 2. Vorsitzende',
  'Vizepräsident / Vizepräsidentin',
  'Zugmarschall',
  'Schriftführer / Schriftführerin',
  'Kassier / Schatzmeister',
  'Sitzungspräsident / Sitzungspräsidentin',
  'Ordensminister / Festwart',
  'Sonstiges Amt (eigene Eingabe)',
] as const;

const STATUS_OPTIONS: AenderungStatus[] = ['Entwurf', 'Gemeldet', 'Bestätigt'];

const MAX_NEWS_ATTACHMENT_BYTES = 700 * 1024; // 700 KB (~950 KB Base64, sicher unter Firestore 1 MiB Limit)

function getSafeHref(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const VereinigungBadenPfalzSection: React.FC<VereinigungBadenPfalzSectionProps> = ({
  currentUser,
  users,
  clubs,
  entries,
  additionalNotificationEmails = [],
  activeSubTab,
  onSubTabChange,
  onSaveEntry,
  onDeleteEntry,
  onSendEmail,
  isCreateOpen,
  onOpenCreate,
  onCloseCreate,
}) => {
  const isPraesidium = isPraesidiumMember(currentUser);
  const canManageNews = canManageVereinigungNews(currentUser);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Alle' | AenderungStatus>('Alle');

  // News Create / Edit modal state
  const [editingEntry, setEditingEntry] = useState<VereinigungEntry | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState<string>(NEWS_CATEGORIES[0]);
  const [formLinkUrl, setFormLinkUrl] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formAttachmentName, setFormAttachmentName] = useState<string | undefined>(undefined);
  const [formAttachmentSize, setFormAttachmentSize] = useState<number | undefined>(undefined);
  const [formAttachmentType, setFormAttachmentType] = useState<string | undefined>(undefined);
  const [formAttachmentData, setFormAttachmentData] = useState<string | undefined>(undefined);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Full-screen direct document reader for News attachments
  const [readerProtocol, setReaderProtocol] = useState<MeetingProtocol | null>(null);

  // Delete confirmation modal
  const [entryToDelete, setEntryToDelete] = useState<VereinigungEntry | null>(null);

  // Änderungsportal Form state
  const [portalClubId, setPortalClubId] = useState<string>(currentUser.clubId || '');
  const [isClubDropdownOpen, setIsClubDropdownOpen] = useState(false);
  const [clubSearchQuery, setClubSearchQuery] = useState('');
  const clubDropdownRef = useRef<HTMLDivElement | null>(null);
  const clubSearchInputRef = useRef<HTMLInputElement | null>(null);

  const [portalOfficeOption, setPortalOfficeOption] = useState<string>(OFFICE_ROLE_OPTIONS[0]);
  const [portalCustomOffice, setPortalCustomOffice] = useState('');
  const [portalNewName, setPortalNewName] = useState('');
  const [portalPredecessor, setPortalPredecessor] = useState('');
  const [portalAddress, setPortalAddress] = useState('');
  const [portalEmail, setPortalEmail] = useState('');
  const [portalPhone, setPortalPhone] = useState('');
  const [portalNotes, setPortalNotes] = useState('');
  const [portalError, setPortalError] = useState<string | null>(null);
  const [dispatchConfirmation, setDispatchConfirmation] = useState<{
    recipients: string[];
    subject: string;
    body: string;
    mailtoUrl: string;
    copied: boolean;
  } | null>(null);

  // Close searchable club dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        clubDropdownRef.current &&
        !clubDropdownRef.current.contains(event.target as Node)
      ) {
        setIsClubDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsClubDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isClubDropdownOpen) {
      setTimeout(() => clubSearchInputRef.current?.focus(), 20);
    }
  }, [isClubDropdownOpen]);

  // Target notification recipients: 2 Vereinigung role holders + additional Präsidium emails
  const vereinigungManagers = useMemo(
    () => users.filter((u) => isVereinigungNewsManager(u)),
    [users]
  );

  const targetNotificationEmails = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    const addEmail = (raw?: string) => {
      const cleaned = (raw || '').trim();
      if (!cleaned || !cleaned.includes('@')) return;
      const key = cleaned.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(cleaned);
      }
    };
    vereinigungManagers.forEach((u) => addEmail(u.email));
    additionalNotificationEmails.forEach((em) => addEmail(em));
    return list;
  }, [vereinigungManagers, additionalNotificationEmails]);

  const selectedPortalClub = useMemo(
    () => clubs.find((c) => c.id === portalClubId) || null,
    [clubs, portalClubId]
  );

  const filteredPortalClubs = useMemo(() => {
    const q = clubSearchQuery.trim().toLowerCase();
    if (!q) return clubs;
    return clubs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.shortName || '').toLowerCase().includes(q) ||
        (c.location || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q)
    );
  }, [clubs, clubSearchQuery]);

  const newsCount = useMemo(
    () => entries.filter((e) => e.type === 'news').length,
    [entries]
  );
  const aenderungCount = useMemo(
    () => entries.filter((e) => e.type === 'aenderungsmitteilung').length,
    [entries]
  );

  const visibleEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries
      .filter((e) => e.type === activeSubTab)
      .filter((e) => {
        if (activeSubTab === 'aenderungsmitteilung' && statusFilter !== 'Alle') {
          return (e.status || 'Gemeldet') === statusFilter;
        }
        return true;
      })
      .filter((e) => {
        if (!q) return true;
        return (
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          (e.clubName || '').toLowerCase().includes(q) ||
          (e.category || '').toLowerCase().includes(q) ||
          (e.officeRole || '').toLowerCase().includes(q) ||
          (e.newHolderName || '').toLowerCase().includes(q) ||
          (e.predecessorName || '').toLowerCase().includes(q) ||
          e.authorName.toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime() ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [entries, activeSubTab, statusFilter, searchQuery]);

  const resetNewsModalFields = () => {
    setFormTitle('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory(NEWS_CATEGORIES[0]);
    setFormLinkUrl('');
    setFormContent('');
    setFormAttachmentName(undefined);
    setFormAttachmentSize(undefined);
    setFormAttachmentType(undefined);
    setFormAttachmentData(undefined);
    setAttachmentError(null);
    setIsDraggingFile(false);
  };

  const openModalForCreateNews = () => {
    if (!canManageNews) return;
    setEditingEntry(null);
    resetNewsModalFields();
    onOpenCreate();
  };

  const openModalForEditNews = (entry: VereinigungEntry) => {
    if (!canManageNews) return;
    setEditingEntry(entry);
    setFormTitle(entry.title);
    setFormDate(entry.date);
    setFormCategory(entry.category || NEWS_CATEGORIES[0]);
    setFormLinkUrl(entry.linkUrl || '');
    setFormContent(entry.content);
    setFormAttachmentName(entry.attachmentName);
    setFormAttachmentSize(entry.attachmentSize);
    setFormAttachmentType(entry.attachmentType);
    setFormAttachmentData(entry.attachmentData);
    setAttachmentError(null);
    setIsDraggingFile(false);
    onOpenCreate();
  };

  useEffect(() => {
    if (isCreateOpen && !editingEntry) {
      resetNewsModalFields();
    }
  }, [isCreateOpen, editingEntry]);

  const handleCloseForm = () => {
    setEditingEntry(null);
    setAttachmentError(null);
    setIsDraggingFile(false);
    onCloseCreate();
  };

  const handleProcessAttachedFile = (file: File) => {
    setAttachmentError(null);
    if (file.size > MAX_NEWS_ATTACHMENT_BYTES) {
      setAttachmentError(
        `Die Datei „${file.name}“ ist ${formatFileSize(file.size)} groß. Maximal erlaubt sind 700 KB für die Cloud-Speicherung.`
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormAttachmentName(file.name);
        setFormAttachmentSize(file.size);
        setFormAttachmentType(file.type || 'application/octet-stream');
        setFormAttachmentData(reader.result);
      }
    };
    reader.onerror = () => {
      setAttachmentError('Datei konnte nicht gelesen werden. Bitte erneut versuchen.');
    };
    reader.readAsDataURL(file);
  };

  const handleDropAttachment = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessAttachedFile(file);
    }
  };

  const handleClearAttachment = () => {
    setFormAttachmentName(undefined);
    setFormAttachmentSize(undefined);
    setFormAttachmentType(undefined);
    setFormAttachmentData(undefined);
    setAttachmentError(null);
  };

  const handleSubmitNewsForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageNews) return;

    const title = formTitle.trim().slice(0, 200);
    const content = formContent.trim().slice(0, 5000);
    if (!title || !content) return;

    const nowIso = new Date().toISOString();
    const entry: VereinigungEntry = {
      id: editingEntry ? editingEntry.id : `vbpkv-${Date.now()}`,
      type: 'news' as VereinigungEntryType,
      title,
      content,
      date: formDate || nowIso.split('T')[0],
      category: formCategory.trim().slice(0, 80) || undefined,
      linkUrl: formLinkUrl.trim().slice(0, 500) || undefined,
      attachmentName: formAttachmentName,
      attachmentSize: formAttachmentSize,
      attachmentType: formAttachmentType,
      attachmentData: formAttachmentData,
      authorId: editingEntry ? editingEntry.authorId : currentUser.id,
      authorName: editingEntry ? editingEntry.authorName : currentUser.name,
      createdAt: editingEntry ? editingEntry.createdAt : nowIso,
      updatedAt: nowIso,
    };

    onSaveEntry(entry);
    handleCloseForm();
  };

  const handleQuickStatusChange = (entry: VereinigungEntry, nextStatus: AenderungStatus) => {
    if (!isPraesidium) return;
    onSaveEntry({
      ...entry,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleOpenAttachmentReader = (entry: VereinigungEntry) => {
    if (!entry.attachmentData || !entry.attachmentName) return;
    setReaderProtocol({
      id: entry.id,
      title: entry.title,
      date: entry.date,
      meetingType: 'Jahreshauptversammlung',
      description: entry.category || 'Verbands-News · Vereinigung Baden Pfalz',
      fileName: entry.attachmentName,
      fileSize: entry.attachmentSize || 0,
      fileType: entry.attachmentType || '',
      fileData: entry.attachmentData,
      uploadedByUserId: entry.authorId,
      uploadedByUserName: entry.authorName,
      uploadedAt: entry.createdAt,
    });
  };

  const triggerMailtoLaunch = (mailtoUrl: string) => {
    try {
      const link = document.createElement('a');
      link.href = mailtoUrl;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      // Fallback handled cleanly by confirmation banner button
    }
  };

  const handleSubmitAenderungPortal = (e: React.FormEvent) => {
    e.preventDefault();
    setPortalError(null);

    if (!selectedPortalClub) {
      setPortalError('Bitte wähle zunächst einen Verein über die Vereinsauswahl aus.');
      return;
    }

    const resolvedOffice =
      portalOfficeOption === 'Sonstiges Amt (eigene Eingabe)'
        ? portalCustomOffice.trim()
        : portalOfficeOption;

    if (!resolvedOffice) {
      setPortalError('Bitte gib das neu besetzte Amt an (Pflichtfeld).');
      return;
    }

    const holderName = portalNewName.trim();
    if (!holderName) {
      setPortalError('Bitte gib den Namen des neuen Amtsinhabers an (Pflichtfeld).');
      return;
    }

    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];
    const predecessor = portalPredecessor.trim();
    const address = portalAddress.trim();
    const email = portalEmail.trim();
    const phone = portalPhone.trim();
    const notes = portalNotes.trim();

    const summaryLines = [
      `Verein: ${selectedPortalClub.name}${selectedPortalClub.shortName ? ` (${selectedPortalClub.shortName})` : ''}`,
      `Neu besetztes Amt: ${resolvedOffice}`,
      `Neuer Amtsinhaber: ${holderName}`,
      `Vorgänger: ${predecessor || 'Nicht angegeben'}`,
      `Adresse: ${address || 'Nicht angegeben'}`,
      `E-Mail: ${email || 'Nicht angegeben'}`,
      `Telefonnummer: ${phone || 'Nicht angegeben'}`,
    ];
    if (notes) {
      summaryLines.push(`Bemerkung: ${notes}`);
    }
    const contentText = summaryLines.join('\n').slice(0, 5000);
    const clubLabel = selectedPortalClub.shortName || selectedPortalClub.name;
    const entryTitle = `${resolvedOffice}: ${holderName} (${clubLabel})`.slice(0, 200);

    const newEntry: VereinigungEntry = {
      id: `vbpkv-${Date.now()}`,
      type: 'aenderungsmitteilung',
      title: entryTitle,
      content: contentText,
      date: todayDate,
      category: 'Ämterwechsel',
      clubId: selectedPortalClub.id,
      clubName: selectedPortalClub.name.slice(0, 160),
      status: 'Gemeldet',
      officeRole: resolvedOffice.slice(0, 120),
      newHolderName: holderName.slice(0, 160),
      newHolderAddress: address ? address.slice(0, 240) : undefined,
      newHolderEmail: email ? email.slice(0, 160) : undefined,
      newHolderPhone: phone ? phone.slice(0, 80) : undefined,
      predecessorName: predecessor ? predecessor.slice(0, 160) : undefined,
      notifiedEmails: targetNotificationEmails.slice(0, 30),
      authorId: currentUser.id,
      authorName: currentUser.name,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    onSaveEntry(newEntry);

    const mailSubject = `Änderungsmitteilung Vereinigung Baden-Pfalz: ${resolvedOffice} (${clubLabel})`;
    const mailBody = [
      `Sehr geehrte Damen und Herren der Vereinigung Badisch-Pfälzischer Karnevalvereine e.V.,`,
      ``,
      `über das Änderungsportal des Narrenkreis Bruchsal wird folgende Neubesetzung eines Vereinsamtes gemeldet:`,
      ``,
      ...summaryLines,
      ``,
      `Gemeldet am: ${new Date().toLocaleDateString('de-DE')}`,
      `Gemeldet durch: ${currentUser.name} (${currentUser.email})`,
    ].join('\n');

    if (onSendEmail && targetNotificationEmails.length > 0) {
      const targetUserIds = users
        .filter((u) =>
          targetNotificationEmails.some(
            (em) => em.toLowerCase() === (u.email || '').trim().toLowerCase()
          )
        )
        .map((u) => u.id);

      const sentMail: SentEmail = {
        id: `mail-${Date.now()}`,
        senderUserId: currentUser.id,
        fromName: currentUser.name,
        fromEmail: currentUser.email,
        recipientType: 'multiple',
        targetId: targetUserIds.join(','),
        recipientDisplay: `Vereinigung Baden-Pfalz Verteiler (${targetNotificationEmails.length} Empfänger)`,
        recipientEmails: targetNotificationEmails,
        subject: mailSubject,
        body: mailBody,
        sentAt: nowIso,
      };
      onSendEmail(sentMail);
    }

    const toParam = targetNotificationEmails.map((em) => encodeURIComponent(em)).join(',');
    const mailtoUrl = `mailto:${toParam}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
    triggerMailtoLaunch(mailtoUrl);

    setDispatchConfirmation({
      recipients: targetNotificationEmails,
      subject: mailSubject,
      body: mailBody,
      mailtoUrl,
      copied: false,
    });

    // Clear personal inputs for clean subsequent entries while preserving selected club
    setPortalNewName('');
    setPortalPredecessor('');
    setPortalAddress('');
    setPortalEmail('');
    setPortalPhone('');
    setPortalNotes('');
    setPortalCustomOffice('');
  };

  return (
    <div className="space-y-5">
      {/* Header Card for Vereinigung Baden Pfalz */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-[2px] rounded-2xl border border-amber-200/80 dark:border-amber-900/50 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-14 rounded-xl overflow-hidden border border-amber-200 dark:border-amber-800 bg-white shrink-0 shadow-2xs">
            <img
              src={VEREINIGUNG_LOGO_URL}
              alt="Vereinigung Badisch-Pfälzischer Karnevalvereine e.V."
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-bold tracking-wide text-amber-800 dark:text-amber-400">
              Verbandsbereich · Vereinigung Badisch-Pfälzischer Karnevalvereine e.V.
            </p>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Vereinigung Baden Pfalz
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
              {activeSubTab === 'news'
                ? 'Verbands-News, Rundschreiben und angehängte Dokumente (Word, PDF) der Vereinigung.'
                : 'Offizielles Änderungsportal: Vereine melden neubesetzte Ämter direkt per E-Mail an die Vereinigung.'}
            </p>
          </div>
        </div>

        {activeSubTab === 'news' && canManageNews && (
          <button
            type="button"
            onClick={openModalForCreateNews}
            className="px-4 py-2.5 text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-400 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Neue News verfassen</span>
          </button>
        )}
      </div>

      {/* Two Nested Sub-Tabs: News & Änderungsmitteilung */}
      <div
        role="tablist"
        aria-label="Unterbereiche Vereinigung Baden Pfalz"
        className="flex flex-wrap items-center gap-2 bg-white/85 dark:bg-slate-900/85 backdrop-blur-[2px] p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs w-full sm:w-fit"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'news'}
          onClick={() => onSubTabChange('news')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'news'
              ? 'bg-slate-900 dark:bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>News</span>
          <span
            className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-md ${
              activeSubTab === 'news'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {newsCount}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeSubTab === 'aenderungsmitteilung'}
          onClick={() => onSubTabChange('aenderungsmitteilung')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'aenderungsmitteilung'
              ? 'bg-slate-900 dark:bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileEdit className="w-4 h-4" />
          <span>Änderungsmitteilung</span>
          <span
            className={`text-[11px] font-mono tabular-nums px-1.5 py-0.5 rounded-md ${
              activeSubTab === 'aenderungsmitteilung'
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {aenderungCount}
          </span>
        </button>
      </div>

      {/* Role Notice for Non-Admin Vereinigung News Managers */}
      {isVereinigungNewsManager(currentUser) && !isPraesidium && (
        <div className="bg-amber-50/95 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 flex items-center gap-3 text-xs text-amber-950 dark:text-amber-200">
          <Flag className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
          <span>
            Du bist als <strong>{currentUser.vereinigungRole}</strong> hinterlegt: Du kannst hier im Bereich{' '}
            <strong>News</strong> neue Verbands-News inkl. Word/PDF-Dateien per Drag & Drop veröffentlichen, bearbeiten und löschen (ohne Admin-Rechte im Narrenkreis).
          </span>
        </div>
      )}

      {/* ÄNDERUNGSPORTAL FORM (directly accessible on Änderungsmitteilung tab) */}
      {activeSubTab === 'aenderungsmitteilung' && (
        <section className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-[2px] rounded-2xl border border-amber-200 dark:border-amber-900/60 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 text-xs font-bold">
                <Send className="w-4 h-4" />
                <span>Änderungsportal · Vereinsämter direkt an die Vereinigung melden</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Neubesetzung eines Vereinsamtes melden
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Melde hier z.B. einen neuen Präsidenten, Vorsitzenden oder Zugmarschall. Pflichtfelder sind mit * markiert. Die Meldung geht direkt per E-Mail an die Beauftragten der Vereinigung und weitere hinterlegte Empfänger.
              </p>
            </div>
          </div>

          {dispatchConfirmation && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 space-y-3 text-xs animate-in fade-in duration-150">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">
                      Änderungsmitteilung gespeichert & E-Mail-Versand ausgelöst
                    </p>
                    <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
                      {dispatchConfirmation.recipients.length > 0 ? (
                        <>
                          Die Meldung wurde im App-Postfach an{' '}
                          <strong className="font-mono">
                            {dispatchConfirmation.recipients.join(', ')}
                          </strong>{' '}
                          gesendet und im Änderungsregister erfasst.
                        </>
                      ) : (
                        <>
                          Die Meldung wurde gespeichert. Hinweis: Im Präsidium wurden noch keine Vereinigungs-Rollen oder zusätzliche E-Mail-Adressen hinterlegt.
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDispatchConfirmation(null)}
                  className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 p-1 rounded-lg cursor-pointer"
                  aria-label="Hinweis schließen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={dispatchConfirmation.mailtoUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-2xs transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Im E-Mail-Programm öffnen</span>
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        `${dispatchConfirmation.subject}\n\n${dispatchConfirmation.body}`
                      );
                      setDispatchConfirmation((prev) =>
                        prev ? { ...prev, copied: true } : null
                      );
                    } catch {
                      // Ignore clipboard restrictions
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold hover:bg-emerald-100/60 transition-colors cursor-pointer"
                >
                  {dispatchConfirmation.copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {dispatchConfirmation.copied ? 'Text kopiert!' : 'Meldungstext kopieren'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {portalError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{portalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitAenderungPortal} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Searchable Dropdown für Vereinsauswahl (Pflichtfeld) */}
              <div ref={clubDropdownRef} className="relative">
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Vereinsauswahl (Dropdown mit Suchfunktion) *
                </label>
                <button
                  type="button"
                  onClick={() => setIsClubDropdownOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={isClubDropdownOpen}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-left flex items-center justify-between gap-2 hover:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-colors cursor-pointer"
                >
                  {selectedPortalClub ? (
                    <span className="flex items-center gap-2.5 min-w-0">
                      <ClubLogo club={selectedPortalClub} size="xs" />
                      <span className="truncate font-semibold text-sm text-slate-900 dark:text-white">
                        {selectedPortalClub.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                        ({selectedPortalClub.shortName})
                      </span>
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">Bitte Verein suchen & auswählen...</span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                      isClubDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isClubDropdownOpen && (
                  <div
                    role="listbox"
                    aria-label="Vereinsauswahl"
                    className="absolute left-0 right-0 mt-1.5 z-40 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                  >
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          ref={clubSearchInputRef}
                          type="text"
                          value={clubSearchQuery}
                          onChange={(e) => setClubSearchQuery(e.target.value)}
                          placeholder="Verein, Kürzel oder Ort suchen..."
                          className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                        />
                        {clubSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setClubSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                            aria-label="Suche leeren"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredPortalClubs.length === 0 ? (
                        <div className="py-5 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
                          Kein Verein für „{clubSearchQuery}“ gefunden.
                        </div>
                      ) : (
                        filteredPortalClubs.map((club) => {
                          const isSelected = club.id === portalClubId;
                          return (
                            <button
                              key={club.id}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                setPortalClubId(club.id);
                                setIsClubDropdownOpen(false);
                                setClubSearchQuery('');
                              }}
                              className={`w-full px-3 py-2.5 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-950 dark:text-amber-200 font-bold'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <ClubLogo club={club} size="xs" />
                                <div className="min-w-0">
                                  <span className="text-xs font-semibold block truncate">
                                    {club.name}
                                  </span>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                                    {club.shortName}
                                    {club.location ? ` · ${club.location}` : ''}
                                  </span>
                                </div>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Amt (Pflichtfeld) */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Neu besetztes Amt *
                </label>
                <select
                  value={portalOfficeOption}
                  onChange={(e) => setPortalOfficeOption(e.target.value)}
                  className="w-full min-h-[44px] text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                >
                  {OFFICE_ROLE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {portalOfficeOption === 'Sonstiges Amt (eigene Eingabe)' && (
                  <input
                    type="text"
                    required
                    maxLength={120}
                    placeholder="Bezeichnung des Amtes eingeben *"
                    value={portalCustomOffice}
                    onChange={(e) => setPortalCustomOffice(e.target.value)}
                    className="mt-2 w-full text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name des neuen Amtsinhabers (Pflichtfeld) */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Name (neuer Amtsinhaber) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={160}
                  placeholder="Vor- und Nachname des neuen Amtsinhabers"
                  value={portalNewName}
                  onChange={(e) => setPortalNewName(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              {/* Vorgänger */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Vorgänger (bisheriger Amtsinhaber)
                </label>
                <input
                  type="text"
                  maxLength={160}
                  placeholder="Vor- und Nachname des Vorgängers"
                  value={portalPredecessor}
                  onChange={(e) => setPortalPredecessor(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Adresse */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Adresse (optional)
                </label>
                <input
                  type="text"
                  maxLength={240}
                  placeholder="Straße Hausnr., PLZ Ort"
                  value={portalAddress}
                  onChange={(e) => setPortalAddress(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              {/* E-Mail */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  E-Mail (optional)
                </label>
                <input
                  type="email"
                  maxLength={160}
                  placeholder="vorstand@verein.de"
                  value={portalEmail}
                  onChange={(e) => setPortalEmail(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              {/* Telefonnummer */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Telefonnummer (optional)
                </label>
                <input
                  type="tel"
                  maxLength={80}
                  placeholder="+49 170 1234567"
                  value={portalPhone}
                  onChange={(e) => setPortalPhone(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Zusätzliche Hinweise (optional)
              </label>
              <textarea
                rows={2}
                maxLength={1000}
                placeholder="z.B. gewählt bei der Generalversammlung, gültig ab..."
                value={portalNotes}
                onChange={(e) => setPortalNotes(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>

            {/* Live E-Mail Recipient Preview */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>E-Mail-Empfänger dieser Meldung ({targetNotificationEmails.length})</span>
                </span>
              </div>
              {targetNotificationEmails.length === 0 ? (
                <p className="text-[11px] text-amber-800 dark:text-amber-400">
                  Hinweis: Derzeit sind noch keine Inhaber der beiden Vereinigungs-Rollen oder zusätzliche E-Mails im Präsidium hinterlegt.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {targetNotificationEmails.map((em) => {
                    const matchedUser = vereinigungManagers.find(
                      (u) => (u.email || '').trim().toLowerCase() === em.toLowerCase()
                    );
                    return (
                      <span
                        key={em}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-mono"
                      >
                        {matchedUser ? (
                          <span>
                            {matchedUser.name} ({matchedUser.vereinigungRole}) · {em}
                          </span>
                        ) : (
                          <span>{em}</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                * Pflichtfelder: Vereinsauswahl, Amt und Name des neuen Amtsinhabers.
              </span>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-400 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                <span>Änderungsmitteilung per E-Mail absenden</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-[2px] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeSubTab === 'news'
                ? 'News nach Titel, Inhalt oder Verfasser durchsuchen...'
                : 'Eingegangene Änderungsmitteilungen nach Verein, Amt oder Name suchen...'
            }
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
          />
        </div>

        {activeSubTab === 'aenderungsmitteilung' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {(['Alle', ...STATUS_OPTIONS] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-amber-800 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        {visibleEntries.length === 0 ? (
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-[2px] rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
            {activeSubTab === 'news' ? (
              <Newspaper className="w-10 h-10 text-amber-500/70 mx-auto" />
            ) : (
              <FileEdit className="w-10 h-10 text-amber-500/70 mx-auto" />
            )}
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {activeSubTab === 'news'
                  ? 'Noch keine Verbands-News eingetragen'
                  : 'Noch keine Änderungsmitteilungen vorhanden'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                {activeSubTab === 'news'
                  ? 'Hier erscheinen aktuelle Rundschreiben, News und angehängte Dokumente der Vereinigung Badisch-Pfälzischer Karnevalvereine e.V.'
                  : 'Nutze das Formular oben, um Neubesetzungen von Vereinsämtern direkt an die Vereinigung zu melden.'}
              </p>
            </div>
            {activeSubTab === 'news' && canManageNews && (
              <button
                type="button"
                onClick={openModalForCreateNews}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-400 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Erste News anlegen</span>
              </button>
            )}
          </div>
        ) : (
          visibleEntries.map((entry) => {
            const safeLink = getSafeHref(entry.linkUrl);
            const formattedDate = entry.date
              ? new Date(entry.date).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : '';

            const status = entry.status || 'Gemeldet';
            const statusColor =
              status === 'Bestätigt'
                ? 'text-emerald-700 dark:text-emerald-400'
                : status === 'Gemeldet'
                ? 'text-sky-700 dark:text-sky-400'
                : 'text-amber-700 dark:text-amber-400';

            const canEditOrDeleteThisEntry =
              entry.type === 'news'
                ? canManageNews
                : isPraesidium || entry.authorId === currentUser.id;

            return (
              <article
                key={entry.id}
                className="bg-white/92 dark:bg-slate-900/92 backdrop-blur-[2px] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Crisp Typographic Meta Line (max 3 separators, no nested pills) */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-bold text-amber-800 dark:text-amber-400">
                        {entry.category ||
                          (entry.type === 'news' ? 'Verbands-News' : 'Änderungsmitteilung')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        {formattedDate}
                      </span>
                      {entry.type === 'aenderungsmitteilung' && entry.clubName && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {entry.clubName}
                          </span>
                        </>
                      )}
                      {entry.type === 'aenderungsmitteilung' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className={`inline-flex items-center gap-1 font-bold ${statusColor}`}>
                            {status === 'Bestätigt' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Clock className="w-3.5 h-3.5" />
                            )}
                            {status}
                          </span>
                        </>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {entry.title}
                    </h4>
                  </div>

                  {/* Card Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start">
                    {entry.type === 'aenderungsmitteilung' && isPraesidium && (
                      <select
                        value={status}
                        onChange={(e) =>
                          handleQuickStatusChange(entry, e.target.value as AenderungStatus)
                        }
                        aria-label="Status ändern"
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    )}

                    {entry.type === 'news' && canManageNews && (
                      <button
                        type="button"
                        onClick={() => openModalForEditNews(entry)}
                        className="min-h-[36px] px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-700 dark:hover:text-sky-300 bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="News bearbeiten"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        <span className="hidden sm:inline">Bearbeiten</span>
                      </button>
                    )}

                    {canEditOrDeleteThisEntry && (
                      <button
                        type="button"
                        onClick={() => setEntryToDelete(entry)}
                        className="min-h-[36px] px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Eintrag löschen"
                        aria-label="Eintrag löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Structured Office-Change Grid for Änderungsmitteilung */}
                {entry.type === 'aenderungsmitteilung' && (entry.officeRole || entry.newHolderName) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 text-xs">
                    {entry.officeRole && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Amt
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {entry.officeRole}
                        </span>
                      </div>
                    )}
                    {entry.newHolderName && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Neuer Amtsinhaber
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white inline-flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {entry.newHolderName}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Vorgänger
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {entry.predecessorName || 'Nicht angegeben'}
                      </span>
                    </div>
                    {entry.newHolderAddress && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Adresse
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {entry.newHolderAddress}
                        </span>
                      </div>
                    )}
                    {entry.newHolderEmail && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          E-Mail
                        </span>
                        <a
                          href={`mailto:${entry.newHolderEmail}`}
                          className="text-sky-700 dark:text-sky-400 hover:underline font-mono"
                        >
                          {entry.newHolderEmail}
                        </a>
                      </div>
                    )}
                    {entry.newHolderPhone && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Telefon
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 font-mono inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          {entry.newHolderPhone}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {entry.content}
                  </p>
                )}

                {/* News Drag & Drop File Attachment Card */}
                {entry.attachmentData && entry.attachmentName && (
                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                          {entry.attachmentName}
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          Angehängtes Dokument{entry.attachmentSize ? ` · ${formatFileSize(entry.attachmentSize)}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenAttachmentReader(entry)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Direkt lesen</span>
                      </button>
                      <a
                        href={entry.attachmentData}
                        download={entry.attachmentName}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                )}

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>
                    Erfasst von {entry.authorName}
                    {entry.notifiedEmails && entry.notifiedEmails.length > 0 && (
                      <> · Informiert: {entry.notifiedEmails.join(', ')}</>
                    )}
                  </span>

                  {safeLink && (
                    <a
                      href={safeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-400 hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Weiterführender Link öffnen</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Modal: Create / Edit News (Only for Vereinigung Managers & Präsidium) */}
      {isCreateOpen && canManageNews && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingEntry ? 'Verbands-News bearbeiten' : 'Neue Verbands-News verfassen'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseForm}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
                aria-label="Dialog schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewsForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Überschrift / Titel *
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  placeholder="z.B. Jahrestagung der Vereinigung Baden Pfalz 2027"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Datum *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Kategorie *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  >
                    {NEWS_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Inhalt / Meldung *
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={5000}
                  placeholder="Wichtige Informationen, Beschlüsse oder Termine der Vereinigung Baden Pfalz..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              {/* Drag & Drop Datei-Upload (Word, PDF, Bilder, Text) */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-200">
                  Datei per Drag & Drop anhängen (Word, PDF, Text, Bild – optional)
                </label>

                <div
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingFile(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingFile(false);
                  }}
                  onDrop={handleDropAttachment}
                  className={`relative rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
                    isDraggingFile
                      ? 'border-amber-500 bg-amber-50/90 dark:bg-amber-950/50'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/60 hover:border-amber-400'
                  }`}
                >
                  <input
                    type="file"
                    id="vereinigung-news-file-input"
                    accept=".pdf,.doc,.docx,.txt,.md,.odt,.png,.jpg,.jpeg,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProcessAttachedFile(file);
                      e.target.value = '';
                    }}
                  />
                  <label
                    htmlFor="vereinigung-news-file-input"
                    className="flex flex-col items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      Datei hierher ziehen (Drag & Drop) oder klicken
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Unterstützt Word (.docx, .doc), PDF, Textdateien und Bilder (max. 700 KB)
                    </span>
                  </label>
                </div>

                {attachmentError && (
                  <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    {attachmentError}
                  </p>
                )}

                {formAttachmentName && formAttachmentData && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {formAttachmentName}
                      </span>
                      {formAttachmentSize && (
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                          ({formatFileSize(formAttachmentSize)})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleClearAttachment}
                      className="text-rose-600 dark:text-rose-400 hover:underline text-[11px] font-semibold shrink-0 cursor-pointer"
                    >
                      Entfernen
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Weiterführender Link (optional)
                </label>
                <input
                  type="text"
                  maxLength={500}
                  placeholder="https://..."
                  value={formLinkUrl}
                  onChange={(e) => setFormLinkUrl(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-400 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingEntry ? 'Änderungen speichern' : 'News veröffentlichen'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {entryToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Eintrag wirklich löschen?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Möchtest du den Eintrag{' '}
                <strong className="text-slate-900 dark:text-white">
                  „{entryToDelete.title}“
                </strong>{' '}
                wirklich aus dem Bereich Vereinigung Baden Pfalz entfernen?
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEntryToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteEntry(entryToDelete.id);
                  setEntryToDelete(null);
                }}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ja, löschen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Full-Screen Document Reader for News Attachments (.docx / .pdf / txt / image) */}
      {readerProtocol && (
        <ProtocolReaderModal
          protocol={readerProtocol}
          onClose={() => setReaderProtocol(null)}
        />
      )}
    </div>
  );
};
