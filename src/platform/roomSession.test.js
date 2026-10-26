import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRoomCode, normalizeRoomCode, isValidRoomCode, parseRoomParam, resolveJoinBaseUrl, buildJoinUrl, toCsv
} from './roomSession.js';

test('código da sala tem 6 caracteres sem símbolos confundíveis', () => {
  const code = createRoomCode(() => 0.5);
  assert.equal(code.length, 6);
  assert.ok(isValidRoomCode(code));
  assert.doesNotMatch(createRoomCode(Math.random), /[01OIL]/);
  assert.equal(normalizeRoomCode(' ab-c 23x9 '), 'ABC23X');
});

test('parâmetro ?sala= e link de entrada', () => {
  assert.equal(parseRoomParam('?sala=abc234'), 'ABC234');
  assert.equal(parseRoomParam('?sala=12'), null);
  assert.equal(parseRoomParam(''), null);
  assert.equal(buildJoinUrl('https://exemplo.app/', 'ABC234'), 'https://exemplo.app/?sala=ABC234');
  assert.equal(buildJoinUrl('https://exemplo.app/', 'curto'), '');
});

test('base do QR: hospedagem configurada, endereço local e app instalado', () => {
  assert.deepEqual(resolveJoinBaseUrl({ configuredUrl: 'https://exemplo.app/' }), { baseUrl: 'https://exemplo.app/', warning: '' });
  assert.match(resolveJoinBaseUrl({ configuredUrl: 'http://exemplo.app/' }).warning, /HTTPS/);
  const local = resolveJoinBaseUrl({ location: { protocol: 'http:', origin: 'http://localhost:3000', pathname: '/', hostname: 'localhost' } });
  assert.equal(local.baseUrl, 'http://localhost:3000/');
  assert.match(local.warning, /só funciona neste computador/);
  const installed = resolveJoinBaseUrl({ location: { protocol: 'file:', origin: 'null', pathname: '/index.html', hostname: '' } });
  assert.equal(installed.baseUrl, '');
});

test('CSV com BOM, CRLF e aspas escapadas', () => {
  assert.equal(toCsv([['a', 'b"c'], [1, null]]), '﻿"a","b""c"\r\n"1",""');
});
