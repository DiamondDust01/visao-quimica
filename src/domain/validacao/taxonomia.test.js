import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTaxonomy, validateEtapas, findCycle } from './taxonomia.js';
import { aggregateTaxonomy } from '../taxonomia.js';
import { AREAS_TESTE_BRUTAS, ETAPAS_TESTE } from '../fixtures.test-data.js';
import { TAXONOMY_AREAS, TAXONOMY_META } from '../../data/taxonomia/index.js';
import { ETAPAS } from '../../data/index.js';

const META = { versao: '1.0.0', ordemAreas: ['area-a'] };
// Base válida: sem o tema 3 (que viola de propósito a regra de etapas no teste do
// recomendador) e, por isso, sem a etapa "superior", que só ele usa.
const ETAPAS_VALIDAS = ETAPAS_TESTE.filter((etapa) => etapa.id !== 'superior');
const validRaw = () => {
  const areas = structuredClone(AREAS_TESTE_BRUTAS);
  areas[0].temas = areas[0].temas.slice(0, 2);
  return areas;
};
const valid = () => aggregateTaxonomy(validRaw(), ETAPAS_VALIDAS);
const check = (areas) => validateTaxonomy({ areas, meta: META, etapas: ETAPAS_VALIDAS });
const subtema = (areas, id) => areas[0].temas.flatMap((tema) => tema.subtemas).find((node) => node.id === id);
const resync = (areas) => aggregateTaxonomy(areas, ETAPAS_VALIDAS);

test('a taxonomia real e as etapas reais são válidas', () => {
  assert.deepEqual(validateEtapas(ETAPAS), []);
  assert.deepEqual(validateTaxonomy({ areas: TAXONOMY_AREAS, meta: TAXONOMY_META, etapas: ETAPAS }), []);
});

test('base de teste é válida', () => {
  assert.deepEqual(check(valid()), []);
});

test('acusa id fora do padrão e id repetido', () => {
  const areas = validRaw();
  subtema(areas, 's2').id = 'S 2';
  subtema(areas, 's3').id = 's1';
  const errors = check(resync(areas)).join('\n');
  assert.match(errors, /kebab-case/);
  assert.match(errors, /id repetido/);
});

test('acusa pré-requisito inexistente, ciclo e pré-requisito de etapa posterior', () => {
  const missing = validRaw();
  subtema(missing, 's2').prerequisitos = ['nao-existe'];
  assert.match(check(resync(missing)).join('\n'), /"nao-existe" não é um subtema existente/);

  const cycle = validRaw();
  subtema(cycle, 's1').prerequisitos = ['s3'];
  assert.match(check(resync(cycle)).join('\n'), /ciclo de pré-requisitos/);

  const later = validRaw();
  subtema(later, 's4').prerequisitos = ['s5'];
  subtema(later, 's5').prerequisitos = [];
  assert.match(check(resync(later)).join('\n'), /só aparece em etapa posterior/);
});

test('acusa campos inválidos: dificuldade, palavras-chave, etapa e "livre"', () => {
  const areas = validRaw();
  subtema(areas, 's1').dificuldade = 7;
  subtema(areas, 's2').palavrasChave = [];
  subtema(areas, 's3').etapasRecomendadas = ['em-9'];
  subtema(areas, 's4').etapasRecomendadas = ['livre', 'em-1'];
  const errors = check(resync(areas)).join('\n');
  assert.match(errors, /"dificuldade" deve ser inteiro de 1 a 5/);
  assert.match(errors, /"palavrasChave" precisa/);
  assert.match(errors, /etapa inexistente "em-9"/);
  assert.match(errors, /"livre" não é etapa recomendável/);
});

test('acusa campos derivados desatualizados e pede o sync', () => {
  const areas = valid();
  areas[0].temas[0].dificuldade = 5;
  assert.match(check(areas).join('\n'), /npm run sync:taxonomia/);
});

test('acusa etapa sem nenhum subtema recomendado e área listada sem arquivo', () => {
  const areas = validRaw();
  subtema(areas, 's1').etapasRecomendadas = ['em-1'];
  assert.match(check(resync(areas)).join('\n'), /etapa "ef-9": nenhum subtema recomendado/);
  assert.match(validateTaxonomy({ areas: [undefined], meta: { versao: '1.0.0', ordemAreas: ['sumiu'] }, etapas: ETAPAS_TESTE }).join('\n'), /"sumiu" não tem arquivo/);
});

test('etapas: id repetido e desafio inexistente', () => {
  const etapas = structuredClone(ETAPAS_TESTE);
  etapas[1].id = 'ef-9';
  etapas[0].desafio = ['nao-existe'];
  const errors = validateEtapas(etapas).join('\n');
  assert.match(errors, /id repetido/);
  assert.match(errors, /etapa inexistente "nao-existe"/);
});

test('findCycle devolve o caminho do ciclo', () => {
  assert.deepEqual(findCycle([{ id: 'a', prerequisitos: ['b'] }, { id: 'b', prerequisitos: ['a'] }]), ['a', 'b', 'a']);
  assert.equal(findCycle([{ id: 'a', prerequisitos: [] }, { id: 'b', prerequisitos: ['a'] }]), null);
});
