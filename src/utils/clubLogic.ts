export interface Club {
  id: string;
  name: string;
  shortName: string;
  category: string;
  logo: string;
  color: string;
  secondaryColor?: string; // 2. Vereinsfarbe (Zweitfarbe / Akzent)
  description: string;
  memberCount: number;
  establishedYear: number;
  location?: string;
  clubhouseAddress?: string; // Vereinsheim Adresse mit Google Maps Navigation
  website?: string;
}

export const DEFAULT_CLUB_WEBSITES: Record<string, string> = {
  'buechenau': 'https://www.bkg-buechenau.de',
  'bkg': 'https://www.bkg-buechenau.de',
  'ubstadt': 'https://www.eselhopfer.de',
  'eselhopfer': 'https://www.eselhopfer.de',
  'philippsburg': 'https://www.kage-narhalla.de',
  'narhalla': 'https://www.kage-narhalla.de',
  'odenheim': 'https://www.okg-odenheim.de',
  'stockriewer': 'https://www.stockriewer.de',
  'forst': 'https://www.ffc-forst.de',
  'ffc': 'https://www.ffc-forst.de',
  'östringen': 'https://www.wicker-wacker.de',
  'oestringen': 'https://www.wicker-wacker.de',
  'wicker': 'https://www.wicker-wacker.de',
  'trolle': 'https://www.klosterberg-trolle.de',
  'kerschdekipper': 'https://www.kerschdekipper.de',
  'sauwagen': 'https://www.sauwagen.de',
  'fwf': 'https://www.sauwagen.de',
  'basselschorra': 'https://www.basselschorra.de',
  'kienholzclub': 'https://www.kienholzclub.de',
  'schlabbedengla': 'https://www.schlabbedengla.de',
  'drehfuechs': 'https://www.drehfuechs.de',
  'drehfüchs': 'https://www.drehfuechs.de',
  'grawama': 'https://www.grawama-schlumbla.de',
  'schlumbla': 'https://www.grawama-schlumbla.de',
  'gkg': 'https://www.gkg-bruchsal.de',
  'hcc': 'https://www.hcc1979.de',
  'hambrück': 'https://www.hcc1979.de',
  'kakage': 'https://www.kakage.de',
  'karlsdorf': 'https://www.kakage.de',
  'kbf': 'https://narrenkreis-bruchsal.de',
  'kikage': 'https://www.kikage.de',
  'kirrlach': 'https://www.kikage.de',
  'krokage': 'https://www.krokage.de',
  'kronau': 'https://www.krokage.de',
  'schmagges': 'https://narrenkreis-bruchsal.de',
  'neukage': 'https://www.neukage.de',
  'neudorf': 'https://www.neukage.de'
};

export function resolveClubWebsite(club: Partial<Club>): string | undefined {
  if (club.website && club.website.trim()) {
    return club.website.trim();
  }
  const searchStr = `${club.id || ''} ${club.name || ''} ${club.shortName || ''}`.toLowerCase();
  for (const [key, url] of Object.entries(DEFAULT_CLUB_WEBSITES)) {
    if (searchStr.includes(key)) {
      return url;
    }
  }
  return undefined;
}

export type PraesidiumRole = 
  | 'Narrenkreis Präsident' 
  | 'Narrenkreis Vizepräsident' 
  | 'Narrenkreis Kassier' 
  | 'Narrenkreis Schriftführerin';

export const PRAESIDIUM_ROLES: PraesidiumRole[] = [
  'Narrenkreis Präsident',
  'Narrenkreis Vizepräsident',
  'Narrenkreis Kassier',
  'Narrenkreis Schriftführerin'
];

export const VEREINIGUNG_LOGO_URL = '/assets/aistudio/Screenshot_20261122-144216_2_99ba3510.jpg';
export const VEREINIGUNG_CLUB_ID = 'vereinigung-baden-pfalz';

