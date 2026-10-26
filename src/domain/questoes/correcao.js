// Correção das respostas, por tipo de questão. Tudo local e determinístico.
// Resultado: { status: 'correta' | 'incorreta' | 'invalida', mensagem, erroComum }
// - 'invalida': a resposta não pôde ser lida (número, unidade ou fórmula mal escrita,
//   campos vazios). Não conta como erro: o estudante corrige e envia de novo.
// - erroComum: a descrição do erro comum previsto na questão, quando a resposta bate com ele.
import { parseFormula, sameComposition, checkBalance, ELEMENT_SYMBOLS, FormulaError } from '../formula.js';
import { resolveUnit, unitDimension, convert, parseNumber, DIMENSION_LABELS } from '../unidades.js';

export const QUESTION_TYPES = ['multipla-escolha', 'numerica', 'balanceamento', 'nomenclatura', 'associacao', 'ordenacao', 'tabela-periodica'];

export const TYPE_LABELS = {
  'multipla-escolha': 'Múltipla escolha',
  numerica: 'Resposta numérica',
  balanceamento: 'Balanceamento',
  nomenclatura: 'Nomenclatura',
  associacao: 'Associação',
  ordenacao: 'Ordenação',
  'tabela-periodica': 'Tabela periódica'
};

export const DEFAULT_TOLERANCE = { relativa: 0.01 };

const result = (status, mensagem, erroComum = null) => ({ status, mensagem, erroComum });
const invalid = (mensagem) => result('invalida', mensagem);

