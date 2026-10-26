// Massa molar a partir de uma fórmula, com as massas atômicas de src/data/elementos.json.
// A carga de íons não altera a conta (a massa dos elétrons é desprezível nesse nível).
import { parseFormula } from './formula.js';

// elementos: lista de src/data/elementos.json. Devolve { total, parcelas, aproximada, carga }.
// `aproximada` é true se algum elemento não tem peso atômico padrão (radioativo) e entrou
// com o número de massa do isótopo mais estável.
export const molarMass = (formula, elementos) => {
  const bySymbol = new Map(elementos.map((element) => [element.simbolo, element]));
  const parsed = parseFormula(formula);
  const parcelas = Object.entries(parsed.elementos)
    .map(([simbolo, quantidade]) => {
      const element = bySymbol.get(simbolo);
      return {
        simbolo,
        nome: element.nome,
        quantidade,
        massaAtomica: element.massaAtomica,
        massaAtomicaTexto: element.massaAtomicaTexto,
        subtotal: quantidade * element.massaAtomica,
        padrao: element.massaAtomicaTipo === 'peso-atomico-padrao'
      };
    })
    .sort((a, b) => bySymbol.get(a.simbolo).numeroAtomico - bySymbol.get(b.simbolo).numeroAtomico);
  return {
    total: parcelas.reduce((sum, parcela) => sum + parcela.subtotal, 0),
    parcelas,
    aproximada: parcelas.some((parcela) => !parcela.padrao),
    carga: parsed.carga
  };
};
