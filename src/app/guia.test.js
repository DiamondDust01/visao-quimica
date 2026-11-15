import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { GUIA_PASSOS, GUIA_SECOES, GUIA_TELAS } from './guia.js';

const sourceFiles = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  if (statSync(path).isDirectory()) return name === 'data' ? [] : sourceFiles(path);
  return /\.jsx$/.test(name) ? [path] : [];
});

test('os passos do guia têm id único, texto, tela válida e seção', () => {
  const ids = GUIA_PASSOS.map((passo) => passo.id);
  assert.equal(new Set(ids).size, ids.length);
  GUIA_PASSOS.forEach((passo) => {
    assert.ok(passo.titulo.length > 3 && passo.texto.length > 20, passo.id);
    assert.ok(GUIA_TELAS.includes(passo.tela), `${passo.id}: tela ${passo.tela}`);
    assert.ok(GUIA_SECOES[passo.tela], `${passo.id}: sem seção`);
  });
  assert.equal(GUIA_PASSOS[0].alvo, null);
  assert.equal(GUIA_PASSOS.at(-1).alvo, null);
});

test('todo alvo do guia existe no código das telas', () => {
  const code = sourceFiles('src').map((file) => readFileSync(file, 'utf8')).join('\n');
  GUIA_PASSOS.filter((passo) => passo.alvo).forEach((passo) => {
    const found = code.includes(`data-guia="${passo.alvo}"`) || code.includes(`guia="${passo.alvo}"`)
      || (passo.alvo.startsWith('btn-') && code.includes('data-guia={`btn-${id}`}'));
    assert.ok(found, `alvo "${passo.alvo}" (passo ${passo.id}) não está em nenhuma tela`);
  });
});
