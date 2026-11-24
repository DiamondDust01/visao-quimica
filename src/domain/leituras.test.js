import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import 'katex/contrib/mhchem/mhchem.js';
import { ARQUIVOS_LEITURA, LEITURAS, leituraDe } from '../data/leituras/index.js';
import { QUESTIONS } from '../data/questoes/index.js';
import { splitCe } from './textoQuimico.js';

const subtemasComQuestoes = new Set(QUESTIONS.map((q) => q.temaId));
const textosDe = (leitura) => [leitura.introducao, leitura.exemplo, ...leitura.secoes.flatMap((s) => [s.titulo, s.texto]), ...leitura.pontosChave].filter(Boolean);

test('leituras: um texto por subtema existente, completo e ainda marcado como não revisado', () => {
  const ids = ARQUIVOS_LEITURA.flatMap((arquivo) => arquivo.leituras.map((leitura) => leitura.subtemaId));
  assert.equal(new Set(ids).size, ids.length, 'subtema com duas leituras');
  assert.equal(LEITURAS.size, ids.length);
  ARQUIVOS_LEITURA.forEach((arquivo) => {
    assert.equal(arquivo.revisado, false);
    arquivo.leituras.forEach((leitura) => {
      assert.ok(subtemasComQuestoes.has(leitura.subtemaId), `${leitura.subtemaId} não é um subtema com questões`);
      assert.ok(leitura.introducao.length > 60, `${leitura.subtemaId}: introdução curta`);
      assert.ok(leitura.secoes.length >= 2 && leitura.secoes.every((s) => s.titulo && s.texto.length > 60), `${leitura.subtemaId}: seções`);
      assert.ok(leitura.pontosChave.length >= 3, `${leitura.subtemaId}: pontos-chave`);
      assert.ok(leitura.exemplo?.length > 20, `${leitura.subtemaId}: exemplo`);
    });
  });
  assert.equal(leituraDe('nao-existe'), null);
});

test('leituras: todas as fórmulas \\ce{} são lidas pelo KaTeX', () => {
  LEITURAS.forEach((leitura) => {
    textosDe(leitura).forEach((texto) => {
      splitCe(texto).filter((parte) => parte.tipo !== 'texto').forEach((parte) => {
        assert.doesNotThrow(() => katex.renderToString(`\\ce{${parte.valor}}`, { throwOnError: true }), `${leitura.subtemaId}: \\ce{${parte.valor}}`);
      });
    });
  });
});
