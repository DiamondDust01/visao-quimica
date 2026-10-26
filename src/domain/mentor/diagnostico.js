// Detecção de padrões de erro por regras. Roda no aparelho, depois de uma resposta errada,
// e complementa os erros comuns previstos em cada questão.
// Devolve uma lista de { padrao, mensagem }; cada padrão aponta para temas de revisão.
import { parseNumber, resolveUnit, convert, unitDimension } from '../unidades.js';
import { parseFormula, checkBalance } from '../formula.js';
import { normalizeName, normalizeSymbol } from '../questoes/correcao.js';
import { groupOf, periodOf } from '../tabelaPeriodica.js';
import { ELEMENT_SYMBOLS } from '../formula.js';

// Padrão → explicação curta e subtemas que ajudam a corrigir.
export const PADROES = {
  'erro-previsto': { nome: 'Erro comum previsto', revisao: [] },
  'conversao-unidade': { nome: 'Conversão de unidades', dica: 'O valor está certo, mas mil vezes maior ou menor: confira as conversões (mL ↔ L, g ↔ kg, mg ↔ g).', revisao: ['fund-unidades'] },
  'potencia-de-10': { nome: 'Potências de 10', dica: 'Os algarismos estão certos, mas a vírgula está no lugar errado: confira as potências de 10.', revisao: ['fund-notacao-cientifica'] },
  'sinal-trocado': { nome: 'Sinal trocado', dica: 'O valor está certo, mas o sinal não: confira a ordem da subtração (final − inicial) ou o sentido do processo.', revisao: ['termo-entalpia-diagramas'] },
  'conta-invertida': { nome: 'Divisão invertida', dica: 'Sua resposta é o inverso do valor esperado: parece que a divisão foi feita ao contrário.', revisao: [] },
  'fator-proporcao': { nome: 'Proporção ou coeficiente', dica: 'Sua resposta difere por um fator inteiro (2, 3 ou 4): confira os coeficientes da equação ou os índices da fórmula.', revisao: ['reac-calculo-estequiometrico'] },
  'kelvin-celsius': { nome: 'Kelvin e Celsius', dica: 'A diferença é de 273: confira a conversão entre °C e K.', revisao: ['fund-unidades', 'gas-variaveis-estado'] },
  'unidade-incompativel': { nome: 'Unidade de outra grandeza', dica: 'A unidade usada mede outra grandeza: releia o que a pergunta pede.', revisao: ['fund-unidades'] },
  'balanceamento-nao-minimo': { nome: 'Coeficientes não simplificados', dica: 'A equação está balanceada, mas dá para dividir todos os coeficientes por um mesmo número.', revisao: ['reac-balanceamento'] },
  'atomos-nao-conservados': { nome: 'Átomos não conservados', dica: 'Conte cada elemento dos dois lados, multiplicando coeficiente por índice.', revisao: ['reac-balanceamento'] },
  'carga-nao-conservada': { nome: 'Carga não conservada', dica: 'Em equações iônicas, a carga total também precisa ser igual dos dois lados.', revisao: ['eletro-balanceamento-redox'] },
  'sufixo-trocado': { nome: 'Sufixos de nomenclatura', dica: 'Só o sufixo está errado: lembre -ídrico/-eto, -ico/-ato e -oso/-ito.', revisao: ['inorg-acidos', 'inorg-sais'] },
  'indices-da-formula': { nome: 'Índices da fórmula', dica: 'Os elementos estão certos, mas as quantidades não: equilibre as cargas dos íons.', revisao: ['lig-ionica'] },
  'grupo-certo-periodo-errado': { nome: 'Período na tabela', dica: 'Você acertou o grupo (coluna), mas não o período (linha).', revisao: ['tab-periodos-grupos'] },
  'periodo-certo-grupo-errado': { nome: 'Grupo na tabela', dica: 'Você acertou o período (linha), mas não o grupo (coluna).', revisao: ['tab-periodos-grupos'] }
};

const near = (a, b, tol = 0.02) => Math.abs(a - b) <= Math.abs(b) * tol + 1e-12;

