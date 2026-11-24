import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { GUIA_MENTOR, GUIA_PASSOS, GUIA_SECOES, GUIA_TELAS, montarGuia } from './guia.js';
import { TABS } from './navigation.js';

const sourceFiles = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  if (statSync(path).isDirectory()) return name === 'data' ? [] : sourceFiles(path);
  return /\.jsx$/.test(name) ? [path] : [];
});

const checkSteps = (passos, nome) => {
  const ids = passos.map((passo) => passo.id);
  assert.equal(new Set(ids).size, ids.length, `${nome}: ids repetidos`);
  passos.forEach((passo) => {
    assert.ok(passo.titulo.length > 3 && passo.texto.length > 20, passo.id);
    if (passo.tela === null) {
      assert.ok(passo.secao, `${passo.id}: passo sem tela precisa de seção própria`);
    } else {
      assert.ok(GUIA_TELAS.includes(passo.tela), `${passo.id}: tela ${passo.tela}`);
      assert.ok(passo.secao || GUIA_SECOES[passo.tela], `${passo.id}: sem seção`);
    }
  });
  assert.equal(passos.at(-1).alvo, null, `${nome}: o último passo é um resumo no centro`);
};

test('os passos do guia têm id único, texto, tela válida e seção', () => {
  checkSteps(GUIA_PASSOS, 'guia');
  assert.equal(GUIA_PASSOS[0].alvo, null);
});

test('sem o Mentor liberado, o guia não passa pelo Laboratório e explica quando ele aparece', () => {
  const semMentor = montarGuia({ mentorLiberado: false });
  checkSteps(semMentor, 'guia sem Mentor');
  assert.ok(!semMentor.some((passo) => passo.tela === 'laboratorio'));
  const abas = semMentor.find((passo) => passo.id === 'abas');
  assert.match(abas.texto, /aparece sozinho/);
  assert.ok(!('semMentor' in abas));

  const comMentor = montarGuia({ mentorLiberado: true });
  assert.equal(comMentor.length, GUIA_PASSOS.length);
  assert.ok(comMentor.some((passo) => passo.tela === 'laboratorio'));
  assert.equal(comMentor.find((passo) => passo.id === 'abas').titulo, 'Os quatro módulos');
});

test('o tutorial do Mentor começa pela aba nova e termina no Laboratório', () => {
  checkSteps(GUIA_MENTOR, 'tutorial do Mentor');
  assert.equal(GUIA_MENTOR[0].tela, null);
  assert.equal(GUIA_MENTOR[0].alvo, 'aba-laboratorio');
  assert.ok(GUIA_MENTOR.slice(1).every((passo) => passo.tela === 'laboratorio'));
});

test('todo alvo do guia existe no código das telas', () => {
  const code = sourceFiles('src').map((file) => readFileSync(file, 'utf8')).join('\n');
  // As abas recebem data-guia={`aba-${item.id}`} na barra de cima e na de baixo.
  const abaAlvos = code.includes('data-guia={`aba-${item.id}`}') ? TABS.map((tab) => `aba-${tab.id}`) : [];
  [...GUIA_PASSOS, ...GUIA_MENTOR].filter((passo) => passo.alvo).forEach((passo) => {
    const found = abaAlvos.includes(passo.alvo)
      || [`data-guia="${passo.alvo}"`, `guia="${passo.alvo}"`, `'data-guia': '${passo.alvo}'`].some((marca) => code.includes(marca));
    assert.ok(found, `alvo "${passo.alvo}" (passo ${passo.id}) não está em nenhuma tela`);
  });
});
