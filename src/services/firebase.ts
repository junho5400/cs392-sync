import { initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// Public web config for the sync-cs392 project. Firebase API keys are public
// identifiers; access is enforced by firestore.rules, not by this key.
export const firebaseConfig = {
  apiKey: 'AIzaSyB95JBcshZ2wu6eumJSaYoSohk4Rn0CMFw',
  authDomain: 'sync-cs392.firebaseapp.com',
  projectId: 'sync-cs392',
  storageBucket: 'sync-cs392.firebasestorage.app',
  messagingSenderId: '45934989089',
  appId: '1:45934989089:web:6129df813ccee79cf63860',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

// Local integration tests point the SDK at the Firestore emulator, e.g.
// VITE_FIRESTORE_EMULATOR=127.0.0.1:8080.
const emulator = import.meta.env.VITE_FIRESTORE_EMULATOR as string | undefined;
if (emulator) {
  const [host, port] = emulator.split(':');
  connectFirestoreEmulator(db, host, Number(port));
}
