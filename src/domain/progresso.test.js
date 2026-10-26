import test from 'node:test';
import assert from 'node:assert/strict';
import { statusFor, registerAnswer, summarizeProgress, accuracy, MIN_RESPOSTAS } from './progresso.js';
import { createProfile, readValidProfile } from './perfil.js';

test('status por desempenho, com mínimo de respostas', () => {
  assert.equal(statusFor(undefined), 'nao-iniciado');
  assert.equal(statusFor({ respondidas: MIN_RESPOSTAS - 1, acertos: 0 }), 'em-andamento');
  assert.equal(statusFor({ respondidas: 5, acertos: 2 }), 'revisar');
  assert.equal(statusFor({ respondidas: 5, acertos: 3 }), 'em-andamento');
  assert.equal(statusFor({ respondidas: 5, acertos: 4 }), 'dominado');
});

test('dados corrompidos não quebram o cálculo', () => {
  assert.equal(statusFor({ respondidas: -3, acertos: 'x' }), 'nao-iniciado');
  assert.equal(accuracy({ respondidas: 2, acertos: 9 }), 1);
});

test('registrar resposta acumula sem alterar o objeto original', () => {
  const original = {};
  const once = registerAnswer(original, 's1', true, 't1');
  const twice = registerAnswer(once, 's1', false, 't2');
  assert.deepEqual(original, {});
  assert.deepEqual(twice.s1, { respondidas: 2, acertos: 1, atualizadoEm: 't2' });
});

test('resumo de progresso de um conjunto de subtemas', () => {
  const summary = summarizeProgress(['a', 'b', 'c', 'd'], { a: { respondidas: 3, acertos: 3 }, b: { respondidas: 3, acertos: 0 }, c: { respondidas: 1, acertos: 1 } });
  assert.deepEqual(summary, { total: 4, 'nao-iniciado': 1, 'em-andamento': 1, revisar: 1, dominado: 1, percentConcluido: 25 });
});

test('perfil guarda só a etapa e é descartado se a etapa não existir mais', () => {
  const profile = createProfile('em-1', 't');
  assert.deepEqual(profile, { etapaId: 'em-1', atualizadoEm: 't' });
  assert.deepEqual(readValidProfile(profile, ['em-1']), profile);
  assert.equal(readValidProfile(profile, ['em-2']), null);
  assert.equal(readValidProfile(null, ['em-1']), null);
});
