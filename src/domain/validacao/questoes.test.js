import test from 'node:test';
import assert from 'node:assert/strict';
import { validateQuestions } from './questoes.js';
import { createTaxonomyIndex, aggregateTaxonomy } from '../taxonomia.js';
import { AREAS_TESTE_BRUTAS, ETAPAS_TESTE } from '../fixtures.test-data.js';
import { EXEMPLOS } from '../questoes/exemplos.test-data.js';

const index = createTaxonomyIndex(aggregateTaxonomy(AREAS_TESTE_BRUTAS, ETAPAS_TESTE), ETAPAS_TESTE);
const all = () => structuredClone(Object.values(EXEMPLOS));
// Completa o mínimo de questões dos outros subtemas da área de teste.
const filler = () => ['s1', 's3', 's4', 's5', 's6', 's7', 's8'].flatMap((temaId) => {
  const etapa = index.get(temaId).etapasRecomendadas[0];
  return [1, 2, 3].map((n) => ({ ...structuredClone(EXEMPLOS.multipla), id: `f-${temaId}-${n}`, temaId, etapa }));
});
const run = (questoes) => validateQuestions({ arquivos: [{ area: 'area-a', questoes: [...questoes, ...filler()] }], index });

test('os exemplos de todos os tipos são válidos', () => {
  const { erros, total } = run(all());
  assert.deepEqual(erros, []);
  assert.equal(total, 8 + 21);
});

test('acusa id repetido, temaId inexistente e etapa fora do subtema', () => {
  const questoes = all();
  questoes[1].id = questoes[0].id;
  questoes[2].temaId = 'nao-existe';
  questoes[3].etapa = 'ef-9';
  const erros = run(questoes).erros.join('\n');
  assert.match(erros, /id repetido/);
  assert.match(erros, /"nao-existe" não é um subtema/);
  assert.match(erros, /etapa "ef-9" não está entre as etapas/);
});

test('acusa gabarito incoerente em cada tipo', () => {
  const q = structuredClone(EXEMPLOS);
  q.multipla.gabarito = 'z';
  q.numerica.verificacao = '250 * 3 / 1000';
  q.balanceamento.gabarito = [1, 1, 1];
  q.nomeParaFormula.gabarito.formula = 'H2So4';
  q.associacao.gabarito = { i1: 'o9', i2: 'o2' };
  q.ordenacao.gabarito = ['li', 'li', 'k'];
  q.tabela.gabarito.simbolos = ['Xy'];
  const erros = run(Object.values(q)).erros.join('\n');
  assert.match(erros, /gabarito "z" não é uma das alternativas/);
  assert.match(erros, /"verificacao" dá 0.75, mas o gabarito é 0.5/);
  assert.match(erros, /não conserva átomos/);
  assert.match(erros, /fórmula do gabarito inválida/);
  assert.match(erros, /item "i1" sem opção válida/);
  assert.match(erros, /cada item exatamente uma vez/);
  assert.match(erros, /"Xy" não é símbolo/);
});

test('acusa balanceamento fora dos menores inteiros e carga não conservada', () => {
  const q = structuredClone(EXEMPLOS.balanceamento);
  q.gabarito = [4, 2, 4];
  const ionic = { ...structuredClone(EXEMPLOS.balanceamento), id: 'ex-ion', equacao: { reagentes: ['Cu', 'Ag^+'], produtos: ['Cu^{2+}', 'Ag'] }, gabarito: [1, 1, 1, 1], errosComuns: [{ descricao: 'x' }] };
  const erros = run([...all().filter((item) => item.id !== 'ex-bal'), q, ionic]).erros.join('\n');
  assert.match(erros, /menores inteiros/);
  assert.match(erros, /não conserva carga/);
});

test('acusa campos obrigatórios ausentes, erro comum igual ao gabarito e cobertura mínima', () => {
  const questoes = all();
  delete questoes[0].dica;
  questoes[0].errosComuns = [];
  questoes[1].errosComuns = [{ descricao: 'x', resposta: { valor: 0.5, unidade: 'L' } }];
  questoes[2].revisado = 'não';
  const erros = run(questoes).erros.join('\n');
  assert.match(erros, /"dica" vazia/);
  assert.match(erros, /"errosComuns" precisa/);
  assert.match(erros, /erro comum coincide com o gabarito/);
  assert.match(erros, /"revisado" deve ser true ou false/);
  const sparse = validateQuestions({ arquivos: [{ area: 'area-a', questoes: all() }], index }).erros.join('\n');
  assert.match(sparse, /subtema "s1": 0 questão\(ões\); o mínimo é 3/);
  assert.match(sparse, /subtema "s8": 0 questão\(ões\); o mínimo é 1/);
});

test('termos sensíveis geram aviso, não erro; área sem arquivo também', () => {
  const questoes = all();
  questoes[0].enunciado = 'Por que materiais explosivos exigem armazenamento especial?';
  const { erros, avisos } = validateQuestions({ arquivos: [{ area: 'area-a', questoes: [...questoes, ...filler()] }], index, areasSemArquivo: ['outra'] });
  assert.deepEqual(erros, []);
  assert.equal(avisos.length, 2);
});
