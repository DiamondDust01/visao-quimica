// Leitura de fórmulas químicas e conferência de balanceamento.
// Sintaxe aceita (a mesma do mhchem, usada no conteúdo):
//   H2O, Ca(OH)2, [Fe(CN)6]^{4-}, CuSO4·5H2O (ou CuSO4*5H2O), SO4^{2-}, SO4^2-, Na^+, Na+, e^-
//   Estado físico no fim é ignorado: CO2(g), NaCl(aq), H2O(l), C(s).
// Símbolos diferenciam maiúsculas e minúsculas: Co (cobalto) não é CO (monóxido de carbono).

export const ELEMENT_SYMBOLS = [
  'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar',
  'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr',
  'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe',
  'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu',
  'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn',
  'Fr', 'Ra', 'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr',
  'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og'
];
const SYMBOLS = new Set(ELEMENT_SYMBOLS);

export class FormulaError extends Error {}

const STATE_SUFFIX = /\((s|l|g|aq|v)\)$/;

// Separa a carga do fim da fórmula. Devolve [corpo, carga].
const splitCharge = (text) => {
  let match = text.match(/\^\{?(\d*)([+-])\}?$/);
  if (match) return [text.slice(0, match.index), Number(match[1] || 1) * (match[2] === '+' ? 1 : -1)];
  match = text.match(/\^\{?([+-])(\d*)\}?$/);
  if (match) return [text.slice(0, match.index), Number(match[2] || 1) * (match[1] === '+' ? 1 : -1)];
  // Sem "^": só um sinal solto no fim (Na+, Cl-). "SO42-" é ambíguo e não é aceito.
  match = text.match(/([A-Za-z)\]])([+-])$/);
  if (match) return [text.slice(0, -1), match[2] === '+' ? 1 : -1];
  if (/[+-]/.test(text)) throw new FormulaError('Para cargas maiores que 1, use ^, como em SO4^2-.');
  return [text, 0];
};

const addCounts = (target, source, factor = 1) => {
  Object.entries(source).forEach(([symbol, count]) => { target[symbol] = (target[symbol] || 0) + count * factor; });
  return target;
};

// Lê uma sequência de grupos até `close` (ou até o fim).
const parseGroup = (text, start, close) => {
  const counts = {};
  let index = start;
  const readNumber = () => {
    const match = text.slice(index).match(/^\d+/);
    if (!match) return 1;
    index += match[0].length;
    const value = Number(match[0]);
    if (value === 0) throw new FormulaError('Índice zero não faz sentido numa fórmula.');
    return value;
  };
  while (index < text.length) {
    const char = text[index];
    if (char === close) return { counts, end: index + 1 };
    if (char === '(' || char === '[') {
      const inner = parseGroup(text, index + 1, char === '(' ? ')' : ']');
      index = inner.end;
      addCounts(counts, inner.counts, readNumber());
      continue;
    }
    if (char === ')' || char === ']') throw new FormulaError('Parêntese ou colchete fechado sem ter sido aberto.');
    const match = text.slice(index).match(/^[A-Z][a-z]?/);
    if (!match) {
      if (/[a-z]/.test(char)) throw new FormulaError(`"${char}" deveria ser maiúscula: todo símbolo de elemento começa com letra maiúscula.`);
      throw new FormulaError(`Caractere inesperado "${char}".`);
    }
    let symbol = match[0];
    // "Co" pode ser cobalto ou C + o (inválido): só aceita o par se for um símbolo.
    if (symbol.length === 2 && !SYMBOLS.has(symbol)) symbol = symbol[0];
    if (!SYMBOLS.has(symbol)) throw new FormulaError(`"${symbol}" não é símbolo de um elemento.`);
    index += symbol.length;
    addCounts(counts, { [symbol]: 1 }, readNumber());
  }
  if (close) throw new FormulaError(`Faltou fechar "${close === ')' ? '(' : '['}".`);
  return { counts, end: index };
};

// Lê uma fórmula. Devolve { elementos: { H: 2, O: 1 }, carga: 0 }.
export const parseFormula = (input) => {
  let text = String(input || '').trim().replace(/\s+/g, '').replace(/\\ce\{(.*)\}$/, '$1');
  if (!text) throw new FormulaError('Fórmula vazia.');
  text = text.replace(STATE_SUFFIX, '');
  if (/^e(\^\{?-\}?|-)$/.test(text)) return { elementos: {}, carga: -1 };
  const [body, carga] = splitCharge(text);
  const elementos = {};
  body.split(/[·*]/).forEach((part, position) => {
    if (!part) throw new FormulaError('Parte vazia na fórmula.');
    const match = part.match(/^(\d+)(.*)$/);
    // Só depois do "·" pode haver coeficiente (CuSO4·5H2O).
    if (match && position === 0) throw new FormulaError('A fórmula não deve começar com número.');
    const multiplier = match ? Number(match[1]) : 1;
    const { counts } = parseGroup(match ? match[2] : part, 0, null);
    addCounts(elementos, counts, multiplier);
  });
  if (!Object.keys(elementos).length) throw new FormulaError('Nenhum elemento encontrado.');
  return { elementos, carga };
};

export const sameComposition = (a, b) => {
  const keys = new Set([...Object.keys(a.elementos), ...Object.keys(b.elementos)]);
  return a.carga === b.carga && [...keys].every((key) => (a.elementos[key] || 0) === (b.elementos[key] || 0));
};

export const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));
export const gcdAll = (values) => values.reduce((acc, value) => gcd(acc, value), 0);

// Confere conservação de átomos e de carga para coeficientes dados.
export const checkBalance = (reagentes, produtos, coeficientes) => {
  const parsed = [...reagentes, ...produtos].map(parseFormula);
  const left = { elementos: {}, carga: 0 };
  const right = { elementos: {}, carga: 0 };
  parsed.forEach((species, index) => {
    const side = index < reagentes.length ? left : right;
    addCounts(side.elementos, species.elementos, coeficientes[index]);
    side.carga += species.carga * coeficientes[index];
  });
  const elementos = [...new Set([...Object.keys(left.elementos), ...Object.keys(right.elementos)])];
  const diferencas = elementos
    .filter((symbol) => (left.elementos[symbol] || 0) !== (right.elementos[symbol] || 0))
    .map((symbol) => ({ elemento: symbol, reagentes: left.elementos[symbol] || 0, produtos: right.elementos[symbol] || 0 }));
  return {
    atomosOk: diferencas.length === 0,
    cargaOk: left.carga === right.carga,
    diferencas,
    carga: { reagentes: left.carga, produtos: right.carga },
    menoresInteiros: gcdAll(coeficientes) === 1
  };
};
