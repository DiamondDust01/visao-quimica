import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALFABETO, TAMANHO_CODIGO, codigoValido, cifrar, decifrar, derivarConta, formatarCodigo, gerarCodigo,
  instantaneoValido, mesclarInstantaneos, montarInstantaneo, normalizarCodigo
} from './conta.js';

test('código gerado tem 20 símbolos do alfabeto e passa na verificação', () => {
  for (let index = 0; index < 50; index += 1) {
    const code = gerarCodigo();
    assert.equal(code.length, TAMANHO_CODIGO);
    assert.ok([...code].every((char) => ALFABETO.includes(char)));
    assert.ok(codigoValido(code));
  }
});

test('erro de digitação é detectado; formatação e confusões comuns são aceitas', () => {
  const code = gerarCodigo();
  const typo = (code[3] === 'A' ? 'B' : 'A');
  assert.ok(!codigoValido(code.slice(0, 3) + typo + code.slice(4)));
  assert.ok(!codigoValido(code.slice(0, -1)));
  assert.ok(codigoValido(formatarCodigo(code).toLowerCase()));
  assert.equal(formatarCodigo(code).split('-').length, 4);
  assert.equal(normalizarCodigo('ab-o il'), 'AB011');
});

test('o mesmo código sempre leva ao mesmo documento; códigos diferentes, a documentos diferentes', async () => {
  const code = gerarCodigo();
  const first = await derivarConta(code);
  const again = await derivarConta(formatarCodigo(code));
  const other = await derivarConta(gerarCodigo());
  assert.match(first.id, /^[0-9a-f]{64}$/);
  assert.equal(first.id, again.id);
  assert.notEqual(first.id, other.id);
  assert.ok(!first.id.includes(code.toLowerCase()));
});

test('dados cifrados não mostram o conteúdo e só abrem com o código certo', async () => {
  const code = gerarCodigo();
  const { chave } = await derivarConta(code);
  const snapshot = montarInstantaneo({ profile: { etapaId: 'em-1', atualizadoEm: 'x' }, progress: { 'gas-leis': { respondidas: 3, acertos: 2 } }, points: 40, mentorLog: [] });
  const sealed = await cifrar(chave, snapshot);
  assert.ok(!sealed.dados.includes('gas-leis'));
  assert.ok(!Buffer.from(sealed.dados, 'base64').toString('utf8').includes('gas-leis'));
  assert.deepEqual(await decifrar(chave, sealed), snapshot);
  const { chave: wrong } = await derivarConta(gerarCodigo());
  await assert.rejects(() => decifrar(wrong, sealed));
});

test('código inválido não deriva conta', async () => {
  await assert.rejects(() => derivarConta('ABC'), /Código inválido/);
});

test('mescla sem contar duas vezes e de forma idempotente', () => {
  const local = {
    versao: 1, salvoEm: '2026-10-26T10:00:00Z', perfil: { etapaId: 'em-1', atualizadoEm: '2026-10-20' },
    progresso: { a: { respondidas: 3, acertos: 2, atualizadoEm: '2026-10-25' }, b: { respondidas: 1, acertos: 1, atualizadoEm: '2026-10-25' } },
    pontos: 50, mentor: [{ em: '2026-10-25T01', questaoId: 'q1' }]
  };
  const remote = {
    versao: 1, salvoEm: '2026-10-26T11:00:00Z', perfil: { etapaId: 'em-2', atualizadoEm: '2026-10-22' },
    progresso: { a: { respondidas: 2, acertos: 2, atualizadoEm: '2026-10-26' }, c: { respondidas: 4, acertos: 4, atualizadoEm: '2026-10-26' } },
    pontos: 80, mentor: [{ em: '2026-10-25T01', questaoId: 'q1' }, { em: '2026-10-24T09', questaoId: 'q0' }]
  };
  const merged = mesclarInstantaneos(local, remote);
  assert.deepEqual(Object.keys(merged.progresso).sort(), ['a', 'b', 'c']);
  assert.equal(merged.progresso.a.respondidas, 3);
  assert.equal(merged.pontos, 80);
  assert.equal(merged.perfil.etapaId, 'em-2');
  assert.deepEqual(merged.mentor.map((item) => item.questaoId), ['q0', 'q1']);
  assert.deepEqual(mesclarInstantaneos(merged, remote), merged);
  assert.deepEqual(mesclarInstantaneos(merged, local), merged);
  assert.ok(instantaneoValido(merged));
});

test('instantâneo de arquivo estranho é recusado', () => {
  assert.ok(!instantaneoValido(null));
  assert.ok(!instantaneoValido({ versao: 1, progresso: [], pontos: 0, mentor: [] }));
  assert.ok(!instantaneoValido({ versao: 2, progresso: {}, pontos: 0, mentor: [] }));
  assert.ok(instantaneoValido(montarInstantaneo({})));
});
