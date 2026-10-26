import { useEffect, useMemo, useState } from 'react';
import { db, appId } from '../platform/firebase.js';
import { createTransport } from '../platform/transport.js';
import { STORAGE_KEYS, readJson, sessionStore, writeJson } from '../platform/storage.js';

// Transporte único do app: Firestore quando há Firebase; senão, demonstração local.
let transport = null;
export const getTransport = () => {
  if (!transport) transport = createTransport({ db, appId });
  return transport;
};

const randomId = () => (globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

// Identidade do aparelho nas salas: o uid do login anônimo (com Firebase) ou um id local
// por aba (na demonstração, cada aba é um participante diferente).
export const useDeviceId = (user) => useMemo(() => {
  if (user?.uid) return user.uid;
  const storage = sessionStore();
  const stored = readJson(STORAGE_KEYS.dispositivo, null, storage);
  if (stored) return stored;
  const created = `local-${randomId()}`;
  writeJson(STORAGE_KEYS.dispositivo, created, storage);
  return created;
}, [user?.uid]);

// Sala em que esta aba está: { code, papel: 'host' | 'participante' }, só na sessão da aba.
export const readMembership = () => readJson(STORAGE_KEYS.sala, null, sessionStore());
export const writeMembership = (value) => writeJson(STORAGE_KEYS.sala, value, sessionStore());

// Estado da sala e, quando `listarParticipantes` é verdadeiro, a lista de participantes.
// Pelas regras do Firestore, só quem já entrou (e o host) pode ler a lista; antes de
// entrar, o aluno vê a contagem que o host mantém em `room.participantes`.
export function useRoomData(code, { listarParticipantes = true } = {}) {
  const [room, setRoom] = useState(undefined);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');

  useEffect(() => {
    if (!code) return undefined;
    const active = getTransport();
    setRoom(undefined);
    setError('');
    const stopRoom = active.watchRoom(code, (state) => setRoom(state), (reason) => setError(`Falha na conexão com a sala: ${reason?.message || reason}`));
    // Na demonstração local, uma sala que não existe nunca responde: depois de um tempo,
    // ela é dada como não encontrada (o Firestore já avisa isso sozinho).
    const timeout = active.kind === 'local' ? setTimeout(() => setRoom((current) => (current === undefined ? null : current)), 1500) : null;
    return () => {
      stopRoom?.();
      if (timeout) clearTimeout(timeout);
    };
  }, [code]);

  useEffect(() => {
    if (!code || !listarParticipantes) return undefined;
    setParticipants([]);
    setListError('');
    const stopList = getTransport().watchParticipants(code, (list) => { setParticipants(list); setListError(''); }, (reason) => setListError(`Não foi possível atualizar a lista de participantes: ${reason?.message || reason}`));
    return () => stopList?.();
  }, [code, listarParticipantes]);

  return { room, participants, error, listError };
}

// Relógio que atualiza a cada segundo enquanto `active` for verdadeiro.
export function useNow(active) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}