export function isVereinigungExcursion(exc?: { organizerClubId?: string } | null): boolean {
  return exc?.organizerClubId === VEREINIGUNG_CLUB_ID;
}

export type VereinigungRole =
  | 'Vereinigung Baden-Pfalz Vertretung 1'
  | 'Vereinigung Baden-Pfalz Vertretung 2';

export const VEREINIGUNG_ROLES: VereinigungRole[] = [
  'Vereinigung Baden-Pfalz Vertretung 1',
  'Vereinigung Baden-Pfalz Vertretung 2'
];

export interface UserProfile {
  id: string;
  name: string; // Pflichtfeld
  email: string; // Pflichtfeld
  mobile: string; // Handynummer - Pflichtfeld
  secondaryMobile?: string; // Zweite Handynummer / Weiteres Mobiltelefon - freiwillig
  clubId: string; // Auswahl vom Verein (Dropdown) - Pflichtfeld
  positionInClub: string; // Position in dem Verein - Pflichtfeld
  address?: string; // Adresse - freiwillig
  phone?: string; // Festnetz Telefon - freiwillig
  landline?: string; // Alternativer Alias für Festnetz
  praesidiumRole?: PraesidiumRole | null;
  vereinigungRole?: VereinigungRole | null; // Nicht-Admin Sonderrolle für News der Vereinigung Baden-Pfalz
  isPraesident?: boolean; // Häkchen: Vereins-Präsident / Teil des Präsidenten-Verteilers
  isZugmarschall?: boolean; // Häkchen: Zugmarschall / Teil des Zugmarschall-Verteilers
  avatar: string;
  bio?: string;
  joinedDate: string;
  password?: string; // Passwort für Login & Registrierung
  hasAcceptedTerms?: boolean; // Impressum & Datenschutz zugestimmt
  termsAcceptedDate?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // user IDs
}

export interface Poll {
  question: string;
  options: PollOption[];
  isClosed?: boolean;
  allowMultiple?: boolean;
}

export interface PostRating {
  userId: string;
  score: number; // 1 to 5
}

export interface ForumComment {
  id: string;
  authorId: string;
  authorName: string;
  authorClubId: string;
  content: string;
  createdAt: string;
  upvotes: string[];
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: 'Allgemein' | 'Narrenkreis-News' | 'Umfrage';
  authorId: string;
  authorName: string;
  authorClubId: string;
  createdAt: string;
  upvotes: string[];
  ratings: PostRating[];
  poll?: Poll;
  comments: ForumComment[];
}

export interface ExcursionAttendee {
  name: string;
  isGuest?: boolean;
  notes?: string;
}

export interface ExcursionRegistration {
  id: string;
  registeredByUserId: string;
  registeredByUserName: string;
  clubId: string;
  clubName: string;
  attendees: ExcursionAttendee[];
  registeredAt: string;
}

export const EXCURSION_CATEGORIES = [
  'Narrenkreissitzung',
  'Fastnachtsumzug',
  'Prunksitzung',
  'Narrensprung',
  'Vereinsausflug',
  'Ordensmatinee',
  'Narrenbaumstellen',
  'Sonstiges'
] as const;

export type ExcursionCategory = typeof EXCURSION_CATEGORIES[number];

export interface Excursion {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  endTime?: string;
  locationName: string;
  meetingPointDetails: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  category: ExcursionCategory;
  comment: string; // Kleines Kommentarfeld
  organizerId: string;
  organizerName: string;
  organizerClubId: string;
  maxParticipants: number;
  registrations: ExcursionRegistration[];
}

export interface MeetingProtocol {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  meetingType: 'Narrenkreissitzung' | 'Jahreshauptversammlung';
  description?: string;
  fileName: string;
  fileSize: number; // in bytes
  fileType: string;
  fileData: string; // Base64 data URI for download
  uploadedByUserId: string;
  uploadedByUserName: string;
  uploadedAt: string; // ISO timestamp
}

