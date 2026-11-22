import React, { useState } from 'react';
import { 
  Shield, 
  Award, 
  Trash2, 
  Plus, 
  Lock, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Building2,
  X,
  FileCheck,
  UserCheck,
  Upload,
  Edit2,
  Search,
  Mail,
  Phone,
  Smartphone,
  MapPin,
  UserPlus,
  Navigation,
  ExternalLink,
  CheckSquare,
  Square,
  MessageCircle,
  PhoneCall,
  Globe
} from 'lucide-react';
import { getWhatsAppUrl, getTelUrl } from '../utils/phoneUtils';
import { 
  UserProfile, 
  Club, 
  PRAESIDIUM_ROLES, 
  PraesidiumRole, 
  isPraesidiumMember,
  resolveClubWebsite
} from '../utils/clubLogic';
import { ClubLogo } from './ClubLogo';
import { UserAvatar } from './UserAvatar';

interface PraesidiumViewProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  clubs: Club[];
  onAddClub: (newClub: Club) => void;
  onEditClub?: (clubId: string, updated: Partial<Club>) => void;
  onDeleteClub: (clubId: string) => void;
  onUpdateUserRole: (userId: string, newRole: PraesidiumRole | null) => void;
  onSwitchUser?: (userId: string) => void;
  onUpdateClubLogo?: (clubId: string, newLogo: string) => void;
  onUpdateUser?: (updated: UserProfile) => void;
  onDeleteUser?: (userId: string) => void;
  onCreateUser?: (newUser: UserProfile) => void;
}

