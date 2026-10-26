import test from 'node:test';
import assert from 'node:assert/strict';
import { ELEMENT_SYMBOLS, parseFormula, checkBalance, sameComposition, FormulaError } from './formula.js';

test('118 símbolos, sem repetição', () => {
  assert.equal(ELEMENT_SYMBOLS.length, 118);
  assert.equal(new Set(ELEMENT_SYMBOLS).size, 118);
});

test('fórmulas simples, com parênteses, colchetes e hidratos', () => {
  assert.deepEqual(parseFormula('H2O'), { elementos: { H: 2, O: 1 }, carga: 0 });
  assert.deepEqual(parseFormula('Ca(OH)2').elementos, { Ca: 1, O: 2, H: 2 });
  assert.deepEqual(parseFormula('Al2(SO4)3').elementos, { Al: 2, S: 3, O: 12 });
  assert.deepEqual(parseFormula('[Fe(CN)6]^{4-}'), { elementos: { Fe: 1, C: 6, N: 6 }, carga: -4 });
  assert.deepEqual(parseFormula('CuSO4·5H2O').elementos, { Cu: 1, S: 1, O: 9, H: 10 });
  assert.deepEqual(parseFormula('CuSO4*5H2O').elementos, { Cu: 1, S: 1, O: 9, H: 10 });
  assert.deepEqual(parseFormula('\\ce{CO2(g)}').elementos, { C: 1, O: 2 });
});

test('cargas em várias notações e o elétron', () => {
  assert.equal(parseFormula('SO4^2-').carga, -2);
  assert.equal(parseFormula('SO4^{2-}').carga, -2);
  assert.equal(parseFormula('Fe^{3+}').carga, 3);
  assert.equal(parseFormula('Na+').carga, 1);
  assert.equal(parseFormula('Cl-').carga, -1);
  assert.equal(parseFormula('NH4^+').carga, 1);
  assert.deepEqual(parseFormula('e^-'), { elementos: {}, carga: -1 });
});

test('diferencia Co de CO e acusa erros com mensagem útil', () => {
  assert.deepEqual(parseFormula('Co').elementos, { Co: 1 });
  assert.deepEqual(parseFormula('CO').elementos, { C: 1, O: 1 });
  assert.throws(() => parseFormula('h2o'), /maiúscula/);
  assert.throws(() => parseFormula('Xx2'), /não é símbolo/);
  assert.throws(() => parseFormula('Ca(OH2'), /fechar/);
  assert.throws(() => parseFormula('SO42-'), /use \^/);
  assert.throws(() => parseFormula('2H2O'), FormulaError);
});

test('balanceamento: conservação de átomos e carga e menores inteiros', () => {
  assert.deepEqual(checkBalance(['H2', 'O2'], ['H2O'], [2, 1, 2]).atomosOk, true);
  const wrong = checkBalance(['H2', 'O2'], ['H2O'], [1, 1, 1]);
  assert.equal(wrong.atomosOk, false);
  assert.deepEqual(wrong.diferencas, [{ elemento: 'O', reagentes: 2, produtos: 1 }]);
  assert.equal(checkBalance(['H2', 'O2'], ['H2O'], [4, 2, 4]).menoresInteiros, false);
  const ionic = checkBalance(['MnO4^-', 'Fe^{2+}', 'H^+'], ['Mn^{2+}', 'Fe^{3+}', 'H2O'], [1, 5, 8, 1, 5, 4]);
  assert.equal(ionic.atomosOk && ionic.cargaOk, true);
  assert.equal(checkBalance(['Cu', 'Ag^+'], ['Cu^{2+}', 'Ag'], [1, 1, 1, 1]).cargaOk, false);
});

test('mesma composição independe da ordem de escrita', () => {
  assert.ok(sameComposition(parseFormula('C2H6O'), parseFormula('CH3CH2OH')));
  assert.ok(!sameComposition(parseFormula('NH4^+'), parseFormula('NH4')));
});
