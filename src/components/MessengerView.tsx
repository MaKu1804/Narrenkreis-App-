import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  Users, 
  User, 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  ExternalLink, 
  Trash2, 
  Inbox, 
  AlertTriangle, 
  X, 
  Search, 
  CheckSquare,
  Award,
  Flag,
  Sparkles
} from 'lucide-react';
import { UserProfile, Club, SentEmail, resolveRecipients } from '../utils/clubLogic';
import { ClubLogo } from './ClubLogo';
import { UserAvatar } from './UserAvatar';

const EMAIL_TEMPLATES = [
  {
    id: 'sitzung',
    label: 'Einladung Narrenkreissitzung',
    badge: 'Präsidenten & Vorstände',
    recipientType: 'verteiler_praesident' as const,
    subject: 'Einladung zur nächsten Narrenkreissitzung am [Datum]',
    body: `Liebe Narrenfreunde, liebe Präsidenten und Vorstände der Mitgliedsvereine,

hiermit laden wir euch herzlich zur nächsten ordentlichen Narrenkreissitzung ein:

📅 Datum: [Datum einsetzen, z.B. Freitag, 14. November 2026]
⏰ Uhrzeit: 19:30 Uhr
📍 Ort: [Vereinsheim / Veranstaltungsort einsetzen]

Vorläufige Tagesordnung:
1. Begrüßung durch das Narrenkreis-Präsidium
2. Genehmigung des letzten Sitzungsprotokolls
3. Rückblick & Terminkoordination der kommenden Kampagne
4. Absprachen Fastnachtsumzüge & Ordensmatinee
5. Verschiedenes & Wortmeldungen der Vereine

Wir bitten um verlässliche Teilnahme mit mindestens einem Vertreter je Verein. Bei Verhinderung bitte rechtzeitig Bescheid geben.

Mit närrischen Grüßen,
Narrenkreis Bruchsal`
  },
  {
    id: 'umzug',
    label: 'Erinnerung Umzugsanmeldung',
    badge: 'Zugmarschälle',
    recipientType: 'verteiler_zugmarschall' as const,
    subject: 'Dringend: Frist Abgabe Umzugsanmeldungen & Fastnachtswagen',
    body: `Hallo liebe Zugmarschälle und Verantwortliche für die Fastnachtsumzüge,

bitte denkt an die rechtzeitige Abgabe eurer Anmeldebögen und Wagendaten für die anstehenden Fastnachtsumzüge im Narrenkreis Bruchsal:

⚠️ Abgabefrist: [Datum einsetzen, z.B. 15. Januar 2027]

Bitte übermittelt uns:
• Anzahl der Fußgruppen & teilnehmenden Narren
• Maße der Festwagen & Zugmaschinen
• Name und Handynummer des verantwortlichen Wagenführers
• Nachweis der TÜV-Gutachten bzw. Brauchtumsabnahme

Vielen Dank für eure Unterstützung für einen sicheren und geordneten Ablauf unserer Umzüge!

Mit närrischem Gruß,
Narrenkreis Bruchsal`
  },
  {
    id: 'helfer',
    label: 'Helferaufruf Kampagne',
    badge: 'Alle Mitglieder',
    recipientType: 'all' as const,
    subject: 'Helferaufruf: Unterstützung für [Veranstaltung / Ordensmatinee]',
    body: `Liebe Fastnachterinnen und Fastnachter im Narrenkreis Bruchsal,

für die bevorstehende Veranstaltung [Name der Veranstaltung] am [Datum] im [Ort] suchen wir noch tatkräftige Unterstützung aus unseren Mitgliedsvereinen:

Gesucht werden Helfer für:
• Aufbau & Deko: [Datum, Uhrzeit]
• Einlass & Bewirtung: [Datum, Uhrzeit]
• Abbau & Aufräumen: [Datum, Uhrzeit]

Wer Zeit und Lust hat mit anzupacken, meldet sich bitte kurz per Antwort auf diese Nachricht oder direkt per WhatsApp.

Gemeinsam schaffen wir eine tolle Veranstaltung für das heimatliche Fastnachtsbrauchtum!

Herzlichen Dank & Narri-Narro!`
  },
  {
    id: 'praesidium_info',
    label: 'Präsidiums-Mitteilung',
    badge: 'Offiziell',
    recipientType: 'all' as const,
    subject: 'Wichtige Mitteilung des Narrenkreis-Präsidiums',
    body: `Liebe Mitgliedsvereine des Narrenkreis Bruchsal,

das Präsidium möchte euch über folgende wichtige Angelegenheit informieren:

[Hier die Mitteilung oder Beschlüsse eintragen...]

Für Rückfragen stehen wir euch jederzeit gerne zur Verfügung.

Mit närrischen Grüßen,
Das Präsidium des Narrenkreis Bruchsal`
  }
];

