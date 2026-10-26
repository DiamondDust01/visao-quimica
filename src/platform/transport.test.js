import test from 'node:test';
import assert from 'node:assert/strict';
import { applyFieldPaths, createTransport, deepMerge, roomPath } from './transport.js';

test('deepMerge preserva respostas anteriores do mesmo aparelho', () => {
  const merged = deepMerge(
    { respostas: { q1: { correta: true } }, pontuacao: 10 },
    { respostas: { q2: { correta: false } } }
  );
  assert.equal(merged.pontuacao, 10);
  assert.deepEqual(Object.keys(merged.respostas).sort(), ['q1', 'q2']);
  assert.equal(merged.respostas.q1.correta, true);
});

test('applyFieldPaths aplica caminhos com ponto como o Firestore', () => {
  const state = applyFieldPaths({ status: 'lobby', ranking: { a: 10 } }, {
    'ranking.b': 20,
    'config.temas.lista': ['gases'],
    status: 'em-andamento'
  });
  assert.equal(state.status, 'em-andamento');
  assert.equal(state.ranking.a, 10);
  assert.equal(state.ranking.b, 20);
  assert.deepEqual(state.config.temas.lista, ['gases']);
});

test('caminho da sala no Firestore usa as coleções do app', () => {
  assert.deepEqual(roomPath('visao-quimica', 'ABC234'), ['artifacts', 'visao-quimica', 'salas', 'ABC234']);
});

test('sem Firebase, a sala vira demonstração local com estado e participantes', async () => {
  const transport = createTransport({ db: null, appId: 'teste' });
  assert.equal(transport.kind, 'local');
  const states = [];
  const lists = [];
  const stopRoom = transport.watchRoom('ABC234', (state) => states.push(state));
  const stopList = transport.watchParticipants('ABC234', (list) => lists.push(list));
  await transport.createRoom({ code: 'ABC234', title: 'Teste', hostUid: 'host', state: { status: 'lobby' } });
  assert.deepEqual(await transport.roomInfo('ABC234'), { exists: true, title: 'Teste' });
  await transport.updateParticipant('ABC234', 'aluno-1', { apelido: 'Átomo Calmo' });
  await transport.updateParticipant('ABC234', 'aluno-1', { pontuacao: 30 });
  await transport.updateRoom('ABC234', { status: 'em-andamento', 'ranking.aluno-1': 30 });
  const lastList = lists.at(-1);
  assert.equal(lastList.length, 1);
  assert.equal(lastList[0].apelido, 'Átomo Calmo');
  assert.equal(lastList[0].pontuacao, 30);
  assert.equal(states.at(-1).status, 'em-andamento');
  assert.equal(states.at(-1).ranking['aluno-1'], 30);
  assert.equal(states.at(-1).hostUid, 'host');
  stopRoom();
  stopList();
  transport.forget('ABC234');
  assert.equal((await transport.roomInfo('ABC234')).exists, false);
});
