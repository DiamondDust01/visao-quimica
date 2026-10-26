// Validação do banco de questões. Devolve { erros, avisos }.
// Erros quebram `npm run validate:content`; avisos são para revisão humana.
import { QUESTION_TYPES, checkAnswer, withinTolerance } from '../questoes/correcao.js';
import { parseFormula, checkBalance, ELEMENT_SYMBOLS } from '../formula.js';
import { UNITS, convert } from '../unidades.js';
import { evaluate } from '../expressao.js';
import { ID_PATTERN } from './taxonomia.js';

// Mínimo de questões por subtema de Ensino Fundamental II e Ensino Médio (meta futura: 5).
export const MIN_QUESTOES_EF_EM = 3;
export const MIN_QUESTOES_OUTROS = 1;
const EF_EM = /^(ef|em)-/;

// Termos que pedem um olhar humano (podem aparecer de forma legítima, por isso são avisos).
export const SENSITIVE_TERMS = /\b(explosiv\w*|detona\w*|sintetizar|síntese caseira|droga\w*|entorpecente\w*|veneno\w*|arma\w* química\w*)\b/i;

const isText = (value) => typeof value === 'string' && value.trim().length > 0;
const isRecord = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const validateOptions = (list, label, errors, where) => {
  if (!Array.isArray(list) || list.length === 0) { errors.push(`${where}: "${label}" precisa ser uma lista não vazia.`); return new Set(); }
  const ids = new Set();
  list.forEach((item, index) => {
    if (!isRecord(item) || !isText(item.id) || !isText(item.texto)) errors.push(`${where}: ${label}[${index}] precisa de "id" e "texto".`);
    else if (ids.has(item.id)) errors.push(`${where}: ${label} com id repetido "${item.id}".`);
    ids.add(item?.id);
  });
  const texts = list.map((item) => String(item?.texto || '').trim().toLowerCase());
  if (new Set(texts).size !== texts.length) errors.push(`${where}: ${label} com texto repetido.`);
  return ids;
};