interface MessengerViewProps {
  currentUser: UserProfile;
  users: UserProfile[];
  clubs: Club[];
  sentEmails: SentEmail[];
  onSendEmail: (email: SentEmail) => void;
  onClearMailbox: (folder: 'sent' | 'inbox' | 'all') => void;
  onDeleteEmail: (emailId: string) => void;
  initialRecipientUserId?: string | null;
}

export const MessengerView: React.FC<MessengerViewProps> = ({
  currentUser,
  users,
  clubs,
  sentEmails,
  onSendEmail,
  onClearMailbox,
  onDeleteEmail,
  initialRecipientUserId
}) => {
  const [recipientType, setRecipientType] = useState<'person' | 'multiple' | 'club' | 'all' | 'verteiler_praesident' | 'verteiler_zugmarschall'>('person');
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    initialRecipientUserId && users.some(u => u.id === initialRecipientUserId)
      ? initialRecipientUserId
      : (users[0]?.id || '')
  );
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>(() => {
    if (initialRecipientUserId && users.some(u => u.id === initialRecipientUserId)) {
      return [initialRecipientUserId];
    }
    return users.slice(0, 2).map(u => u.id);
  });
  const [personSearchQuery, setPersonSearchQuery] = useState('');
  const [selectedClubId, setSelectedClubId] = useState<string>(clubs[0]?.id || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sync recipient if initialRecipientUserId changes
  React.useEffect(() => {
    if (initialRecipientUserId && users.some(u => u.id === initialRecipientUserId)) {
      setRecipientType('person');
      setSelectedPersonId(initialRecipientUserId);
      setSelectedPersonIds([initialRecipientUserId]);
    }
  }, [initialRecipientUserId, users]);

  // Postfach folders: 'sent' (Gesendet) or 'inbox' (Posteingang)
  const [activeMailboxFolder, setActiveMailboxFolder] = useState<'sent' | 'inbox'>('sent');
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [clearScope, setClearScope] = useState<'folder' | 'all'>('folder');

  const targetId = recipientType === 'person' 
    ? selectedPersonId 
    : recipientType === 'multiple' 
      ? selectedPersonIds.join(',') 
      : recipientType === 'club' 
        ? selectedClubId 
        : undefined;

  const resolution = resolveRecipients(recipientType, targetId, users, clubs);

  // Profile-isolated emails: Each profile has its own postbox!
  const userSentEmails = sentEmails.filter(m => 
    m.senderUserId === currentUser.id || (!m.senderUserId && m.fromEmail === currentUser.email)
  );

  const userInboxEmails = sentEmails.filter(m => {
    const isSender = m.senderUserId === currentUser.id || (!m.senderUserId && m.fromEmail === currentUser.email);
    if (isSender) return false;
    if (m.recipientEmails && m.recipientEmails.includes(currentUser.email)) return true;
    if (m.recipientType === 'club' && m.targetId === currentUser.clubId) return true;
    if (m.recipientType === 'all') return true;
    if (m.recipientType === 'verteiler_praesident' && currentUser.isPraesident) return true;
    if (m.recipientType === 'verteiler_zugmarschall' && currentUser.isZugmarschall) return true;
    return false;
  });

  const displayedEmails = activeMailboxFolder === 'sent' ? userSentEmails : userInboxEmails;
  const totalProfileEmails = userSentEmails.length + userInboxEmails.length;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;

    if (resolution.emails.length === 0) {
      setStatusMessage('Keine gültigen Empfänger-Adressen gefunden.');
      return;
    }

    const newSentEmail: SentEmail = {
      id: `mail-${Date.now()}`,
      senderUserId: currentUser.id,
      fromName: `${currentUser.name} (${currentUser.positionInClub || 'Mitglied'})`,
      fromEmail: currentUser.email,
      recipientType,
      targetId,
      recipientDisplay: resolution.display,
      recipientEmails: resolution.emails,
      subject: subject.trim(),
      body: body.trim(),
      sentAt: new Date().toISOString()
    };

    onSendEmail(newSentEmail);
    setSubject('');
    setBody('');
    setActiveMailboxFolder('sent');
    setStatusMessage(`E-Mail erfolgreich an ${resolution.count} ${resolution.count === 1 ? 'Empfänger' : 'Empfänger'} versendet!`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleExecuteClearMailbox = () => {
    const targetFolder = clearScope === 'all' ? 'all' : activeMailboxFolder;
    onClearMailbox(targetFolder);
    setIsConfirmClearOpen(false);
    const label = targetFolder === 'all' 
      ? 'Komplettes Postfach' 
      : targetFolder === 'sent' 
        ? 'Gesendete E-Mails' 
        : 'Posteingang';
    setStatusMessage(`${label} für ${currentUser.name} wurde erfolgreich geleert.`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Optional direct mail client link
  const mailtoUrl = `mailto:${resolution.emails.join(',')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-snug flex items-center gap-2">
            <Mail className="w-5 h-5 text-red-700" />
            <span>Narrenkreis E-Mail Messenger</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Schreibe von deiner offiziellen E-Mail-Adresse an einzelne Personen, Vereine oder alle Verbände. Jedes Profil besitzt sein eigenes, leerebares Postfach.
          </p>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center gap-2 shrink-0">
          <span className="text-slate-500">Aktives Profil:</span>
          <strong className="text-slate-900 font-mono text-[11px]">{currentUser.email}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Email Composer (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
            <span>Neue E-Mail verfassen (Blanko)</span>
            <span className="text-xs text-slate-400 font-normal">Reines Textfeld ohne Vorlagen</span>
          </h3>

          <form onSubmit={handleSend} className="space-y-4">
            {/* Absender info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Deine Absender-Adresse</span>
                <span className="font-semibold text-slate-800 font-mono">{currentUser.email}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Absender-Name</span>
                <span className="font-semibold text-slate-800">{currentUser.name} ({currentUser.positionInClub || 'Mitglied'})</span>
              </div>
            </div>

            {/* Recipient Mode Selection: Einzelne Person / Mehrfachauswahl / Verein / An alle */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Empfängerkreis auswählen *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRecipientType('person')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    recipientType === 'person'
                      ? 'border-red-600 bg-red-50/70 text-red-900 ring-1 ring-red-600'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Einzelne Person</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientType('multiple')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    recipientType === 'multiple'
                      ? 'border-red-600 bg-red-50/70 text-red-900 ring-1 ring-red-600'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5 text-red-700" />
                  <span>Mehrfachauswahl</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientType('club')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    recipientType === 'club'
                      ? 'border-red-600 bg-red-50/70 text-red-900 ring-1 ring-red-600'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Ganzen Verein</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientType('all')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    recipientType === 'all'
                      ? 'border-red-600 bg-red-50/70 text-red-900 ring-1 ring-red-600'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Alle Mitglieder</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientType('verteiler_praesident')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    recipientType === 'verteiler_praesident'
                      ? 'border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600 font-bold shadow-xs'
                      : 'border-amber-200 bg-amber-50/40 hover:bg-amber-100/60 text-amber-900'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>Verteiler Präsident</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientType('verteiler_zugmarschall')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    recipientType === 'verteiler_zugmarschall'
                      ? 'border-purple-600 bg-purple-50 text-purple-950 ring-1 ring-purple-600 font-bold shadow-xs'
                      : 'border-purple-200 bg-purple-50/40 hover:bg-purple-100/60 text-purple-900'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5 text-purple-600" />
                  <span>Verteiler Zugmarschall</span>
                </button>
              </div>
            </div>

            {/* Target Selectors */}
            {recipientType === 'person' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Person auswählen (Dropdown) *
                </label>
                <select
                  value={selectedPersonId}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                >
                  {users.map((u) => {
                    const uClub = clubs.find(c => c.id === u.clubId);
                    return (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.email} ({uClub?.shortName || 'Kein Verein'}, {u.positionInClub || 'Mitglied'})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {recipientType === 'multiple' && (
              <div className="space-y-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Bestimmte Empfänger auswählen ({selectedPersonIds.length} von {users.length} ausgewählt)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPersonIds(users.map(u => u.id))}
                      className="text-[11px] font-semibold text-red-700 hover:text-red-800 hover:underline cursor-pointer"
                    >
                      Alle auswählen
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPersonIds([])}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                    >
                      Auswahl aufheben
                    </button>
                  </div>
                </div>

                {/* Search filter for members */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={personSearchQuery}
                    onChange={(e) => setPersonSearchQuery(e.target.value)}
                    placeholder="Mitglieder nach Name oder Verein filtern..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  />
                </div>

                {/* Checkbox list */}
                <div className="max-h-56 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100 bg-white rounded-lg border border-slate-200 p-2">
                  {users
                    .filter(u => {
                      if (!personSearchQuery.trim()) return true;
                      const q = personSearchQuery.toLowerCase();
                      const uClub = clubs.find(c => c.id === u.clubId);
                      return (
                        u.name.toLowerCase().includes(q) ||
                        u.email.toLowerCase().includes(q) ||
                        (uClub?.name || '').toLowerCase().includes(q) ||
                        (u.positionInClub || '').toLowerCase().includes(q)
                      );
                    })
                    .map((u) => {
                      const isChecked = selectedPersonIds.includes(u.id);
                      const uClub = clubs.find(c => c.id === u.clubId);

                      return (
                        <label
                          key={u.id}
                          className={`pt-1.5 first:pt-0 flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            isChecked ? 'bg-red-50/70 text-slate-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPersonIds(prev => [...prev, u.id]);
                                } else {
                                  setSelectedPersonIds(prev => prev.filter(id => id !== u.id));
                                }
                              }}
                              className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300 cursor-pointer"
                            />
                            <UserAvatar user={u} size="xs" />
                            <div>
                              <span className="text-xs font-bold block leading-tight">{u.name}</span>
                              <span className="text-[10px] text-slate-500 block">
                                {u.email} · {uClub?.shortName || uClub?.name || 'Unabhängig'} ({u.positionInClub || 'Mitglied'})
                              </span>
                            </div>
                          </div>

                          {isChecked && (
                            <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full shrink-0">
                              Ausgewählt
                            </span>
                          )}
                        </label>
                      );
                    })}
                </div>
              </div>
            )}

            {recipientType === 'club' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Verein auswählen (Dropdown) *
                </label>
                <select
                  value={selectedClubId}
                  onChange={(e) => setSelectedClubId(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                >
                  {clubs.map((c) => {
                    const memberCount = users.filter(u => u.clubId === c.id).length;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({memberCount} erreichbare Personen)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {recipientType === 'all' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Die Nachricht geht als Rundmail an alle {users.length} erfassten Mitglieder aller Mitgliedsvereine im Narrenkreis Bruchsal.
                </span>
              </div>
            )}

            {recipientType === 'verteiler_praesident' && (
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Award className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Offizieller Präsidenten-Verteiler</span>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                    {resolution.count} {resolution.count === 1 ? 'Präsident erfasst' : 'Präsidenten erfasst'}
                  </span>
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Automatische Sammel-Nachricht an alle Mitglieder, bei denen in der <strong>Präsidiums-Mitgliederverwaltung</strong> das Häkchen <strong>„Präsident“</strong> gesetzt ist.
                </p>
                {users.filter(u => u.isPraesident).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-amber-200/60">
                    {users.filter(u => u.isPraesident).map(u => {
                      const uClub = clubs.find(c => c.id === u.clubId);
                      return (
                        <span key={u.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-300 shadow-2xs rounded-lg text-xs font-medium text-amber-950">
                          <span className="font-semibold">{u.name}</span>
                          <span className="text-amber-600 text-[10px]">({uClub?.shortName || uClub?.name || u.positionInClub})</span>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-700 italic">
                    Aktuell hat noch kein Mitglied das Häkchen „Präsident“ in der Mitgliederverwaltung.
                  </p>
                )}
              </div>
            )}

            {recipientType === 'verteiler_zugmarschall' && (
              <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl text-xs text-purple-950 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-purple-900">
                    <Flag className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>Offizieller Zugmarschall-Verteiler</span>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-800 bg-purple-100/80 px-2 py-0.5 rounded-full">
                    {resolution.count} {resolution.count === 1 ? 'Zugmarschall erfasst' : 'Zugmarschälle erfasst'}
                  </span>
                </div>
                <p className="text-purple-800 text-[11px] leading-relaxed">
                  Automatische Sammel-Nachricht an alle Mitglieder, bei denen in der <strong>Präsidiums-Mitgliederverwaltung</strong> das Häkchen <strong>„Zugmarschall“</strong> gesetzt ist.
                </p>
                {users.filter(u => u.isZugmarschall).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-purple-200/60">
                    {users.filter(u => u.isZugmarschall).map(u => {
                      const uClub = clubs.find(c => c.id === u.clubId);
                      return (
                        <span key={u.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-purple-300 shadow-2xs rounded-lg text-xs font-medium text-purple-950">
                          <span className="font-semibold">{u.name}</span>
                          <span className="text-purple-600 text-[10px]">({uClub?.shortName || uClub?.name || u.positionInClub})</span>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-purple-700 italic">
                    Aktuell hat noch kein Mitglied das Häkchen „Zugmarschall“ in der Mitgliederverwaltung.
                  </p>
                )}
              </div>
            )}

            {/* Resolved recipients summary badge */}
            <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
              <span>Empfänger: <strong className="text-slate-800">{resolution.display}</strong></span>
              <span className="font-mono tabular-nums font-semibold text-red-700">
                {resolution.count} {resolution.count === 1 ? 'Adresse' : 'Adressen'}
              </span>
            </div>

            {/* Rundmail-Textvorlagen */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Rundmail-Textvorlagen</span>
                </span>
                <span className="text-[10px] text-slate-400">1 Klick zum Vorbefüllen</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {EMAIL_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setSubject(tmpl.subject);
                      setBody(tmpl.body);
                      setRecipientType(tmpl.recipientType);
                      setStatusMessage(`Vorlage „${tmpl.label}“ geladen! Du kannst Betreff und Text nun frei anpassen.`);
                      setTimeout(() => setStatusMessage(null), 3500);
                    }}
                    className="p-2 rounded-lg bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-950 border border-slate-200 hover:border-amber-300 text-left transition-colors flex items-center justify-between gap-2 cursor-pointer shadow-2xs group"
                  >
                    <span className="text-xs font-semibold group-hover:text-amber-900 transition-colors">
                      {tmpl.label}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
                      {tmpl.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Betreff *
              </label>
              <input
                type="text"
                required
                placeholder="Betreffzeile eingeben..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
              />
            </div>

            {/* Body (Blank field - no templates) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-Mail Text (Blanko-Feld) *
              </label>
              <textarea
                required
                rows={7}
                placeholder="Schreibe hier deinen Nachrichtentext frei ohne Vorlage..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 font-sans leading-relaxed"
              />
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <a
                href={mailtoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                title="Im lokalen E-Mail-Programm (z.B. Outlook/Apple Mail) öffnen"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Im E-Mail-Programm öffnen</span>
              </a>

              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>E-Mail jetzt senden</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Profile-Isolated Mailbox with "Postfach leeren" */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          {/* Mailbox Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-red-700" />
                <span>Postfach: {currentUser.name}</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Individuelles Postfach für dieses Profil
              </p>
            </div>

            {/* Button: Postfach leeren */}
            <button
              onClick={() => setIsConfirmClearOpen(true)}
              disabled={totalProfileEmails === 0}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                totalProfileEmails === 0
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                  : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-400'
              }`}
              title="Postfach für dieses Profil leeren"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Postfach leeren</span>
            </button>
          </div>

          {/* Mailbox Folder Selector: Gesendet vs Posteingang */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveMailboxFolder('sent')}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeMailboxFolder === 'sent'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Send className="w-3 h-3 text-red-700" />
              <span>Gesendet ({userSentEmails.length})</span>
            </button>

            <button
              onClick={() => setActiveMailboxFolder('inbox')}
              className={`flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeMailboxFolder === 'inbox'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Inbox className="w-3 h-3 text-amber-700" />
              <span>Posteingang ({userInboxEmails.length})</span>
            </button>
          </div>

          {/* Email List for current profile */}
          {displayedEmails.length === 0 ? (
            <div className="text-center py-10 px-4 space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <Mail className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700">
                {activeMailboxFolder === 'sent' ? 'Keine gesendeten E-Mails' : 'Posteingang ist leer'}
              </h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Das Postfach für das Profil <strong>{currentUser.name}</strong> ist aktuell leer.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {displayedEmails.map((mail) => (
                <div
                  key={mail.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs shadow-2xs hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                        {mail.recipientType === 'all' ? 'Rundmail an alle' : mail.recipientType === 'club' ? 'Vereinsmail' : 'Einzelperson'}
                      </span>
                      <h4 className="font-bold text-slate-900 mt-1 leading-snug">
                        {mail.subject}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                        {new Date(mail.sentAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {/* Delete single email button */}
                      <button
                        onClick={() => onDeleteEmail(mail.id)}
                        className="text-slate-300 hover:text-rose-600 p-1 rounded hover:bg-white transition-colors"
                        title="Diese E-Mail löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600">
                    <span className="text-slate-400">
                      {activeMailboxFolder === 'sent' ? 'An: ' : 'Von: '}
                    </span>
                    <span className="font-medium text-slate-800">
                      {activeMailboxFolder === 'sent' ? mail.recipientDisplay : `${mail.fromName} (${mail.fromEmail})`}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-3 bg-white p-2.5 rounded-lg border border-slate-200/60 whitespace-pre-line leading-relaxed">
                    {mail.body}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                    <span>Absender: {mail.fromEmail}</span>
                    <span className="font-mono">{mail.recipientEmails.length} Empfänger</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal: Postfach leeren */}
      {isConfirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-md p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                Postfach für dieses Profil leeren?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Möchtest du das Postfach für <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.email}) leeren?
              </p>
              <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                Jedes Profil besitzt sein eigenes Postfach. Beim Leeren werden ausschließlich die Nachrichten dieses Profils gelöscht.
              </p>
            </div>

            {/* Clear Scope Selection */}
            <div className="space-y-2 pt-1 text-xs">
              <label className="block font-semibold text-slate-700">Bereich zum Leeren auswählen:</label>
              
              <div 
                onClick={() => setClearScope('all')}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  clearScope === 'all'
                    ? 'border-rose-500 bg-rose-50/70 text-rose-950 font-semibold ring-1 ring-rose-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>Komplettes Postfach leeren (Gesendet & Eingang)</span>
                <span className="font-mono text-xs">{totalProfileEmails} E-Mails</span>
              </div>

              <div 
                onClick={() => setClearScope('folder')}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  clearScope === 'folder'
                    ? 'border-rose-500 bg-rose-50/70 text-rose-950 font-semibold ring-1 ring-rose-500'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>Nur aktuellen Ordner ({activeMailboxFolder === 'sent' ? 'Gesendet' : 'Posteingang'}) leeren</span>
                <span className="font-mono text-xs">{displayedEmails.length} E-Mails</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmClearOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleExecuteClearMailbox}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ja, Postfach jetzt leeren</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
