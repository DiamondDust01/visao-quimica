import test from 'node:test';
import assert from 'node:assert/strict';
import {
  criarLembreteBackup, concluirBackup, instantaneoValido, lembreteBackupVencido,
  mesclarInstantaneos, montarInstantaneo, normalizarLembreteBackup
} from './backup.js';

test('mantém o formato de backup versão 1 e importa backups antigos', () => {
  const snapshot = montarInstantaneo({
    profile: { etapaId: 'em-1' },
    progress: { 'gas-leis': { respondidas: 3, acertos: 2 } },
    points: 40,
    mentorLog: [{ em: '2026-10-25T01:00:00Z', questaoId: 'q1' }]
  }, '2026-10-26T10:00:00Z');

  assert.equal(snapshot.versao, 1);
  assert.equal(snapshot.salvoEm, '2026-10-26T10:00:00Z');
  assert.ok(instantaneoValido(snapshot));
  assert.ok(!instantaneoValido({ ...snapshot, versao: 2 }));
  assert.ok(!instantaneoValido({ ...snapshot, progresso: [] }));
});

test('junta o progresso sem duplicar respostas, pontos ou registro do Mentor', () => {
  const local = {
    versao: 1, salvoEm: '2026-10-26T10:00:00Z', perfil: { etapaId: 'em-1', atualizadoEm: '2026-10-20' },
    progresso: { a: { respondidas: 3, acertos: 2, atualizadoEm: '2026-10-25' }, b: { respondidas: 1, acertos: 1, atualizadoEm: '2026-10-25' } },
    pontos: 50, mentor: [{ em: '2026-10-25T01', questaoId: 'q1' }]
  };
  const imported = {
    versao: 1, salvoEm: '2026-10-26T11:00:00Z', perfil: { etapaId: 'em-2', atualizadoEm: '2026-10-22' },
    progresso: { a: { respondidas: 2, acertos: 2, atualizadoEm: '2026-10-26' }, c: { respondidas: 4, acertos: 4, atualizadoEm: '2026-10-26' } },
    pontos: 80, mentor: [{ em: '2026-10-25T01', questaoId: 'q1' }, { em: '2026-10-24T09', questaoId: 'q0' }]
  };
  const merged = mesclarInstantaneos(local, imported);

  assert.deepEqual(Object.keys(merged.progresso).sort(), ['a', 'b', 'c']);
  assert.equal(merged.progresso.a.respondidas, 3);
  assert.equal(merged.pontos, 80);
  assert.equal(merged.perfil.etapaId, 'em-2');
  assert.deepEqual(merged.mentor.map((item) => item.questaoId), ['q0', 'q1']);
  assert.deepEqual(mesclarInstantaneos(merged, imported), merged);
  assert.deepEqual(mesclarInstantaneos(merged, local), merged);
});

test('lembrete semanal e mensal só vencem após o intervalo configurado', () => {
  const configuredAt = new Date('2026-10-01T12:00:00Z');
  const weekly = criarLembreteBackup('semanal', configuredAt);
  const monthly = criarLembreteBackup('mensal', configuredAt);

  assert.ok(!lembreteBackupVencido(weekly, new Date('2026-10-08T11:59:59Z')));
  assert.ok(lembreteBackupVencido(weekly, new Date('2026-10-08T12:00:00Z')));
  assert.ok(!lembreteBackupVencido(monthly, new Date('2026-11-01T11:59:59Z')));
  assert.ok(lembreteBackupVencido(monthly, new Date('2026-11-01T12:00:00Z')));
  assert.ok(!lembreteBackupVencido(criarLembreteBackup('nunca', configuredAt), new Date('2030-01-01')));
});

test('salvar um backup reinicia o prazo e dados de lembrete inválidos usam valores seguros', () => {
  const savedAt = new Date('2026-10-10T12:00:00Z');
  const updated = concluirBackup(criarLembreteBackup('semanal', new Date('2026-10-01T12:00:00Z')), savedAt);

  assert.equal(updated.ultimoBackupEm, savedAt.toISOString());
  assert.ok(!lembreteBackupVencido(updated, new Date('2026-10-17T11:59:59Z')));
  const endOfMonth = criarLembreteBackup('mensal', new Date('2026-01-31T12:00:00Z'));
  assert.ok(lembreteBackupVencido(endOfMonth, new Date('2026-02-28T12:00:00Z')));
  assert.deepEqual(normalizarLembreteBackup({ frequencia: 'invalid' }, savedAt), {
    frequencia: 'nunca',
    configuradoEm: savedAt.toISOString(),
    ultimoBackupEm: null
  });
});
