// Validação da taxonomia e das etapas. Devolve uma lista de erros legíveis
// (vazia quando está tudo certo). Usada por `npm run validate:content` e pelos testes.
import { NODE_KEYS, aggregateTaxonomy, flattenTaxonomy, createTaxonomyIndex } from '../taxonomia.js';

export const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+$/;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export const validateEtapas = (etapas) => {
  const errors = [];
  const ids = new Set();
  etapas.forEach((etapa, index) => {
    const where = `etapas[${index}] (${etapa.id || 'sem id'})`;
    if (!ID_PATTERN.test(etapa.id || '')) errors.push(`${where}: id inválido.`);
    if (ids.has(etapa.id)) errors.push(`${where}: id repetido.`);
    ids.add(etapa.id);
    ['nome', 'grupo', 'descricao'].forEach((key) => { if (!isNonEmptyString(etapa[key])) errors.push(`${where}: campo "${key}" vazio.`); });
    if (!Number.isInteger(etapa.nivel) || etapa.nivel < 0) errors.push(`${where}: "nivel" deve ser inteiro ≥ 0.`);
    if (!['simples', 'intermediaria', 'tecnica'].includes(etapa.linguagem)) errors.push(`${where}: "linguagem" deve ser simples, intermediaria ou tecnica.`);
    if (!Array.isArray(etapa.desafio)) errors.push(`${where}: "desafio" deve ser uma lista.`);
  });
  etapas.forEach((etapa) => (etapa.desafio || []).forEach((id) => {
    if (!ids.has(id)) errors.push(`etapa ${etapa.id}: desafio aponta para etapa inexistente "${id}".`);
    if (id === etapa.id) errors.push(`etapa ${etapa.id}: não pode ser desafio de si mesma.`);
  }));
  return errors;
};

// Procura ciclos no grafo de pré-requisitos (DFS com três cores).
export const findCycle = (subtemas) => {
  const graph = new Map(subtemas.map((node) => [node.id, node.prerequisitos || []]));
  const state = new Map();
  const stack = [];
  const visit = (id) => {
    state.set(id, 'visiting');
    stack.push(id);
    for (const next of graph.get(id) || []) {
      if (!graph.has(next)) continue;
      if (state.get(next) === 'visiting') return [...stack.slice(stack.indexOf(next)), next];
      if (!state.has(next)) {
        const cycle = visit(next);
        if (cycle) return cycle;
      }
    }
    stack.pop();
    state.set(id, 'done');
    return null;
  };
  for (const id of graph.keys()) {
    if (!state.has(id)) {
      const cycle = visit(id);
      if (cycle) return cycle;
    }
  }
  return null;
};