// Nomes: sem acentos, minúsculas, espaços e hífens padronizados ("Ácido  Sulfúrico" = "acido sulfurico").
export const normalizeName = (text) => String(text || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().trim()
  .replace(/\s*-\s*/g, '-').replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ');

export const normalizeSymbol = (text) => {
  const clean = String(text || '').trim();
  return clean ? clean[0].toUpperCase() + clean.slice(1).toLowerCase() : '';
};

export const withinTolerance = (value, expected, tolerancia = DEFAULT_TOLERANCE) => {
  if ('absoluta' in tolerancia) return Math.abs(value - expected) <= tolerancia.absoluta + 1e-12;
  return Math.abs(value - expected) <= Math.abs(expected) * tolerancia.relativa + 1e-12;
};

const findCommonError = (question, matches) => (question.errosComuns || []).find((erro) => erro.resposta !== undefined && matches(erro.resposta))?.descricao || null;

// ---------------------------------------------------------------------------
const checkMultipleChoice = (question, answer) => {
  if (!answer) return invalid('Escolha uma alternativa.');
  if (answer === question.gabarito) return result('correta', 'Resposta correta.');
  return result('incorreta', 'Essa não é a alternativa correta.', findCommonError(question, (resposta) => resposta === answer));
};

// Converte a resposta {valor, unidade} para a unidade do gabarito. Devolve número ou objeto de erro.
const readNumeric = (question, answer) => {
  const value = parseNumber(answer?.valor);
  if (Number.isNaN(value)) return { erro: invalid('Não consegui ler o número. Use vírgula ou ponto para decimais, e "× 10^" ou "e" para potências de 10.') };
  const expectedUnit = question.gabarito.unidade;
  if (!expectedUnit) return { valor: value };
  if (!String(answer?.unidade || '').trim()) return { erro: invalid('Informe a unidade da resposta.') };
  const unit = resolveUnit(answer.unidade);
  if (!unit) return { erro: invalid(`Não reconheci a unidade "${answer.unidade}".`) };
  if (unitDimension(unit) !== unitDimension(expectedUnit)) {
    return { erro: result('incorreta', `A unidade "${unit}" mede ${DIMENSION_LABELS[unitDimension(unit)]}, mas a pergunta pede ${DIMENSION_LABELS[unitDimension(expectedUnit)]}.`) };
  }
  // Em questões de conversão, a resposta precisa vir na unidade pedida.
  if (question.gabarito.exigirUnidade && unit !== expectedUnit) {
    return { erro: result('incorreta', `A pergunta pede a resposta em ${expectedUnit}.`) };
  }
  return { valor: convert(value, unit, expectedUnit), unidade: unit };
};

const checkNumeric = (question, answer) => {
  const read = readNumeric(question, answer);
  if (read.erro) return read.erro;
  const { valor, unidade, tolerancia = DEFAULT_TOLERANCE } = question.gabarito;
  if (withinTolerance(read.valor, valor, tolerancia)) {
    const converted = unidade && read.unidade && read.unidade !== unidade ? ` (equivale a ${formatNumber(valor)} ${unidade})` : '';
    return result('correta', `Resposta correta${converted}.`);
  }
  const erroComum = findCommonError(question, (resposta) => {
    const expected = resposta.unidade && unidade ? convert(resposta.valor, resposta.unidade, unidade) : resposta.valor;
    return expected !== null && withinTolerance(read.valor, expected, tolerancia);
  });
  return result('incorreta', 'O valor não confere com o esperado.', erroComum);
};

export const formatNumber = (value) => {
  if (value !== 0 && (Math.abs(value) >= 1e6 || Math.abs(value) < 1e-3)) {
    const [mantissa, exponent] = value.toExponential(3).split('e');
    return `${Number(mantissa).toLocaleString('pt-BR')} × 10^${Number(exponent)}`;
  }
  return Number(value.toPrecision(6)).toLocaleString('pt-BR', { maximumFractionDigits: 6 });
};

const checkBalancing = (question, answer) => {
  const { reagentes, produtos } = question.equacao;
  const total = reagentes.length + produtos.length;
  const values = Array.from({ length: total }, (_, index) => String(answer?.[index] ?? '').trim());
  if (values.some((value) => value === '')) return invalid('Preencha todos os coeficientes (use 1 quando não houver número).');
  const coefs = values.map(Number);
  if (coefs.some((value) => !Number.isInteger(value) || value < 1)) return invalid('Os coeficientes devem ser números inteiros maiores que zero.');
  const check = checkBalance(reagentes, produtos, coefs);
  const erroComum = findCommonError(question, (resposta) => resposta.every((value, index) => value === coefs[index]));
  if (!check.atomosOk) {
    const [first] = check.diferencas;
    return result('incorreta', `Os átomos não se conservam: há ${first.reagentes} de ${first.elemento} nos reagentes e ${first.produtos} nos produtos.`, erroComum);
  }
  if (!check.cargaOk) return result('incorreta', `A carga não se conserva: ${check.carga.reagentes} nos reagentes e ${check.carga.produtos} nos produtos.`, erroComum);
  if (!check.menoresInteiros) return result('incorreta', 'A equação está balanceada, mas os coeficientes devem ser os menores números inteiros possíveis.', erroComum);
  return result('correta', 'Equação balanceada corretamente.');
};

const checkNaming = (question, answer) => {
  const text = String(answer || '').trim();
  if (!text) return invalid(question.direcao === 'nome-para-formula' ? 'Escreva a fórmula.' : 'Escreva o nome.');
  if (question.direcao === 'nome-para-formula') {
    let parsed;
    try {
      parsed = parseFormula(text);
    } catch (error) {
      if (error instanceof FormulaError) return invalid(`Não consegui ler a fórmula: ${error.message}`);
      throw error;
    }
    if (sameComposition(parsed, parseFormula(question.gabarito.formula))) return result('correta', 'Fórmula correta.');
    const erroComum = findCommonError(question, (resposta) => {
      try { return sameComposition(parsed, parseFormula(resposta)); } catch { return false; }
    });
    return result('incorreta', 'A fórmula não corresponde ao nome dado.', erroComum);
  }
  const normalized = normalizeName(text);
  if (question.gabarito.nomes.some((nome) => normalizeName(nome) === normalized)) return result('correta', 'Nome correto.');
  return result('incorreta', 'O nome não corresponde à fórmula.', findCommonError(question, (resposta) => normalizeName(resposta) === normalized));
};

const checkMatching = (question, answer) => {
  const pending = question.itens.filter((item) => !answer?.[item.id]);
  if (pending.length) return invalid('Associe todos os itens antes de responder.');
  const right = question.itens.filter((item) => answer[item.id] === question.gabarito[item.id]).length;
  if (right === question.itens.length) return result('correta', 'Todas as associações estão corretas.');
  return result('incorreta', `${right} de ${question.itens.length} associações corretas.`);
};

const checkOrdering = (question, answer) => {
  if (!Array.isArray(answer) || answer.length !== question.gabarito.length) return invalid('Ordene todos os itens.');
  const right = answer.filter((id, index) => id === question.gabarito[index]).length;
  if (right === answer.length) return result('correta', 'Ordem correta.');
  return result('incorreta', `${right} de ${answer.length} itens na posição certa.`);
};

const checkPeriodicTable = (question, answer) => {
  const symbol = normalizeSymbol(answer);
  if (!symbol) return invalid('Indique um elemento.');
  if (!ELEMENT_SYMBOLS.includes(symbol)) return invalid(`"${String(answer).trim()}" não é o símbolo de um elemento.`);
  if (question.gabarito.simbolos.includes(symbol)) return result('correta', 'Elemento correto.');
  return result('incorreta', 'Esse não é o elemento pedido.', findCommonError(question, (resposta) => resposta === symbol));
};

const CHECKERS = {
  'multipla-escolha': checkMultipleChoice,
  numerica: checkNumeric,
  balanceamento: checkBalancing,
  nomenclatura: checkNaming,
  associacao: checkMatching,
  ordenacao: checkOrdering,
  'tabela-periodica': checkPeriodicTable
};

export const checkAnswer = (question, answer) => {
  const checker = CHECKERS[question?.tipo];
  if (!checker) return invalid('Tipo de questão desconhecido.');
  return checker(question, answer);
};

// Texto curto do gabarito, para mostrar depois da resposta.
export const describeAnswer = (question) => {
  switch (question.tipo) {
    case 'multipla-escolha': {
      const alt = question.alternativas.find((item) => item.id === question.gabarito);
      return `${question.gabarito.toUpperCase()}) ${alt?.texto ?? ''}`;
    }
    case 'numerica': return `${formatNumber(question.gabarito.valor)}${question.gabarito.unidade ? ` ${question.gabarito.unidade}` : ''}`;
    case 'balanceamento': {
      const { reagentes, produtos } = question.equacao;
      const term = (species, index) => `${question.gabarito[index] === 1 ? '' : question.gabarito[index]}${species}`;
      return `\\ce{${reagentes.map(term).join(' + ')} -> ${produtos.map((species, index) => term(species, index + reagentes.length)).join(' + ')}}`;
    }
    case 'nomenclatura': return question.direcao === 'nome-para-formula' ? `\\ce{${question.gabarito.formula}}` : question.gabarito.nomes[0];
    case 'associacao': return question.itens.map((item) => `${item.texto} → ${question.opcoes.find((opcao) => opcao.id === question.gabarito[item.id])?.texto}`).join('; ');
    case 'ordenacao': return question.gabarito.map((id) => question.itens.find((item) => item.id === id)?.texto).join(' → ');
    case 'tabela-periodica': return question.gabarito.simbolos.join(' ou ');
    default: return '';
  }
};
