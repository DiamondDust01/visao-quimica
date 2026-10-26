import test from 'node:test';
import assert from 'node:assert/strict';
import SmilesDrawer from 'smiles-drawer';
import { analisarSmiles, formulaConfere } from './estrutura.js';
import { validateStructures } from './validacao/estruturas.js';
import galeria from '../data/estruturas.json' with { type: 'json' };

test('SMILES vira fórmula molecular com hidrogênios implícitos', () => {
  assert.equal(analisarSmiles(SmilesDrawer, 'CCO').formula, 'C2H6O');
  assert.equal(analisarSmiles(SmilesDrawer, 'c1ccccc1').formula, 'C6H6');
  assert.equal(analisarSmiles(SmilesDrawer, 'CC(=O)O').formula, 'C2H4O2');
});

test('SMILES inválido devolve erro em português, sem lançar exceção', () => {
  assert.match(analisarSmiles(SmilesDrawer, 'C1CC(').erro, /SMILES inválido/);
  assert.equal(analisarSmiles(SmilesDrawer, '  ').erro, 'Digite um SMILES.');
});

test('fórmula confere pela composição, não pela ordem dos elementos', () => {
  assert.ok(formulaConfere('C2H6O', 'C2H5OH'));
  assert.ok(!formulaConfere('C2H6O', 'C2H4O'));
  assert.ok(!formulaConfere('C2H6O', 'fórmula ruim'));
});

test('a galeria do app é válida', () => {
  assert.deepEqual(validateStructures({ SmilesDrawer, galeria, questoes: [] }), []);
});

test('validador acusa fórmula que não confere e SMILES quebrado nas questões', () => {
  const questoes = [
    { id: 'q-ok', estrutura: { smiles: 'CCO', formula: 'C2H6O' } },
    { id: 'q-formula', estrutura: { smiles: 'CCO', formula: 'C2H4O' } },
    { id: 'q-smiles', estrutura: { smiles: 'C1CC', formula: 'C3H8' } },
    { id: 'q-tipo', estrutura: 'CCO' }
  ];
  const errors = validateStructures({ SmilesDrawer, galeria, questoes });
  assert.equal(errors.length, 3);
  assert.ok(errors.some((error) => error.includes('q-formula') && error.includes('não confere')));
  assert.ok(errors.some((error) => error.includes('q-smiles') && error.includes('SMILES inválido')));
  assert.ok(errors.some((error) => error.includes('q-tipo')));
});
