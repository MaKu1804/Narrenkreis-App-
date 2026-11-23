import React, { useState } from 'react';
import { X, User, Mail, Phone, Shield, Check, UserPlus, Users, Calendar, Sparkles, Camera, Trash2 } from 'lucide-react';
import { Club, UserProfile, Excursion } from '../utils/clubLogic';
import { MemberClubLogos } from './ClubLogo';
import { UserAvatar } from './UserAvatar';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  clubs: Club[];
  excursions: Excursion[];
  onUpdateUser: (updated: UserProfile) => void;
  onSwitchUser: (userId: string) => void;
  onCreateUser: (newUser: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  clubs,
  excursions,
  onUpdateUser,
  onSwitchUser,
  onCreateUser
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'switch' | 'new'>('profile');
  
  // Profile edit form
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [mobile, setMobile] = useState(currentUser.mobile || '');
  const [clubId, setClubId] = useState(currentUser.clubId);
  const [roleInClub, setRoleInClub] = useState(currentUser.positionInClub || 'Mitglied');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New user form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newClubId, setNewClubId] = useState(clubs[0]?.id || '');
  const [newRole, setNewRole] = useState('Mitglied');
  const [newBio, setNewBio] = useState('');

  if (!isOpen) return null;

  const currentClub = clubs.find(c => c.id === currentUser.clubId);

  // Excursions where user or user's club is registered
  const userRegistrations = excursions.filter(exc => 
    exc.registrations.some(r => r.registeredByUserId === currentUser.id)
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const initials = name.trim().split(/\s+/).map(p => p[0]).join('').toUpperCase().slice(0, 2) || 'VN';
    const updated: UserProfile = {
      ...currentUser,
      name,
      email,
      phone,
      mobile: mobile || '+49 170 0000000',
      secondaryMobile: currentUser.secondaryMobile,
      clubId,
      positionInClub: roleInClub,
      bio,
      avatar: avatar || initials
    };
    onUpdateUser(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCreateNewUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const initials = newName.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || 'VN';
    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, '.')}@vereinsnetz.de`,
      mobile: newMobile.trim() || newPhone.trim() || '+49 170 0000000',
      phone: newPhone.trim(),
      clubId: newClubId,
      positionInClub: newRole.trim() || 'Mitglied',
      avatar: initials,
      bio: newBio.trim(),
      joinedDate: new Date().toISOString().split('T')[0]
    };

    onCreateUser(newUser);
    onSwitchUser(newUser.id);
    setActiveTab('profile');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <UserAvatar user={{ ...currentUser, avatar }} size="sm" editable onPhotoChange={setAvatar} />
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Mein Vereins-Profil & Einstellungen
              </h2>
              <p className="text-xs text-slate-500">
                Verwalte deine Vereinszugehörigkeit und Kontaktdaten
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 px-6 pt-2 gap-2 bg-slate-50/30">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Profileinstellungen
          </button>
          <button
            onClick={() => setActiveTab('switch')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'switch'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Konto wechseln ({allUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'new'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Neuen Account erstellen
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Current Club badge banner */}
              <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MemberClubLogos club={currentClub} user={currentUser} size="lg" />
                  <div>
                    <span className="text-[11px] font-semibold text-sky-800 uppercase tracking-wider block">
                      Zugeordneter Verein
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      {currentClub?.name || 'Kein Verein gewählt'}
                    </h4>
                    <span className="text-xs text-slate-600">
                      Funktion: {currentUser.positionInClub || 'Mitglied'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-slate-500 block">
                    Mitglied seit {currentUser.joinedDate}
                  </span>
                  <span className="text-xs font-semibold text-sky-700">
                    {userRegistrations.length} aktive Ausflugs-Anmeldungen
                  </span>
                </div>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vollständiger Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-Mail Adresse *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefon / Notfallkontakt
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                {/* Club Dropdown selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vereinszugehörigkeit (Aus Dropdown wählen) *
                  </label>
                  <select
                    value={clubId}
                    onChange={(e) => setClubId(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    {clubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name} ({club.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rolle oder Funktion im Verein
                  </label>
                  <input
                    type="text"
                    value={roleInClub}
                    onChange={(e) => setRoleInClub(e.target.value)}
                    placeholder="z.B. Tourenleiter, Aktives Mitglied, Jugendwart, Vorstand"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Über mich & Erfahrungen
                  </label>
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Interessen, Touren-Erfahrungen, Scheine (z.B. Erste Hilfe, Kletterschein)..."
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {saveSuccess ? (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Profil erfolgreich gespeichert!
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">
                    Änderungen werden sofort für Anmeldungen und Forum übernommen.
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Schließen
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors"
                  >
                    Änderungen speichern
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'switch' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Wähle einen bestehenden Account aus, um die App aus der Perspektive eines anderen Vereinsmitglieds zu testen:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allUsers.map((user) => {
                  const userClub = clubs.find(c => c.id === user.clubId);
                  const isCurrent = user.id === currentUser.id;

                  return (
                    <div
                      key={user.id}
                      onClick={() => {
                        onSwitchUser(user.id);
                        onClose();
                      }}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isCurrent
                          ? 'border-sky-500 bg-sky-50/60 ring-2 ring-sky-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar user={user} size="sm" />
                          <div>
                            <span className="text-sm font-bold text-slate-900 block leading-tight">
                              {user.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {user.positionInClub || 'Mitglied'}
                            </span>
                          </div>
                        </div>
                        {isCurrent && (
                          <span className="text-[11px] font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                            Aktiv
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100/80">
                        <MemberClubLogos club={userClub} user={user} size="xs" />
                        <span className="text-xs font-medium text-slate-700 truncate">
                          {userClub?.shortName || userClub?.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'new' && (
            <form onSubmit={handleCreateNewUser} className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  Erstelle einen individuellen Benutzeraccount mit eigener Vereinszugehörigkeit.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="z.B. Maximilian Bauer"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-Mail Adresse
                  </label>
                  <input
                    type="email"
                    placeholder="m.bauer@alpenverein.de"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefonnummer
                  </label>
                  <input
                    type="tel"
                    placeholder="+49 175 1234567"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vereinszuordnung (Dropdown) *
                  </label>
                  <select
                    value={newClubId}
                    onChange={(e) => setNewClubId(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    {clubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name} ({club.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rolle im Verein
                  </label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="z.B. Mitglied, Zeugwart, Schriftführer"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kurze Notiz / Bio
                  </label>
                  <textarea
                    rows={2}
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    placeholder="Hallo, ich freue mich auf gemeinsame Touren!"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Account anlegen & einloggen
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
