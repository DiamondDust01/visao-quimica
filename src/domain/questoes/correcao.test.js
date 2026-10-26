import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAnswer, describeAnswer, normalizeName } from './correcao.js';
import { buildSession, summarizeSession } from './sessao.js';
import { EXEMPLOS as E } from './exemplos.test-data.js';

const status = (question, answer) => checkAnswer(question, answer).status;

test('múltipla escolha e erro comum ligado à alternativa', () => {
  assert.equal(status(E.multipla, 'b'), 'correta');
  const wrong = checkAnswer(E.multipla, 'c');
  assert.equal(wrong.status, 'incorreta');
  assert.equal(wrong.erroComum, 'Confundiu com o número de átomos.');
  assert.equal(checkAnswer(E.multipla, 'a').erroComum, null);
  assert.equal(status(E.multipla, ''), 'invalida');
});

test('numérica: tolerância, conversão e verificação de unidade', () => {
  assert.equal(status(E.numerica, { valor: '0,5', unidade: 'L' }), 'correta');
  assert.equal(status(E.numerica, { valor: '0.505', unidade: 'L' }), 'correta');
  const converted = checkAnswer(E.numerica, { valor: '500', unidade: 'mL' });
  assert.equal(converted.status, 'correta');
  assert.match(converted.mensagem, /equivale a 0,5 L/);
  assert.equal(status(E.numerica, { valor: '0,6', unidade: 'L' }), 'incorreta');
  const wrongDimension = checkAnswer(E.numerica, { valor: '0,5', unidade: 'g' });
  assert.equal(wrongDimension.status, 'incorreta');
  assert.match(wrongDimension.mensagem, /mede massa/);
  assert.equal(checkAnswer(E.numerica, { valor: '500', unidade: 'L' }).erroComum, 'Esqueceu de converter mL em L.');
  assert.equal(status(E.numerica, { valor: '0,5', unidade: '' }), 'invalida');
  assert.equal(status(E.numerica, { valor: '0,5', unidade: 'xícaras' }), 'invalida');
  assert.equal(status(E.numerica, { valor: 'meio', unidade: 'L' }), 'invalida');
  const strict = { ...E.numerica, gabarito: { ...E.numerica.gabarito, exigirUnidade: true } };
  assert.equal(status(strict, { valor: '0,5', unidade: 'L' }), 'correta');
  assert.match(checkAnswer(strict, { valor: '500', unidade: 'mL' }).mensagem, /pede a resposta em L/);
});

test('balanceamento: conservação, menores inteiros e mensagens', () => {
  assert.equal(status(E.balanceamento, ['2', '1', '2']), 'correta');
  const notMinimal = checkAnswer(E.balanceamento, [4, 2, 4]);
  assert.equal(notMinimal.status, 'incorreta');
  assert.match(notMinimal.mensagem, /menores números inteiros/);
  const wrong = checkAnswer(E.balanceamento, [1, 1, 1]);
  assert.match(wrong.mensagem, /2 de O nos reagentes e 1 nos produtos/);
  assert.equal(wrong.erroComum, 'Mudou o índice em vez do coeficiente.');
  assert.equal(status(E.balanceamento, ['2', '', '2']), 'invalida');
  assert.equal(status(E.balanceamento, ['2', '0', '2']), 'invalida');
});

test('nomenclatura nos dois sentidos', () => {
  assert.equal(status(E.nomeParaFormula, 'H2SO4'), 'correta');
  assert.equal(status(E.nomeParaFormula, 'SO4H2'), 'correta');
  assert.equal(checkAnswer(E.nomeParaFormula, 'H2SO3').erroComum, 'Confundiu com o ácido sulfuroso.');
  assert.equal(status(E.nomeParaFormula, 'h2so4'), 'invalida');
  assert.equal(status(E.formulaParaNome, '  Cloreto de  Sodio '), 'correta');
  assert.equal(checkAnswer(E.formulaParaNome, 'clorato de sódio').erroComum, 'Usou o sufixo dos oxiácidos.');
  assert.equal(normalizeName('But - 2 - eno'), 'but-2-eno');
});

test('associação, ordenação e tabela periódica', () => {
  assert.equal(status(E.associacao, { i1: 'o1', i2: 'o2' }), 'correta');
  assert.match(checkAnswer(E.associacao, { i1: 'o1', i2: 'o3' }).mensagem, /1 de 2/);
  assert.equal(status(E.associacao, { i1: 'o1' }), 'invalida');
  assert.equal(status(E.ordenacao, ['li', 'na', 'k']), 'correta');
  assert.match(checkAnswer(E.ordenacao, ['na', 'li', 'k']).mensagem, /1 de 3/);
  assert.equal(status(E.tabela, ' na '), 'correta');
  assert.equal(checkAnswer(E.tabela, 'K').erroComum, 'Escolheu o elemento do período errado.');
  assert.equal(status(E.tabela, 'Xy'), 'invalida');
});

test('descrição do gabarito', () => {
  assert.equal(describeAnswer(E.balanceamento), '\\ce{2H2 + O2 -> 2H2O}');
  assert.equal(describeAnswer(E.multipla), 'B) Dois');
  assert.equal(describeAnswer(E.numerica), '0,5 L');
});

test('sessão reveza entre subtemas e prioriza a etapa do estudante', () => {
  const q = (id, temaId, etapa) => ({ id, temaId, etapa });
  const questoes = [q('a1', 'a', 'em-2'), q('a2', 'a', 'em-1'), q('a3', 'a', 'em-1'), q('b1', 'b', 'em-1'), q('c1', 'c', 'em-1')];
  const nivel = { 'em-1': 5, 'em-2': 6 };
  const session = buildSession({ questoes, subtemaIds: ['a', 'b'], quantidade: 3, nivelDaEtapa: (id) => nivel[id], nivelEstudante: 5, random: () => 0.3 });
  assert.equal(session.length, 3);
  assert.ok(session.every((question) => question.temaId !== 'c'));
  assert.deepEqual(new Set(session.slice(0, 2).map((question) => question.temaId)), new Set(['a', 'b']));
  assert.equal(session.find((question) => question.temaId === 'a').etapa, 'em-1');
  assert.equal(buildSession({ questoes, subtemaIds: ['a', 'b', 'c'], quantidade: 50 }).length, 5);
});

test('resumo da sessão', () => {
  const summary = summarizeSession([
    { temaId: 'a', status: 'correta', dicaUsada: true },
    { temaId: 'a', status: 'incorreta', dicaUsada: false },
    { temaId: 'b', status: 'correta', dicaUsada: false }
  ]);
  assert.deepEqual(summary, { total: 3, corretas: 2, percentual: 67, dicasUsadas: 1, pontos: 0, porSubtema: { a: { total: 2, corretas: 1 }, b: { total: 1, corretas: 1 } } });
});
