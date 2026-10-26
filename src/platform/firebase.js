// Integração opcional com o Firebase. Sem VITE_FIREBASE_CONFIG o app funciona offline:
// `db` e `auth` ficam nulos e as salas usam a demonstração local (transport.js).

import { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const parseConfig = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    console.error('VITE_FIREBASE_CONFIG não é um JSON válido; o app segue sem Firebase.');
    return null;
  }
};

const firebaseConfig = parseConfig(import.meta.env.VITE_FIREBASE_CONFIG);
const app = firebaseConfig ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const firebaseEnabled = Boolean(app);
// Raiz dos dados no Firestore: artifacts/{appId}/...
export const appId = import.meta.env.VITE_APP_ID || 'visao-quimica';

// Só em desenvolvimento: VITE_FIREBASE_EMULATORS=1 liga autenticação e Firestore aos
// emuladores locais (portas definidas em firebase.json).
if (app && import.meta.env.DEV && import.meta.env.VITE_FIREBASE_EMULATORS === '1') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9199', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8180);
}

// Login anônimo: as regras do Firestore exigem usuário autenticado, mas o app não pede dados pessoais.
export function useAnonymousAuth() {
  const [state, setState] = useState({ user: null, loading: firebaseEnabled, error: '' });

  useEffect(() => {
    if (!auth) return undefined;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setState({ user, loading: false, error: '' });
        return;
      }
      signInAnonymously(auth).catch((error) => {
        console.error('Falha no login anônimo:', error);
        setState({ user: null, loading: false, error: 'Não foi possível conectar ao servidor. O app segue funcionando offline.' });
      });
    });
    return unsubscribe;
  }, []);

  return state;
}
