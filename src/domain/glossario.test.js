import test from 'node:test';
import assert from 'node:assert/strict';
import { criarBuscador, marcarTermos, termoBloqueado } from './glossario.js';
import { splitCe } from './textoQuimico.js';
import glossario from '../data/glossario.json' with { type: 'json' };
import { QUESTIONS } from '../data/questoes/index.js';

const TERMOS = [
  { id: 'eq', termo: 'ponto de equivalência', formas: ['ponto de equivalência', 'equivalência'], explicacao: 'x', temas: ['sol-titulacao'] },
  { id: 'proveta', termo: 'proveta', formas: ['proveta', 'provetas'], explicacao: 'x', temas: ['lab-*'] },
  { id: 'meia-vida', termo: 'meia-vida', formas: ['meia-vida'], explicacao: 'x' }
];
const buscador = criarBuscador(TERMOS);
const termos = (segmentos) => segmentos.filter((s) => s.tipo === 'termo').map((s) => s.valor);

test('marca palavras inteiras, sem diferenciar maiúsculas, e prefere a forma mais longa', () => {
  const segmentos = marcarTermos('No Ponto de equivalência, a proveta e as provetas...', buscador);
  assert.deepEqual(termos(segmentos), ['Ponto de equivalência', 'proveta']);
  assert.equal(segmentos.map((s) => s.valor).join(''), 'No Ponto de equivalência, a proveta e as provetas...');
  assert.deepEqual(termos(marcarTermos('provetaria e superproveta', buscador)), []);
  assert.deepEqual(termos(marcarTermos('A meia-vida do césio', buscador)), ['meia-vida']);
});

test('cada termo é marcado só na primeira vez e pode ser bloqueado', () => {
  assert.deepEqual(termos(marcarTermos('proveta, proveta e provetas', buscador)), ['proveta']);
  assert.deepEqual(termos(marcarTermos('proveta e equivalência', buscador, (e) => e.id === 'proveta')), ['equivalência']);
  assert.deepEqual(marcarTermos('', buscador), [{ tipo: 'texto', valor: '' }]);
  assert.deepEqual(marcarTermos('sem nada', criarBuscador([])), [{ tipo: 'texto', valor: 'sem nada' }]);
});

test('termos do assunto da questão só são explicados depois da resposta', () => {
  const [eq, proveta, meiaVida] = TERMOS;
  assert.equal(termoBloqueado(eq, 'sol-titulacao', false), true);
  assert.equal(termoBloqueado(eq, 'sol-titulacao', true), false);
  assert.equal(termoBloqueado(eq, 'sol-diluicao', false), false);
  assert.equal(termoBloqueado(proveta, 'lab-vidrarias', false), true);
  assert.equal(termoBloqueado(proveta, 'fund-densidade', false), false);
  assert.equal(termoBloqueado(meiaVida, 'rad-meia-vida', false), false);
});

// Textos das questões em que o glossário aparece (fora dos trechos \ce{...}).
const textosDa = (q) => [
  q.enunciado,
  ...(q.alternativas || []).map((a) => a.texto),
  ...(q.itens || []).map((a) => a.texto),
  ...(q.resolucaoPassoAPasso || []),
  ...(q.errosComuns || []).map((e) => e.descricao),
  q.dica
].filter(Boolean).flatMap((texto) => splitCe(texto).filter((p) => p.tipo === 'texto').map((p) => p.valor));

test('glossário: ids e formas únicos, textos preenchidos e subtemas existentes', () => {
  const ids = new Set();
  const formas = new Set();
  const temaIds = new Set(QUESTIONS.map((q) => q.temaId));
  glossario.termos.forEach((entrada) => {
    assert.ok(!ids.has(entrada.id), `id repetido: ${entrada.id}`);
    ids.add(entrada.id);
    assert.ok(entrada.termo && entrada.explicacao && entrada.formas.length, `${entrada.id} incompleto`);
    entrada.formas.forEach((forma) => {
      const chave = forma.toLocaleLowerCase('pt-BR');
      assert.ok(!formas.has(chave), `forma repetida: ${forma}`);
      formas.add(chave);
    });
    (entrada.temas || []).forEach((padrao) => {
      const existe = padrao.endsWith('*')
        ? [...temaIds].some((id) => id.startsWith(padrao.slice(0, -1)))
        : temaIds.has(padrao);
      assert.ok(existe, `${entrada.id}: subtema "${padrao}" não existe`);
    });
  });
});

test('glossário: todo termo aparece em alguma questão', () => {
  const todos = criarBuscador(glossario.termos);
  const achados = new Set();
  QUESTIONS.forEach((q) => textosDa(q).forEach((texto) => {
    marcarTermos(texto, todos).forEach((s) => { if (s.tipo === 'termo') achados.add(s.entrada.id); });
  }));
  const sobrando = glossario.termos.map((e) => e.id).filter((id) => !achados.has(id));
  assert.deepEqual(sobrando, []);
});
