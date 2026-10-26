// Armazenamento local do aparelho. Todas as chaves do app passam por aqui e usam o
// mesmo prefixo, para que "apagar dados deste aparelho" remova tudo e nada mais.
// Leituras e escritas nunca lançam erro: em janela anônima ou com o armazenamento
// bloqueado, o app continua funcionando com os valores padrão.

export const STORAGE_PREFIX = 'visao-quimica:';

export const STORAGE_KEYS = {
  tema: 'tema',
  perfil: 'perfil',
  progresso: 'progresso',
  apelido: 'apelido',
  sala: 'sala',
  pontos: 'pontos',
  mentor: 'mentor',
  dispositivo: 'dispositivo',
  conta: 'conta'
};

const defaultStorage = (kind = 'localStorage') => {
  try {
    return typeof window !== 'undefined' ? window[kind] : null;
  } catch {
    return null;
  }
};

export const storageKey = (key) => STORAGE_PREFIX + key;

export const readValue = (key, fallback = null, storage = defaultStorage()) => {
  try {
    const raw = storage?.getItem(storageKey(key));
    return raw === null || raw === undefined ? fallback : raw;
  } catch {
    return fallback;
  }
};

export const writeValue = (key, value, storage = defaultStorage()) => {
  try {
    storage?.setItem(storageKey(key), String(value));
    return true;
  } catch {
    return false;
  }
};

export const removeValue = (key, storage = defaultStorage()) => {
  try {
    storage?.removeItem(storageKey(key));
    return true;
  } catch {
    return false;
  }
};

export const readJson = (key, fallback = null, storage = defaultStorage()) => {
  const raw = readValue(key, null, storage);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const writeJson = (key, value, storage = defaultStorage()) => {
  try {
    return writeValue(key, JSON.stringify(value), storage);
  } catch {
    return false;
  }
};

// Remove só as chaves do app. Retorna quantas saíram.
export const clearAppStorage = (storage = defaultStorage()) => {
  try {
    const keys = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && key.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
    return keys.length;
  } catch {
    return 0;
  }
};

export const sessionStore = () => defaultStorage('sessionStorage');
