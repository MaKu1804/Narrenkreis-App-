import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore, 
  getFirestore, 
  doc, 
  getDocFromServer,
  getDocsFromServer,
  collection,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = (() => {
  const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    }, dbId);
  } catch (e1) {
    console.warn('[Firebase] Fallback to simple getFirestore:', e1);
    try {
      return getFirestore(app, dbId);
    } catch (e2) {
      console.error('[Firebase] Failed to initialize Firestore:', e2);
      return getFirestore(app);
    }
  }
})();

export async function testConnection(): Promise<boolean> {
  try {
    const checkPromise = getDocFromServer(doc(db, 'test', 'connection'));
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 4000)
    );
    await Promise.race([checkPromise, timeoutPromise]);
    return true;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message === 'timeout')) {
      console.warn('[Firebase Firestore] Client läuft im Offline-Cache Modus oder verbindet sich im Hintergrund.');
      return false;
    }
    // Any other response (including document not found or permission check) confirms the server is reached
    return true;
  }
}