const numericPatterns = (question, answer) => {
  const value = parseNumber(answer?.valor);
  if (!Number.isFinite(value)) return [];
  const { valor: expected, unidade } = question.gabarito;
  let given = value;
  if (unidade) {
    const unit = resolveUnit(answer?.unidade);
    if (!unit) return [];
    if (unitDimension(unit) !== unitDimension(unidade)) return ['unidade-incompativel'];
    given = convert(value, unit, unidade);
  }
  if (expected === 0) return [];
  if (unitDimension(unidade) === 'temperatura' && (near(given, expected - 273.15, 0.005) || near(given, expected + 273.15, 0.005) || near(given, expected - 273, 0.005) || near(given, expected + 273, 0.005))) return ['kelvin-celsius'];
  if (near(given, -expected)) return ['sinal-trocado'];
  if ([1000, 0.001, 1e6, 1e-6].some((factor) => near(given, expected * factor))) return ['conversao-unidade'];
  if ([10, 100, 0.1, 0.01, 1e4, 1e-4].some((factor) => near(given, expected * factor))) return ['potencia-de-10'];
  if (Math.abs(expected) !== 1 && near(given, 1 / expected)) return ['conta-invertida'];
  if ([2, 3, 4, 1 / 2, 1 / 3, 1 / 4].some((factor) => near(given, expected * factor))) return ['fator-proporcao'];
  return [];
};

const balancingPatterns = (question, answer) => {
  const coefs = (answer || []).map(Number);
  const { reagentes, produtos } = question.equacao;
  if (coefs.length !== reagentes.length + produtos.length || coefs.some((value) => !Number.isInteger(value) || value < 1)) return [];
  const check = checkBalance(reagentes, produtos, coefs);
  if (!check.atomosOk) return ['atomos-nao-conservados'];
  if (!check.cargaOk) return ['carga-nao-conservada'];
  if (!check.menoresInteiros) return ['balanceamento-nao-minimo'];
  return [];
};

// Troca só de sufixo: "acido sulfuroso" × "acido sulfurico", "sulfito" × "sulfato".
const SUFFIXES = /(idrico|ico|oso|eto|ato|ito)\b/g;
const namingPatterns = (question, answer) => {
  if (question.direcao === 'formula-para-nome') {
    const given = normalizeName(answer).replace(SUFFIXES, '#');
    return question.gabarito.nomes.some((nome) => normalizeName(nome).replace(SUFFIXES, '#') === given) ? ['sufixo-trocado'] : [];
  }
  try {
    const given = parseFormula(answer);
    const expected = parseFormula(question.gabarito.formula);
    const sameElements = Object.keys(given.elementos).sort().join() === Object.keys(expected.elementos).sort().join();
    return sameElements ? ['indices-da-formula'] : [];
  } catch {
    return [];
  }
};

const tablePatterns = (question, answer) => {
  const symbol = normalizeSymbol(answer);
  const z = ELEMENT_SYMBOLS.indexOf(symbol) + 1;
  if (!z) return [];
  const targets = question.gabarito.simbolos.map((item) => ELEMENT_SYMBOLS.indexOf(item) + 1);
  if (targets.some((target) => groupOf(target) !== null && groupOf(target) === groupOf(z))) return ['grupo-certo-periodo-errado'];
  if (targets.some((target) => periodOf(target) === periodOf(z))) return ['periodo-certo-grupo-errado'];
  return [];
};

const DETECTORS = { numerica: numericPatterns, balanceamento: balancingPatterns, nomenclatura: namingPatterns, 'tabela-periodica': tablePatterns };

// result: saída de checkAnswer. Só diagnostica respostas incorretas.
export const diagnose = (question, answer, result) => {
  if (result?.status !== 'incorreta') return [];
  const found = [];
  if (result.erroComum) found.push({ padrao: 'erro-previsto', mensagem: result.erroComum });
  const detector = DETECTORS[question.tipo];
  // Quando o erro previsto já explica a resposta, as regras genéricas não acrescentam nada.
  if (detector && !result.erroComum) {
    detector(question, answer).forEach((padrao) => found.push({ padrao, mensagem: PADROES[padrao].dica }));
  }
  return found;
};
