// Testes das regras do Firestore no emulador. Rode com: npm run test:rules
// (o firebase emulators:exec sobe o emulador, define FIRESTORE_EMULATOR_HOST e roda estes testes).
import test, { after, before, beforeEach } from 'node:test';
import fs from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, getDocs, collection, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

const APP = 'visao-quimica';
const CODE = 'ABC234';
const room = (db) => doc(db, 'artifacts', APP, 'salas', CODE);
const participant = (db, uid) => doc(db, 'artifacts', APP, 'salas', CODE, 'participantes', uid);
const signal = (db, pairId) => doc(db, 'artifacts', APP, 'salas', CODE, 'sinais', pairId);

let env;

before(async () => {
  const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8180').split(':');
  env = await initializeTestEnvironment({
    projectId: 'demo-visao-quimica',
    firestore: { rules: fs.readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host, port: Number(port) }
  });
});

after(async () => {
  await env?.cleanup();
});

// Cada teste parte de uma sala do "host" com "aluno-a" e "aluno-b" dentro.
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(room(db), { codigo: CODE, titulo: 'Turma 1', hostUid: 'host', status: 'lobby' });
    await setDoc(participant(db, 'aluno-a'), { apelido: 'Átomo Calmo', pontuacao: 0 });
    await setDoc(participant(db, 'aluno-b'), { apelido: 'Molécula Atenta', pontuacao: 0 });
  });
});

const as = (uid) => env.authenticatedContext(uid).firestore();

test('sem login nada é lido nem escrito', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(room(db)));
  await assertFails(setDoc(doc(db, 'artifacts', APP, 'users', 'x'), { a: 1 }));
});

test('cada usuário acessa só os próprios dados', async () => {
  await assertSucceeds(setDoc(doc(as('aluno-a'), 'artifacts', APP, 'users', 'aluno-a'), { progresso: {} }));
  await assertFails(getDoc(doc(as('aluno-b'), 'artifacts', APP, 'users', 'aluno-a')));
  await assertFails(setDoc(doc(as('aluno-b'), 'artifacts', APP, 'users', 'aluno-a'), { progresso: {} }));
});

test('criar sala: só como o próprio host e com código válido', async () => {
  const db = as('prof');
  await assertSucceeds(setDoc(doc(db, 'artifacts', APP, 'salas', 'XYZ789'), { codigo: 'XYZ789', hostUid: 'prof' }));
  await assertFails(setDoc(doc(db, 'artifacts', APP, 'salas', 'XYZ788'), { codigo: 'XYZ788', hostUid: 'outro' }));
  await assertFails(setDoc(doc(db, 'artifacts', APP, 'salas', 'abc'), { codigo: 'abc', hostUid: 'prof' }));
  await assertFails(setDoc(doc(db, 'artifacts', APP, 'salas', 'XYZ787'), { codigo: 'OUTRO1', hostUid: 'prof' }));
});

test('só o host escreve a sala e ninguém troca o dono', async () => {
  await assertSucceeds(updateDoc(room(as('host')), { status: 'em-andamento', 'ranking.aluno-a': 10 }));
  await assertFails(updateDoc(room(as('aluno-a')), { status: 'encerrada' }));
  await assertFails(updateDoc(room(as('host')), { hostUid: 'aluno-a' }));
  await assertFails(deleteDoc(room(as('aluno-a'))));
  await assertSucceeds(getDoc(room(as('aluno-a'))));
});

test('participante escreve só o próprio registro, com campos permitidos', async () => {
  await assertSucceeds(setDoc(participant(as('aluno-c'), 'aluno-c'), { apelido: 'Íon Veloz', pontuacao: 0, entrouEm: '2026-10-25T10:00:00Z' }));
  await assertSucceeds(setDoc(participant(as('aluno-a'), 'aluno-a'), { pontuacao: 30, respostas: { q1: { correta: true } }, sessaoP2P: 'abc' }, { merge: true }));
  await assertFails(setDoc(participant(as('aluno-a'), 'aluno-b'), { pontuacao: 999 }, { merge: true }));
  await assertFails(setDoc(participant(as('aluno-a'), 'aluno-a'), { nomeCompleto: 'Fulano' }, { merge: true }));
  await assertFails(setDoc(participant(as('aluno-a'), 'aluno-a'), { apelido: 'x'.repeat(41) }, { merge: true }));
  await assertFails(setDoc(participant(as('aluno-a'), 'aluno-a'), { pontuacao: 'muito' }, { merge: true }));
});

