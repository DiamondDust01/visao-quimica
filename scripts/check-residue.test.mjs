import test from 'node:test';
import assert from 'node:assert/strict';
import { findResidue } from './check-residue.mjs';

test('detecta os termos do projeto de origem em código, comentários e chaves', () => {
  const sample = [
    "const KEY = 'obi-quest-theme';",
    '// Modo Pensa Comigo',
    'Simulador da OBI',
    'Treino de programação e algoritmos',
    "collection(db, 'pensaComigoParticipants')"
  ].join('\n');
  assert.deepEqual(findResidue(sample).map((hit) => hit.line), [1, 2, 3, 4, 4, 5]);
});

test('não acusa palavras que só contêm as letras, nem a etapa Olimpíadas de Química', () => {
  assert.deepEqual(findResidue('mobile, automobilismo, Olimpíadas de Química, conhecimento'), []);
  assert.equal(findResidue('Olimpíada de Informática').length > 0, true);
});
