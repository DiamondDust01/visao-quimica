import test from 'node:test';
import assert from 'node:assert/strict';
import { TABS, TAB_IDS, DEFAULT_TAB, isTabId, getTab } from './navigation.js';

test('abas têm IDs únicos e incluem os módulos de estudo', () => {
  assert.equal(new Set(TAB_IDS).size, TABS.length);
  ['fundamentos', 'pratica', 'laboratorio'].forEach((id) => assert.ok(isTabId(id), id));
  assert.equal(TABS.length, 4);
  assert.ok(!isTabId('como-funciona'));
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

test('o menu "Mais" leva a todas as telas fora das abas, sem itens repetidos', async () => {
  const { MENU_MAIS, SCREEN_IDS } = await import('./navigation.js');
  const itens = MENU_MAIS.flatMap((grupo) => grupo.itens);
  assert.equal(new Set(itens.map((item) => item.id)).size, itens.length);
  itens.forEach((item) => assert.ok((item.tela && SCREEN_IDS.includes(item.tela)) || ['guia', 'tema'].includes(item.acao), item.id));
  SCREEN_IDS.forEach((tela) => assert.ok(itens.some((item) => item.tela === tela), `${tela} sem item no menu`));
  SCREEN_IDS.forEach((tela) => assert.ok(!isTabId(tela), `${tela} não deve ser aba`));
});
