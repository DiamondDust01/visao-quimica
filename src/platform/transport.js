// Transporte de dados das salas.
//
// Firestore (com Firebase configurado):
//   artifacts/{appId}/salas/{código}                     dados e estado da sala (só o host escreve)
//   artifacts/{appId}/salas/{código}/participantes/{uid}  registro de cada aparelho (só o próprio participante escreve)
//   artifacts/{appId}/salas/{código}/sinais/{par}         sinalização WebRTC entre dois participantes (peerPairing.js)
// Cada participante escreve apenas o próprio documento, então dezenas de aparelhos não
// disputam o mesmo registro.
//
// Demonstração local (sem Firebase): os dados ficam na memória deste aparelho e são
// espelhados entre abas do mesmo navegador por BroadcastChannel, quando disponível.

import { collection, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const deepMerge = (target, patch) => {
  const output = { ...(target || {}) };
  Object.entries(patch || {}).forEach(([key, value]) => {
    output[key] = isPlainObject(value) && isPlainObject(output[key]) ? deepMerge(output[key], value) : value;
  });
  return output;
};

// Aplica chaves com ponto ("ranking.uid") como o updateDoc do Firestore.
export const applyFieldPaths = (target, patch) => {
  let output = { ...(target || {}) };
  Object.entries(patch || {}).forEach(([path, value]) => {
    const keys = path.split('.');
    if (keys.length === 1) {
      output[path] = value;
      return;
    }
    const nestedPatch = keys.reduceRight((acc, key) => ({ [key]: acc }), value);
    output = deepMerge(output, nestedPatch);
  });
  return output;
};

export const roomPath = (appId, code) => ['artifacts', appId, 'salas', code];

const createFirestoreTransport = (db, appId) => {
  const roomRef = (code) => doc(db, ...roomPath(appId, code));
  const participantsRef = (code) => collection(db, ...roomPath(appId, code), 'participantes');
  const participantRef = (code, uid) => doc(db, ...roomPath(appId, code), 'participantes', uid);

  return {
    kind: 'firestore',
    roomRef,
    async roomInfo(code) {
      const snapshot = await getDoc(roomRef(code));
      if (!snapshot.exists()) return { exists: false, title: '' };
      return { exists: true, title: snapshot.data().titulo || '' };
    },
    async createRoom({ code, title, hostUid, state }) {
      const now = new Date().toISOString();
      await setDoc(roomRef(code), { ...state, codigo: code, titulo: title, hostUid, criadaEm: now, atualizadaEm: now });
    },
    watchRoom(code, onState, onError) {
      return onSnapshot(roomRef(code), (snapshot) => onState(snapshot.exists() ? snapshot.data() : null), onError);
    },
    async updateRoom(code, patch) {
      await updateDoc(roomRef(code), { ...patch, atualizadaEm: new Date().toISOString() });
    },
    watchParticipants(code, onList, onError) {
      return onSnapshot(participantsRef(code), (snapshot) => onList(snapshot.docs.map((item) => ({ uid: item.id, ...item.data() }))), onError);
    },
    async updateParticipant(code, uid, patch) {
      await setDoc(participantRef(code, uid), { ...patch, atualizadoEm: new Date().toISOString() }, { merge: true });
    }
  };
};

// ---------------------------------------------------------------------------
// Demonstração local
// ---------------------------------------------------------------------------
const localRooms = new Map();
const roomListeners = new Map();
const participantListeners = new Map();
let channel = null;

const getChannel = () => {
  if (channel !== null) return channel;
  try {
    channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('visao-quimica-demo') : false;
  } catch {
    channel = false;
  }
  if (channel) {
    channel.onmessage = (event) => handleRemote(event.data);
    // No Node (testes), o canal não deve segurar o processo aberto.
    channel.unref?.();
  }
  return channel;
};

const ensureRoom = (code) => {
  if (!localRooms.has(code)) localRooms.set(code, { state: null, participants: new Map() });
  return localRooms.get(code);
};

const emitRoom = (code) => {
  const room = ensureRoom(code);
  (roomListeners.get(code) || new Set()).forEach((listener) => listener(room.state));
};

const emitParticipants = (code) => {
  const room = ensureRoom(code);
  const list = [...room.participants.entries()].map(([uid, data]) => ({ uid, ...data }));
  (participantListeners.get(code) || new Set()).forEach((listener) => listener(list));
};

const broadcast = (message) => {
  const active = getChannel();
  if (active) {
    try {
      active.postMessage(message);
    } catch {
      // Sem espelhamento entre abas; a demonstração continua nesta aba.
    }
  }
};

function handleRemote(message) {
  if (!message || !message.code) return;
  const room = ensureRoom(message.code);
  if (message.type === 'hello') {
    if (room.state) broadcast({ type: 'snapshot', code: message.code, state: room.state, participants: [...room.participants.entries()] });
    return;
  }
  if (message.type === 'snapshot') {
    if (message.state && (!room.state || (message.state.atualizadaEm || '') >= (room.state.atualizadaEm || ''))) room.state = message.state;
    (message.participants || []).forEach(([uid, data]) => room.participants.set(uid, deepMerge(room.participants.get(uid), data)));
    emitRoom(message.code);
    emitParticipants(message.code);
    return;
  }
  if (message.type === 'room') {
    room.state = message.state;
    emitRoom(message.code);
    return;
  }
  if (message.type === 'participant') {
    room.participants.set(message.uid, message.data);
    emitParticipants(message.code);
  }
}

const addListener = (registry, code, listener) => {
  if (!registry.has(code)) registry.set(code, new Set());
  registry.get(code).add(listener);
  return () => registry.get(code)?.delete(listener);
};

const createLocalTransport = () => ({
  kind: 'local',
  roomRef: null,
  async roomInfo(code) {
    if (!localRooms.get(code)?.state) {
      broadcast({ type: 'hello', code });
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    const current = localRooms.get(code);
    if (!current?.state) return { exists: false, title: '' };
    return { exists: true, title: current.state.titulo || '' };
  },
  async createRoom({ code, title, hostUid, state }) {
    const room = ensureRoom(code);
    const now = new Date().toISOString();
    room.state = { ...state, codigo: code, titulo: title, hostUid, criadaEm: now, atualizadaEm: now };
    broadcast({ type: 'room', code, state: room.state });
    emitRoom(code);
  },
  watchRoom(code, onState) {
    const unsubscribe = addListener(roomListeners, code, onState);
    const room = ensureRoom(code);
    if (room.state) onState(room.state);
    else broadcast({ type: 'hello', code });
    return unsubscribe;
  },
  async updateRoom(code, patch) {
    const room = ensureRoom(code);
    room.state = applyFieldPaths(room.state, { ...patch, atualizadaEm: new Date().toISOString() });
    broadcast({ type: 'room', code, state: room.state });
    emitRoom(code);
  },
  watchParticipants(code, onList) {
    const unsubscribe = addListener(participantListeners, code, onList);
    emitParticipants(code);
    return unsubscribe;
  },
  async updateParticipant(code, uid, patch) {
    const room = ensureRoom(code);
    const data = deepMerge(room.participants.get(uid), { ...patch, atualizadoEm: new Date().toISOString() });
    room.participants.set(uid, data);
    broadcast({ type: 'participant', code, uid, data });
    emitParticipants(code);
  },
  // Só na demonstração local: esquece a sala nesta aba.
  forget(code) {
    localRooms.delete(code);
  }
});

export const createTransport = ({ db, appId }) => (db ? createFirestoreTransport(db, appId) : createLocalTransport());
