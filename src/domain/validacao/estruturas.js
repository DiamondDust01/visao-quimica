// Validação das estruturas (SMILES) da galeria e das questões.
import { analisarSmiles, formulaConfere } from '../estrutura.js';
import { ID_PATTERN } from './taxonomia.js';

const isText = (value) => typeof value === 'string' && value.trim().length > 0;

// Confere um par SMILES + fórmula. Devolve a lista de erros.
const checkPair = (SmilesDrawer, item, where) => {
  const errors = [];
  if (!isText(item?.smiles)) return [`${where}: "smiles" vazio.`];
  if (!isText(item.formula)) errors.push(`${where}: "formula" vazia.`);
  const result = analisarSmiles(SmilesDrawer, item.smiles);
  if (result.erro) return [...errors, `${where}: ${result.erro} (${item.smiles})`];
  if (isText(item.formula) && !formulaConfere(result.formula, item.formula)) {
    errors.push(`${where}: a fórmula informada (${item.formula}) não confere com a do SMILES (${result.formula}).`);
  }
  return errors;
};

// galeria: conteúdo de src/data/estruturas.json; questoes: banco de questões completo.
export const validateStructures = ({ SmilesDrawer, galeria, questoes }) => {
  const errors = [];
  const ids = new Set();
  (galeria?.estruturas || []).forEach((item, position) => {
    const where = `galeria[${position}] "${item?.id}"`;
    if (!ID_PATTERN.test(item?.id || '')) errors.push(`${where}: id inválido.`);
    if (ids.has(item?.id)) errors.push(`${where}: id repetido.`);
    ids.add(item?.id);
    if (!isText(item?.nome)) errors.push(`${where}: "nome" vazio.`);
    if (!isText(item?.descricao)) errors.push(`${where}: "descricao" vazia.`);
    errors.push(...checkPair(SmilesDrawer, item, where));
  });
  if (!(galeria?.estruturas || []).length) errors.push('galeria: nenhuma estrutura.');

  questoes.filter((question) => question.estrutura !== undefined).forEach((question) => {
    const where = `questão "${question.id}"`;
    if (question.estrutura === null || typeof question.estrutura !== 'object') {
      errors.push(`${where}: "estrutura" deve ser um objeto { smiles, formula }.`);
      return;
    }
    errors.push(...checkPair(SmilesDrawer, question.estrutura, where));
  });
  return errors;
};