export interface SentEmail {
  id: string;
  senderUserId?: string; // Der Verfasser / das Profil
  fromName: string;
  fromEmail: string;
  recipientType: 'person' | 'multiple' | 'club' | 'all' | 'verteiler_praesident' | 'verteiler_zugmarschall';
  targetId?: string; // user id, comma-separated user ids, or club id
  recipientDisplay: string;
  recipientEmails: string[];
  subject: string;
  body: string; // Blanko-Feld
  sentAt: string;
}

export type VereinigungEntryType = 'news' | 'aenderungsmitteilung';

export type AenderungStatus = 'Entwurf' | 'Gemeldet' | 'Bestätigt';

export interface VereinigungComment {
  id: string;
  authorId: string;
  authorName: string;
  authorClubId: string;
  content: string;
  createdAt: string;
}

export interface VereinigungEntry {
  id: string;
  type: VereinigungEntryType;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  category?: string;
  clubId?: string;
  clubName?: string;
  status?: AenderungStatus;
  linkUrl?: string;
  // Optionaler Datei-Anhang für News (z.B. Word, PDF per Drag & Drop)
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
  attachmentData?: string;
  // Strukturierte Felder für Änderungsmitteilungen (Ämterneubesetzung)
  officeRole?: string;
  newHolderName?: string;
  newHolderAddress?: string;
  newHolderEmail?: string;
  newHolderPhone?: string;
  predecessorName?: string;
  notifiedEmails?: string[];
  // Kommentare & Rückfragen von Mitgliedern
  comments?: VereinigungComment[];
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface VereinigungSettings {
  id: 'vereinigung_config';
  notificationEmails: string[];
  updatedAt?: string;
  updatedByName?: string;
}

// Pure business logic functions

/**
 * Checks if a user has an active executive role in the Narrenkreis Präsidium (Admin)
 */
export function isPraesidiumMember(user?: UserProfile | null): boolean {
  if (!user || !user.praesidiumRole) return false;
  return PRAESIDIUM_ROLES.includes(user.praesidiumRole as PraesidiumRole);
}

/**
 * Checks if a user holds one of the 2 non-admin Vereinigung Baden-Pfalz News roles
 */
export function isVereinigungNewsManager(user?: UserProfile | null): boolean {
  if (!user || !user.vereinigungRole) return false;
  return VEREINIGUNG_ROLES.includes(user.vereinigungRole as VereinigungRole);
}

/**
 * Checks if a user is allowed to create/edit/delete Vereinigung News (Präsidium Admins OR the 2 Vereinigung News roles)
 */
export function canManageVereinigungNews(user?: UserProfile | null): boolean {
  return isPraesidiumMember(user) || isVereinigungNewsManager(user);
}

/**
 * Validates member profile according to the user specification:
 * Mandatory: name, email, mobile, clubId, positionInClub
 * Optional: address, phone
 */
export function validateProfile(profile: Partial<UserProfile>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!profile.name || !profile.name.trim()) {
    errors.push('Name ist ein Pflichtfeld.');
  }
  if (!profile.email || !profile.email.trim() || !profile.email.includes('@')) {
    errors.push('Eine gültige E-Mail-Adresse ist ein Pflichtfeld.');
  }
  if (!profile.mobile || !profile.mobile.trim()) {
    errors.push('Handynummer ist ein Pflichtfeld.');
  }
  if (!profile.clubId || !profile.clubId.trim()) {
    errors.push('Die Auswahl des Vereins ist ein Pflichtfeld.');
  }
  if (!profile.positionInClub || !profile.positionInClub.trim()) {
    errors.push('Die Position im Verein ist ein Pflichtfeld.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sicherer Helfer für Benutzerinitialen (verhindert das Ausgeben von Base64 Bild-URLs als Text)
 */
export function getUserInitials(user?: Partial<UserProfile> | null): string {
  if (!user) return 'NK';
  if (user.avatar && !user.avatar.startsWith('data:') && !user.avatar.startsWith('http') && !user.avatar.startsWith('/') && user.avatar.length <= 4) {
    return user.avatar.toUpperCase();
  }
  if (user.name) {
    return user.name
      .trim()
      .split(/\s+/)
      .map(p => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'NK';
  }
  return 'NK';
}

/**
 * Resolves recipient email addresses for the email messenger
 */
export function resolveRecipients(
  type: 'person' | 'multiple' | 'club' | 'all' | 'verteiler_praesident' | 'verteiler_zugmarschall',
  targetId: string | undefined,
  users: UserProfile[],
  clubs: Club[]
): { display: string; emails: string[]; count: number } {
  if (type === 'verteiler_praesident') {
    const targets = users.filter(u => Boolean(u.isPraesident));
    const validEmails = targets.map(u => u.email).filter(e => Boolean(e) && e.includes('@'));
    const names = targets.map(u => u.name).join(', ');
    return {
      display: targets.length > 0 
        ? `Verteiler Präsidenten: ${names} (${validEmails.length} Empfänger)` 
        : 'Verteiler Präsidenten (Kein Mitglied mit gesetztem Häkchen)',
      emails: validEmails,
      count: validEmails.length
    };
  }

  if (type === 'verteiler_zugmarschall') {
    const targets = users.filter(u => Boolean(u.isZugmarschall));
    const validEmails = targets.map(u => u.email).filter(e => Boolean(e) && e.includes('@'));
    const names = targets.map(u => u.name).join(', ');
    return {
      display: targets.length > 0 
        ? `Verteiler Zugmarschälle: ${names} (${validEmails.length} Empfänger)` 
        : 'Verteiler Zugmarschälle (Kein Mitglied mit gesetztem Häkchen)',
      emails: validEmails,
      count: validEmails.length
    };
  }

  if (type === 'all') {
    const validEmails = users.map(u => u.email).filter(e => Boolean(e) && e.includes('@'));
    return {
      display: `An alle Mitglieder (${validEmails.length} Personen im Narrenkreis Bruchsal)`,
      emails: validEmails,
      count: validEmails.length
    };
  }

  if (type === 'multiple') {
    const ids = targetId ? targetId.split(',').filter(Boolean) : [];
    const targetUsers = users.filter(u => ids.includes(u.id));
    const emails = targetUsers.map(u => u.email).filter(e => Boolean(e) && e.includes('@'));
    const names = targetUsers.map(u => u.name).join(', ');
    return {
      display: targetUsers.length > 0 
        ? `Mehrfachauswahl: ${names} (${emails.length} Personen)` 
        : 'Keine Mitglieder ausgewählt',
      emails,
      count: emails.length
    };
  }

  if (type === 'club') {
    const targetClub = clubs.find(c => c.id === targetId);
    const clubMembers = users.filter(u => u.clubId === targetId);
    const emails = clubMembers.map(u => u.email).filter(e => Boolean(e) && e.includes('@'));
    const clubName = targetClub?.name || 'Ausgewählter Verein';
    return {
      display: `Verein: ${clubName} (${emails.length} Mitglieder)`,
      emails,
      count: emails.length
    };
  }

  // Single person
  const targetUser = users.find(u => u.id === targetId);
  if (targetUser && targetUser.email) {
    return {
      display: `${targetUser.name} (${targetUser.email})`,
      emails: [targetUser.email],
      count: 1
    };
  }

  return {
    display: 'Kein Empfänger ausgewählt',
    emails: [],
    count: 0
  };
}

/**
 * Calculates poll distribution, totals and percentage per option
 */
export function calculatePollResults(poll: Poll) {
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
  
  const optionsWithPercentages = poll.options.map(opt => {
    const count = opt.votes.length;
    const percentage = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
    return {
      ...opt,
      count,
      percentage
    };
  });

  return {
    totalVotes,
    options: optionsWithPercentages
  };
}

/**
 * Calculates average rating score and user specific score
 */
export function calculatePostRating(ratings: PostRating[], currentUserId?: string) {
  if (!ratings || ratings.length === 0) {
    return {
      average: 0,
      count: 0,
      userRating: null
    };
  }

  const sum = ratings.reduce((acc, curr) => acc + curr.score, 0);
  const average = Number((sum / ratings.length).toFixed(1));
  const userRating = currentUserId 
    ? ratings.find(r => r.userId === currentUserId)?.score ?? null 
    : null;

  return {
    average,
    count: ratings.length,
    userRating
  };
}

/**
 * Calculates excursion attendee capacity and remaining spots
 */
export function calculateExcursionCapacity(excursion: Excursion) {
  const totalAttendees = excursion.registrations.reduce(
    (sum, reg) => sum + reg.attendees.length, 
    0
  );
  const remainingSpots = Math.max(0, excursion.maxParticipants - totalAttendees);
  const spotsFilledPercent = excursion.maxParticipants > 0 
    ? Math.min(100, Math.round((totalAttendees / excursion.maxParticipants) * 100))
    : 0;
  const isFull = totalAttendees >= excursion.maxParticipants;

  return {
    totalAttendees,
    maxParticipants: excursion.maxParticipants,
    remainingSpots,
    spotsFilledPercent,
    isFull
  };
}

/**
 * Groups excursion participants by their club affiliation
 */
export function groupAttendeesByClub(excursion: Excursion) {
  const clubSummary: Record<string, { clubName: string; clubId: string; count: number; members: string[] }> = {};

  for (const reg of excursion.registrations) {
    if (!clubSummary[reg.clubId]) {
      clubSummary[reg.clubId] = {
        clubId: reg.clubId,
        clubName: reg.clubName,
        count: 0,
        members: []
      };
    }
    clubSummary[reg.clubId].count += reg.attendees.length;
    for (const att of reg.attendees) {
      clubSummary[reg.clubId].members.push(att.name);
    }
  }

  return Object.values(clubSummary).sort((a, b) => b.count - a.count);
}

/**
 * Validates adding multi-person registration from a club
 */
export function validateClubRegistration(
  excursion: Excursion,
  attendeeNames: string[],
  userClubId: string
): { valid: boolean; error?: string } {
  const cleanNames = attendeeNames.map(n => n.trim()).filter(Boolean);
  if (cleanNames.length === 0) {
    return { valid: false, error: 'Mindestens ein Teilnehmername muss angegeben werden.' };
  }

  if (!userClubId) {
    return { valid: false, error: 'Bitte weisen Sie sich einem Verein zu.' };
  }

  const { remainingSpots } = calculateExcursionCapacity(excursion);
  if (cleanNames.length > remainingSpots) {
    return {
      valid: false,
      error: `Nur noch ${remainingSpots} freie Plätze verfügbar, Sie versuchen ${cleanNames.length} anzumelden.`
    };
  }

  return { valid: true };
}

/**
 * Filters and groups events for calendar views
 */
export function filterEventsForCalendar(excursions: Excursion[], year: number, month: number) {
  const monthStr = String(month).padStart(2, '0');
  const prefix = `${year}-${monthStr}`;

  const monthEvents = excursions.filter(e => e.date.startsWith(prefix));
  
  const dayMap: Record<number, Excursion[]> = {};
  for (const e of monthEvents) {
    const day = parseInt(e.date.split('-')[2], 10);
    if (!dayMap[day]) {
      dayMap[day] = [];
    }
    dayMap[day].push(e);
  }

  return {
    monthEvents,
    dayMap,
    count: monthEvents.length
  };
}

/**
 * Filters emails for a specific user profile
 */
export function getEmailsForUser(
  userId: string,
  userEmail: string,
  userClubId: string,
  emails: SentEmail[],
  folder: 'sent' | 'inbox' | 'all' = 'sent'
): SentEmail[] {
  if (folder === 'sent') {
    return emails.filter(m => m.senderUserId === userId);
  }
  if (folder === 'inbox') {
    return emails.filter(m => {
      if (m.senderUserId === userId) return false;
      if (m.recipientEmails && m.recipientEmails.includes(userEmail)) return true;
      if (m.recipientType === 'club' && m.targetId === userClubId) return true;
      if (m.recipientType === 'all') return true;
      return false;
    });
  }
  // folder === 'all'
  return emails.filter(m => {
    if (m.senderUserId === userId) return true;
    if (m.recipientEmails && m.recipientEmails.includes(userEmail)) return true;
    if (m.recipientType === 'club' && m.targetId === userClubId) return true;
    if (m.recipientType === 'all') return true;
    return false;
  });
}

/**
 * Empties the mailbox for a specific user profile
 */
export function clearMailboxForUser(
  userId: string,
  userEmail: string,
  emails: SentEmail[],
  folder: 'sent' | 'inbox' | 'all' = 'sent'
): SentEmail[] {
  if (folder === 'sent') {
    // Keep emails where sender is NOT this user
    return emails.filter(m => m.senderUserId !== userId && m.fromEmail !== userEmail);
  }
  if (folder === 'inbox') {
    return emails.filter(m => {
      // Keep emails sent by this user
      if (m.senderUserId === userId || m.fromEmail === userEmail) return true;
      // Filter out incoming to this user
      if (m.recipientEmails && m.recipientEmails.includes(userEmail)) return false;
      return true;
    });
  }
  // folder === 'all': Remove all sent by this user AND clear incoming to this user
  return emails.filter(m => {
    const isSentByMe = m.senderUserId === userId || m.fromEmail === userEmail;
    if (isSentByMe) return false;
    const isReceivedByMe = m.recipientEmails && m.recipientEmails.includes(userEmail);
    if (isReceivedByMe) return false;
    return true;
  });
}

/**
 * Deletes a single email from all emails list
 */
export function deleteSingleEmail(
  emailId: string,
  emails: SentEmail[]
): SentEmail[] {
  return emails.filter(m => m.id !== emailId);
}

/**
 * Updates a forum post
 */
export function updateForumPost(
  posts: ForumPost[],
  postId: string,
  updated: { title: string; content: string; category: ForumPost['category'] }
): ForumPost[] {
  return posts.map(p => p.id === postId ? { ...p, ...updated } : p);
}

/**
 * Deletes a forum post
 */
export function deleteForumPost(
  posts: ForumPost[],
  postId: string
): ForumPost[] {
  return posts.filter(p => p.id !== postId);
}

/**
 * Robust helper to extract and clean phone numbers, splitting combined numbers
 * like "0163-2042460 und 0176-45346432" or multiple mobile entries into clean individual numbers.
 */
export function extractPhoneNumbers(mobile?: string, secondaryMobile?: string): string[] {
  const result: string[] = [];

  const addParsed = (str?: string) => {
    if (!str || !str.trim()) return;
    // Split by common separators: " und ", "&", "/", ",", ";" or newlines
    const parts = str.split(/\s+(?:und|&|\/)\s+|[,;/]+|\n+/i);
    for (const part of parts) {
      const clean = part.trim();
      // Ensure it contains digits
      if (clean && /\d/.test(clean) && !result.includes(clean)) {
        result.push(clean);
      }
    }
  };

  addParsed(mobile);
  addParsed(secondaryMobile);

  return result;
}

/**
 * Strips formatting characters to produce a clean E.164-compatible dial string
 */
export function cleanPhoneNumber(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  } else if (cleaned.startsWith('0') && !cleaned.startsWith('+')) {
    cleaned = '+49' + cleaned.substring(1);
  }
  return cleaned;
}

