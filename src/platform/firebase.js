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
const RETRY_DELAYS_MS = [3000, 10000, 30000, 60000];

export function useAnonymousAuth() {
  const [state, setState] = useState({ user: null, loading: firebaseEnabled, error: '' });

  useEffect(() => {
    if (!auth) return undefined;
    let timer = null;
    let attempt = 0;
    // Sem rede, o login falha: tenta de novo com espera crescente e assim que a rede voltar.
    const signIn = () => {
      clearTimeout(timer);
      signInAnonymously(auth).catch((error) => {
        console.warn('Login anônimo falhou; nova tentativa em seguida.', error?.code || error);
        setState({ user: null, loading: false, error: 'Não foi possível conectar ao servidor. O app segue funcionando offline.' });
        timer = setTimeout(signIn, RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]);
        attempt += 1;
      });
    };
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        clearTimeout(timer);
        setState({ user, loading: false, error: '' });
        return;
      }
      signIn();
    });
    const onOnline = () => { if (!auth.currentUser) signIn(); };
    window.addEventListener('online', onOnline);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', onOnline);
      unsubscribe();
    };
  }, []);

  return state;
}
