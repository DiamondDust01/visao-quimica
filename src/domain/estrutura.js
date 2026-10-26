// Estruturas moleculares a partir de SMILES, com a biblioteca smiles-drawer.
// A biblioteca chega como parâmetro: o app a carrega só quando uma estrutura aparece na tela,
// e os scripts de validação a importam diretamente.
import { parseFormula, sameComposition } from './formula.js';

const describeError = (error) => {
  const column = error?.location?.start?.column;
  if (column) return `SMILES inválido perto do caractere ${column}.`;
  if (/parenthes/i.test(error?.message || '')) return 'SMILES inválido: os parênteses não fecham.';
  if (/ring/i.test(error?.message || '')) return 'SMILES inválido: um anel foi aberto e não foi fechado.';
  return 'SMILES inválido.';
};

// A smiles-drawer aceita anel sem fechamento ("C1CC") e ligação sem átomo no fim ("C="),
// e desenha outra molécula. Esses dois casos são barrados antes.
const checkClosures = (texto) => {
  const semColchetes = texto.replace(/\[[^\]]*\]/g, 'X');
  const counts = new Map();
  for (const label of semColchetes.match(/%\d\d|\d/g) || []) counts.set(label, (counts.get(label) || 0) + 1);
  const aberto = [...counts].find(([, count]) => count % 2 === 1);
  if (aberto) return `SMILES inválido: o anel ${aberto[0].replace('%', '')} foi aberto e não foi fechado.`;
  if (/[-=#$:/\\]($|\)|\.)/.test(semColchetes)) return 'SMILES inválido: há uma ligação sem átomo depois dela.';
  return null;
};

// Lê um SMILES. Devolve { arvore, formula } (fórmula molecular na ordem de Hill, como "C2H6O")
// ou { erro } com uma mensagem em português.
export const analisarSmiles = (SmilesDrawer, smiles) => {
  const texto = String(smiles || '').trim();
  if (!texto) return { erro: 'Digite um SMILES.' };
  const fechamento = checkClosures(texto);
  if (fechamento) return { erro: fechamento };
  try {
    const arvore = SmilesDrawer.Parser.parse(texto, {});
    const drawer = new SmilesDrawer.SvgDrawer({});
    drawer.preprocessor.initDraw(arvore, 'light', true, []);
    drawer.preprocessor.processGraph();
    return { arvore, formula: drawer.preprocessor.getMolecularFormula() };
  } catch (error) {
    return { erro: describeError(error) };
  }
};

// A fórmula tirada do SMILES tem a mesma composição que a fórmula informada?
export const formulaConfere = (formulaDoSmiles, formulaInformada) => {
  try {
    return sameComposition(parseFormula(formulaDoSmiles), parseFormula(formulaInformada));
  } catch {
    return false;
  }
};
