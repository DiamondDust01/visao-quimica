import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_PREFIX, readJson, writeJson, readValue, writeValue, clearAppStorage } from './storage.js';

export const memoryStorage = () => {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    key: (index) => [...map.keys()][index] ?? null,
    get length() { return map.size; },
    map
  };
};

test('todas as chaves usam o prefixo do app', () => {
  const storage = memoryStorage();
  writeValue('tema', 'light', storage);
  writeJson('perfil', { etapa: 'em-1' }, storage);
  assert.deepEqual([...storage.map.keys()].sort(), [`${STORAGE_PREFIX}perfil`, `${STORAGE_PREFIX}tema`]);
  assert.equal(readValue('tema', 'dark', storage), 'light');
  assert.deepEqual(readJson('perfil', null, storage), { etapa: 'em-1' });
});

test('JSON inválido ou armazenamento bloqueado voltam ao padrão sem lançar erro', () => {
  const storage = memoryStorage();
  storage.setItem(`${STORAGE_PREFIX}progresso`, '{quebrado');
  assert.deepEqual(readJson('progresso', {}, storage), {});
  const blocked = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); } };
  assert.equal(readValue('tema', 'dark', blocked), 'dark');
  assert.equal(writeJson('perfil', {}, blocked), false);
});

test('apagar dados deste aparelho remove só as chaves do app', () => {
  const storage = memoryStorage();
  writeValue('tema', 'dark', storage);
  writeValue('apelido', 'Átomo Curioso', storage);
  storage.setItem('outro-app', 'fica');
  assert.equal(clearAppStorage(storage), 2);
  assert.deepEqual([...storage.map.keys()], ['outro-app']);
});
