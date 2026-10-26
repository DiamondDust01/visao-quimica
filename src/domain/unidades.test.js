import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveUnit, convert, parseNumber, unitDimension, UNITS } from './unidades.js';

const close = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));

test('reconhece unidades e apelidos comuns', () => {
  assert.equal(resolveUnit('ml'), 'mL');
  assert.equal(resolveUnit('g / mol'), 'g/mol');
  assert.equal(resolveUnit('g/cm3'), 'g/mL');
  assert.equal(resolveUnit('ºC'), '°C');
  assert.equal(resolveUnit('M'), 'mol/L');
  assert.equal(resolveUnit('m'), 'm');
  assert.equal(resolveUnit('KJ/mol'), 'kJ/mol');
  assert.equal(resolveUnit('furlong'), null);
  assert.equal(resolveUnit(''), null);
});

test('converte dentro da mesma grandeza e recusa grandezas diferentes', () => {
  assert.ok(close(convert(500, 'mL', 'L'), 0.5));
  assert.ok(close(convert(25, '°C', 'K'), 298.15));
  assert.ok(close(convert(760, 'mmHg', 'atm'), 1));
  assert.ok(close(convert(1, 'kcal', 'kJ'), 4.184));
  assert.ok(close(convert(1, 'g/mL', 'g/L'), 1000));
  assert.equal(convert(1, 'g', 'L'), null);
  assert.equal(unitDimension('kJ/mol'), 'energia-molar');
});

test('toda unidade tem grandeza e fator válidos', () => {
  Object.entries(UNITS).forEach(([key, def]) => {
    assert.ok(def.dimensao, key);
    assert.ok(Number.isFinite(def.fator) && def.fator > 0, key);
  });
});

test('lê números como estudantes escrevem', () => {
  assert.equal(parseNumber('0,5'), 0.5);
  assert.equal(parseNumber('1.250,5'), 1250.5);
  assert.equal(parseNumber('1250.5'), 1250.5);
  assert.equal(parseNumber('6,02 × 10^23'), 6.02e23);
  assert.equal(parseNumber('6,02x10²³'), 6.02e23);
  assert.equal(parseNumber('1,2e-3'), 1.2e-3);
  assert.equal(parseNumber('3 × 10⁻²'), 0.03);
  assert.equal(parseNumber('−4'), -4);
  assert.ok(Number.isNaN(parseNumber('abc')));
  assert.ok(Number.isNaN(parseNumber('')));
});
