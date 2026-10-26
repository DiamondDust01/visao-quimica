import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, ExpressionError } from './expressao.js';
import { parseChemText, chemPlainText } from './textoQuimico.js';

const close = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));

test('expressões: precedência, potência, unário e funções', () => {
  assert.equal(evaluate('2 + 3 * 4'), 14);
  assert.equal(evaluate('(2*1 + 16) * 3'), 54);
  assert.equal(evaluate('2^3^2'), 512);
  assert.equal(evaluate('-2^2'), -4);
  assert.ok(close(evaluate('-log10(0.001)'), 3));
  assert.ok(close(evaluate('6.02e23 * 0.5'), 3.01e23));
  assert.ok(close(evaluate('0.5^(11460/5730)'), 0.25));
  assert.throws(() => evaluate('2 +'), ExpressionError);
  assert.throws(() => evaluate('foo(2)'), /desconhecida/);
  assert.throws(() => evaluate('1/0'), /finito/);
  assert.throws(() => evaluate('alert(1)'), ExpressionError);
});

test('texto químico: índices, coeficientes, cargas e setas', () => {
  assert.deepEqual(parseChemText('\\ce{2H2O}'), [{ tipo: 'texto', valor: '2H' }, { tipo: 'sub', valor: '2' }, { tipo: 'texto', valor: 'O' }]);
  assert.deepEqual(parseChemText('\\ce{SO4^{2-}}'), [{ tipo: 'texto', valor: 'SO' }, { tipo: 'sub', valor: '4' }, { tipo: 'sup', valor: '2−' }]);
  assert.deepEqual(parseChemText('\\ce{Na+}'), [{ tipo: 'texto', valor: 'Na+' }]);
  assert.equal(chemPlainText('O gás \\ce{CO2} e a reação \\ce{N2 + 3H2 <=> 2NH3}.'), 'O gás CO2 e a reação N2 + 3H2  ⇌  2NH3.');
  assert.equal(chemPlainText('\\ce{CuSO4·5H2O}'), 'CuSO4·5H2O');
  const hydrate = parseChemText('\\ce{CuSO4·5H2O}');
  assert.ok(hydrate.some((segment) => segment.tipo === 'texto' && segment.valor.includes('·5H')));
  assert.deepEqual(parseChemText('sem fórmula'), [{ tipo: 'texto', valor: 'sem fórmula' }]);
});
