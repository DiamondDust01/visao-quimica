import test from 'node:test';
import assert from 'node:assert/strict';
import { CORES, COR_DO_GRUPO } from './cores.js';
import { MENU_MAIS, SCREEN_IDS, TABS } from './navigation.js';

const CHAVES = ['icone', 'ativo', 'texto', 'titulo', 'borda'];

test('cada aba, tela do "Mais" e grupo do menu tem uma cor completa', () => {
  const areas = [...TABS.map((tab) => tab.id), ...SCREEN_IDS, ...MENU_MAIS.map((grupo) => COR_DO_GRUPO[grupo.id])];
  for (const area of areas) {
    assert.ok(CORES[area], `sem cor para ${area}`);
    for (const chave of CHAVES) assert.ok(CORES[area][chave], `${area} sem ${chave}`);
  }
});

test('as abas principais têm cores diferentes entre si', () => {
  const tons = TABS.map((tab) => CORES[tab.id].icone);
  assert.equal(new Set(tons).size, tons.length);
});
