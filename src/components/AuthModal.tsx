import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Smartphone, 
  Lock, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  FileText, 
  LogIn, 
  UserPlus, 
  Shield, 
  ExternalLink,
  Search,
  ChevronDown,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  Send,
  Building2
} from 'lucide-react';
import { UserProfile, Club, validateProfile } from '../utils/clubLogic';
import { ClubLogo } from './ClubLogo';
import { ClubSelector } from './ClubSelector';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
  onRegister: (newUser: UserProfile) => void;
  onUpdateUser?: (updated: UserProfile) => void;
  users: UserProfile[];
  clubs: Club[];
  onOpenLegal: (tab: 'impressum' | 'datenschutz') => void;
  isLandingPage?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  onUpdateUser,
  users,
  clubs,
  onOpenLegal,
  isLandingPage = false
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register Form (Pflichtfelder aus Profil)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [secondaryMobile, setSecondaryMobile] = useState('');
  const [clubId, setClubId] = useState(clubs[0]?.id || '');
  const [positionInClub, setPositionInClub] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consentTerms, setConsentTerms] = useState(false);
  const [registerErrors, setRegisterErrors] = useState<string[]>([]);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Forgot Password / Emergency Reset state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [foundUserForReset, setFoundUserForReset] = useState<UserProfile | null>(null);
  const [resetCode, setResetCode] = useState('');
  const [newPasswordForReset, setNewPasswordForReset] = useState('');
  const [confirmPasswordForReset, setConfirmPasswordForReset] = useState('');

  useEffect(() => {
    if ((!clubId || !clubs.some(c => c.id === clubId)) && clubs.length > 0) {
      setClubId(clubs[0].id);
    }
  }, [clubs, clubId]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const emailTrimmed = loginEmail.trim().toLowerCase();
    const foundUser = users.find(u => 
      u.email.toLowerCase() === emailTrimmed || 
      u.name.toLowerCase() === emailTrimmed
    );

    if (!foundUser) {
      setLoginError('Kein Mitgliedsprofil mit dieser E-Mail-Adresse oder diesem Namen gefunden.');
      return;
    }

    // If user has a password set, verify it
    if (foundUser.password && loginPassword && foundUser.password !== loginPassword) {
      setLoginError('Ungültiges Passwort für dieses Profil. Nutze bei Bedarf den Link „Passwort vergessen?“.');
      return;
    }

    onLogin(foundUser);
    onClose();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];

    // Profile mandatory fields validation
    const candidate: Partial<UserProfile> = {
      name,
      email,
      mobile,
      secondaryMobile: secondaryMobile.trim() || undefined,
      clubId,
      positionInClub
    };

    const profileVal = validateProfile(candidate);
    if (!profileVal.valid) {
      errors.push(...profileVal.errors);
    }

    // Password validation
    if (!password || password.length < 4) {
      errors.push('Bitte ein Passwort mit mindestens 4 Zeichen vergeben.');
    }
    if (password !== confirmPassword) {
      errors.push('Die Passwörter stimmen nicht überein.');
    }

    // Impressum & Datenschutz Pflicht-Zustimmung
    if (!consentTerms) {
      errors.push('Du musst dem Impressum und der Datenschutzerklärung zustimmen, um dich zu registrieren.');
    }

    // Check if email already registered
    if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
      errors.push('Diese E-Mail-Adresse ist bereits im Narrenkreis Bruchsal registriert.');
    }

    if (errors.length > 0) {
      setRegisterErrors(errors);
      return;
    }

    setRegisterErrors([]);

    const initials = name.trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      secondaryMobile: secondaryMobile.trim() || undefined,
      clubId,
      positionInClub: positionInClub.trim(),
      avatar: initials || 'NB',
      joinedDate: new Date().toISOString().split('T')[0],
      password,
      hasAcceptedTerms: true,
      termsAcceptedDate: new Date().toISOString()
    };

    setRegisterSuccess(true);
    setTimeout(() => {
      onRegister(newUser);
      onClose();
    }, 1200);
  };

  // Step 1: Request Password Reset via Email
  const handleForgotRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    const emailTrimmed = forgotEmail.trim().toLowerCase();
    const foundUser = users.find(u => u.email.toLowerCase() === emailTrimmed);

    if (!foundUser) {
      setForgotError(`Kein registriertes Mitglied mit der E-Mail-Adresse „${forgotEmail}“ gefunden. Bitte überprüfe die Schreibweise.`);
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setResetCode(code);
    setFoundUserForReset(foundUser);
    setForgotStep('reset');
    setForgotSuccess(`Mitgliedskonto für ${foundUser.name} gefunden. Du kannst das Passwort jetzt direkt neu vergeben oder die Notfall-E-Mail öffnen.`);
  };

  // Step 2: Set New Password & Save
  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (!foundUserForReset) return;

    if (!newPasswordForReset || newPasswordForReset.length < 4) {
      setForgotError('Das neue Passwort muss mindestens 4 Zeichen lang sein.');
      return;
    }

    if (newPasswordForReset !== confirmPasswordForReset) {
      setForgotError('Die beiden Passwörter stimmen nicht überein.');
      return;
    }

    const updatedUser: UserProfile = {
      ...foundUserForReset,
      password: newPasswordForReset
    };

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

    setForgotSuccess('Passwort erfolgreich geändert! Du wirst jetzt automatisch angemeldet...');
    setTimeout(() => {
      onLogin(updatedUser);
      onClose();
    }, 1200);
  };

  const resetClub = foundUserForReset ? clubs.find(c => c.id === foundUserForReset.clubId) : null;

  const contentCard = (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-lg flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors ${isLandingPage ? 'my-auto' : 'max-h-[92vh]'}`}>
      {/* Header with Mode toggle */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => { setMode('login'); setLoginError(null); setRegisterErrors([]); setForgotError(null); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
            <span>Anmelden</span>
          </button>

          <button
            type="button"
            onClick={() => { setMode('register'); setLoginError(null); setRegisterErrors([]); setForgotError(null); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />
            <span>Registrieren</span>
          </button>
        </div>

        {!isLandingPage && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Modal / Card Body */}
      <div className="p-6 sm:p-7 overflow-y-auto space-y-5">
        {mode === 'forgot' ? (
          /* Forgot Password Mode */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setMode('login'); setForgotError(null); setForgotSuccess(null); }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-900 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Zurück zum Login</span>
              </button>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Passwort-Rücksetzung
              </span>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-red-700 shrink-0" />
                <span>Passwort per E-Mail zurücksetzen</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Falls du dein Passwort vergessen hast, kannst du es hier mit deiner hinterlegten E-Mail-Adresse im Notfall zurücksetzen und sofort neu vergeben.
              </p>
            </div>

            {forgotError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Rücksetz-Freigabe erteilt</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  {forgotSuccess}
                </p>
              </div>
            )}

            {forgotStep === 'request' ? (
              <form onSubmit={handleForgotRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deine registrierte E-Mail-Adresse *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="name@karneval-bruchsal.de"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      style={{ fontSize: '16px' }}
                      className="w-full text-base sm:text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Die E-Mail-Adresse, mit der du im Narrenkreis Bruchsal registriert bist.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Passwort-Rücksetzung anfordern</span>
                </button>
              </form>
            ) : (
              /* Step 2: Set New Password Form + Email Action */
              <div className="space-y-4">
                {foundUserForReset && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                        <ClubLogo club={resetClub} size="sm" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {foundUserForReset.name}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {resetClub?.name || 'Narrenkreis Bruchsal'} · {foundUserForReset.positionInClub || 'Mitglied'}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-200 shrink-0">
                      Code: {resetCode}
                    </span>
                  </div>
                )}

                {/* Email Client mailto button */}
                {foundUserForReset && (
                  <a
                    href={`mailto:${foundUserForReset.email}?subject=${encodeURIComponent(
                      'Passwort-Rücksetzung Narrenkreis Bruchsal'
                    )}&body=${encodeURIComponent(
                      `Hallo ${foundUserForReset.name},\n\ndein Notfall-Rücksetzcode für das Narrenkreis-Portal lautet: ${resetCode}\n\nE-Mail: ${foundUserForReset.email}\nVerein: ${resetClub?.name || 'Narrenkreis Bruchsal'}\n\nDu kannst jetzt direkt im Portal ein neues Passwort festlegen.\n\nMit närrischen Grüßen,\nNarrenkreis Bruchsal`
                    )}`}
                    className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-600" />
                    <span>Bestätigung in E-Mail-Programm öffnen (mailto)</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}

                {/* New Password Form */}
                <form onSubmit={handlePasswordResetSubmit} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Neues Passwort *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="Mindestens 4 Zeichen"
                        value={newPasswordForReset}
                        onChange={(e) => setNewPasswordForReset(e.target.value)}
                        style={{ fontSize: '16px' }}
                        className="w-full text-base sm:text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Neues Passwort wiederholen *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="Neues Passwort bestätigen"
                        value={confirmPasswordForReset}
                        onChange={(e) => setConfirmPasswordForReset(e.target.value)}
                        style={{ fontSize: '16px' }}
                        className="w-full text-base sm:text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Neues Passwort speichern & anmelden</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : mode === 'login' ? (
          /* Login Mode */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                Mitglieds-Login
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Melde dich mit deiner E-Mail-Adresse an, um Beiträge zu erstellen, E-Mails zu schreiben und dich für Ausflüge anzumelden.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  E-Mail-Adresse oder Name
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="z.B. name@karneval-bruchsal.de"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    style={{ fontSize: '16px' }}
                    className="w-full text-base sm:text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Passwort
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setForgotEmail(loginEmail);
                      setForgotError(null);
                      setForgotSuccess(null);
                      setForgotStep('request');
                    }}
                    className="text-[11px] font-semibold text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3 text-red-600 dark:text-red-400" />
                    <span>Passwort vergessen?</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="Passwort eingeben"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{ fontSize: '16px' }}
                    className="w-full text-base sm:text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Jetzt anmelden</span>
            </button>

            <div className="text-center pt-3 border-t border-slate-100 mt-4 space-y-2">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-xs text-red-700 hover:underline font-semibold cursor-pointer block w-full text-center"
              >
                Noch kein Konto? Hier als neues Mitglied registrieren
              </button>
            </div>
          </form>
        ) : (
          /* Register Mode */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                Neues Mitgliedskonto registrieren
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pflichtfelder gemäß Vereinssatzung des Narrenkreis Bruchsal.
              </p>
            </div>

            {registerSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Konto erfolgreich erstellt! Du wirst angemeldet...</span>
              </div>
            ) : (
              <>
                {registerErrors.length > 0 && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Bitte korrigiere folgende Angaben:</span>
                    </div>
                    <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5 pl-1">
                      {registerErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Profile fields */}
                <div className="space-y-3">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Vollständiger Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Vorname Nachname"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{ fontSize: '16px' }}
                      className="w-full text-base sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
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
                      placeholder="name@karneval-bruchsal.de"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ fontSize: '16px' }}
                      className="w-full text-base sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                    />
                  </div>

                  {/* 1. Mobile */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Handynummer (Mobiltelefon) *
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="+49 171 1234567"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        style={{ fontSize: '16px' }}
                        className="w-full text-base sm:text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                      />
                    </div>
                  </div>

                  {/* 2. Mobile (optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Zweite Handynummer (Weiteres Mobiltelefon, optional)
                    </label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="z.B. +49 176 1234567 (optional)"
                        value={secondaryMobile}
                        onChange={(e) => setSecondaryMobile(e.target.value)}
                        style={{ fontSize: '16px' }}
                        className="w-full text-base sm:text-sm pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                      />
                    </div>
                  </div>

                  {/* Club selection - iOS-optimized with search, large touch target & full club names */}
                  <ClubSelector
                    selectedClubId={clubId}
                    clubs={clubs}
                    onChange={setClubId}
                    label="Auswahl vom Verein (per Dropdown / Suche)"
                    helperText="Tippe auf den Verein, um aus allen 22 Mitgliedsvereinen bequem per Suchfeld oder Liste auszuwählen."
                  />

                  {/* Position in Club */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Position in dem Verein *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="z.B. Zunftmeister, Elferrat, Garde, Aktives Mitglied..."
                      value={positionInClub}
                      onChange={(e) => setPositionInClub(e.target.value)}
                      style={{ fontSize: '16px' }}
                      className="w-full text-base sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                    />
                  </div>

                  {/* Passwords */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Passwort *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Mind. 4 Zeichen"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ fontSize: '16px' }}
                        className="w-full text-base sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Passwort wiederholen *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Passwort bestätigen"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{ fontSize: '16px' }}
                        className="w-full text-base sm:text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600"
                      />
                    </div>
                  </div>

                  {/* Mandatory Consent Checkbox for Impressum & Datenschutz */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={consentTerms}
                        onChange={(e) => setConsentTerms(e.target.checked)}
                        className="mt-0.5 rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs text-slate-700 leading-snug">
                        Ich habe das{' '}
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); onOpenLegal('impressum'); }}
                          className="text-red-700 underline font-semibold hover:text-red-900 inline"
                        >
                          Impressum
                        </button>{' '}
                        und die{' '}
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); onOpenLegal('datenschutz'); }}
                          className="text-red-700 underline font-semibold hover:text-red-900 inline"
                        >
                          Datenschutzerklärung
                        </button>{' '}
                        gelesen und stimme diesen verbindlich zu. *
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-3"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Mitgliedskonto verbindlich anlegen</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                  >
                    Bereits registriert? Hier anmelden
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );

  if (isLandingPage) {
    return contentCard;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      {contentCard}
    </div>
  );
};
