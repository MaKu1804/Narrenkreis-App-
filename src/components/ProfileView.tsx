import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Smartphone, 
  MapPin, 
  Check, 
  AlertCircle, 
  Award,
  ChevronRight,
  Send,
  Inbox,
  Download,
  Camera,
  CheckCheck,
  Trash2
} from 'lucide-react';
import { 
  UserProfile, 
  Club, 
  SentEmail,
  validateProfile, 
  isPraesidiumMember,
  getEmailsForUser 
} from '../utils/clubLogic';
import { ClubLogo } from './ClubLogo';
import { ClubSelector } from './ClubSelector';
import { MessengerView } from './MessengerView';
import { UserAvatar } from './UserAvatar';
import { downloadContactVCard } from '../utils/vcardExport';

export type ProfileSubTab = 'profile' | 'messenger';

interface ProfileViewProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  clubs: Club[];
  sentEmails: SentEmail[];
  onUpdateUser: (updated: UserProfile) => void;
  onSwitchUser?: (userId: string) => void;
  onCreateUser?: (newUser: UserProfile) => void;
  onClearMailbox: (folder: 'sent' | 'inbox' | 'all') => void;
  onDeleteEmail: (emailId: string) => void;
  onSendEmail: (email: SentEmail) => void;
  activeSubTab?: ProfileSubTab;
  onSubTabChange?: (tab: ProfileSubTab) => void;
  initialRecipientUserId?: string | null;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  allUsers,
  clubs,
  sentEmails,
  onUpdateUser,
  onSwitchUser,
  onCreateUser,
  onClearMailbox,
  onDeleteEmail,
  onSendEmail,
  activeSubTab = 'profile',
  onSubTabChange,
  initialRecipientUserId
}) => {
  // Local sub-tab state if not controlled externally
  const [internalSubTab, setInternalSubTab] = useState<ProfileSubTab>(activeSubTab);
  const currentSubTab = onSubTabChange ? activeSubTab : internalSubTab;

  const handleSelectSubTab = (tab: ProfileSubTab) => {
    if (onSubTabChange) {
      onSubTabChange(tab);
    } else {
      setInternalSubTab(tab);
    }
  };

  // Form fields for profile editing
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [mobile, setMobile] = useState(currentUser.mobile || '');
  const [secondaryMobile, setSecondaryMobile] = useState(currentUser.secondaryMobile || '');
  const [clubId, setClubId] = useState(currentUser.clubId);
  const [positionInClub, setPositionInClub] = useState(currentUser.positionInClub || '');
  const [address, setAddress] = useState(currentUser.address || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [downloadingVCard, setDownloadingVCard] = useState(false);
  const [vcardDownloaded, setVcardDownloaded] = useState(false);
  const [pendingUserToConfirm, setPendingUserToConfirm] = useState<UserProfile | null>(null);

  // Track the ID of the user whose profile is currently loaded in the form
  const lastLoadedUserIdRef = useRef<string>(currentUser.id);

  // Sync form state ONLY if a different user was selected/switched (prevents resetting fields mid-typing)
  useEffect(() => {
    if (lastLoadedUserIdRef.current !== currentUser.id) {
      lastLoadedUserIdRef.current = currentUser.id;
      setName(currentUser.name);
      setEmail(currentUser.email);
      setMobile(currentUser.mobile || '');
      setSecondaryMobile(currentUser.secondaryMobile || '');
      setClubId(currentUser.clubId);
      setPositionInClub(currentUser.positionInClub || '');
      setAddress(currentUser.address || '');
      setPhone(currentUser.phone || '');
      setBio(currentUser.bio || '');
      setAvatar(currentUser.avatar || '');
      setValidationErrors([]);
    }
  }, [currentUser.id]);

  // If an initialRecipientUserId is supplied, auto-switch to messenger sub-tab
  useEffect(() => {
    if (initialRecipientUserId) {
      handleSelectSubTab('messenger');
    }
  }, [initialRecipientUserId]);

  const currentClub = clubs.find(c => c.id === clubId);
  const hasPraesidiumRole = isPraesidiumMember(currentUser);

  // Emails specifically for this user profile to show badges
  const userSentEmails = getEmailsForUser(currentUser.id, currentUser.email, currentUser.clubId, sentEmails, 'sent');
  const userInboxEmails = getEmailsForUser(currentUser.id, currentUser.email, currentUser.clubId, sentEmails, 'inbox');
  const totalProfileEmails = userSentEmails.length + userInboxEmails.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const candidate: Partial<UserProfile> = {
      name,
      email,
      mobile,
      clubId,
      positionInClub
    };

    const validation = validateProfile(candidate);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);

    const initials = name.trim().split(/\s+/).map(p => p[0]).join('').toUpperCase().slice(0, 2) || 'NK';
    const finalAvatar = avatar || initials;

    const updatedUser: UserProfile = {
      ...currentUser,
      name: name.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      secondaryMobile: secondaryMobile.trim() || undefined,
      clubId,
      positionInClub: positionInClub.trim(),
      address: address.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      avatar: finalAvatar
    };

    if (clubId !== currentUser.clubId) {
      setPendingUserToConfirm(updatedUser);
      return;
    }

    onUpdateUser(updatedUser);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Profile Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <UserAvatar
            user={{ ...currentUser, avatar: avatar || currentUser.avatar }}
            size="lg"
            showBorder
            borderVariant="amber"
            editable
            onPhotoChange={(newPhoto) => {
              setAvatar(newPhoto);
              onUpdateUser({ ...currentUser, avatar: newPhoto });
            }}
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">{currentUser.name}</h2>
              {hasPraesidiumRole && (
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-700" />
                  {currentUser.praesidiumRole}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser.positionInClub || 'Mitglied'} · {currentClub?.name || 'Kein Verein zugewiesen'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Eigenes Profil</span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation (Unter-Reiter im Profil) */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-2 pt-2 rounded-xl shadow-2xs">
        <button
          type="button"
          onClick={() => handleSelectSubTab('profile')}
          className={`flex items-center gap-2 py-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            currentSubTab === 'profile'
              ? 'border-red-700 text-red-700 bg-red-50/60 rounded-t-lg shadow-2xs'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 rounded-t-lg'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Mein Profil & Kontaktdaten</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectSubTab('messenger')}
          className={`flex items-center gap-2 py-3 px-5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            currentSubTab === 'messenger'
              ? 'border-red-700 text-red-700 bg-red-50/60 rounded-t-lg shadow-2xs'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50/80 rounded-t-lg'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>E-Mail Messenger</span>
          {totalProfileEmails > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] bg-red-100 text-red-800 font-bold">
              {totalProfileEmails}
            </span>
          )}
        </button>
      </div>

      {/* Content for Unter-Reiter 1: Mein Profil & Kontaktdaten */}
      {currentSubTab === 'profile' && (
        <div className="space-y-6">
          {/* Quick Messenger status callout */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Offizielles Postfach für {currentUser.name}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  {currentUser.email} · {totalProfileEmails} {totalProfileEmails === 1 ? 'E-Mail' : 'E-Mails'} im Postfach
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSelectSubTab('messenger')}
              className="px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <span>E-Mail verfassen & Postfach öffnen</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Edit Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Profileinstellungen & Kontaktdaten bearbeiten
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Die mit einem Stern (*) markierten Felder sind Pflichtfelder gemäß Satzung des Narrenkreis Bruchsal.
              </p>
            </div>

            {/* Assigned Club Info Box */}
            <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ClubLogo club={currentClub} size="lg" />
                <div>
                  <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
                    Zugeordneter Verein im Narrenkreis
                  </span>
                  <span className="text-sm font-bold text-slate-900 block">
                    {currentClub?.name || 'Kein Verein zugewiesen'}
                  </span>
                  <span className="text-xs text-slate-600">
                    Vereinskürzel: {currentClub?.shortName} · Gegründet {currentClub?.establishedYear}
                  </span>
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                <span>Mitglied seit: {currentUser.joinedDate}</span>
              </div>
            </div>

            {/* Validation Errors Box */}
            {validationErrors.length > 0 && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Bitte fülle alle Pflichtfelder aus:</span>
                </div>
                <ul className="list-disc list-inside text-xs text-rose-700 pl-1 space-y-0.5">
                  {validationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section: Profilbild einpflegen */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      user={{ ...currentUser, avatar }}
                      size="xl"
                      showBorder
                      borderVariant="amber"
                      editable
                      onPhotoChange={(newPhoto) => {
                        setAvatar(newPhoto);
                      }}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-amber-600" />
                        <span>Profilbild / Foto</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Lade ein persönliches Foto hoch. Wird automatisch auf Mobilgeräten und Visitenkarten dargestellt.
                      </p>
                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                          <Camera className="w-3.5 h-3.5" />
                          <span>{avatar && (avatar.startsWith('data:') || avatar.startsWith('http')) ? 'Foto ändern' : 'Foto auswählen'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const src = event.target?.result as string;
                                if (!src) return;
                                const img = new Image();
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  const maxDim = 400;
                                  let width = img.width;
                                  let height = img.height;
                                  if (width > height) {
                                    if (width > maxDim) {
                                      height = Math.round((height * maxDim) / width);
                                      width = maxDim;
                                    }
                                  } else {
                                    if (height > maxDim) {
                                      width = Math.round((width * maxDim) / height);
                                      height = maxDim;
                                    }
                                  }
                                  canvas.width = width;
                                  canvas.height = height;
                                  const ctx = canvas.getContext('2d');
                                  if (ctx) {
                                    ctx.drawImage(img, 0, 0, width, height);
                                    setAvatar(canvas.toDataURL('image/jpeg', 0.85));
                                  } else {
                                    setAvatar(src);
                                  }
                                };
                                img.src = src;
                              };
                              reader.readAsDataURL(file);
                              e.target.value = '';
                            }}
                          />
                        </label>

                        {avatar && (avatar.startsWith('data:') || avatar.startsWith('http')) && (
                          <button
                            type="button"
                            onClick={() => setAvatar('')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Foto entfernen</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:border-l sm:border-slate-200 sm:pl-4 flex flex-col justify-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      Telefonbuch-Export
                    </span>
                    <button
                      type="button"
                      disabled={downloadingVCard}
                      onClick={async () => {
                        setDownloadingVCard(true);
                        try {
                          await downloadContactVCard(
                            { ...currentUser, name, email, mobile, phone, address, bio, avatar: avatar || currentUser.avatar },
                            currentClub
                          );
                          setVcardDownloaded(true);
                          setTimeout(() => setVcardDownloaded(false), 3000);
                        } finally {
                          setDownloadingVCard(false);
                        }
                      }}
                      className="mt-1.5 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      {vcardDownloaded ? <CheckCheck className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                      <span>{vcardDownloaded ? 'vCard bereitgestellt' : 'Meine Visitenkarte (.vcf)'}</span>
                    </button>
                    <span className="text-[10px] text-slate-400 mt-1">Für Android & iPhone Telefonbuch</span>
                  </div>
                </div>
              </div>

              {/* Section: Pflichtfelder */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-sky-900 mb-3 flex items-center gap-1.5">
                  <span>Pflichtfelder</span>
                  <span className="text-rose-500">*</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Vollständiger Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="z.B. Bernd Heitlinger"
                      style={{ fontSize: '16px' }}
                      className="w-full text-base sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      E-Mail-Adresse *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@karneval-bruchsal.de"
                      style={{ fontSize: '16px' }}
                      className="w-full text-base sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>

                  {/* Mobile / Handynummer */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Handynummer (Mobiltelefon) *
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="+49 171 1234567"
                        style={{ fontSize: '16px' }}
                        className="w-full text-base sm:text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* 2. Mobile / Weitere Handynummer */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Zweite Handynummer (Weiteres Mobiltelefon, optional)
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={secondaryMobile}
                        onChange={(e) => setSecondaryMobile(e.target.value)}
                        placeholder="z.B. +49 176 1234567 (optional)"
                        style={{ fontSize: '16px' }}
                        className="w-full text-base sm:text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* Club Selection with Search & Logos */}
                  <div>
                    <ClubSelector
                      selectedClubId={clubId}
                      clubs={clubs}
                      onChange={setClubId}
                      label="Auswahl vom Verein (per Dropdown / Suche)"
                    />
                  </div>

                  {/* Position in dem Verein */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Position in dem Verein *
                    </label>
                    <input
                      type="text"
                      required
                      value={positionInClub}
                      onChange={(e) => setPositionInClub(e.target.value)}
                      placeholder="z.B. Zunftmeister, Elferrat, Sitzungspräsident, Gardetrainerin, Kassier, Aktives Mitglied..."
                      style={{ fontSize: '16px' }}
                      className="w-full text-base sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Freiwillige Angaben */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Freiwillige Angaben
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Adresse */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Adresse (Straße, Hausnr., PLZ, Ort)
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="z.B. Schönbornstraße 14, 76646 Bruchsal"
                        className="w-full text-sm pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* Festnetz Telefon */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Telefon (Festnetz)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="z.B. 07251 12345"
                        className="w-full text-sm pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* Bio / Anmerkungen */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Über mich & Fastnachtserfahrung (Freiwillig)
                    </label>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Fastnachtsorden, Aktivität in Garden, Büttenreden..."
                      className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Save Action Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {saveSuccess ? (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Profileinstellungen erfolgreich gespeichert!
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    Änderungen werden sofort für alle Bereiche, Vereine und den Messenger übernommen.
                  </span>
                )}

                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Profil speichern</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content for Unter-Reiter 2: E-Mail Messenger */}
      {currentSubTab === 'messenger' && (
        <div className="animate-in fade-in duration-150">
          <MessengerView
            currentUser={currentUser}
            users={allUsers}
            clubs={clubs}
            sentEmails={sentEmails}
            onSendEmail={onSendEmail}
            onClearMailbox={onClearMailbox}
            onDeleteEmail={onDeleteEmail}
            initialRecipientUserId={initialRecipientUserId}
          />
        </div>
      )}

      {/* Sicherheitsabfrage Vereinswechsel in ProfileView */}
      {pendingUserToConfirm && (() => {
        const targetClub = clubs.find(c => c.id === pendingUserToConfirm.clubId);
        const previousClub = clubs.find(c => c.id === currentUser.clubId);

        return (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setPendingUserToConfirm(null)}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                  <AlertCircle className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Vereinswechsel bestätigen
                  </h3>
                  <p className="text-xs text-amber-700 font-semibold">
                    Sicherheitsabfrage
                  </p>
                </div>
              </div>

              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-3 text-xs text-amber-950">
                <p className="leading-relaxed">
                  Möchtest du deinen Verein in deinem Profil wirklich zu folgendem Mitgliedsverein ändern?
                </p>
                {targetClub && (
                  <div className="flex items-center gap-3 font-bold text-slate-900 bg-white p-3 rounded-xl border border-amber-300 shadow-2xs">
                    <ClubLogo club={targetClub} size="sm" />
                    <div className="min-w-0">
                      <span className="block truncate text-xs font-extrabold text-slate-900">{targetClub.name}</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        {targetClub.shortName} · {targetClub.category}
                      </span>
                    </div>
                  </div>
                )}
                {previousClub && (
                  <p className="text-[11px] text-slate-600 bg-white/60 p-2 rounded-lg border border-amber-200/60">
                    Bisherige Vereinszuordnung: <strong>{previousClub.name}</strong> wird dadurch aktualisiert.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPendingUserToConfirm(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateUser(pendingUserToConfirm);
                    setPendingUserToConfirm(null);
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 3000);
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Ja, Verein wechseln</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
