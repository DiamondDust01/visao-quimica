// Unidades aceitas nas respostas numéricas, agrupadas por grandeza.
// Cada unidade tem o fator para a unidade de base da grandeza (e deslocamento, na temperatura).
// A resposta pode vir em qualquer unidade da mesma grandeza: 500 mL vale como 0,5 L.

const U = (dimensao, fator, aliases, offset = 0) => ({ dimensao, fator, aliases, offset });

export const DIMENSION_LABELS = {
  massa: 'massa',
  volume: 'volume',
  quantidade: 'quantidade de matéria',
  'concentracao-molar': 'concentração em mol/L',
  'massa-por-volume': 'massa por volume (concentração ou densidade)',
  fracao: 'fração (%, ppm)',
  pressao: 'pressão',
  temperatura: 'temperatura',
  energia: 'energia',
  'energia-molar': 'energia por mol',
  'massa-molar': 'massa molar',
  'massa-atomica': 'massa atômica',
  tempo: 'tempo',
  carga: 'carga elétrica',
  corrente: 'corrente elétrica',
  potencial: 'potencial elétrico',
  comprimento: 'comprimento',
  'velocidade-reacao': 'velocidade de reação',
  'quantidade-por-tempo': 'quantidade de matéria por tempo',
  'massa-por-tempo': 'massa por tempo',
  'volume-molar': 'volume molar',
  'calor-especifico': 'calor específico',
  entidades: 'número de entidades'
};

// Unidade canônica → definição. A unidade canônica é a usada no gabarito.
export const UNITS = {
  kg: U('massa', 1000, []), g: U('massa', 1, []), mg: U('massa', 1e-3, []), 'µg': U('massa', 1e-6, ['ug', 'μg']), t: U('massa', 1e6, []),
  L: U('volume', 1, ['l']), mL: U('volume', 1e-3, ['ml']), 'cm³': U('volume', 1e-3, ['cm3']), 'dm³': U('volume', 1, ['dm3']), 'm³': U('volume', 1000, ['m3']), 'µL': U('volume', 1e-6, ['uL', 'μL']),
  mol: U('quantidade', 1, []), mmol: U('quantidade', 1e-3, []),
  'mol/L': U('concentracao-molar', 1, ['mol·L⁻¹', 'mol.L-1', 'mol L-1', 'M', 'mol/dm3', 'mol/dm³']), 'mmol/L': U('concentracao-molar', 1e-3, ['mM']),
  'g/L': U('massa-por-volume', 1, ['g·L⁻¹', 'g.L-1', 'kg/m3', 'kg/m³']), 'mg/L': U('massa-por-volume', 1e-3, []),
  'g/mL': U('massa-por-volume', 1000, ['g/cm3', 'g/cm³', 'kg/L']), 'g/cm³': null,
  '%': U('fracao', 0.01, ['por cento']), ppm: U('fracao', 1e-6, []), ppb: U('fracao', 1e-9, []),
  atm: U('pressao', 1, []), Pa: U('pressao', 1 / 101325, []), kPa: U('pressao', 1 / 101.325, []), mmHg: U('pressao', 1 / 760, ['torr', 'Torr']), bar: U('pressao', 1 / 1.01325, []),
  K: U('temperatura', 1, ['kelvin']), '°C': U('temperatura', 1, ['ºC', 'oC', 'graus Celsius'], 273.15),
  J: U('energia', 1, []), kJ: U('energia', 1000, ['KJ']), cal: U('energia', 4.184, []), kcal: U('energia', 4184, ['Kcal']),
  'J/mol': U('energia-molar', 1, ['J·mol⁻¹']), 'kJ/mol': U('energia-molar', 1000, ['kJ·mol⁻¹', 'kJ.mol-1', 'KJ/mol']), 'kcal/mol': U('energia-molar', 4184, []), 'cal/mol': U('energia-molar', 4.184, []),
  'g/mol': U('massa-molar', 1, ['g·mol⁻¹', 'g.mol-1', 'g mol-1']), 'kg/mol': U('massa-molar', 1000, []),
  u: U('massa-atomica', 1, ['Da', 'uma']),
  s: U('tempo', 1, ['seg', 'segundos']), min: U('tempo', 60, ['minutos']), h: U('tempo', 3600, ['horas', 'hora']), dia: U('tempo', 86400, ['dias']), ano: U('tempo', 365.25 * 86400, ['anos']),
  C: U('carga', 1, ['coulomb', 'coulombs']),
  A: U('corrente', 1, ['ampère', 'amperes']), mA: U('corrente', 1e-3, []),
  V: U('potencial', 1, ['volt', 'volts']), mV: U('potencial', 1e-3, []),
  m: U('comprimento', 1, []), cm: U('comprimento', 1e-2, []), mm: U('comprimento', 1e-3, []), nm: U('comprimento', 1e-9, []), pm: U('comprimento', 1e-12, []), 'Å': U('comprimento', 1e-10, []),
  'mol/(L·s)': U('velocidade-reacao', 1, ['mol/(L*s)', 'mol/L·s', 'mol/L.s', 'mol/L/s', 'mol·L⁻¹·s⁻¹']),
  'mol/(L·min)': U('velocidade-reacao', 1 / 60, ['mol/(L*min)', 'mol/L·min', 'mol/L.min', 'mol/L/min', 'mol·L⁻¹·min⁻¹']),
  'mol/s': U('quantidade-por-tempo', 1, []), 'mol/min': U('quantidade-por-tempo', 1 / 60, []), 'mol/h': U('quantidade-por-tempo', 1 / 3600, []),
  'g/s': U('massa-por-tempo', 1, []), 'g/min': U('massa-por-tempo', 1 / 60, []), 'g/h': U('massa-por-tempo', 1 / 3600, []),
  'L/mol': U('volume-molar', 1, ['L·mol⁻¹']),
  'J/(g·°C)': U('calor-especifico', 1, ['J/(g·K)', 'J/g°C', 'J/(g*°C)', 'J/g.°C']), 'cal/(g·°C)': U('calor-especifico', 4.184, ['cal/g°C', 'cal/(g*°C)', 'cal/g.°C']),
  'moléculas': U('entidades', 1, ['moleculas']), 'átomos': U('entidades', 1, ['atomos']), 'íons': U('entidades', 1, ['ions']),
  'partículas': U('entidades', 1, ['particulas']), 'elétrons': U('entidades', 1, ['eletrons'])
};
// g/cm³ é só um apelido de g/mL; fica fora da lista de canônicas.
delete UNITS['g/cm³'];

