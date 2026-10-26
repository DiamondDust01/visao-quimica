import test from 'node:test';
import assert from 'node:assert/strict';
import { createTaxonomyIndex, aggregateTaxonomy } from './taxonomia.js';
import { recommend, unstudiedPrerequisites, orderTrail, prerequisiteClosure, MAX_DESAFIOS } from './recomendador.js';
import { statusFor } from './progresso.js';
import { AREAS_TESTE_BRUTAS, ETAPAS_TESTE } from './fixtures.test-data.js';
import { TAXONOMIA, ETAPAS } from '../data/index.js';

const index = createTaxonomyIndex(aggregateTaxonomy(AREAS_TESTE_BRUTAS, ETAPAS_TESTE), ETAPAS_TESTE);
const answered = (respondidas, acertos) => ({ respondidas, acertos, atualizadoEm: '2026-10-25T00:00:00Z' });

test('sem progresso: recomendados da etapa, base de etapas anteriores e trilha respeitando pré-requisitos', () => {
  const result = recommend({ index, etapaId: 'em-1' });
  assert.deepEqual(result.recomendados, ['s2', 's3', 's4']);
  assert.deepEqual(result.revisao, ['s1']);
  assert.deepEqual(result.trilha, ['s1', 's2', 's3', 's4']);
  assert.equal(result.proximo, 's1');
  assert.deepEqual(result.concluidos, []);
});

test('desafio traz a etapa seguinte só quando os pré-requisitos estão ao alcance', () => {
  const result = recommend({ index, etapaId: 'em-1' });
  // s7 depende de s8, que é de Ensino Superior e não está na trilha: fica de fora.
  assert.deepEqual(result.desafio, ['s6', 's5']);
});

test('subtema dominado sai da trilha e da revisão e vai para concluídos', () => {
  const result = recommend({ index, etapaId: 'em-1', progress: { s1: answered(5, 5) } });
  assert.deepEqual(result.revisao, []);
  assert.deepEqual(result.trilha, ['s2', 's3', 's4']);
  assert.deepEqual(result.concluidos, ['s1']);
});

test('acerto baixo manda o subtema para revisão e para o começo da trilha', () => {
  const result = recommend({ index, etapaId: 'em-1', progress: { s4: answered(3, 1) } });
  assert.equal(statusFor({ respondidas: 3, acertos: 1 }), 'revisar');
  assert.deepEqual(result.revisao, ['s4', 's1']);
  assert.equal(result.trilha[0], 's4');
  assert.ok(!result.recomendados.includes('s4'));
});

test('subtema de outra etapa estudado com acerto baixo também volta para revisão, depois da sua base', () => {
  const result = recommend({ index, etapaId: 'em-1', progress: { s5: answered(4, 1) } });
  assert.ok(result.revisao.includes('s5'));
  assert.ok(result.trilha.indexOf('s5') > result.trilha.indexOf('s3'));
  assert.ok(!result.desafio.includes('s5'));
});

test('o caminho até um tema que precisa de revisão vem antes do resto', () => {
  // s6 (2ª série) teve acerto baixo; seu pré-requisito s4 passa à frente de s1.
  const result = recommend({ index, etapaId: 'em-1', progress: { s6: answered(3, 0) } });
  assert.deepEqual(result.trilha.slice(0, 2), ['s4', 's6']);
  assert.equal(result.proximo, 's4');
});

test('estudo livre e etapa desconhecida não recomendam nada', () => {
  for (const etapaId of ['livre', 'nao-existe']) {
    const result = recommend({ index, etapaId });
    assert.equal(result.semRecomendacao, true);
    assert.deepEqual(result.trilha, []);
  }
});

test('a recomendação é determinística', () => {
  const progress = { s2: answered(2, 1), s4: answered(3, 3) };
  assert.deepEqual(recommend({ index, etapaId: 'em-1', progress }), recommend({ index, etapaId: 'em-1', progress }));
});

test('orderTrail coloca cada pré-requisito antes de quem depende dele', () => {
  const order = orderTrail(index, ['s3', 's2', 's1', 's5'], () => 'nao-iniciado');
  assert.deepEqual(order, ['s1', 's2', 's3', 's5']);
  assert.deepEqual([...prerequisiteClosure(index, ['s5'])].sort(), ['s1', 's2', 's3']);
});

test('aviso de pré-requisitos não estudados na seleção livre', () => {
  assert.deepEqual(unstudiedPrerequisites(index, ['s3']), [{ subtemaId: 's3', faltando: ['s2'] }]);
  // Selecionar o tema inteiro inclui os pré-requisitos internos.
  assert.deepEqual(unstudiedPrerequisites(index, ['t1']), []);
  // Pré-requisito já iniciado não gera aviso.
  assert.deepEqual(unstudiedPrerequisites(index, ['s3'], { s2: answered(1, 0) }), []);
});

test('com os dados reais, toda etapa gera uma trilha válida', () => {
  ETAPAS.forEach((etapa) => {
    const result = recommend({ index: TAXONOMIA, etapaId: etapa.id });
    if (etapa.semRecomendacao) {
      assert.equal(result.semRecomendacao, true);
      return;
    }
    assert.ok(result.trilha.length > 0, etapa.id);
    assert.equal(new Set(result.trilha).size, result.trilha.length, `${etapa.id}: repetição na trilha`);
    const position = new Map(result.trilha.map((id, order) => [id, order]));
    result.trilha.forEach((id) => TAXONOMIA.get(id).prerequisitos.forEach((prereq) => {
      if (position.has(prereq)) assert.ok(position.get(prereq) < position.get(id), `${etapa.id}: ${prereq} deveria vir antes de ${id}`);
    }));
    assert.deepEqual(new Set([...result.recomendados, ...result.revisao]), new Set(result.trilha), etapa.id);
    assert.ok(result.desafio.length <= MAX_DESAFIOS);
    result.desafio.forEach((id) => {
      assert.ok(!position.has(id), `${etapa.id}: desafio ${id} já está na trilha`);
      assert.ok(TAXONOMIA.minNivel(id) > etapa.nivel, `${etapa.id}: desafio ${id} é de etapa igual ou anterior`);
    });
  });
});
