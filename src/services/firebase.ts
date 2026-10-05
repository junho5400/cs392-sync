import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously, type User } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// Web config is public by design; access is enforced by firestore.rules.
const app = initializeApp({
  apiKey: 'AIzaSyB95JBcshZ2wu6eumJSaYoSohk4Rn0CMFw',
  authDomain: 'sync-cs392.firebaseapp.com',
  projectId: 'sync-cs392',
  storageBucket: 'sync-cs392.firebasestorage.app',
  messagingSenderId: '45934989089',
  appId: '1:45934989089:web:6129df813ccee79cf63860',
});

export const auth = getAuth(app);
export const db = getFirestore(app);

// Local integration tests use the emulators, e.g. VITE_FIRESTORE_EMULATOR=127.0.0.1:8080
// and VITE_AUTH_EMULATOR=http://127.0.0.1:9099.
const firestoreEmulator = import.meta.env.VITE_FIRESTORE_EMULATOR as string | undefined;
if (firestoreEmulator) {
  const [host, port] = firestoreEmulator.split(':');
  connectFirestoreEmulator(db, host, Number(port));
}
const authEmulator = import.meta.env.VITE_AUTH_EMULATOR as string | undefined;
if (authEmulator) connectAuthEmulator(auth, authEmulator, { disableWarnings: true });

let signingIn: Promise<User> | null = null;

/** The browser's anonymous identity, created on first use and kept by Firebase Auth. */
export const currentUser = (): Promise<User> => {
  signingIn ??= auth.authStateReady().then(async () => auth.currentUser ?? (await signInAnonymously(auth)).user);
  return signingIn;
};