const normalize = (text) => String(text || '').trim().replace(/\s+/g, ' ').replace(/µ|μ/g, 'µ');

const LOOKUP = new Map();
const LOOKUP_INSENSITIVE = new Map();
Object.entries(UNITS).forEach(([canonical, def]) => {
  [canonical, ...def.aliases].forEach((alias) => {
    const key = normalize(alias);
    LOOKUP.set(key, canonical);
    const lower = key.toLowerCase();
    // Sem distinção de maiúsculas só quando não há ambiguidade (m e M, por exemplo, são diferentes).
    LOOKUP_INSENSITIVE.set(lower, LOOKUP_INSENSITIVE.has(lower) && LOOKUP_INSENSITIVE.get(lower) !== canonical ? null : canonical);
  });
});

// Devolve a unidade canônica, ou null se não for reconhecida.
export const resolveUnit = (text) => {
  const key = normalize(text).replace(/ ?\/ ?/g, '/');
  if (!key) return null;
  if (LOOKUP.has(key)) return LOOKUP.get(key);
  return LOOKUP_INSENSITIVE.get(key.toLowerCase()) || null;
};

export const unitDimension = (canonical) => UNITS[canonical]?.dimensao || null;

// Converte um valor entre duas unidades da mesma grandeza.
export const convert = (value, from, to) => {
  const a = UNITS[from];
  const b = UNITS[to];
  if (!a || !b || a.dimensao !== b.dimensao) return null;
  return (value * a.fator + a.offset - b.offset) / b.fator;
};

export const unitsOfDimension = (dimensao) => Object.keys(UNITS).filter((key) => UNITS[key].dimensao === dimensao);

// Lê números escritos como estudantes escrevem: "0,5", "1.250,5", "6,02 × 10^23", "6,02x10²³", "1,2e-3".
const SUPERSCRIPTS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
export const parseNumber = (input) => {
  let text = String(input ?? '').trim().replace(/\s+/g, '').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g, (char) => SUPERSCRIPTS[char]).replace(/−/g, '-');
  if (!text) return NaN;
  text = text.replace(/(?:[x×*·]10\^?|[x×*·]10(?=[-+]?\d))/i, 'e');
  // Vírgula decimal; ponto como separador de milhar só quando há vírgula também.
  if (text.includes(',')) text = text.replace(/\./g, '').replace(',', '.');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(text)) return NaN;
  return Number(text);
};