export const validateTaxonomy = ({ areas, meta, etapas }) => {
  const errors = [];
  const etapaIds = new Set(etapas.map((etapa) => etapa.id));

  if (!SEMVER.test(meta?.versao || '')) errors.push('meta.json: "versao" deve seguir o formato 1.2.3.');
  areas.forEach((area, index) => {
    if (!area) errors.push(`meta.json: a área "${meta.ordemAreas[index]}" não tem arquivo carregado em src/data/taxonomia/index.js.`);
  });
  const present = areas.filter(Boolean);
  if (errors.length) return errors;

  const nodes = flattenTaxonomy(present);
  const seen = new Set();
  nodes.forEach((node) => {
    const where = `${node.nivel} "${node.id || node.nome || '?'}"`;
    if (!ID_PATTERN.test(node.id || '')) errors.push(`${where}: id deve estar em kebab-case (letras minúsculas, números e hífens).`);
    if (seen.has(node.id)) errors.push(`${where}: id repetido.`);
    seen.add(node.id);
    NODE_KEYS.forEach((key) => { if (!(key in node)) errors.push(`${where}: falta o campo "${key}". Rode npm run sync:taxonomia.`); });
    if (!isNonEmptyString(node.nome)) errors.push(`${where}: "nome" vazio.`);
    if (!isNonEmptyString(node.descricao)) errors.push(`${where}: "descricao" vazia.`);
    if (!Number.isInteger(node.dificuldade) || node.dificuldade < 1 || node.dificuldade > 5) errors.push(`${where}: "dificuldade" deve ser inteiro de 1 a 5.`);
    if (!Array.isArray(node.palavrasChave) || node.palavrasChave.length === 0 || !node.palavrasChave.every(isNonEmptyString)) {
      errors.push(`${where}: "palavrasChave" precisa ter ao menos um termo.`);
    }
    if (!Array.isArray(node.prerequisitos)) errors.push(`${where}: "prerequisitos" deve ser uma lista.`);
    if (!Array.isArray(node.etapasRecomendadas)) errors.push(`${where}: "etapasRecomendadas" deve ser uma lista.`);
    (node.etapasRecomendadas || []).forEach((id) => {
      if (!etapaIds.has(id)) errors.push(`${where}: etapa inexistente "${id}".`);
      if (id === 'livre') errors.push(`${where}: "livre" não é etapa recomendável.`);
    });
    if (node.nivel === 'area' && !(node.temas || []).length) errors.push(`${where}: área sem temas.`);
    if (node.nivel === 'tema' && !(node.subtemas || []).length) errors.push(`${where}: tema sem subtemas.`);
  });

  // Áreas: a raiz de cada arquivo marca a própria área.
  present.forEach((area) => {
    flattenTaxonomy([area]).forEach((node) => {
      if (node.area !== area.id) errors.push(`${node.nivel} "${node.id}": "area" deve ser "${area.id}".`);
    });
  });

  const subtemas = nodes.filter((node) => node.nivel === 'subtema');
  const subtemaIds = new Set(subtemas.map((node) => node.id));
  subtemas.forEach((node) => {
    const where = `subtema "${node.id}"`;
    if (!(node.etapasRecomendadas || []).length) errors.push(`${where}: precisa de ao menos uma etapa recomendada.`);
    const prereqs = node.prerequisitos || [];
    if (new Set(prereqs).size !== prereqs.length) errors.push(`${where}: pré-requisito repetido.`);
    prereqs.forEach((id) => {
      if (id === node.id) errors.push(`${where}: não pode ser pré-requisito de si mesmo.`);
      else if (!subtemaIds.has(id)) errors.push(`${where}: pré-requisito "${id}" não é um subtema existente.`);
    });
  });

  const cycle = findCycle(subtemas);
  if (cycle) errors.push(`ciclo de pré-requisitos: ${cycle.join(' → ')}.`);

  // Um pré-requisito não pode ser recomendado só para uma etapa posterior à do próprio subtema.
  if (!errors.length) {
    const index = createTaxonomyIndex(present, etapas);
    subtemas.forEach((node) => {
      node.prerequisitos.forEach((id) => {
        if (index.minNivel(id) > index.minNivel(node.id)) {
          errors.push(`subtema "${node.id}": o pré-requisito "${id}" só aparece em etapa posterior à dele.`);
        }
      });
    });
  }

  // Campos derivados de temas e áreas, e ordem canônica das listas.
  if (!errors.length) {
    const expected = aggregateTaxonomy(present, etapas);
    present.forEach((area, index) => {
      if (JSON.stringify(area) !== JSON.stringify(expected[index])) {
        errors.push(`área "${area.id}": campos derivados ou ordem das listas desatualizados. Rode npm run sync:taxonomia.`);
      }
    });
  }

  // Toda etapa (menos "livre") precisa de ao menos um subtema recomendado.
  etapas.filter((etapa) => !etapa.semRecomendacao).forEach((etapa) => {
    if (!subtemas.some((node) => (node.etapasRecomendadas || []).includes(etapa.id))) {
      errors.push(`etapa "${etapa.id}": nenhum subtema recomendado.`);
    }
  });

  return errors;
};
