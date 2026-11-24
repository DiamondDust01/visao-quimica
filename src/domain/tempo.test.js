import test from 'node:test';
import assert from 'node:assert/strict';
import { formatarDuracao, formatarRelogio } from './tempo.js';

test('relógio da sessão em minutos e segundos, com horas só depois de uma hora', () => {
  assert.equal(formatarRelogio(0), '00:00');
  assert.equal(formatarRelogio(247), '04:07');
  assert.equal(formatarRelogio(3729), '1:02:09');
  assert.equal(formatarRelogio(-5), '00:00');
  assert.equal(formatarRelogio('x'), '00:00');
});

test('duração por extenso para o resultado e leitores de tela', () => {
  assert.equal(formatarDuracao(45), '45 s');
  assert.equal(formatarDuracao(247), '4 min 7 s');
  assert.equal(formatarDuracao(240), '4 min');
  assert.equal(formatarDuracao(3729), '1 h 2 min');
  assert.equal(formatarDuracao(7200), '2 h');
});
