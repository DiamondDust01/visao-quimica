import test from 'node:test';
import assert from 'node:assert/strict';
import { periodOf, groupOf, blockOf, gridPosition, electronCount, configSegments } from './tabelaPeriodica.js';
import { molarMass } from './massaMolar.js';
import { validateElements } from './validacao/elementos.js';
import elementosData from '../data/elementos.json' with { type: 'json' };

const { elementos } = elementosData;
const close = (a, b, tol = 1e-3) => Math.abs(a - b) <= tol;

test('período, grupo e bloco calculados a partir do número atômico', () => {
  const cases = [[1, 1, 1, 's'], [2, 1, 18, 's'], [3, 2, 1, 's'], [5, 2, 13, 'p'], [10, 2, 18, 'p'], [11, 3, 1, 's'], [13, 3, 13, 'p'],
    [21, 4, 3, 'd'], [26, 4, 8, 'd'], [35, 4, 17, 'p'], [47, 5, 11, 'd'], [55, 6, 1, 's'], [56, 6, 2, 's'], [72, 6, 4, 'd'],
    [79, 6, 11, 'd'], [86, 6, 18, 'p'], [87, 7, 1, 's'], [104, 7, 4, 'd'], [118, 7, 18, 'p']];
  cases.forEach(([z, period, group, block]) => {
    assert.equal(periodOf(z), period, `período de ${z}`);
    assert.equal(groupOf(z), group, `grupo de ${z}`);
    assert.equal(blockOf(z), block, `bloco de ${z}`);
  });
  assert.equal(groupOf(57), null);
  assert.equal(blockOf(92), 'f');
});

test('posição na grade: séries f em linhas separadas e sem colisões', () => {
  assert.deepEqual(gridPosition(57), { row: 9, col: 3 });
  assert.deepEqual(gridPosition(71), { row: 9, col: 17 });
  assert.deepEqual(gridPosition(103), { row: 10, col: 17 });
  const keys = new Set(Array.from({ length: 118 }, (_, i) => JSON.stringify(gridPosition(i + 1))));
  assert.equal(keys.size, 118);
});

test('contagem de elétrons e exibição da configuração', () => {
  assert.equal(electronCount('[Ar] 3d5 4s1'), 24);
  assert.equal(electronCount('1s2 2s2 2p6'), 10);
  assert.deepEqual(configSegments('[He] 2s2'), [{ tipo: 'texto', valor: '[He]' }, { tipo: 'texto', valor: ' ' }, { tipo: 'texto', valor: '2s' }, { tipo: 'sup', valor: '2' }]);
});

test('elementos.json é válido e traz as fontes com data', () => {
  assert.deepEqual(validateElements(elementosData), []);
  assert.match(elementosData.meta.fontes.massaAtomica.url, /ciaaw\.org/);
});

test('valores de referência da CIAAW (pesos abreviados 2024)', () => {
  const mass = (symbol) => elementos.find((element) => element.simbolo === symbol);
  assert.equal(mass('H').massaAtomicaTexto, '1.0080');
  assert.equal(mass('C').massaAtomica, 12.011);
  assert.equal(mass('O').massaAtomica, 15.999);
  assert.equal(mass('Cl').massaAtomica, 35.45);
  assert.equal(mass('Tc').massaAtomicaTexto, '[97]');
});

test('massa molar com as massas da IUPAC', () => {
  assert.ok(close(molarMass('H2O', elementos).total, 18.015));
  assert.ok(close(molarMass('CuSO4·5H2O', elementos).total, 249.68, 0.01));
  const sulfate = molarMass('SO4^{2-}', elementos);
  assert.equal(sulfate.carga, -2);
  assert.ok(close(sulfate.total, 96.06, 0.01));
  assert.deepEqual(molarMass('CO2', elementos).parcelas.map((p) => [p.simbolo, p.quantidade]), [['C', 1], ['O', 2]]);
  assert.equal(molarMass('TcO4^-', elementos).aproximada, true);
  assert.throws(() => molarMass('Xx', elementos));
});