const TYPE_VALIDATORS = {
  'multipla-escolha': (q, errors, where) => {
    const ids = validateOptions(q.alternativas, 'alternativas', errors, where);
    if (q.alternativas?.length < 3 || q.alternativas?.length > 5) errors.push(`${where}: múltipla escolha precisa de 3 a 5 alternativas.`);
    if (!ids.has(q.gabarito)) errors.push(`${where}: gabarito "${q.gabarito}" não é uma das alternativas.`);
    (q.errosComuns || []).forEach((erro) => {
      if (erro.resposta === undefined) return;
      if (!ids.has(erro.resposta)) errors.push(`${where}: erro comum aponta para alternativa inexistente "${erro.resposta}".`);
      if (erro.resposta === q.gabarito) errors.push(`${where}: erro comum aponta para a alternativa correta.`);
    });
  },
  numerica: (q, errors, where) => {
    const g = q.gabarito;
    if (!isRecord(g) || !Number.isFinite(g.valor)) { errors.push(`${where}: gabarito numérico precisa de "valor" finito.`); return; }
    if (g.unidade !== null && !UNITS[g.unidade]) errors.push(`${where}: unidade "${g.unidade}" desconhecida (use a forma canônica de src/domain/unidades.js ou null).`);
    if (g.exigirUnidade !== undefined && (typeof g.exigirUnidade !== 'boolean' || (g.exigirUnidade && !g.unidade))) errors.push(`${where}: "exigirUnidade" deve ser booleano e só faz sentido com unidade.`);
    if (g.tolerancia !== undefined) {
      // absoluta: 0 é resposta exata (contagens, como número de nêutrons).
      const ok = isRecord(g.tolerancia) && (('relativa' in g.tolerancia && g.tolerancia.relativa > 0 && g.tolerancia.relativa <= 0.1) || ('absoluta' in g.tolerancia && g.tolerancia.absoluta >= 0));
      if (!ok) errors.push(`${where}: tolerância deve ser { relativa: >0 e ≤0,1 } ou { absoluta: ≥0 }.`);
    }
    if (!isText(q.verificacao)) errors.push(`${where}: questão numérica precisa de "verificacao" (expressão que recalcula o gabarito).`);
    else {
      try {
        const value = evaluate(q.verificacao);
        if (!withinTolerance(value, g.valor, g.tolerancia)) errors.push(`${where}: "verificacao" dá ${value}, mas o gabarito é ${g.valor}.`);
      } catch (error) {
        errors.push(`${where}: "verificacao" inválida: ${error.message}`);
      }
    }
    (q.errosComuns || []).forEach((erro) => {
      if (erro.resposta === undefined) return;
      if (!isRecord(erro.resposta) || !Number.isFinite(erro.resposta.valor)) { errors.push(`${where}: erro comum numérico precisa de { valor, unidade }.`); return; }
      const unit = erro.resposta.unidade ?? g.unidade;
      if (unit && g.unidade && convert(1, unit, g.unidade) === null) errors.push(`${where}: erro comum com unidade incompatível "${unit}".`);
      const asExpected = unit && g.unidade ? convert(erro.resposta.valor, unit, g.unidade) : erro.resposta.valor;
      if (asExpected !== null && withinTolerance(asExpected, g.valor, g.tolerancia)) errors.push(`${where}: erro comum coincide com o gabarito.`);
    });
  },
  balanceamento: (q, errors, where) => {
    const eq = q.equacao;
    if (!isRecord(eq) || !Array.isArray(eq.reagentes) || !Array.isArray(eq.produtos) || !eq.reagentes.length || !eq.produtos.length) {
      errors.push(`${where}: "equacao" precisa de reagentes e produtos.`);
      return;
    }
    const total = eq.reagentes.length + eq.produtos.length;
    if (!Array.isArray(q.gabarito) || q.gabarito.length !== total || !q.gabarito.every((value) => Number.isInteger(value) && value > 0)) {
      errors.push(`${where}: gabarito deve ter ${total} coeficientes inteiros positivos.`);
      return;
    }
    try {
      const check = checkBalance(eq.reagentes, eq.produtos, q.gabarito);
      if (!check.atomosOk) errors.push(`${where}: gabarito não conserva átomos (${check.diferencas.map((d) => `${d.elemento}: ${d.reagentes}≠${d.produtos}`).join(', ')}).`);
      if (!check.cargaOk) errors.push(`${where}: gabarito não conserva carga (${check.carga.reagentes}≠${check.carga.produtos}).`);
      if (!check.menoresInteiros) errors.push(`${where}: gabarito não está nos menores inteiros.`);
    } catch (error) {
      errors.push(`${where}: fórmula inválida na equação: ${error.message}`);
    }
    (q.errosComuns || []).forEach((erro) => {
      if (erro.resposta !== undefined && (!Array.isArray(erro.resposta) || erro.resposta.length !== total)) errors.push(`${where}: erro comum deve ter ${total} coeficientes.`);
    });
  },
  nomenclatura: (q, errors, where) => {
    if (!['nome-para-formula', 'formula-para-nome'].includes(q.direcao)) errors.push(`${where}: "direcao" deve ser nome-para-formula ou formula-para-nome.`);
    if (!isRecord(q.gabarito) || !isText(q.gabarito.formula) || !Array.isArray(q.gabarito.nomes) || !q.gabarito.nomes.every(isText) || !q.gabarito.nomes.length) {
      errors.push(`${where}: gabarito precisa de "formula" e de "nomes" (lista).`);
      return;
    }
    try { parseFormula(q.gabarito.formula); } catch (error) { errors.push(`${where}: fórmula do gabarito inválida: ${error.message}`); }
  },
  associacao: (q, errors, where) => {
    const items = validateOptions(q.itens, 'itens', errors, where);
    const options = validateOptions(q.opcoes, 'opcoes', errors, where);
    if (!isRecord(q.gabarito)) { errors.push(`${where}: gabarito deve mapear cada item a uma opção.`); return; }
    items.forEach((id) => { if (!options.has(q.gabarito[id])) errors.push(`${where}: item "${id}" sem opção válida no gabarito.`); });
    Object.keys(q.gabarito).forEach((id) => { if (!items.has(id)) errors.push(`${where}: gabarito cita item inexistente "${id}".`); });
  },
  ordenacao: (q, errors, where) => {
    const items = validateOptions(q.itens, 'itens', errors, where);
    if (q.itens?.length < 3) errors.push(`${where}: ordenação precisa de ao menos 3 itens.`);
    if (!isText(q.criterio)) errors.push(`${where}: ordenação precisa de "criterio".`);
    if (!Array.isArray(q.gabarito) || q.gabarito.length !== items.size || new Set(q.gabarito).size !== items.size || !q.gabarito.every((id) => items.has(id))) {
      errors.push(`${where}: gabarito deve listar cada item exatamente uma vez.`);
    }
  },
  'tabela-periodica': (q, errors, where) => {
    const symbols = q.gabarito?.simbolos;
    if (!Array.isArray(symbols) || !symbols.length) { errors.push(`${where}: gabarito precisa de "simbolos".`); return; }
    symbols.forEach((symbol) => { if (!ELEMENT_SYMBOLS.includes(symbol)) errors.push(`${where}: "${symbol}" não é símbolo de elemento.`); });
    (q.errosComuns || []).forEach((erro) => {
      if (erro.resposta !== undefined && (!ELEMENT_SYMBOLS.includes(erro.resposta) || symbols.includes(erro.resposta))) errors.push(`${where}: erro comum com símbolo inválido ou igual ao gabarito.`);
    });
  }
};