export const PraesidiumView: React.FC<PraesidiumViewProps> = ({
  currentUser,
  allUsers,
  clubs,
  onAddClub,
  onEditClub,
  onDeleteClub,
  onUpdateUserRole,
  onSwitchUser,
  onUpdateClubLogo,
  onUpdateUser,
  onDeleteUser,
  onCreateUser
}) => {
  const isAuthorized = isPraesidiumMember(currentUser);

  // Sub-tab: 'vereine' (Vereine & Präsidiumsrollen) or 'mitglieder' (Mitgliederverwaltung)
  const [activePraesidiumTab, setActivePraesidiumTab] = useState<'vereine' | 'mitglieder'>('vereine');

  // Member management state
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberClubFilter, setMemberClubFilter] = useState('Alle');
  const [memberRoleFilter, setMemberRoleFilter] = useState('Alle');

  // Member edit modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserMobile, setEditUserMobile] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserClubId, setEditUserClubId] = useState('');
  const [editUserPosition, setEditUserPosition] = useState('');
  const [editUserAddress, setEditUserAddress] = useState('');
  const [editUserPraesidiumRole, setEditUserPraesidiumRole] = useState<PraesidiumRole | 'none'>('none');
  const [editUserIsPraesident, setEditUserIsPraesident] = useState(false);
  const [editUserIsZugmarschall, setEditUserIsZugmarschall] = useState(false);

  // Member delete confirmation
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  // Add member modal
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserMobile, setNewUserMobile] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserClubId, setNewUserClubId] = useState(clubs[0]?.id || '');
  const [newUserPosition, setNewUserPosition] = useState('Ausschuss / Mitglied');
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newUserPraesidiumRole, setNewUserPraesidiumRole] = useState<PraesidiumRole | 'none'>('none');
  const [newUserIsPraesident, setNewUserIsPraesident] = useState(false);
  const [newUserIsZugmarschall, setNewUserIsZugmarschall] = useState(false);
  const [newUserPassword, setNewUserPassword] = useState('geheim123');

  // Club creation modal
  const [isAddClubOpen, setIsAddClubOpen] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newShortName, setNewShortName] = useState('');
  const [newCategory, setNewCategory] = useState('Karnevalsgesellschaft');
  const [newLocation, setNewLocation] = useState('Bruchsal');
  const [newClubAddress, setNewClubAddress] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newColor, setNewColor] = useState('#b91c1c');
  const [newSecondaryColor, setNewSecondaryColor] = useState('#ffffff');
  const [hasNewSecondaryColor, setHasNewSecondaryColor] = useState(false);
  const [newYear, setNewYear] = useState(1990);
  const [newDescription, setNewDescription] = useState('');
  const [newLogoDataUrl, setNewLogoDataUrl] = useState<string | null>(null);

  // Club edit modal
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [editClubName, setEditClubName] = useState('');
  const [editClubShortName, setEditClubShortName] = useState('');
  const [editClubCategory, setEditClubCategory] = useState('');
  const [editClubLocation, setEditClubLocation] = useState('');
  const [editClubAddress, setEditClubAddress] = useState('');
  const [editClubWebsite, setEditClubWebsite] = useState('');
  const [editClubColor, setEditClubColor] = useState('#b91c1c');
  const [editClubSecondaryColor, setEditClubSecondaryColor] = useState('#ffffff');
  const [hasEditSecondaryColor, setHasEditSecondaryColor] = useState(false);
  const [editClubYear, setEditClubYear] = useState(1990);
  const [editClubDescription, setEditClubDescription] = useState('');

  // Delete club confirmation
  const [clubToDelete, setClubToDelete] = useState<Club | null>(null);

  const handleOpenEditClub = (club: Club) => {
    setEditingClub(club);
    setEditClubName(club.name);
    setEditClubShortName(club.shortName || '');
    setEditClubCategory(club.category || '');
    setEditClubLocation(club.location || 'Bruchsal');
    setEditClubAddress(club.clubhouseAddress || '');
    setEditClubWebsite(club.website || resolveClubWebsite(club) || '');
    setEditClubColor(club.color || '#b91c1c');
    setEditClubSecondaryColor(club.secondaryColor || '#ffffff');
    setHasEditSecondaryColor(Boolean(club.secondaryColor));
    setEditClubYear(club.establishedYear || 1990);
    setEditClubDescription(club.description || '');
  };

  const handleSaveEditClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClub || !editClubName.trim()) return;

    if (onEditClub) {
      onEditClub(editingClub.id, {
        name: editClubName.trim(),
        shortName: editClubShortName.trim() || editClubName.trim(),
        category: editClubCategory.trim() || 'Karneval',
        location: editClubLocation.trim() || 'Bruchsal',
        clubhouseAddress: editClubAddress.trim(),
        website: editClubWebsite.trim() || undefined,
        color: editClubColor,
        secondaryColor: hasEditSecondaryColor ? editClubSecondaryColor : undefined,
        establishedYear: editClubYear,
        description: editClubDescription.trim()
      });
    }

    setEditingClub(null);
  };

  const handleOpenEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserMobile(user.mobile || '');
    setEditUserPhone(user.phone || '');
    setEditUserClubId(user.clubId);
    setEditUserPosition(user.positionInClub || '');
    setEditUserAddress(user.address || '');
    setEditUserPraesidiumRole(user.praesidiumRole || 'none');
    setEditUserIsPraesident(Boolean(user.isPraesident));
    setEditUserIsZugmarschall(Boolean(user.isZugmarschall));
  };

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editUserName.trim() || !editUserEmail.trim() || !editUserMobile.trim()) return;

    const newRole = editUserPraesidiumRole === 'none' ? null : editUserPraesidiumRole;

    const updated: UserProfile = {
      ...editingUser,
      name: editUserName.trim(),
      email: editUserEmail.trim(),
      mobile: editUserMobile.trim(),
      phone: editUserPhone.trim(),
      clubId: editUserClubId,
      positionInClub: editUserPosition.trim(),
      address: editUserAddress.trim(),
      praesidiumRole: newRole,
      isPraesident: editUserIsPraesident,
      isZugmarschall: editUserIsZugmarschall,
      avatar: editUserName.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    };

    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    if (newRole !== editingUser.praesidiumRole) {
      onUpdateUserRole(editingUser.id, newRole);
    }

    setEditingUser(null);
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;
    if (onDeleteUser) {
      onDeleteUser(userToDelete.id);
    }
    setUserToDelete(null);
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserMobile.trim()) return;

    const newRole = newUserPraesidiumRole === 'none' ? null : newUserPraesidiumRole;
    const initials = newUserName.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

    const created: UserProfile = {
      id: `user-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      mobile: newUserMobile.trim(),
      phone: newUserPhone.trim(),
      clubId: newUserClubId,
      positionInClub: newUserPosition.trim(),
      address: newUserAddress.trim(),
      praesidiumRole: newRole,
      isPraesident: newUserIsPraesident,
      isZugmarschall: newUserIsZugmarschall,
      avatar: initials,
      joinedDate: new Date().toISOString().split('T')[0],
      password: newUserPassword,
      hasAcceptedTerms: true,
      termsAcceptedDate: new Date().toISOString()
    };

    if (onCreateUser) {
      onCreateUser(created);
    }
    if (newRole) {
      onUpdateUserRole(created.id, newRole);
    }

    setIsAddUserOpen(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserMobile('');
    setNewUserPhone('');
    setNewUserAddress('');
    setNewUserPraesidiumRole('none');
    setNewUserIsPraesident(false);
    setNewUserIsZugmarschall(false);
  };

  const filteredMembers = allUsers.filter((u) => {
    const matchesSearch = !memberSearchQuery.trim() || 
      u.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      (u.mobile || '').toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      (u.positionInClub || '').toLowerCase().includes(memberSearchQuery.toLowerCase());

    const matchesClub = memberClubFilter === 'Alle' || u.clubId === memberClubFilter;

    const matchesRole = memberRoleFilter === 'Alle' ||
      (memberRoleFilter === 'praesidium' && Boolean(u.praesidiumRole)) ||
      (memberRoleFilter === 'mitglieder' && !u.praesidiumRole);

    return matchesSearch && matchesClub && matchesRole;
  });

  // If user is not in the Praesidium, show restricted view
  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border-2 border-amber-200 shadow-xs">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900">
            Geschützter Präsidiumsbereich
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Auf diesen Bereich hat ausschließlich das gewählte Präsidium des Narrenkreis Bruchsal Zugriff:
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {PRAESIDIUM_ROLES.map((role) => (
              <span key={role} className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                {role}
              </span>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 max-w-md mx-auto">
          Jedes Mitglied darf nur mit dem eigenen Konto angemeldet sein. Falls du ein Amt im Präsidium bekleidest, melde dich bitte über das Login-Portal mit deiner Präsidiums-Adresse an.
        </div>
      </div>
    );
  }

  // Handle Add Club
  const handleCreateClubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim()) return;

    const initials = newShortName.trim().slice(0, 2).toUpperCase() || newClubName.trim().slice(0, 2).toUpperCase();
    const clubId = `club-${Date.now()}`;
    const secondaryColorValue = hasNewSecondaryColor ? newSecondaryColor : undefined;

    // Custom vector crest badge with official border and initials
    const gradientDef = secondaryColorValue ? `
      <defs>
        <linearGradient id="grad-${clubId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="50%" stop-color="${newColor}" />
          <stop offset="50%" stop-color="${secondaryColorValue}" />
        </linearGradient>
      </defs>` : '';

    const circleFill = secondaryColorValue ? `url(#grad-${clubId})` : newColor;

    const logoSvg = `<svg viewBox="0 0 100 100" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${gradientDef}
      <circle cx="50" cy="50" r="48" fill="${circleFill}" stroke="#fde047" stroke-width="4"/>
      <path d="M28 50L50 24L72 50L50 76L28 50Z" fill="#ffffff" fill-opacity="0.25"/>
      <text x="50" y="58" font-family="sans-serif" font-size="26" font-weight="bold" fill="#ffffff" text-anchor="middle" filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.8))">${initials}</text>
    </svg>`;

    const created: Club = {
      id: clubId,
      name: newClubName.trim(),
      shortName: newShortName.trim() || newClubName.trim(),
      category: newCategory,
      logo: newLogoDataUrl || logoSvg,
      color: newColor,
      secondaryColor: secondaryColorValue,
      description: newDescription.trim() || `Mitgliedsverein im Narrenkreis Bruchsal (${newLocation}).`,
      memberCount: 50,
      establishedYear: Number(newYear) || 2026,
      location: newLocation.trim(),
      clubhouseAddress: newClubAddress.trim() || undefined,
      website: newWebsite.trim() || undefined
    };

    onAddClub(created);
    setIsAddClubOpen(false);
    setNewClubName('');
    setNewShortName('');
    setNewClubAddress('');
    setNewWebsite('');
    setNewDescription('');
    setNewLogoDataUrl(null);
    setHasNewSecondaryColor(false);
  };

  const handleConfirmDeleteClub = () => {
    if (!clubToDelete) return;
    onDeleteClub(clubToDelete.id);
    setClubToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Authorized Präsidium Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
            <Award className="w-4 h-4" />
            <span>Offizieller Präsidiumsbereich · Narrenkreis Bruchsal</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            Präsidiums-Verwaltung & Vereinsregister
          </h2>
          <p className="text-xs text-amber-100 max-w-2xl">
            Eingeloggt als <strong className="text-white">{currentUser.name}</strong> ({currentUser.praesidiumRole}).
            Hier verwaltet das Präsidium die Mitgliedsvereine, Rollenverteilungen und Mitglieder.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {activePraesidiumTab === 'vereine' ? (
            <button
              onClick={() => setIsAddClubOpen(true)}
              className="px-4 py-2.5 text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-400 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Neuen Verein aufnehmen</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="px-4 py-2.5 text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-400 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Neues Mitglied anlegen</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none max-w-full">
        <button
          type="button"
          onClick={() => setActivePraesidiumTab('vereine')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activePraesidiumTab === 'vereine'
              ? 'bg-amber-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Vereine & Präsidiumsrollen</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activePraesidiumTab === 'vereine' ? 'bg-amber-950/60 text-amber-200' : 'bg-slate-100 text-slate-600'}`}>
            {clubs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActivePraesidiumTab('mitglieder')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activePraesidiumTab === 'mitglieder'
              ? 'bg-amber-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Mitgliederverwaltung</span>
          <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${activePraesidiumTab === 'mitglieder' ? 'bg-amber-950/60 text-amber-200' : 'bg-slate-100 text-slate-600'}`}>
            {allUsers.length}
          </span>
        </button>
      </div>

      {/* Content Tab 1: Vereine & Präsidiumsrollen */}
      {activePraesidiumTab === 'vereine' && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Die 4 Präsidiumsrollen (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-600" />
              <span>Das Narrenkreis-Präsidium</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Die 4 satzungsgemäßen Präsidiumsrollen
            </p>
          </div>

          <div className="space-y-3">
            {PRAESIDIUM_ROLES.map((role) => {
              const holder = allUsers.find(u => u.praesidiumRole === role);
              const holderClub = holder ? clubs.find(c => c.id === holder.clubId) : null;

              return (
                <div
                  key={role}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded text-[11px]">
                      {role}
                    </span>
                    <span className="text-[10px] text-slate-400">Amtsinhaber</span>
                  </div>

                  {holder ? (
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <UserAvatar user={holder} size="xs" />
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight">{holder.name}</span>
                          <span className="text-[10px] text-slate-500">{holderClub?.shortName || holderClub?.name}</span>
                        </div>
                      </div>

                      {/* Reassign dropdown */}
                      <select
                        value={holder.id}
                        onChange={(e) => {
                          const newUserId = e.target.value;
                          // Revoke from previous holder, assign to new
                          onUpdateUserRole(holder.id, null);
                          if (newUserId) {
                            onUpdateUserRole(newUserId, role);
                          }
                        }}
                        className="text-[10px] border border-slate-300 rounded px-1.5 py-1 bg-white focus:outline-none"
                      >
                        {allUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-400 italic text-xs">Aktuell unbesetzt</span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            onUpdateUserRole(e.target.value, role);
                          }
                        }}
                        className="text-[10px] border border-slate-300 rounded px-1.5 py-1 bg-white focus:outline-none"
                      >
                        <option value="">Besetzen...</option>
                        {allUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Vereins-Verwaltung (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-sky-600" />
                <span>Vereins-Verwaltung Narrenkreis Bruchsal</span>
              </h3>
              <p className="text-xs text-slate-500">
                Vereine verwalten, neue Vereine mit Logo anlegen oder austretende Vereine löschen
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
              {clubs.length} Mitgliedsvereine
            </span>
          </div>

          {/* List of Clubs with Delete option */}
          {clubs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              Keine Vereine vorhanden. Klicke oben auf „Neuen Verein aufnehmen“, um einen Mitgliedsverein anzulegen.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {clubs.map((club) => {
                const affiliatedMembers = allUsers.filter(u => u.clubId === club.id);

                return (
                  <div
                    key={club.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 p-3 rounded-xl transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <ClubLogo club={club} size="lg" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{club.name}</h4>
                          <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded">
                            {club.category}
                          </span>
                          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200" title="Vereinsfarben">
                            <span className="w-2.5 h-2.5 rounded-full border border-slate-300 shadow-2xs" style={{ backgroundColor: club.color }} />
                            {club.secondaryColor && (
                              <span className="w-2.5 h-2.5 rounded-full border border-slate-300 shadow-2xs" style={{ backgroundColor: club.secondaryColor }} />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {club.location ? `${club.location} · ` : ''}Gegr. {club.establishedYear} · {affiliatedMembers.length} registrierte App-Mitglieder
                        </p>
                        {club.clubhouseAddress && (
                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-700">
                            <span className="inline-flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>{club.clubhouseAddress}</span>
                            </span>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(club.clubhouseAddress)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors shadow-2xs"
                              title="Direkt Google Maps öffnen und Route / Navigation starten"
                            >
                              <Navigation className="w-3.5 h-3.5 text-sky-600" />
                              <span>Google Maps</span>
                              <ExternalLink className="w-3 h-3 text-sky-500" />
                            </a>
                          </div>
                        )}
                        {(() => {
                          const websiteUrl = resolveClubWebsite(club);
                          if (!websiteUrl) return null;
                          return (
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                              <a
                                href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                                title="Offizielle Homepage im neuen Tab öffnen"
                              >
                                <Globe className="w-3 h-3 text-blue-600" />
                                <span>Homepage: {websiteUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-blue-400" />
                              </a>
                            </div>
                          );
                        })()}
                        <p className="text-xs text-slate-600 mt-1 line-clamp-1 max-w-lg">
                          {club.description}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Edit club, Upload logo & Delete club */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleOpenEditClub(club)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-sky-700 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Vereinsdaten bearbeiten"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-sky-600" />
                        <span>Bearbeiten</span>
                      </button>

                      {onUpdateClubLogo && (
                        <label
                          className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/90 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Eigenes Vereins-Logo / Wappen hochladen"
                        >
                          <Upload className="w-3.5 h-3.5 text-amber-700" />
                          <span>Logo ändern</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  if (typeof reader.result === 'string') {
                                    onUpdateClubLogo(club.id, reader.result);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}

                      <button
                        onClick={() => setClubToDelete(club)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Verein löschen (z.B. bei Austritt aus dem Narrenkreis)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Verein löschen</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Content Tab 2: Mitgliederverwaltung */}
      {activePraesidiumTab === 'mitglieder' && (
        <div className="space-y-4">
          {/* Controls Bar: Search, Filters, Stats */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Mitglied suchen (Name, E-Mail, Telefon, Position)..."
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all font-medium"
                />
              </div>

              {/* Club Filter */}
              <select
                value={memberClubFilter}
                onChange={(e) => setMemberClubFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-medium text-slate-700"
              >
                <option value="Alle">Alle Vereine</option>
                {clubs.map(c => (
                  <option key={c.id} value={c.id}>{c.shortName || c.name}</option>
                ))}
              </select>

              {/* Praesidium Role Filter */}
              <select
                value={memberRoleFilter}
                onChange={(e) => setMemberRoleFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 font-medium text-slate-700"
              >
                <option value="Alle">Alle Rollen</option>
                <option value="praesidium">Nur Präsidium</option>
                <option value="mitglieder">Nur Vereinsmitglieder</option>
              </select>
            </div>

            <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl self-start md:self-auto shrink-0">
              {filteredMembers.length} {filteredMembers.length === 1 ? 'Mitglied' : 'Mitglieder'} gefunden
            </span>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredMembers.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">Keine Mitglieder für diese Filterkriterien gefunden.</p>
                <p className="text-[11px] text-slate-400">Passe die Suche an oder lege oben ein neues Mitglied an.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Mitglied</th>
                      <th className="py-3.5 px-4">Verein & Funktion</th>
                      <th className="py-3.5 px-4">Kontaktdaten</th>
                      <th className="py-3.5 px-4">Präsidiumsamt</th>
                      <th className="py-3.5 px-3 text-center">Präsident</th>
                      <th className="py-3.5 px-3 text-center">Zugmarschall</th>
                      <th className="py-3.5 px-4">Status & Datenschutz</th>
                      <th className="py-3.5 px-4 text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMembers.map((member) => {
                      const memberClub = clubs.find(c => c.id === member.clubId);

                      return (
                        <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <UserAvatar user={member} size="sm" />
                              <div>
                                <span className="font-bold text-slate-900 block leading-tight">{member.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">Seit {member.joinedDate || '2026'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <ClubLogo club={memberClub} size="xs" />
                              <span className="font-semibold text-slate-800">{memberClub?.shortName || memberClub?.name || 'Unabhängig'}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">{member.positionInClub || 'Mitglied'}</span>
                          </td>
                          <td className="py-3 px-4 space-y-0.5">
                            <div className="flex items-center gap-1.5 text-slate-800 font-mono text-[11px]">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{member.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px] flex-wrap">
                              <Smartphone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{member.mobile || '—'}</span>
                              {member.mobile && (
                                <div className="inline-flex items-center gap-1 ml-1">
                                  <a
                                    href={getWhatsAppUrl(member.mobile)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                                    title="WhatsApp Chat starten"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                  </a>
                                  <a
                                    href={getTelUrl(member.mobile)}
                                    className="p-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors"
                                    title="Direkt anrufen"
                                  >
                                    <PhoneCall className="w-3 h-3" />
                                  </a>
                                </div>
                              )}
                            </div>
                            {member.address && (
                              <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[160px]">{member.address}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {member.praesidiumRole ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                <Shield className="w-3 h-3 text-amber-600" />
                                {member.praesidiumRole}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Kein Amt</span>
                            )}
                          </td>

                          {/* Kästchen 1: Präsident (Verteiler) */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const newVal = !member.isPraesident;
                                onUpdateUser?.({ ...member, isPraesident: newVal });
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                member.isPraesident
                                  ? 'bg-amber-100 text-amber-950 border-amber-300 ring-2 ring-amber-400/40 shadow-xs font-bold'
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                              }`}
                              title={member.isPraesident ? 'Präsident-Häkchen gesetzt (Klicken zum Entfernen)' : 'Klicken zum Setzen des Präsidenten-Häkchens'}
                            >
                              {member.isPraesident ? (
                                <CheckSquare className="w-4 h-4 text-amber-700 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span>Präsident</span>
                            </button>
                          </td>

                          {/* Kästchen 2: Zugmarschall (Verteiler) */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const newVal = !member.isZugmarschall;
                                onUpdateUser?.({ ...member, isZugmarschall: newVal });
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                member.isZugmarschall
                                  ? 'bg-purple-100 text-purple-950 border-purple-300 ring-2 ring-purple-400/40 shadow-xs font-bold'
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                              }`}
                              title={member.isZugmarschall ? 'Zugmarschall-Häkchen gesetzt (Klicken zum Entfernen)' : 'Klicken zum Setzen des Zugmarschall-Häkchens'}
                            >
                              {member.isZugmarschall ? (
                                <CheckSquare className="w-4 h-4 text-purple-700 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span>Zugmarschall</span>
                            </button>
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Aktiv (DSGVO ok)
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditUser(member)}
                                className="px-2.5 py-1 text-slate-700 hover:text-sky-700 bg-white hover:bg-sky-50 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                title="Mitgliedsdaten bearbeiten"
                              >
                                <Edit2 className="w-3 h-3 text-sky-600" />
                                <span>Bearbeiten</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setUserToDelete(member)}
                                className="px-2.5 py-1 text-slate-700 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                title="Mitglied aus dem Narrenkreis löschen"
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                                <span>Löschen</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Verein anlegen */}
      {isAddClubOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Neuen Verein in den Narrenkreis aufnehmen
                </h3>
              </div>
              <button
                onClick={() => setIsAddClubOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClubSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vollständiger Vereinsname *
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Carneval-Club Heidelsheim 1952 e.V."
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kurzname / Kürzel *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="z.B. CCH"
                    value={newShortName}
                    onChange={(e) => setNewShortName(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ort / Stadtteil *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="z.B. Bruchsal-Büchenau"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Vereinsheim Adresse Feld mit Google Maps */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vereinsheim Adresse (für Google Maps Navigation)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="z.B. Tunnelstraße 12, 76646 Bruchsal"
                    value={newClubAddress}
                    onChange={(e) => setNewClubAddress(e.target.value)}
                    className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Offizielle Vereins-Homepage URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vereins-Homepage / Website URL
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://www.beispiel-verein.de"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                    className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Wird im Vereinsverzeichnis mit einem direkten Button eingebettet.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategorie
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gründungsjahr
                  </label>
                  <input
                    type="number"
                    value={newYear}
                    onChange={(e) => setNewYear(parseInt(e.target.value, 10))}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Logo / Color generator with 2nd Color Option */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Vereinsfarben & Standard-Wappen
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-sky-800 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasNewSecondaryColor}
                      onChange={(e) => setHasNewSecondaryColor(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                    <span>2. Farbe als Option hinzufügen</span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  {/* 1. Vereinsfarbe */}
                  <div className="flex items-center gap-2">
                    <div className="text-center">
                      <input
                        type="color"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shadow-2xs"
                        title="1. Vereinsfarbe (Hauptfarbe)"
                      />
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">1. Farbe</span>
                    </div>
                  </div>

                  {/* 2. Vereinsfarbe (Zweitfarbe) */}
                  {hasNewSecondaryColor && (
                    <div className="flex items-center gap-2 animate-in fade-in duration-150">
                      <div className="text-center">
                        <input
                          type="color"
                          value={newSecondaryColor}
                          onChange={(e) => setNewSecondaryColor(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shadow-2xs"
                          title="2. Vereinsfarbe (Zweitfarbe / Akzent)"
                        />
                        <span className="text-[10px] text-slate-500 font-medium block mt-0.5">2. Farbe</span>
                      </div>
                    </div>
                  )}

                  {/* Wappen-Vorschau */}
                  <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                    <div
                      className="w-11 h-11 rounded-full border-2 border-amber-400 shadow-xs flex items-center justify-center text-white text-xs font-bold transition-all relative overflow-hidden shrink-0"
                      style={{
                        background: hasNewSecondaryColor
                          ? `linear-gradient(135deg, ${newColor} 50%, ${newSecondaryColor} 50%)`
                          : newColor
                      }}
                    >
                      <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] font-extrabold text-white text-xs tracking-wider">
                        {newShortName.slice(0, 2).toUpperCase() || 'VK'}
                      </span>
                    </div>
                    <div className="min-w-0 text-xs">
                      <span className="font-semibold text-slate-800 block">
                        {hasNewSecondaryColor ? 'Zweifarbiges Wappen' : 'Einfarbiges Wappen'}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {hasNewSecondaryColor 
                          ? `${newColor} & ${newSecondaryColor}` 
                          : 'Wird als Wappenfarbe genutzt, falls kein Bild hochgeladen wird'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Eigenes Vereins-Logo / Wappen hochladen (optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs">
                    <Upload className="w-4 h-4 text-amber-700" />
                    <span>{newLogoDataUrl ? 'Anderes Bild wählen' : 'Bilddatei auswählen (PNG, JPG, SVG)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setNewLogoDataUrl(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  {newLogoDataUrl && (
                    <div className="flex items-center gap-2">
                      <img src={newLogoDataUrl} alt="Vorschau" className="w-9 h-9 object-contain rounded border border-slate-200 p-0.5 bg-white shadow-2xs" />
                      <button
                        type="button"
                        onClick={() => setNewLogoDataUrl(null)}
                        className="text-xs text-rose-600 hover:underline cursor-pointer"
                      >
                        Entfernen
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Fastnachtsbrauchtum, Gardetanz, Narrenruf..."
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddClubOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Verein aufnehmen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Verein bearbeiten */}
      {editingClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Verein bearbeiten
                  </h3>
                  <p className="text-xs text-slate-500">{editingClub.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingClub(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
                aria-label="Schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditClub} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vollständiger Vereinsname *
                </label>
                <input
                  type="text"
                  required
                  value={editClubName}
                  onChange={(e) => setEditClubName(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kurzname / Kürzel *
                  </label>
                  <input
                    type="text"
                    required
                    value={editClubShortName}
                    onChange={(e) => setEditClubShortName(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ort / Stadtteil
                  </label>
                  <input
                    type="text"
                    value={editClubLocation}
                    onChange={(e) => setEditClubLocation(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Vereinsheim Adressen Feld mit Google Maps */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Vereinsheim Adresse (für Google Maps Navigation)
                  </label>
                  {editClubAddress && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(editClubAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-sky-700 hover:text-sky-800 hover:underline inline-flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3 text-sky-600" />
                      <span>In Maps öffnen</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Straße Hausnr., PLZ Ort"
                    value={editClubAddress}
                    onChange={(e) => setEditClubAddress(e.target.value)}
                    className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Ermöglicht allen Mitgliedern die direkte 1-Klick Navigation zum Vereinsheim.
                </p>
              </div>

              {/* Offizielle Vereins-Homepage URL */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Vereins-Homepage / Website URL
                  </label>
                  {editClubWebsite && (
                    <a
                      href={editClubWebsite.startsWith('http') ? editClubWebsite : `https://${editClubWebsite}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3 text-blue-600" />
                      <span>Website testen</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://www.beispiel-verein.de"
                    value={editClubWebsite}
                    onChange={(e) => setEditClubWebsite(e.target.value)}
                    className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Wird direkt im Vereinsverzeichnis als prominenter Homepage-Button eingebettet.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategorie
                  </label>
                  <input
                    type="text"
                    value={editClubCategory}
                    onChange={(e) => setEditClubCategory(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gründungsjahr
                  </label>
                  <input
                    type="number"
                    value={editClubYear}
                    onChange={(e) => setEditClubYear(parseInt(e.target.value, 10))}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Vereinsfarben in Verein bearbeiten */}
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Vereinsfarben & Standard-Wappen
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-sky-800 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasEditSecondaryColor}
                      onChange={(e) => setHasEditSecondaryColor(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                    <span>2. Farbe als Option hinzufügen</span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="text-center">
                      <input
                        type="color"
                        value={editClubColor}
                        onChange={(e) => setEditClubColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shadow-2xs"
                        title="1. Vereinsfarbe (Hauptfarbe)"
                      />
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">1. Farbe</span>
                    </div>
                  </div>

                  {hasEditSecondaryColor && (
                    <div className="flex items-center gap-2 animate-in fade-in duration-150">
                      <div className="text-center">
                        <input
                          type="color"
                          value={editClubSecondaryColor}
                          onChange={(e) => setEditClubSecondaryColor(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shadow-2xs"
                          title="2. Vereinsfarbe (Zweitfarbe / Akzent)"
                        />
                        <span className="text-[10px] text-slate-500 font-medium block mt-0.5">2. Farbe</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                    <div
                      className="w-11 h-11 rounded-full border-2 border-amber-400 shadow-xs flex items-center justify-center text-white text-xs font-bold transition-all relative overflow-hidden shrink-0"
                      style={{
                        background: hasEditSecondaryColor
                          ? `linear-gradient(135deg, ${editClubColor} 50%, ${editClubSecondaryColor} 50%)`
                          : editClubColor
                      }}
                    >
                      <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] font-extrabold text-white text-xs tracking-wider">
                        {editClubShortName.slice(0, 2).toUpperCase() || 'VK'}
                      </span>
                    </div>
                    <div className="min-w-0 text-xs">
                      <span className="font-semibold text-slate-800 block">
                        {hasEditSecondaryColor ? 'Zweifarbiges Wappen' : 'Einfarbiges Wappen'}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {hasEditSecondaryColor ? `${editClubColor} & ${editClubSecondaryColor}` : 'Hauptfarbe aktiv'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  rows={3}
                  value={editClubDescription}
                  onChange={(e) => setEditClubDescription(e.target.value)}
                  placeholder="Vereinsgeschichte, Fastnachtstradition, Umzüge..."
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingClub(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Änderungen speichern</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Verein löschen / Austritt */}
      {clubToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-md p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                Verein aus Narrenkreis löschen?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Möchtest du den Verein <strong className="text-slate-900">{clubToDelete.name}</strong> wirklich aus der Vereins-Verwaltung entfernen? Der Verein wird aus allen Dropdown-Listen und dem Narrenkreis-Register gelöscht.
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClubToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClub}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors"
              >
                Ja, Verein unwiderruflich löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mitglied bearbeiten */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Mitgliedsdaten bearbeiten
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Vollständiger Name *
                </label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    E-Mail-Adresse *
                  </label>
                  <input
                    type="email"
                    required
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Handynummer *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editUserMobile}
                    onChange={(e) => setEditUserMobile(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Verein *
                  </label>
                  <select
                    value={editUserClubId}
                    onChange={(e) => setEditUserClubId(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    {clubs.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Position im Verein *
                  </label>
                  <input
                    type="text"
                    required
                    value={editUserPosition}
                    onChange={(e) => setEditUserPosition(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Festnetz Telefon (optional)
                  </label>
                  <input
                    type="tel"
                    value={editUserPhone}
                    onChange={(e) => setEditUserPhone(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Präsidiumsamt
                  </label>
                  <select
                    value={editUserPraesidiumRole}
                    onChange={(e) => setEditUserPraesidiumRole(e.target.value as any)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    <option value="none">Kein Präsidiumsamt</option>
                    {PRAESIDIUM_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Adresse (optional)
                </label>
                <input
                  type="text"
                  value={editUserAddress}
                  onChange={(e) => setEditUserAddress(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              {/* Verteiler-Zugehörigkeit Häkchen: Präsident & Zugmarschall */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="block font-bold text-slate-800 text-xs">
                  Verteiler-Kästchen (Häkchen)
                </span>
                <p className="text-[11px] text-slate-500">
                  Aktivierte Kästchen fügen das Mitglied automatisch in die Messenger-Verteiler ein:
                </p>
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editUserIsPraesident}
                      onChange={(e) => setEditUserIsPraesident(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Präsident (Teil des Verteilers „Präsidenten“)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editUserIsZugmarschall}
                      onChange={(e) => setEditUserIsZugmarschall(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Zugmarschall (Teil des Verteilers „Zugmarschälle“)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Änderungen speichern</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mitglied löschen Bestätigung */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                Mitglied wirklich löschen?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Möchtest du das Mitglied <strong className="text-slate-900">{userToDelete.name}</strong> ({userToDelete.email}) wirklich aus dem Narrenkreis entfernen? Der Login-Zugang und das Profil werden gelöscht.
              </p>
              {userToDelete.praesidiumRole && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] font-medium text-left">
                  Hinweis: Dieses Mitglied belegt das Amt <strong>{userToDelete.praesidiumRole}</strong>. Dieses Amt wird bei Löschung unbesetzt.
                </div>
              )}
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ja, Mitglied löschen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Neues Mitglied anlegen */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Neues Mitglied im Narrenkreis anlegen
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Vollständiger Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Hans Muster"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    E-Mail-Adresse *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@verein.de"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Handynummer *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+49 170 1234567"
                    value={newUserMobile}
                    onChange={(e) => setNewUserMobile(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Verein *
                  </label>
                  <select
                    value={newUserClubId}
                    onChange={(e) => setNewUserClubId(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  >
                    {clubs.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Position im Verein *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="z.B. Schriftführer, Kassier..."
                    value={newUserPosition}
                    onChange={(e) => setNewUserPosition(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Präsidiumsamt (optional)
                  </label>
                  <select
                    value={newUserPraesidiumRole}
                    onChange={(e) => setNewUserPraesidiumRole(e.target.value as any)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  >
                    <option value="none">Kein Präsidiumsamt</option>
                    {PRAESIDIUM_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Initiales Passwort *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Adresse (optional)
                </label>
                <input
                  type="text"
                  placeholder="Straße, PLZ Ort"
                  value={newUserAddress}
                  onChange={(e) => setNewUserAddress(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                />
              </div>

              {/* Verteiler-Zugehörigkeit Häkchen: Präsident & Zugmarschall */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="block font-bold text-slate-800 text-xs">
                  Verteiler-Kästchen (Häkchen)
                </span>
                <p className="text-[11px] text-slate-500">
                  Aktivierte Kästchen fügen das neue Mitglied direkt in die Messenger-Verteiler ein:
                </p>
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newUserIsPraesident}
                      onChange={(e) => setNewUserIsPraesident(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Präsident (Teil des Verteilers „Präsidenten“)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newUserIsZugmarschall}
                      onChange={(e) => setNewUserIsZugmarschall(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Zugmarschall (Teil des Verteilers „Zugmarschälle“)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-slate-900 bg-amber-300 hover:bg-amber-400 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Mitglied speichern & freischalten</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
