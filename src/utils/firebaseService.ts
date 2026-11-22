import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc,
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Club, 
  UserProfile, 
  MeetingProtocol, 
  ForumPost, 
  Excursion, 
  SentEmail 
} from './clubLogic';
import { 
  INITIAL_CLUBS, 
  INITIAL_USERS, 
  INITIAL_PROTOCOLS, 
  INITIAL_FORUM_POSTS, 
  INITIAL_EXCURSIONS, 
  INITIAL_SENT_EMAILS 
} from '../data/mockData';

// ================= ERROR HANDLING AS PER SKILL =================

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// ================= SYNC & SEEDING =================

/**
 * Initialisiert die Cloud-Datenbank mit den 11 offiziellen Vereinen
 * und Standard-Daten, falls Sammlungen noch leer sind.
 */
export async function initializeFirestoreData() {
  const isAlreadyInit = localStorage.getItem('narrenkreis_firestore_seeded_v3_clean') === 'true';
  if (isAlreadyInit) {
    return;
  }

  try {
    // 1. Clubs prüfen & initialisieren
    const clubsSnap = await getDocs(collection(db, 'clubs'));
    if (clubsSnap.empty) {
      console.log('[Firestore] Initialisiere 11 Vereine in Firestore...');
      for (const club of INITIAL_CLUBS) {
        await setDoc(doc(db, 'clubs', club.id), sanitizeForFirestore(club), { merge: true });
      }
    } else {
      const existingClubIds = new Set(clubsSnap.docs.map(d => d.id));
      for (const club of INITIAL_CLUBS) {
        if (!existingClubIds.has(club.id)) {
          await setDoc(doc(db, 'clubs', club.id), sanitizeForFirestore(club), { merge: true });
        } else if (club.website) {
          // Enrich existing club documents with official website if missing
          await setDoc(doc(db, 'clubs', club.id), { website: club.website }, { merge: true });
        }
      }
    }

    // 2. Users prüfen & initialisieren
    const usersSnap = await getDocs(collection(db, 'users'));
    if (usersSnap.empty) {
      console.log('[Firestore] Initialisiere Benutzer in Firestore...');
      for (const user of INITIAL_USERS) {
        await setDoc(doc(db, 'users', user.id), sanitizeForFirestore(user), { merge: true });
      }
    }

    // 3. Protokolle prüfen & initialisieren
    const seedMetaRef = doc(db, 'system', 'seed_state');
    const seedMetaSnap = await getDoc(seedMetaRef);
    const hasBeenSeeded = seedMetaSnap.exists() && seedMetaSnap.data()?.protocolsSeeded === true;

    if (!hasBeenSeeded) {
      const protocolsSnap = await getDocs(collection(db, 'protocols'));
      if (protocolsSnap.empty) {
        for (const proto of INITIAL_PROTOCOLS) {
          await setDoc(doc(db, 'protocols', proto.id), sanitizeForFirestore(proto), { merge: true });
        }
      }
      await setDoc(seedMetaRef, { protocolsSeeded: true }, { merge: true });
    }

    localStorage.setItem('narrenkreis_firestore_seeded_v3_clean', 'true');
  } catch (err) {
    console.warn('[Firestore Seeding Notice]:', err);
  }
}

// ================= REAL-TIME SUBSCRIPTIONS & DIRECT SYNC =================

export async function syncAllFromFirestore(): Promise<{
  users: UserProfile[];
  clubs: Club[];
  protocols: MeetingProtocol[];
  forumPosts: ForumPost[];
  excursions: Excursion[];
  sentEmails: SentEmail[];
}> {
  try {
    const [uSnap, cSnap, pSnap, fSnap, eSnap, mSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'clubs')),
      getDocs(collection(db, 'protocols')),
      getDocs(collection(db, 'forumPosts')),
      getDocs(collection(db, 'excursions')),
      getDocs(collection(db, 'sentEmails'))
    ]);

    const users: UserProfile[] = [];
    uSnap.forEach(d => users.push(d.data() as UserProfile));

    const clubs: Club[] = [];
    cSnap.forEach(d => clubs.push(d.data() as Club));

    let deletedLocal: string[] = [];
    try {
      deletedLocal = JSON.parse(localStorage.getItem('narrenkreis_bruchsal_v3_clean_deleted_protocols') || '[]');
    } catch {}

    const protocols: MeetingProtocol[] = [];
    pSnap.forEach(d => {
      const data = d.data() as MeetingProtocol;
      if (!deletedLocal.includes(data.id)) {
        protocols.push(data);
      }
    });
    protocols.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const forumPosts: ForumPost[] = [];
    fSnap.forEach(d => forumPosts.push(d.data() as ForumPost));
    forumPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const excursions: Excursion[] = [];
    eSnap.forEach(d => excursions.push(d.data() as Excursion));
    excursions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const sentEmails: SentEmail[] = [];
    mSnap.forEach(d => sentEmails.push(d.data() as SentEmail));
    sentEmails.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    return { users, clubs, protocols, forumPosts, excursions, sentEmails };
  } catch (err) {
    console.error('[Firestore syncAllFromFirestore Fehler]:', err);
    throw err;
  }
}

export function subscribeToUsers(onUpdate: (users: UserProfile[]) => void) {
  return onSnapshot(collection(db, 'users'), (snapshot) => {
    if (!snapshot.empty) {
      const list: UserProfile[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as UserProfile);
      });
      onUpdate(list);
    }
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'users');
  });
}

export function subscribeToClubs(onUpdate: (clubs: Club[]) => void) {
  return onSnapshot(collection(db, 'clubs'), (snapshot) => {
    if (!snapshot.empty) {
      const list: Club[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Club);
      });
      onUpdate(list);
    }
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, 'clubs');
  });
}

