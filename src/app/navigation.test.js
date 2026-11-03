import test from 'node:test';
import assert from 'node:assert/strict';
import { TABS, TAB_IDS, DEFAULT_TAB, isTabId, getTab } from './navigation.js';

test('abas têm IDs únicos e incluem os módulos de estudo', () => {
  assert.equal(new Set(TAB_IDS).size, TABS.length);
  ['fundamentos', 'pratica', 'laboratorio', 'como-funciona'].forEach((id) => assert.ok(isTabId(id), id));
  assert.equal(TABS.length, 5);
  assert.ok(!isTabId('desafios'));
  assert.ok(isTabId(DEFAULT_TAB));
});

test('rótulos curtos cabem na barra inferior do celular', () => {
  TABS.forEach((tab) => assert.ok(tab.short && tab.short.length <= 8, tab.id));
});

test('aba desconhecida volta para o início', () => {
  assert.equal(getTab('inexistente').id, 'inicio');
  assert.equal(isTabId('inexistente'), false);
});
