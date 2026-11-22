import { Club, UserProfile, ForumPost, Excursion, SentEmail, MeetingProtocol } from '../utils/clubLogic';

export const BRUCHSAL_CLUB_LOGOS: Record<string, string> = {
  'club-gkg': `<svg viewBox="0 0 100 100" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#b91c1c" stroke="#fef08a" stroke-width="4"/>
    <path d="M26 62C26 62 36 34 50 34C64 34 74 62 74 62" fill="#ffffff"/>
    <path d="M20 62H80L72 74H28L20 62Z" fill="#fbbf24"/>
    <circle cx="50" cy="26" r="6" fill="#fbbf24"/>
    <circle cx="24" cy="50" r="5" fill="#f8fafc"/>
    <circle cx="76" cy="50" r="5" fill="#f8fafc"/>
    <path d="M42 44L50 36L58 44V56H42V44Z" fill="#b91c1c"/>
  </svg>`,

  'club-bnz': `<svg viewBox="0 0 100 100" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#6b21a8" stroke="#fef08a" stroke-width="4"/>
    <path d="M30 38C30 26 40 22 50 22C60 22 70 26 70 38C70 56 60 74 50 78C40 74 30 56 30 38Z" fill="#f8fafc"/>
    <circle cx="43" cy="40" r="4" fill="#6b21a8"/>
    <circle cx="57" cy="40" r="4" fill="#6b21a8"/>
    <path d="M44 56C47 60 53 60 56 56" stroke="#b91c1c" stroke-width="3" stroke-linecap="round"/>
    <circle cx="50" cy="18" r="5" fill="#fbbf24"/>
    <path d="M22 62L30 52M78 62L70 52" stroke="#fbbf24" stroke-width="3.5" stroke-linecap="round"/>
  </svg>`,

  'club-cvh': `<svg viewBox="0 0 100 100" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#15803d" stroke="#fde047" stroke-width="4"/>
    <path d="M32 70L40 38L50 50L60 38L68 70H32Z" fill="#fef08a"/>
    <circle cx="40" cy="34" r="4" fill="#ffffff"/>
    <circle cx="50" cy="44" r="4" fill="#ffffff"/>
    <circle cx="60" cy="34" r="4" fill="#ffffff"/>
    <path d="M36 70H64V76H36V70Z" fill="#14532d"/>
  </svg>`,

  'club-krawatten': `<svg viewBox="0 0 100 100" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#1d4ed8" stroke="#93c5fd" stroke-width="4"/>
    <path d="M44 26H56L58 34L50 38L42 34L44 26Z" fill="#f8fafc"/>
    <path d="M46 36L42 66L50 78L58 66L54 36H46Z" fill="#ef4444"/>
    <circle cx="50" cy="48" r="3" fill="#fde047"/>
    <circle cx="50" cy="60" r="3" fill="#fde047"/>
    <circle cx="50" cy="70" r="3" fill="#fde047"/>
  </svg>`,

  'club-hcc': `<svg viewBox="0 0 100 100" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#c2410c" stroke="#fed7aa" stroke-width="4"/>
    <circle cx="50" cy="50" r="28" fill="#fde047"/>
    <path d="M50 16V24M50 76V84M16 50H24M76 50H84M26 26L32 32M68 68L74 74M26 74L32 68M68 26L74 32" stroke="#ea580c" stroke-width="3" stroke-linecap="round"/>
    <circle cx="42" cy="46" r="3.5" fill="#9a3412"/>
    <circle cx="58" cy="46" r="3.5" fill="#9a3412"/>
    <path d="M42 58C46 64 54 64 58 58" stroke="#9a3412" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  'club-burgnarren': `<svg viewBox="0 0 100 100" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="48" fill="#831843" stroke="#fbcfe8" stroke-width="4"/>
    <path d="M34 72V42L44 32V72H34Z" fill="#f8fafc"/>
    <path d="M44 72V32L56 32V72H44Z" fill="#e2e8f0"/>
    <path d="M56 72V42L66 32V72H56Z" fill="#f8fafc"/>
    <path d="M38 28L50 18L62 28H38Z" fill="#fde047"/>
    <circle cx="50" cy="18" r="4" fill="#fbbf24"/>
  </svg>`
};

export const INITIAL_CLUBS: Club[] = [
  {
    id: 'club-fg-gs',
    name: 'Faschingsgemeinschaft Grawama Schlumbla e.V.',
    shortName: 'FG Grawama Schlumbla',
    category: 'Faschingswagen',
    logo: '/assets/clubs/fg_grawama_schlumbla.png',
    color: '#1e293b',
    description: 'Mitgliedsverein im Narrenkreis Bruchsal (Graben - Neudorf ).',
    memberCount: 1,
    establishedYear: 2014,
    location: 'Graben - Neudorf',
    website: 'https://www.grawama-schlumbla.de'
  },
  {
    id: 'club-kbf',
    name: 'Komitee Bruchsaler Fasnachtsumzüge',
    shortName: 'KBF Bruchsal',
    category: 'Karnevalsgesellschaft',
    logo: '/assets/clubs/komitee_bruchsal.png',
    color: '#eab308',
    description: 'Mitgliedsverein im Narrenkreis Bruchsal (Bruchsal).',
    memberCount: 0,
    establishedYear: 1965,
    location: 'Bruchsal',
    website: 'https://narrenkreis-bruchsal.de'
  },
  {
    id: 'club-drehfuechs',
    name: 'Drehfüchs Grobach',
    shortName: 'Drehfüchs Grobach',
    category: 'Faschingswagen',
    logo: '/assets/clubs/drehfuechs_grobach.png',
    color: '#f97316',
    description: 'Mitgliedsverein im Narrenkreis Bruchsal (Unterrombach ).',
    memberCount: 0,
    establishedYear: 2015,
    location: 'Unterrombach',
    website: 'https://www.drehfuechs.de'
  },
  {
    id: 'club-neukage',
    name: 'Neudorfer Karnevalsgesellschaft e.V.',
    shortName: 'NeuKaGe',
    category: 'Karnevalsgesellschaft',
    logo: '/assets/clubs/neudorfer_kage.png',
    color: '#0284c7',
    description: 'Mitgliedsverein im Narrenkreis Bruchsal (Graben - Neudorf).',
    memberCount: 0,
    establishedYear: 1959,
    location: 'Graben - Neudorf',
    website: 'https://www.neukage.de'
  },
  {
    id: 'club-krokage',
    name: 'Kronauer Karnevalsgesellschaft e.V.',
    shortName: 'KroKaGe',
    category: 'Karnevalsgesellschaft',
    logo: '/assets/clubs/kronauer_kage.png',
    color: '#2563eb',
    description: 'Mitgliedsverein im Narrenkreis Bruchsal (Kronau).',
    memberCount: 0,
    establishedYear: 1979,
    location: 'Kronau',
    clubhouseAddress: 'KroKaGe Vereinsheim, Im Mühlhaag , 76709 Kronau',
    website: 'https://www.krokage.de'
  },
  {
    id: 'club-gkg',
    name: 'Große Karnevalsgesellschaft Bruchsal e.V.',
    shortName: 'GKG Bruchsal',
    category: 'Karnevalsgesellschaft',
    logo: '/assets/clubs/gkg_bruchsal.png',
    color: '#b91c1c',
    description: 'Mitgliedsverein im Narrenkreis Bruchsal (Bruchsal).',
    memberCount: 0,
    establishedYear: 1879,
    location: 'Bruchsal',
    website: 'https://www.gkg-bruchsal.de'
  },
  {
    id: 'club-kikage',
    name: 'Kirrlacher Karnevals-Gesellschaft e.V.',
    shortName: 'KiKaGe',
    category: 'Karnevalsgesellschaft',
    logo: '/assets/clubs/kirrlacher_kage.png',
    color: '#16a34a',
    description: 'Mitgliedsverein im Narrenkreis Bruchsal (Kirrlach ).',
    memberCount: 0,
    establishedYear: 1958,
    location: 'Kirrlach',
    website: 'https://www.kikage.de'
  },
  {
    id: 'club-kakage',
    name: 'Karlsdorfer Karnevals-Gesellschaft e.V.',
    shortName: 'KaKaGe',
    category: 'Karnevalsgesellschaft',
    logo: '/assets/clubs/karlsdorfer_kage.png',
    color: '#64748b',
    description: 'Mitgliedsverein im Narrenkreis Bruchsal (Karlsdorf ).',
    memberCount: 0,
    establishedYear: 1981,
    location: 'Karlsdorf',
    website: 'https://www.kakage.de'
  },
  {
    id: 'club-buechenau',
    name: 'Büchenauer Karnevals Gesellschaft e.V.',
    shortName: 'BKG Büchenau',
    category: 'Karnevalsgesellschaft',
    logo: '/assets/clubs/buechenauer_kage.png',
    color: '#dc2626',
    description: 'Mitgliedsverein im Narrenkreis Bruchsal (Büchenau ).',
    memberCount: 0,
    establishedYear: 1984,
    location: 'Büchenau',
    clubhouseAddress: 'Gustav-Laforsch-Straße 74, 76646 Bruchsal-Büchenau',
    website: 'https://www.bkg-buechenau.de'
  },
  {
    id: 'club-hcc',
    name: 'Hambrücker Carnevals Club 1979 e.V.',
    shortName: 'HCC Hambrücken',
    category: 'Karnevalsgesellschaft',
    logo: '/assets/clubs/hambruecker_cc.png',
    color: '#1d4ed8',
    description: 'Mitgliedsverein im Narrenkreis Bruchsal (Halbrücken ).',
    memberCount: 0,
    establishedYear: 1979,
    location: 'Halbrücken',
    clubhouseAddress: 'Teichstr. / Heuweg 11, 76707 Hambrücken',
    website: 'https://www.hcc1979.de'
  },
  {
    id: 'club-mit-schmagges',
    name: 'Mit Schmagges',
    shortName: 'Mit Schmagges',
    category: 'Karnevalsgesellschaft',
    logo: '/assets/clubs/mit_schmagges.png',
    color: '#db2777',
    description: 'Mitgliedsverein im Narrenkreis Bruchsal (Staffort).',
    memberCount: 0,
    establishedYear: 2020,
    location: 'Staffort',
    clubhouseAddress: 'Dreschhalle, An der Nachtweide , 76297 Stutensee',
    website: 'https://narrenkreis-bruchsal.de'
  }
];

// Die Mitglieder des Narrenkreis Bruchsal (anhand von Screenshot 151811)
export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-martin',
    name: 'Martin Kuntzsch',
    email: 'faschingsgemeinschaft-gs@gmx.de',
    mobile: '+49 171 1234567',
    clubId: 'club-fg-gs',
    positionInClub: 'Vorstand für kulturelle Angelegenheiten',
    praesidiumRole: 'Narrenkreis Vizepräsident',
    isPraesident: true,
    isZugmarschall: true,
    avatar: 'MK',
    joinedDate: '2026-01-01',
    hasAcceptedTerms: true
  }
];

// Alle Beispieldaten entfernt (Forum leer, Kalender leer, Messenger-Postfach leer)
export const INITIAL_FORUM_POSTS: ForumPost[] = [];
export const INITIAL_EXCURSIONS: Excursion[] = [];
export const INITIAL_SENT_EMAILS: SentEmail[] = [];

// Offizielle Protokolle des Narrenkreis Bruchsal
const SAMPLE_PROTOCOL_TEXT = `NARRENKREIS BRUCHSAL
Interessengemeinschaft Bruchsaler Karnevals- und Fastnachtsvereine

SITZUNGSPROTOKOLL
=============================================================
Sitzungsart:       Narrenkreissitzung
Datum:             15. Februar 2026
Uhrzeit:           19:30 - 21:45 Uhr
Ort:               Bürgerzentrum Bruchsal, Otto-Oppenheimer-Platz
Leitung:           Narrenkreis-Präsidium
Protokollführer:   Martin Kuntzsch (Narrenkreis Vizepräsident)

ANWESENDE MITGLIEDSVEREINE:
-------------------------------------------------------------
1. Große Karnevalgesellschaft Bruchsal 1877 e.V. (GKG Bruchsal)
2. Bruchsaler Narrenzunft 1980 e.V.
3. Carnevalverein Heidelsheim e.V. (CVH)
4. Untergrombacher Krawattenmacher e.V.
5. Helmsheimer Carneval Club e.V. (HCC)
6. Obergrombacher Burgnarren 1988 e.V.
7. Faschingsgemeinschaft Grawama Schlumbla e.V. (FG GS)

TAGESORDNUNG:
-------------------------------------------------------------
TOP 1: Begrüßung durch das Narrenkreis-Präsidium
TOP 2: Rückblick auf die vergangenen Veranstaltungen & Kampagne
TOP 3: Planung & Zugaufstellung Großer Fastnachtsumzug Bruchsal
TOP 4: Sicherheitskonzept, Sanitätsdienst & Zugmarschall-Einteilung
TOP 5: Festlegung der Termine für die kommende Kampagne
TOP 6: Verschiedenes, Närrische Wortmeldungen und Anfragen

BESCHLÜSSE:
-------------------------------------------------------------
- Beschluss TOP 3: Die vorliegende Zugaufstellung wird in der abgestimmten
  Reihenfolge von allen anwesenden Vereinen einstimmig genehmigt.
- Beschluss TOP 4: Das Sicherheitskonzept mit den Absperrpunkten und
  Verkehrsregelungen wird genehmigt. Die Zugmarschälle übernehmen die
  Einweisung vor Ort.
- Beschluss TOP 5: Die nächste ordentliche Narrenkreissitzung findet
  im Herbst 2026 statt.

Bruchsal, den 15.02.2026

Gez.
Narrenkreis-Präsidium Bruchsal
Martin Kuntzsch, Protokollführer
`;

export const INITIAL_PROTOCOLS: MeetingProtocol[] = [
  {
    id: 'proto-1',
    title: 'Protokoll der ordentlichen Narrenkreissitzung Frühjahr 2026',
    date: '2026-02-15',
    meetingType: 'Narrenkreissitzung',
    description: 'Offizielles Protokoll der Narrenkreissitzung zur Kampagnenplanung, Zugaufstellung und Sicherheitskonzept im Bürgerzentrum Bruchsal.',
    fileName: 'Protokoll_Narrenkreissitzung_15_02_2026.txt',
    fileSize: 1842,
    fileType: 'text/plain',
    fileData: `data:text/plain;charset=utf-8,${encodeURIComponent(SAMPLE_PROTOCOL_TEXT)}`,
    uploadedByUserId: 'user-martin',
    uploadedByUserName: 'Martin Kuntzsch',
    uploadedAt: '2026-02-16T10:00:00.000Z'
  }
];
