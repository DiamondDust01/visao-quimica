import test from 'node:test';
import assert from 'node:assert/strict';
import { drawNickname, isDrawnNickname, NICKNAME_COMBINATIONS, buildNickname } from './nicknames.js';

test('apelido sorteado combina termo e adjetivo com concordância', () => {
  assert.equal(buildNickname({ name: 'Molécula', gender: 'f' }, { m: 'Curioso', f: 'Curiosa' }), 'Molécula Curiosa');
  assert.equal(buildNickname({ name: 'Átomo', gender: 'm' }, { m: 'Curioso', f: 'Curiosa' }), 'Átomo Curioso');
  assert.ok(NICKNAME_COMBINATIONS >= 300);
});

test('novo sorteio evita repetir o apelido anterior', () => {
  const first = drawNickname(() => 0);
  assert.notEqual(drawNickname(() => 0, first), first);
});

test('somente apelidos do sorteio são aceitos', () => {
  assert.ok(isDrawnNickname(drawNickname()));
  assert.equal(isDrawnNickname('Maria Silva'), false);
});