test('pontuação do participante fica entre 0 e 1000', async () => {
  await assertSucceeds(setDoc(participant(as('aluno-a'), 'aluno-a'), { pontuacao: 1000 }, { merge: true }));
  await assertFails(setDoc(participant(as('aluno-a'), 'aluno-a'), { pontuacao: 1001 }, { merge: true }));
  await assertFails(setDoc(participant(as('aluno-a'), 'aluno-a'), { pontuacao: -10 }, { merge: true }));
});

test('resposta gravada com merge, como o app faz', async () => {
  await assertSucceeds(setDoc(participant(as('aluno-a'), 'aluno-a'), { respostas: { 'q-1': { correta: true, pontos: 20 } }, pontuacao: 20, atualizadoEm: '2026-10-26T10:00:00Z' }, { merge: true }));
  await assertSucceeds(setDoc(participant(as('aluno-a'), 'aluno-a'), { concluido: true }, { merge: true }));
});

test('não dá para entrar numa sala que não existe', async () => {
  await assertFails(setDoc(doc(as('aluno-a'), 'artifacts', APP, 'salas', 'NAOEXI', 'participantes', 'aluno-a'), { apelido: 'Átomo Calmo' }));
});

test('participantes e host leem o ranking; quem está fora não', async () => {
  const list = (db) => getDocs(collection(db, 'artifacts', APP, 'salas', CODE, 'participantes'));
  await assertSucceeds(list(as('aluno-a')));
  await assertSucceeds(list(as('host')));
  await assertFails(list(as('intruso')));
  await assertSucceeds(getDoc(participant(as('intruso'), 'intruso')));
});

test('host pode remover participante; outro participante não', async () => {
  await assertFails(deleteDoc(participant(as('aluno-b'), 'aluno-a')));
  await assertSucceeds(deleteDoc(participant(as('host'), 'aluno-a')));
  await assertSucceeds(deleteDoc(participant(as('aluno-b'), 'aluno-b')));
});

test('sinalização WebRTC: só os dois aparelhos do par, dentro da sala', async () => {
  await assertSucceeds(setDoc(signal(as('aluno-a'), 'aluno-a__aluno-b'), { offer: {} }));
  await assertSucceeds(getDoc(signal(as('aluno-b'), 'aluno-a__aluno-b')));
  await assertFails(getDoc(signal(as('host'), 'aluno-a__aluno-b')));
  await assertFails(setDoc(signal(as('intruso'), 'intruso__aluno-b'), { offer: {} }));
});

test('nada fora de artifacts/{appId} é acessível', async () => {
  await assertFails(setDoc(doc(as('aluno-a'), 'qualquer', 'coisa'), { a: 1 }));
  await assertFails(getDoc(doc(as('aluno-a'), 'artifacts', APP, 'outra', 'coisa')));
});

// Contas: endereço = hash de 64 caracteres hexadecimais; conteúdo cifrado com campos fixos.
const ACCOUNT_ID = 'a'.repeat(64);
const account = (db, id = ACCOUNT_ID) => doc(db, 'artifacts', APP, 'contas', id);
const sealed = (extra = {}) => ({ versao: 1, iv: 'AAAAAAAAAAAAAAAA', dados: 'Y2lmcmFkbw==', atualizadoEm: serverTimestamp(), ...extra });

test('conta: quem tem o endereço grava, lê, atualiza e exclui', async () => {
  await assertSucceeds(setDoc(account(as('aparelho-1')), sealed()));
  await assertSucceeds(getDoc(account(as('aparelho-2'))));
  await assertSucceeds(setDoc(account(as('aparelho-2')), sealed({ dados: 'b3V0cm8=' })));
  await assertSucceeds(deleteDoc(account(as('aparelho-1'))));
});

test('conta: sem login, listando ou com endereço fora do formato, nada passa', async () => {
  await assertFails(setDoc(account(env.unauthenticatedContext().firestore()), sealed()));
  await assertFails(getDocs(collection(as('aparelho-1'), 'artifacts', APP, 'contas')));
  await assertFails(setDoc(account(as('aparelho-1'), 'curto'), sealed()));
  await assertFails(setDoc(account(as('aparelho-1'), 'A'.repeat(64)), sealed()));
});

test('conta: só os campos cifrados, com tamanho limitado e data do servidor', async () => {
  await assertFails(setDoc(account(as('aparelho-1')), sealed({ email: 'x@y.z' })));
  await assertFails(setDoc(account(as('aparelho-1')), sealed({ versao: 2 })));
  await assertFails(setDoc(account(as('aparelho-1')), sealed({ dados: 'x'.repeat(500001) })));
  await assertFails(setDoc(account(as('aparelho-1')), sealed({ atualizadoEm: new Date('2020-01-01') })));
  await assertFails(setDoc(account(as('aparelho-1')), sealed({ iv: 123 })));
});
