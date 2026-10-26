import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRoomConfig, createRoomState, startPatch, endPatch, secondsLeft, isAnswering, formatClock,
  answerPatch, rankParticipants, resultsCsv, asPlayersMap, ROOM_STATUS
} from './sala.js';
import { getRoomStartState } from '../platform/competitionRooms.js';

const q = (id, temaId) => ({ id, temaId, etapa: 'em-1' });
const questoes = [q('a1', 'a'), q('a2', 'a'), q('b1', 'b'), q('b2', 'b'), q('c1', 'c')];
const config = { titulo: 'Turma A', subtemaIds: ['a', 'b'], quantidade: 3, tempoMin: 10, minJogadores: 1, maxJogadores: 8 };

test('configuração da sala é validada', () => {
  assert.equal(validateRoomConfig({ ...config, disponiveis: 4 }).valid, true);
  assert.match(validateRoomConfig({ ...config, subtemaIds: [] }).error, /ao menos um tema/);
  assert.match(validateRoomConfig({ ...config, disponiveis: 0 }).error, /não têm questões/);
  assert.match(validateRoomConfig({ ...config, tempoMin: 0 }).error, /tempo/);
});

test('questões sorteadas uma vez, só dos temas escolhidos', () => {
  const room = createRoomState({ ...config, questoes, random: () => 0.4 });
  assert.equal(room.status, ROOM_STATUS.lobby);
  assert.equal(room.questoes.length, 3);
  assert.ok(room.questoes.every((id) => !id.startsWith('c')));
  assert.deepEqual(createRoomState({ ...config, questoes, random: () => 0.4 }).questoes, room.questoes);
});

test('início, tempo restante e encerramento', () => {
  const room = { ...createRoomState({ ...config, questoes }), ...startPatch({ config }, 1000) };
  assert.equal(room.encerraEm, 1000 + 10 * 60 * 1000);
  assert.equal(secondsLeft(room, 1000), 600);
  assert.equal(isAnswering(room, 1000 + 599 * 1000), true);
  assert.equal(isAnswering(room, 1000 + 600 * 1000), false);
  assert.equal(isAnswering({ ...room, ...endPatch(5000) }, 2000), false);
  assert.equal(secondsLeft({ status: 'lobby' }), null);
  assert.equal(formatClock(125), '02:05');
});

test('pontuação do participante é a soma das respostas', () => {
  const first = answerPatch({}, { questaoId: 'a1', status: 'correta', pontos: 20 });
  assert.deepEqual(first, { respostas: { a1: { correta: true, pontos: 20 } }, pontuacao: 20 });
  const second = answerPatch({ respostas: first.respostas }, { questaoId: 'b1', status: 'incorreta', pontos: 0 });
  assert.equal(second.pontuacao, 20);
  assert.deepEqual(Object.keys(second.respostas), ['b1']);
});

test('ranking com desempate e empates na mesma posição', () => {
  const ranking = rankParticipants([
    { uid: 'u1', apelido: 'Íon Veloz', pontuacao: 30, respostas: { a: { correta: true }, b: { correta: true } }, atualizadoEm: '2' },
    { uid: 'u2', apelido: 'Átomo Calmo', pontuacao: 50, respostas: { a: { correta: true } }, atualizadoEm: '3' },
    { uid: 'u3', apelido: 'Molécula Atenta', pontuacao: 30, respostas: { a: { correta: true }, b: { correta: true } }, atualizadoEm: '2' },
    { uid: 'u4', apelido: 'Béquer Curioso', pontuacao: 30, respostas: { a: { correta: true } }, atualizadoEm: '1' }
  ]);
  assert.deepEqual(ranking.map((row) => [row.uid, row.posicao]), [['u2', 1], ['u1', 2], ['u3', 2], ['u4', 4]]);
  const csv = resultsCsv(ranking, 5);
  assert.match(csv, /"1","Átomo Calmo","50","1","1","5","não"/);
});

test('participantes no formato das regras de início da sala', () => {
  const players = asPlayersMap([{ uid: 'a' }, { uid: 'b' }]);
  assert.equal(getRoomStartState({ status: 'lobby', minPlayers: 2, maxPlayers: 4, players }).canStart, true);
});