export const validateQuestions = ({ arquivos, index, areasSemArquivo = [] }) => {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const countBySubtema = new Map();

  arquivos.forEach(({ area, questoes }) => {
    if (!index.get(area) || index.get(area).nivel !== 'area') errors.push(`arquivo de questões com área inexistente "${area}".`);
    if (!Array.isArray(questoes)) { errors.push(`área "${area}": "questoes" deve ser uma lista.`); return; }
    questoes.forEach((q, position) => {
      const where = `questão "${q?.id || `#${position}`}"`;
      if (!isRecord(q)) { errors.push(`${where}: não é um objeto.`); return; }
      if (!ID_PATTERN.test(q.id || '')) errors.push(`${where}: id inválido.`);
      if (ids.has(q.id)) errors.push(`${where}: id repetido.`);
      ids.add(q.id);
      const subtema = index.get(q.temaId);
      if (!subtema || subtema.nivel !== 'subtema') errors.push(`${where}: temaId "${q.temaId}" não é um subtema existente.`);
      else {
        if (subtema.area !== area) errors.push(`${where}: o subtema é da área "${subtema.area}", mas a questão está no arquivo de "${area}".`);
        if (!subtema.etapasRecomendadas.includes(q.etapa)) errors.push(`${where}: etapa "${q.etapa}" não está entre as etapas do subtema (${subtema.etapasRecomendadas.join(', ')}).`);
        countBySubtema.set(q.temaId, (countBySubtema.get(q.temaId) || 0) + 1);
      }
      if (!Number.isInteger(q.dificuldade) || q.dificuldade < 1 || q.dificuldade > 5) errors.push(`${where}: "dificuldade" deve ser inteiro de 1 a 5.`);
      if (!QUESTION_TYPES.includes(q.tipo)) { errors.push(`${where}: tipo "${q.tipo}" desconhecido.`); return; }
      if (!isText(q.enunciado)) errors.push(`${where}: "enunciado" vazio.`);
      if (!isText(q.dica)) errors.push(`${where}: "dica" vazia.`);
      if (!Array.isArray(q.resolucaoPassoAPasso) || !q.resolucaoPassoAPasso.length || !q.resolucaoPassoAPasso.every(isText)) errors.push(`${where}: "resolucaoPassoAPasso" precisa de ao menos um passo.`);
      if (!Array.isArray(q.errosComuns) || !q.errosComuns.length || !q.errosComuns.every((erro) => isRecord(erro) && isText(erro.descricao))) {
        errors.push(`${where}: "errosComuns" precisa de ao menos um item com "descricao".`);
      }
      if (typeof q.revisado !== 'boolean') errors.push(`${where}: "revisado" deve ser true ou false.`);
      TYPE_VALIDATORS[q.tipo](q, errors, where);

      // O próprio gabarito precisa ser aceito pelo corretor (exceto tipos em que ele não é uma resposta digitada).
      const self = {
        'multipla-escolha': q.gabarito,
        numerica: { valor: String(q.gabarito?.valor), unidade: q.gabarito?.unidade || '' },
        balanceamento: q.gabarito,
        nomenclatura: q.direcao === 'nome-para-formula' ? q.gabarito?.formula : q.gabarito?.nomes?.[0],
        associacao: q.gabarito,
        ordenacao: q.gabarito,
        'tabela-periodica': q.gabarito?.simbolos?.[0]
      }[q.tipo];
      try {
        if (checkAnswer(q, self).status !== 'correta') errors.push(`${where}: o corretor não aceita o próprio gabarito.`);
      } catch (error) {
        errors.push(`${where}: o corretor falhou com o gabarito: ${error.message}`);
      }

      const text = [q.enunciado, q.dica, ...(q.resolucaoPassoAPasso || [])].join(' ');
      if (SENSITIVE_TERMS.test(text)) warnings.push(`${where}: contém termo sensível (${text.match(SENSITIVE_TERMS)[0]}); confira se o contexto é só conceitual e de segurança.`);
    });
  });

  // Cobertura: só nas áreas que já têm arquivo de questões.
  const covered = new Set(arquivos.map((arquivo) => arquivo.area));
  index.subtemas.filter((subtema) => covered.has(subtema.area)).forEach((subtema) => {
    const minimum = subtema.etapasRecomendadas.some((etapa) => EF_EM.test(etapa)) ? MIN_QUESTOES_EF_EM : MIN_QUESTOES_OUTROS;
    const count = countBySubtema.get(subtema.id) || 0;
    if (count < minimum) errors.push(`subtema "${subtema.id}": ${count} questão(ões); o mínimo é ${minimum}.`);
  });
  areasSemArquivo.forEach((area) => warnings.push(`área "${area}" ainda sem arquivo de questões.`));

  return { erros: errors, avisos: warnings, total: ids.size };
};
