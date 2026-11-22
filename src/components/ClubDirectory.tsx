import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  Award, 
  Calendar, 
  Check, 
  X, 
  ArrowLeft, 
  Mail, 
  Phone, 
  Smartphone, 
  MapPin, 
  Copy, 
  CheckCheck, 
  ChevronRight, 
  Search,
  MessageSquare,
  Building2,
  ExternalLink,
  Navigation,
  Download,
  Camera,
  MessageCircle,
  PhoneCall,
  AlertCircle,
  RefreshCw,
  Database,
  Globe
} from 'lucide-react';
import { getWhatsAppUrl, getTelUrl } from '../utils/phoneUtils';
import { Club, UserProfile, isPraesidiumMember, extractPhoneNumbers, resolveClubWebsite } from '../utils/clubLogic';
import { ClubLogo } from './ClubLogo';
import { UserAvatar } from './UserAvatar';
import { downloadContactVCard } from '../utils/vcardExport';

interface ClubDirectoryProps {
  clubs: Club[];
  users: UserProfile[];
  currentUser: UserProfile;
  onSelectClubToJoin: (clubId: string) => void;
  onOpenMessengerForUser?: (userId: string) => void;
  onNavigateToPraesidium?: () => void;
  onUpdateClubLogo?: (clubId: string, newLogo: string) => void;
  onEditClub?: (clubId: string, updated: Partial<Club>) => void;
  onUpdateUser?: (updated: UserProfile) => void;
  onSyncDatabase?: () => Promise<void>;
  isSyncing?: boolean;
}

