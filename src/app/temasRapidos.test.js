import test from 'node:test';
import assert from 'node:assert/strict';
import { TEMAS_RAPIDOS } from './temasRapidos.js';
import { ETAPAS, TAXONOMIA } from '../data/index.js';
import { QUESTIONS } from '../data/questoes/index.js';

test('há um único tema sugerido, o de reações endotérmicas e exotérmicas, com resumo', () => {
  const sugeridos = TEMAS_RAPIDOS.filter((tema) => tema.sugerido);
  assert.equal(sugeridos.length, 1);
  assert.equal(sugeridos[0].id, 'endo-exo');
  assert.equal(sugeridos[0].etapaId, 'em-2');
  assert.ok(sugeridos[0].resumo?.length > 30);
});

test('temas rápidos apontam para subtemas com questões e etapas reais', () => {
  const ids = TEMAS_RAPIDOS.map((tema) => tema.id);
  assert.equal(new Set(ids).size, ids.length, 'ids repetidos');
  const etapaIds = new Set(ETAPAS.map((etapa) => etapa.id));
  const comQuestoes = new Set(QUESTIONS.map((questao) => questao.temaId));

  for (const tema of TEMAS_RAPIDOS) {
    assert.ok(tema.titulo, `${tema.id} sem título`);
    assert.ok(etapaIds.has(tema.etapaId), `${tema.id}: etapa ${tema.etapaId} não existe`);
    assert.ok(tema.subtemaIds.length > 0, `${tema.id} sem subtemas`);
    for (const subtemaId of tema.subtemaIds) {
      const subtema = TAXONOMIA.byId.get(subtemaId);
      assert.ok(subtema, `${tema.id}: subtema ${subtemaId} não existe`);
      assert.ok(comQuestoes.has(subtemaId), `${tema.id}: ${subtemaId} não tem questões`);
      assert.ok(subtema.etapasRecomendadas.includes(tema.etapaId), `${tema.id}: ${subtemaId} não é indicado para ${tema.etapaId}`);
    }
  }
});