export function subscribeToProtocols(onUpdate: (protocols: MeetingProtocol[]) => void) {
  return onSnapshot(collection(db, 'protocols'), (snapshot) => {
    let deletedLocal: string[] = [];
    try {
      deletedLocal = JSON.parse(localStorage.getItem('narrenkreis_bruchsal_v3_clean_deleted_protocols') || '[]');
    } catch {
      // ignore
    }

    const list: MeetingProtocol[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as MeetingProtocol;
      if (!deletedLocal.includes(data.id)) {
        list.push(data);
      }
    });
    // Sortieren nach Datum absteigend
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    onUpdate(list);
  }, (err) => {
    console.error('[Firestore Protocols Snapshot Fehler]:', err);
  });
}

export function subscribeToForum(onUpdate: (posts: ForumPost[]) => void) {
  return onSnapshot(collection(db, 'forumPosts'), (snapshot) => {
    const list: ForumPost[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as ForumPost);
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    onUpdate(list);
  }, (err) => {
    console.error('[Firestore Forum Snapshot Fehler]:', err);
  });
}

export function subscribeToExcursions(onUpdate: (excursions: Excursion[]) => void) {
  return onSnapshot(collection(db, 'excursions'), (snapshot) => {
    const list: Excursion[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as Excursion);
    });
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    onUpdate(list);
  }, (err) => {
    console.error('[Firestore Excursions Snapshot Fehler]:', err);
  });
}

export function subscribeToSentEmails(onUpdate: (emails: SentEmail[]) => void) {
  return onSnapshot(collection(db, 'sentEmails'), (snapshot) => {
    const list: SentEmail[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as SentEmail);
    });
    list.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    onUpdate(list);
  }, (err) => {
    console.error('[Firestore Emails Snapshot Fehler]:', err);
  });
}

// ================= HELPER: SANITIZE FOR FIRESTORE =================

/**
 * Entfernt rekursiv alle 'undefined' Werte, da Firestore setDoc()
 * bei Feldern mit dem Wert 'undefined' einen Fehler wirft.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
      }
    }
    return clean as T;
  }
  return data;
}

// ================= CRUD MUTATIONS =================

export async function dbSaveUser(user: UserProfile): Promise<void> {
  try {
    const clean = sanitizeForFirestore(user);
    await setDoc(doc(db, 'users', user.id), clean, { merge: true });
  } catch (err) {
    console.error('[Firestore dbSaveUser Fehler]:', err);
  }
}

export async function dbDeleteUser(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (err) {
    console.error('[Firestore dbDeleteUser Fehler]:', err);
  }
}

export async function dbSaveClub(club: Club): Promise<void> {
  try {
    const clean = sanitizeForFirestore(club);
    await setDoc(doc(db, 'clubs', club.id), clean, { merge: true });
  } catch (err) {
    console.error('[Firestore dbSaveClub Fehler]:', err);
  }
}

export async function dbDeleteClub(clubId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'clubs', clubId));
  } catch (err) {
    console.error('[Firestore dbDeleteClub Fehler]:', err);
  }
}

export async function dbSaveProtocol(proto: MeetingProtocol): Promise<void> {
  try {
    const clean = sanitizeForFirestore(proto);
    await setDoc(doc(db, 'protocols', proto.id), clean, { merge: true });
  } catch (err) {
    console.error('[Firestore dbSaveProtocol Fehler]:', err);
  }
}

export async function dbDeleteProtocol(protoId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'protocols', protoId));
    // Als gelöscht markieren und Protokoll-Seeding dauerhaft sperren
    await setDoc(doc(db, 'system', 'seed_state'), {
      protocolsSeeded: true
    }, { merge: true });

    // LocalStorage Tracking damit beim Reload kein Re-Init erfolgt
    try {
      const saved = localStorage.getItem('narrenkreis_bruchsal_v3_clean_deleted_protocols') || '[]';
      const deleted: string[] = JSON.parse(saved);
      if (!deleted.includes(protoId)) {
        deleted.push(protoId);
        localStorage.setItem('narrenkreis_bruchsal_v3_clean_deleted_protocols', JSON.stringify(deleted));
      }
    } catch {
      // Ignore
    }
  } catch (err) {
    console.error('[Firestore dbDeleteProtocol Fehler]:', err);
  }
}

export async function dbSaveForumPost(post: ForumPost): Promise<void> {
  try {
    const clean = sanitizeForFirestore(post);
    await setDoc(doc(db, 'forumPosts', post.id), clean, { merge: true });
  } catch (err) {
    console.error('[Firestore dbSaveForumPost Fehler]:', err);
  }
}

export async function dbDeleteForumPost(postId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'forumPosts', postId));
  } catch (err) {
    console.error('[Firestore dbDeleteForumPost Fehler]:', err);
  }
}

export async function dbSaveExcursion(exc: Excursion): Promise<void> {
  try {
    const clean = sanitizeForFirestore(exc);
    await setDoc(doc(db, 'excursions', exc.id), clean, { merge: true });
  } catch (err) {
    console.error('[Firestore dbSaveExcursion Fehler]:', err);
  }
}

export async function dbDeleteExcursion(excId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'excursions', excId));
  } catch (err) {
    console.error('[Firestore dbDeleteExcursion Fehler]:', err);
  }
}

export async function dbSaveSentEmail(email: SentEmail): Promise<void> {
  try {
    const clean = sanitizeForFirestore(email);
    await setDoc(doc(db, 'sentEmails', email.id), clean, { merge: true });
  } catch (err) {
    console.error('[Firestore dbSaveSentEmail Fehler]:', err);
  }
}

export async function dbDeleteSentEmail(emailId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'sentEmails', emailId));
  } catch (err) {
    console.error('[Firestore dbDeleteSentEmail Fehler]:', err);
  }
}