export const ClubDirectory: React.FC<ClubDirectoryProps> = ({
  clubs,
  users,
  currentUser,
  onSelectClubToJoin,
  onOpenMessengerForUser,
  onNavigateToPraesidium,
  onUpdateClubLogo,
  onEditClub,
  onUpdateUser,
  onSyncDatabase,
  isSyncing = false
}) => {
  // Directory tabs: 'clubs' (Mitgliedsvereine) oder 'members' (Alle registrierten Mitglieder)
  const [activeDirectoryTab, setActiveDirectoryTab] = useState<'clubs' | 'members'>('clubs');
  const [searchQuery, setSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberClubFilter, setMemberClubFilter] = useState('Alle');

  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [downloadingVCard, setDownloadingVCard] = useState(false);
  const [vcardDownloaded, setVcardDownloaded] = useState(false);
  const [clubToConfirmJoin, setClubToConfirmJoin] = useState<Club | null>(null);
  const currentUserClub = clubs.find(c => c.id === currentUser.clubId);

  const handleCopy = (text: string, fieldKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const filteredClubs = clubs.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.shortName.toLowerCase().includes(q) ||
      (c.category && c.category.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q))
    );
  });

  // Filtered list of all registered members
  const filteredAllMembers = users.filter(u => {
    const q = memberSearchQuery.toLowerCase().trim();
    const club = clubs.find(c => c.id === u.clubId);
    const matchesSearch = !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.mobile || '').toLowerCase().includes(q) ||
      (u.positionInClub || '').toLowerCase().includes(q) ||
      (u.praesidiumRole || '').toLowerCase().includes(q) ||
      (club?.name || '').toLowerCase().includes(q) ||
      (club?.shortName || '').toLowerCase().includes(q);

    const matchesClub = memberClubFilter === 'Alle' || u.clubId === memberClubFilter;
    return matchesSearch && matchesClub;
  });

  // Members of currently selected club
  const selectedClubMembers = selectedClub 
    ? users.filter(u => u.clubId === selectedClub.id)
    : [];

  const isPraesidium = isPraesidiumMember(currentUser);

  return (
    <div className="space-y-6">
      {/* Top Header Card with View Switcher & Live Database Sync Button */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 tracking-wide uppercase mb-1">
              <Building2 className="w-4 h-4" />
              <span>Narrenkreis Bruchsal · Vereins- & Mitgliederregister</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {activeDirectoryTab === 'clubs' ? 'Mitgliedsvereine & Zünfte' : 'Alle registrierten Mitglieder'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              {activeDirectoryTab === 'clubs'
                ? `Übersicht aller ${clubs.length} Mitgliedsvereine. Klicke auf einen Verein für dessen Mitglieder oder wechsle oben auf das Gesamterzeichnis aller ${users.length} registrierten Mitglieder.`
                : `Vollständiges Verzeichnis aller ${users.length} registrierten Narrenkreis-Mitglieder mit Vereinszugehörigkeit, Rollen und direkten Kontaktdaten.`}
            </p>
          </div>

          {/* Cloud Database Sync Status & Action Button */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cloud: {users.length} Mitglieder · {clubs.length} Vereine</span>
            </div>

            {onSyncDatabase && (
              <button
                type="button"
                onClick={onSyncDatabase}
                disabled={isSyncing}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Echtzeit-Synchronisierung mit der Cloud-Datenbank erzwingen"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronisiere...' : 'Aktualisieren'}</span>
              </button>
            )}
          </div>
        </div>

        {/* View Toggle Bar & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 shrink-0">
            <button
              type="button"
              onClick={() => setActiveDirectoryTab('clubs')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeDirectoryTab === 'clubs'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-amber-700" />
              <span>Vereine ({clubs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveDirectoryTab('members')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeDirectoryTab === 'members'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-700" />
              <span>Alle Mitglieder ({users.length})</span>
            </button>
          </div>

          {activeDirectoryTab === 'clubs' ? (
            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Verein oder Kategorie suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Mitglied, Position oder Verein suchen..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
              <select
                value={memberClubFilter}
                onChange={(e) => setMemberClubFilter(e.target.value)}
                className="text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 max-w-[150px] sm:max-w-[200px] truncate"
              >
                <option value="Alle">Alle Vereine ({users.length})</option>
                {clubs.map(c => {
                  const cCount = users.filter(u => u.clubId === c.id).length;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.shortName} ({cCount})
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      </div>


      {/* SECTION 1: CLUBS VIEW OR ALL REGISTERED MEMBERS VIEW */}
      {activeDirectoryTab === 'clubs' ? (
        clubs.length === 0 ? (
          <div className="py-14 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-4 shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Shield className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h4 className="text-base font-bold text-slate-800">Keine Vereine registriert</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Aktuell sind noch keine Mitgliedsvereine eingetragen. Das Anlegen und Verwalten von Vereinen ist exklusiv dem Narrenkreis-Präsidium vorbehalten.
              </p>
            </div>
            {currentUser.praesidiumRole && onNavigateToPraesidium && (
              <div className="pt-2">
                <button
                  onClick={onNavigateToPraesidium}
                  className="px-4 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition-colors inline-flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>Zum Präsidium (Verein anlegen)</span>
                </button>
              </div>
            )}
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <p className="text-sm font-semibold text-slate-700">Keine Vereine für die Suche gefunden</p>
            <p className="text-xs text-slate-500">Versuche einen anderen Suchbegriff.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredClubs.map((club) => {
              const clubMembers = users.filter(u => u.clubId === club.id);
              const isUserInThisClub = currentUser.clubId === club.id;

              return (
                <div
                  key={club.id}
                  onClick={() => setSelectedClub(club)}
                  className={`group bg-white rounded-2xl border p-5 flex flex-col justify-between space-y-4 cursor-pointer transition-all hover:shadow-md hover:border-amber-400 ${
                    isUserInThisClub
                      ? 'border-amber-500 shadow-xs ring-2 ring-amber-500/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Logo & Category */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <ClubLogo club={club} size="xl" />
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-amber-900 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-md inline-block">
                          {club.category || 'Karneval'}
                        </span>
                        {club.establishedYear && (
                          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
                            Gegr. {club.establishedYear}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors leading-tight">
                        {club.name}
                      </h3>
                    </div>

                    {club.shortName && club.shortName !== club.name && (
                      <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                        Kürzel: {club.shortName}
                      </span>
                    )}

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 mb-3">
                      {club.description || 'Aktiver Verein im Narrenkreis Bruchsal.'}
                    </p>

                    {/* Offizielle Vereins-Homepage Button (wie vom Nutzer mit roter Linie markiert) */}
                    {(() => {
                      const websiteUrl = resolveClubWebsite(club);
                      if (websiteUrl) {
                        return (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="mb-3"
                          >
                            <a
                              href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full group/btn px-3 py-2 rounded-xl bg-gradient-to-r from-sky-50 via-sky-50/70 to-blue-50 dark:from-sky-950/40 dark:via-sky-900/30 dark:to-blue-950/40 hover:from-sky-100 hover:to-blue-100 dark:hover:from-sky-900/60 dark:hover:to-blue-900/50 border border-sky-200/90 dark:border-sky-800/80 text-sky-900 dark:text-sky-200 text-xs font-semibold flex items-center justify-between shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                              title={`${club.name} Homepage im Browser öffnen`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-6 h-6 rounded-lg bg-sky-600 dark:bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                  <Globe className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0 text-left">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 block leading-none">
                                    Offizielle Homepage
                                  </span>
                                  <span className="text-xs font-bold text-sky-950 dark:text-white truncate block mt-0.5">
                                    {websiteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                                  </span>
                                </div>
                              </div>
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 dark:text-sky-300 group-hover/btn:translate-x-0.5 transition-transform shrink-0 ml-2 bg-white/70 dark:bg-slate-900/50 px-2 py-1 rounded-md border border-sky-200/60 dark:border-sky-800/60">
                                <span>Öffnen</span>
                                <ExternalLink className="w-3 h-3" />
                              </span>
                            </a>
                          </div>
                        );
                      }
                      if (isPraesidium) {
                        return (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="mb-3"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (onNavigateToPraesidium) {
                                  onNavigateToPraesidium();
                                }
                              }}
                              className="w-full px-3 py-1.5 rounded-xl border border-dashed border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              title="Website im Präsidiumsbereich hinzufügen"
                            >
                              <Globe className="w-3.5 h-3.5 text-sky-500" />
                              <span>+ Homepage im Präsidium eintragen</span>
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Vereinsheim Adresse & Google Maps Navigation Button */}
                    {club.clubhouseAddress && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs mb-3 space-y-1.5"
                      >
                        <div className="flex items-start gap-1.5 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                              Vereinsheim
                            </span>
                            <span className="text-slate-800 font-medium text-xs break-words line-clamp-2">
                              {club.clubhouseAddress}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-amber-200/50">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(club.clubhouseAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                            title="Direkt Google Maps öffnen und hin navigieren"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Google Maps Route</span>
                            <ExternalLink className="w-3 h-3 text-amber-200" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Registered members count and avatars */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          <strong className="text-slate-900">{clubMembers.length}</strong> {clubMembers.length === 1 ? 'Mitglied' : 'Mitglieder'}
                        </span>
                      </span>

                      {/* Member avatar initials */}
                      {clubMembers.length > 0 && (
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {clubMembers.slice(0, 4).map((m) => (
                            <UserAvatar
                              key={m.id}
                              user={m}
                              size="xs"
                              className="ring-2 ring-white"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer action with Bearbeiten button */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-50">
                    <div className="flex items-center gap-1.5">
                      {isUserInThisClub ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                          <Check className="w-3 h-3 text-amber-600" />
                          Dein Verein
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Mitgliedsverein
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClub(club);
                      }}
                      className="text-xs font-semibold text-amber-700 group-hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* SECTION 2: ALL REGISTERED MEMBERS VIEW */
        filteredAllMembers.length === 0 ? (
          <div className="py-14 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3 shadow-xs">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Keine Mitglieder gefunden</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Für diesen Filter oder Suchbegriff wurden keine registrierten Mitglieder gefunden.
            </p>
            {(memberSearchQuery || memberClubFilter !== 'Alle') && (
              <button
                type="button"
                onClick={() => {
                  setMemberSearchQuery('');
                  setMemberClubFilter('Alle');
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors cursor-pointer"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>{filteredAllMembers.length} {filteredAllMembers.length === 1 ? 'Mitglied registriert' : 'Mitglieder registriert'}</span>
              <span>Klicke auf ein Mitglied für Kontaktdaten</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAllMembers.map((member) => {
                const memberClub = clubs.find(c => c.id === member.clubId);
                const isCurrentUser = member.id === currentUser.id;

                return (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md p-4 transition-all flex flex-col justify-between gap-3 cursor-pointer group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar user={member} size="md" className="shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors truncate">
                                {member.name}
                              </h3>
                              {isCurrentUser && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                                  Du
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-600 block truncate">
                              {member.positionInClub || 'Mitglied'}
                            </span>
                          </div>
                        </div>

                        {/* Praesidium Badge if any */}
                        {member.praesidiumRole && (
                          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-600" />
                            <span className="hidden sm:inline">{member.praesidiumRole}</span>
                          </span>
                        )}
                      </div>

                      {/* Club affiliation */}
                      {memberClub && (
                        <div className="mt-3 flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                          <ClubLogo club={memberClub} size="xs" />
                          <span className="font-semibold truncate">{memberClub.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-auto">{memberClub.shortName}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Contact & Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {member.mobile && (
                          <>
                            <a
                              href={getWhatsAppUrl(member.mobile)}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold transition-colors"
                              title="WhatsApp Chat starten"
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-600" />
                              <span>WhatsApp</span>
                            </a>
                            <a
                              href={getTelUrl(member.mobile)}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-[11px] font-bold transition-colors"
                              title="Direkt anrufen"
                            >
                              <PhoneCall className="w-3 h-3 text-sky-600" />
                              <span>Anrufen</span>
                            </a>
                          </>
                        )}
                        {onOpenMessengerForUser && member.id !== currentUser.id && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenMessengerForUser(member.id);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 text-[11px] font-bold transition-colors cursor-pointer"
                            title="Nachricht im Messenger verfassen"
                          >
                            <Mail className="w-3 h-3 text-red-600" />
                            <span>Nachricht</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMember(member);
                        }}
                        className="text-xs font-semibold text-amber-700 group-hover:text-amber-800 flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}


      {/* MODAL 1: Club Details & Member List */}
      {selectedClub && !selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <ClubLogo club={selectedClub} size="md" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {selectedClub.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    {selectedClub.shortName && (
                      <span className="font-semibold text-amber-900 bg-amber-100/70 px-1.5 py-0.2 rounded text-[10px]">
                        {selectedClub.shortName}
                      </span>
                    )}
                    <span>·</span>
                    <span>{selectedClub.category || 'Verein'}</span>
                    {selectedClub.establishedYear && (
                      <>
                        <span>·</span>
                        <span>Gegr. {selectedClub.establishedYear}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedClub(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Official Club Website Banner */}
              {(() => {
                const websiteUrl = resolveClubWebsite(selectedClub);
                if (!websiteUrl) return null;
                return (
                  <div className="bg-gradient-to-r from-sky-50 via-sky-50/80 to-blue-50 dark:from-sky-950/40 dark:via-sky-900/30 dark:to-blue-950/40 p-4 rounded-xl border border-sky-200 dark:border-sky-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-600 dark:bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 block">
                          Offizielle Vereins-Homepage
                        </span>
                        <span className="text-sm font-bold text-sky-950 dark:text-white block mt-0.5">
                          {websiteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                        </span>
                        <span className="text-[11px] text-sky-800/80 dark:text-sky-300/80 block mt-0.5">
                          Aktuelle Berichte, Termine, Fotos und Kampagne
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopy(websiteUrl, 'website')}
                        className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                        title="Website-Adresse in Zwischenablage kopieren"
                      >
                        {copiedField === 'website' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === 'website' ? 'Kopiert' : 'Kopieren'}</span>
                      </button>
                      <a
                        href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                        title="Homepage im neuen Browser-Tab aufrufen"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Homepage besuchen</span>
                        <ExternalLink className="w-3 h-3 text-sky-200" />
                      </a>
                    </div>
                  </div>
                );
              })()}

              {/* Clubhouse Address with Direct Navigation Button */}
              {selectedClub.clubhouseAddress && (
                <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-amber-800" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                        Vereinsheim Adresse
                      </span>
                      <span className="text-sm font-semibold text-slate-900 block mt-0.5">
                        {selectedClub.clubhouseAddress}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Treffpunkt für Mitglieder & Veranstaltungen
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedClub.clubhouseAddress || '', 'clubhouse')}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      title="Adresse in Zwischenablage kopieren"
                    >
                      {copiedField === 'clubhouse' ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedField === 'clubhouse' ? 'Kopiert' : 'Kopieren'}</span>
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedClub.clubhouseAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                      title="Direkt Google Maps öffnen und Navigation starten"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Google Maps Route</span>
                      <ExternalLink className="w-3 h-3 text-amber-200" />
                    </a>
                  </div>
                </div>
              )}

              {/* Club description */}
              {selectedClub.description && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Über den Verein
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {selectedClub.description}
                  </p>
                </div>
              )}

              {/* Profile assignment action if not user's club */}
              <div className="flex flex-col gap-3 p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 text-xs">
                <div>
                  <span className="font-bold text-amber-950 block text-xs sm:text-sm">Vereinszugehörigkeit</span>
                  <span className="text-amber-800/90 text-xs mt-0.5 block">
                    {currentUser.clubId === selectedClub.id 
                      ? 'Du bist diesem Verein in deinem Profil zugeordnet.' 
                      : 'Möchtest du diesem Verein beitreten bzw. dich ihm im Profil zuordnen?'}
                  </span>
                </div>
                {currentUser.clubId === selectedClub.id ? (
                  <span className="w-full py-2.5 rounded-xl bg-amber-200/90 text-amber-950 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 shadow-2xs">
                    <Check className="w-4 h-4 text-amber-800" />
                    Aktiver Verein in deinem Profil
                  </span>
                ) : clubToConfirmJoin?.id === selectedClub.id ? (
                  <div className="p-4 bg-amber-100/90 border-2 border-amber-400 rounded-xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          Sicherheitsabfrage: Vereinswechsel bestätigen
                        </h4>
                        <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                          Möchtest du deinem Benutzerprofil wirklich dem Verein <strong>{selectedClub.name}</strong> zuordnen?
                        </p>
                        {currentUserClub && (
                          <p className="text-[11px] text-slate-700 mt-1 bg-white/70 p-2 rounded-lg border border-amber-200">
                            Bisheriger Verein: <strong>{currentUserClub.name}</strong> wird durch diesen Wechsel ersetzt.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-300/60">
                      <button
                        type="button"
                        onClick={() => setClubToConfirmJoin(null)}
                        className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
                      >
                        Abbrechen
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectClubToJoin(selectedClub.id);
                          setClubToConfirmJoin(null);
                          setSelectedClub(null);
                        }}
                        className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Ja, Verein wechseln</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setClubToConfirmJoin(selectedClub);
                    }}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-xs text-center flex items-center justify-center gap-2"
                  >
                    <span>Diesen Verein im Profil wählen</span>
                  </button>
                )}
              </div>

              {/* Members List with Roles */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-700" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Mitglieder & Positionen im Verein
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                    {selectedClubMembers.length} {selectedClubMembers.length === 1 ? 'Mitglied' : 'Mitglieder'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mb-3">
                  Klicke auf ein Mitglied, um dessen vollständige Kontaktdaten (Telefon, E-Mail, Adresse) aufzurufen.
                </p>

                {selectedClubMembers.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-5 space-y-2">
                    <Users className="w-7 h-7 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">
                      Noch keine Mitglieder für {selectedClub.shortName || selectedClub.name} registriert
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Sobald sich Mitglieder für diesen Verein registrieren oder ihn im Profil auswählen, erscheinen sie hier. Insgesamt sind bereits <strong>{users.length} Mitglieder</strong> im Narrenkreis Bruchsal registriert.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClub(null);
                          setActiveDirectoryTab('members');
                        }}
                        className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Users className="w-3.5 h-3.5 text-amber-700" />
                        <span>Alle {users.length} registrierten Mitglieder anzeigen</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    {selectedClubMembers.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => setSelectedMember(member)}
                        className="p-3.5 hover:bg-amber-50/40 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar */}
                          <UserAvatar user={member} size="md" className="shrink-0" />

                          {/* Member info */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                                {member.name}
                              </span>

                              {/* Position in Club Badge */}
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200/60">
                                {member.positionInClub || 'Mitglied'}
                              </span>

                              {/* Praesidium role badge if applicable */}
                              {member.praesidiumRole && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                  <Award className="w-3 h-3 text-amber-600" />
                                  {member.praesidiumRole}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-1.5 flex-wrap">
                              <span className="truncate flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {member.email}
                              </span>
                              {member.mobile && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="flex items-center gap-1 font-mono text-[11px] text-slate-700">
                                    <Smartphone className="w-3 h-3 text-slate-400" />
                                    {member.mobile}
                                  </span>
                                  {/* 1-Klick WhatsApp */}
                                  <a
                                    href={getWhatsAppUrl(member.mobile)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold shadow-2xs transition-colors"
                                    title="WhatsApp Chat öffnen"
                                  >
                                    <MessageCircle className="w-3 h-3 text-emerald-600" />
                                    <span>WhatsApp</span>
                                  </a>
                                  {/* 1-Klick Anrufen */}
                                  <a
                                    href={getTelUrl(member.mobile)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-[10px] font-bold shadow-2xs transition-colors"
                                    title="Direkt anrufen"
                                  >
                                    <PhoneCall className="w-3 h-3 text-sky-600" />
                                    <span>Anrufen</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action: Open Contact Details */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="hidden sm:inline text-xs font-semibold text-amber-700 group-hover:underline">
                            Kontaktdaten
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {selectedClubMembers.length} Mitglieder im Register
              </span>
              <button
                type="button"
                onClick={() => setSelectedClub(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Member Contact Details */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            {/* Contact Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <button
                onClick={() => setSelectedMember(null)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Zurück zur Vereinsübersicht</span>
              </button>

              <button
                onClick={() => {
                  setSelectedMember(null);
                  setSelectedClub(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contact Details Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Member Card Hero */}
              <div className="flex items-center gap-4 bg-gradient-to-r from-slate-900 to-amber-950 p-4 rounded-2xl text-white">
                <UserAvatar
                  user={selectedMember}
                  size="lg"
                  showBorder
                  borderVariant="amber"
                  editable={selectedMember.id === currentUser.id}
                  onPhotoChange={(newPhoto) => {
                    const updated = { ...selectedMember, avatar: newPhoto };
                    setSelectedMember(updated);
                    if (onUpdateUser) {
                      onUpdateUser(updated);
                    }
                  }}
                />
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white truncate leading-tight">
                    {selectedMember.name}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-200 border border-sky-400/30">
                      {selectedMember.positionInClub || 'Mitglied'}
                    </span>
                    {selectedMember.praesidiumRole && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-400" />
                        {selectedMember.praesidiumRole}
                      </span>
                    )}
                  </div>
                  {selectedClub && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-100/80 mt-1.5 truncate">
                      <ClubLogo club={selectedClub} size="xs" />
                      <span>{selectedClub.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Contact Attributes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Kontaktdaten & Informationen
                </h4>

                {/* Email item */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">E-Mail-Adresse</span>
                      <a 
                        href={`mailto:${selectedMember.email}`}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline truncate block"
                      >
                        {selectedMember.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopy(selectedMember.email, 'email')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
                      title="E-Mail kopieren"
                    >
                      {copiedField === 'email' ? (
                        <CheckCheck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    {copiedField === 'email' && (
                      <span className="text-[10px] text-emerald-600 font-bold">Kopiert!</span>
                    )}
                  </div>
                </div>

                {/* Mobile items (supporting 1st and 2nd phone numbers with individual actions) */}
                {(() => {
                  const mobileNumbers = extractPhoneNumbers(selectedMember.mobile, selectedMember.secondaryMobile);
                  if (mobileNumbers.length === 0) {
                    return (
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">Handy / Mobilfunk</span>
                            <span className="text-xs text-slate-400 italic">Keine Handynummer hinterlegt</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return mobileNumbers.map((phoneNum, idx) => {
                    const label = mobileNumbers.length > 1
                      ? `${idx + 1}. Handy / Mobilfunk`
                      : 'Handy / Mobilfunk';
                    const copyKey = `mobile-${idx}`;

                    return (
                      <div
                        key={`phone-${idx}`}
                        className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                            <Smartphone className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">{label}</span>
                              {mobileNumbers.length > 1 && idx === 0 && (
                                <span className="text-[9px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded">Hauptnummer</span>
                              )}
                              {mobileNumbers.length > 1 && idx === 1 && (
                                <span className="text-[9px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded">2. Nummer</span>
                              )}
                            </div>
                            <a 
                              href={getTelUrl(phoneNum)}
                              className="text-xs sm:text-sm font-mono font-bold text-slate-900 hover:text-sky-700 hover:underline block mt-0.5"
                            >
                              {phoneNum}
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap self-end sm:self-auto">
                          <a
                            href={getWhatsAppUrl(phoneNum)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                            title={`Per WhatsApp an ${phoneNum} schreiben`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                          <a
                            href={getTelUrl(phoneNum)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                            title={`Direkt anrufen: ${phoneNum}`}
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>Anrufen</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(phoneNum, copyKey)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                            title="Nummer kopieren"
                          >
                            {copiedField === copyKey ? (
                              <CheckCheck className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          {copiedField === copyKey && (
                            <span className="text-[10px] text-emerald-600 font-bold">Kopiert!</span>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}

                {/* Landline / Festnetz (optional) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Festnetz-Telefon</span>
                      {selectedMember.phone ? (
                        <a 
                          href={`tel:${selectedMember.phone}`}
                          className="text-xs font-mono font-bold text-slate-900 hover:underline block"
                        >
                          {selectedMember.phone}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Nicht angegeben</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address (optional) */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Anschrift / Wohnort</span>
                    {selectedMember.address ? (
                      <span className="text-xs text-slate-800 leading-snug block mt-0.5">
                        {selectedMember.address}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic block mt-0.5">
                        Keine Anschrift hinterlegt
                      </span>
                    )}
                  </div>
                </div>

                {/* Membership since & bio */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Mitglied seit</span>
                    <span className="text-xs font-mono font-bold text-slate-800 mt-0.5 block">
                      {selectedMember.joinedDate || '2026'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Vereinsposition</span>
                    <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
                      {selectedMember.positionInClub || 'Mitglied'}
                    </span>
                  </div>
                </div>

                {selectedMember.bio && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Notiz / Bio</span>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {selectedMember.bio}
                    </p>
                  </div>
                )}
              </div>

              {/* Eigenes Profilbild einpflegen / ändern wenn eigenes Profil */}
              {selectedMember.id === currentUser.id && (
                <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      user={selectedMember}
                      size="md"
                      showBorder
                      borderVariant="amber"
                      editable
                      onPhotoChange={(newPhoto) => {
                        const updated = { ...selectedMember, avatar: newPhoto };
                        setSelectedMember(updated);
                        if (onUpdateUser) {
                          onUpdateUser(updated);
                        }
                      }}
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-amber-950 block">Dein Profilbild</span>
                      <span className="text-[11px] text-amber-800 block truncate">
                        Tippe auf das Kamerasymbol, um ein Foto von Kamera oder Galerie hochzuladen
                      </span>
                    </div>
                  </div>
                  {selectedMember.avatar && (selectedMember.avatar.startsWith('data:image/') || selectedMember.avatar.startsWith('http')) && (
                    <button
                      type="button"
                      onClick={() => {
                        const initials = selectedMember.name.trim().split(/\s+/).map(p => p[0]).join('').toUpperCase().slice(0, 2) || 'VN';
                        const updated = { ...selectedMember, avatar: initials };
                        setSelectedMember(updated);
                        if (onUpdateUser) {
                          onUpdateUser(updated);
                        }
                      }}
                      className="text-[11px] font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded transition-colors shrink-0"
                    >
                      Foto entfernen
                    </button>
                  )}
                </div>
              )}

              {/* Kontakt ins Telefonbuch speichern (Android / iOS) */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  disabled={downloadingVCard}
                  onClick={async () => {
                    setDownloadingVCard(true);
                    try {
                      await downloadContactVCard(selectedMember, selectedClub);
                      setVcardDownloaded(true);
                      setTimeout(() => setVcardDownloaded(false), 3000);
                    } catch (err) {
                      console.error('vCard export failed:', err);
                    } finally {
                      setDownloadingVCard(false);
                    }
                  }}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-between shadow-sm transition-all cursor-pointer ${
                    vcardDownloaded
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/40 flex items-center justify-center shrink-0">
                      {vcardDownloaded ? (
                        <CheckCheck className="w-4 h-4 text-white" />
                      ) : (
                        <Download className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold leading-tight">
                        {vcardDownloaded ? 'Kontakt bereitgestellt!' : 'Kontakt ins Telefonbuch speichern'}
                      </div>
                      <div className="text-[11px] text-emerald-100 font-normal">
                        vCard (.vcf) für Android & Apple iPhone Kontakte
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold bg-emerald-800/60 text-emerald-100 px-2.5 py-1 rounded-md shrink-0">
                    {downloadingVCard ? 'Lädt...' : vcardDownloaded ? 'Erledigt' : 'Download .vcf'}
                  </span>
                </button>
                <p className="text-[10px] text-slate-500 text-center">
                  Funktioniert direkt auf Android (Google Kontakte) und iOS (Apple Kontakte) ohne zusätzliche App.
                </p>
              </div>

              {/* Direct Messenger action button */}
              {onOpenMessengerForUser && (
                <button
                  type="button"
                  onClick={() => {
                    const memberId = selectedMember.id;
                    setSelectedMember(null);
                    setSelectedClub(null);
                    onOpenMessengerForUser(memberId);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Nachricht an {selectedMember.name} im Messenger verfassen</span>
                </button>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Zurück zur Liste</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedMember(null);
                  setSelectedClub(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Sicherheitsabfrage Vereinswechsel */}
      {clubToConfirmJoin && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setClubToConfirmJoin(null)}
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
              <div className="flex items-center gap-3 font-bold text-slate-900 bg-white p-3 rounded-xl border border-amber-300 shadow-2xs">
                <ClubLogo club={clubToConfirmJoin} size="sm" />
                <div className="min-w-0">
                  <span className="block truncate text-xs font-extrabold text-slate-900">{clubToConfirmJoin.name}</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {clubToConfirmJoin.shortName} · {clubToConfirmJoin.category}
                  </span>
                </div>
              </div>
              {currentUserClub && (
                <p className="text-[11px] text-slate-600 bg-white/60 p-2 rounded-lg border border-amber-200/60">
                  Bisherige Vereinszuordnung: <strong>{currentUserClub.name}</strong> wird dadurch aktualisiert.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setClubToConfirmJoin(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectClubToJoin(clubToConfirmJoin.id);
                  setClubToConfirmJoin(null);
                  setSelectedClub(null);
                }}
                className="px-4 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Ja, Verein wechseln</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
