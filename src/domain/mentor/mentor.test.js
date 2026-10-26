import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnose } from './diagnostico.js';
import { helpLevels } from './estrategias.js';
import { appendLog, summarizePatterns, suggestReview, MAX_REGISTROS } from './revisao.js';
import { pointsFor, levelFor } from '../pontuacao.js';
import { checkAnswer } from '../questoes/correcao.js';
import { createTaxonomyIndex, aggregateTaxonomy } from '../taxonomia.js';
import { AREAS_TESTE_BRUTAS, ETAPAS_TESTE } from '../fixtures.test-data.js';
import { EXEMPLOS as E } from '../questoes/exemplos.test-data.js';

const patterns = (question, answer) => diagnose(question, answer, checkAnswer(question, answer)).map((item) => item.padrao);
// Questão numérica sem erros comuns previstos, para testar só as regras genéricas.
const numeric = (valor, unidade) => ({ ...E.numerica, errosComuns: [{ descricao: 'x' }], gabarito: { valor, unidade, tolerancia: { relativa: 0.01 } } });

test('padrões numéricos: conversão, potência de 10, sinal, inverso, fator e unidade', () => {
  assert.deepEqual(patterns(numeric(0.5, 'L'), { valor: '500', unidade: 'L' }), ['conversao-unidade']);
  assert.deepEqual(patterns(numeric(0.5, 'L'), { valor: '5', unidade: 'L' }), ['potencia-de-10']);
  assert.deepEqual(patterns(numeric(-150, 'kJ'), { valor: '150', unidade: 'kJ' }), ['sinal-trocado']);
  assert.deepEqual(patterns(numeric(2.7, 'g/mL'), { valor: '0,37037', unidade: 'g/mL' }), ['conta-invertida']);
  assert.deepEqual(patterns(numeric(68, 'g'), { valor: '34', unidade: 'g' }), ['fator-proporcao']);
  assert.deepEqual(patterns(numeric(300, 'K'), { valor: '27', unidade: 'K' }), ['kelvin-celsius']);
  assert.deepEqual(patterns(numeric(0.5, 'L'), { valor: '0,5', unidade: 'g' }), ['unidade-incompativel']);
  assert.deepEqual(patterns(numeric(0.5, 'L'), { valor: '0,37', unidade: 'L' }), []);
});

test('erro previsto na questão tem prioridade sobre as regras genéricas', () => {
  const result = diagnose(E.numerica, { valor: '500', unidade: 'L' }, checkAnswer(E.numerica, { valor: '500', unidade: 'L' }));
  assert.deepEqual(result.map((item) => item.padrao), ['erro-previsto']);
  assert.deepEqual(diagnose(E.numerica, { valor: '0,5', unidade: 'L' }, checkAnswer(E.numerica, { valor: '0,5', unidade: 'L' })), []);
});

test('padrões de balanceamento, nomenclatura e tabela periódica', () => {
  const balancing = { ...E.balanceamento, errosComuns: [{ descricao: 'x' }] };
  assert.deepEqual(patterns(balancing, [4, 2, 4]), ['balanceamento-nao-minimo']);
  assert.deepEqual(patterns(balancing, [1, 1, 1]), ['atomos-nao-conservados']);
  const ionic = { ...balancing, equacao: { reagentes: ['Cu', 'Ag^+'], produtos: ['Cu^{2+}', 'Ag'] }, gabarito: [1, 2, 1, 2] };
  assert.deepEqual(patterns(ionic, [1, 1, 1, 1]), ['carga-nao-conservada']);
  const toName = { ...E.formulaParaNome, errosComuns: [{ descricao: 'x' }], gabarito: { formula: 'H2SO4', nomes: ['ácido sulfúrico'] } };
  assert.deepEqual(patterns(toName, 'ácido sulfuroso'), ['sufixo-trocado']);
  const toFormula = { ...E.nomeParaFormula, errosComuns: [{ descricao: 'x' }], gabarito: { formula: 'CaCl2', nomes: ['cloreto de cálcio'] } };
  assert.deepEqual(patterns(toFormula, 'CaCl'), ['indices-da-formula']);
  const table = { ...E.tabela, errosComuns: [{ descricao: 'x' }], gabarito: { simbolos: ['Cl'] } };
  assert.deepEqual(patterns(table, 'Br'), ['grupo-certo-periodo-errado']);
  assert.deepEqual(patterns(table, 'S'), ['periodo-certo-grupo-errado']);
  assert.deepEqual(patterns(table, 'Fe'), []);
});

test('níveis de ajuda: estratégia, dica e primeiro passo', () => {
  const levels = helpLevels(E.balanceamento);
  assert.deepEqual(levels.map((level) => level.titulo), ['Estratégia', 'Dica', 'Primeiro passo']);
  assert.equal(levels[1].texto, E.balanceamento.dica);
});

test('pontuação com desconto por ajuda e níveis', () => {
  assert.equal(pointsFor({ dificuldade: 3, status: 'correta' }), 30);
  assert.equal(pointsFor({ dificuldade: 3, status: 'correta', nivelAjuda: 2 }), 15);
  assert.equal(pointsFor({ dificuldade: 4, status: 'correta', nivelAjuda: 9 }), 10);
  assert.equal(pointsFor({ dificuldade: 5, status: 'incorreta' }), 0);
  assert.equal(levelFor(0).nome, 'Átomo');
  assert.deepEqual([levelFor(150).nome, levelFor(150).faltam, levelFor(150).percentual], ['Molécula', 150, 25]);
  assert.equal(levelFor(99999).proximo, null);
});

test('registro limitado e sugestões de revisão por acerto baixo, base e padrões', () => {
  let log = [];
  for (let i = 0; i < MAX_REGISTROS + 10; i += 1) log = appendLog(log, { temaId: 's4', padroes: [] });
  assert.equal(log.length, MAX_REGISTROS);

  const index = createTaxonomyIndex(aggregateTaxonomy(AREAS_TESTE_BRUTAS, ETAPAS_TESTE), ETAPAS_TESTE);
  const progress = { s3: { respondidas: 5, acertos: 1 }, s1: { respondidas: 3, acertos: 3 } };
  const suggestions = suggestReview({ index, progress, log: [{ temaId: 's6', padroes: [] }, { temaId: 's6', padroes: [] }] });
  const ids = suggestions.map((item) => item.subtemaId);
  assert.deepEqual(ids, ['s2', 's3', 's6']);
  assert.match(suggestions[0].motivos[0], /base de "Subtema s3"/);
  assert.ok(!ids.includes('s1'), 'tema dominado não é sugerido');

  const summary = summarizePatterns([{ padroes: ['conversao-unidade', 'erro-previsto'] }, { padroes: ['conversao-unidade'] }]);
  assert.deepEqual(summary.map((item) => [item.padrao, item.vezes]), [['conversao-unidade', 2]]);
});
