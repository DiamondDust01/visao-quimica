// Recomendador de trilha por etapa escolar. Determinístico e local: as mesmas entradas
// sempre geram a mesma saída, e nada é enviado para fora do aparelho.
//
// 1. Recomendados: subtemas marcados com a etapa do estudante.
// 2. Base: pré-requisitos (diretos e indiretos) que ficam fora da etapa e ainda não
//    foram dominados. Eles entram na trilha antes de quem depende deles.
// 3. Revisão: a base acima, mais qualquer subtema estudado com acerto baixo.
// 4. Desafio: subtemas da etapa seguinte (e de nenhuma etapa igual ou anterior à atual)
//    cujos pré-requisitos já estão na trilha ou dominados; até MAX_DESAFIOS, dos mais
//    acessíveis aos mais difíceis.
// 5. Trilha: ordenação topológica (pré-requisito sempre antes). Entre os subtemas
//    liberados, vem primeiro o que precisa de revisão (ou leva a um tema que precisa),
//    depois o que está em andamento, depois o que não foi iniciado; empates seguem a
//    ordem da taxonomia.
//    Subtemas dominados saem da fila e aparecem em "concluídos".
// O estudante pode ignorar tudo isso e escolher qualquer tema na Prática.
import { STATUS, statusFor } from './progresso.js';

export const MAX_DESAFIOS = 5;

const PRIORITY = { [STATUS.revisar]: 0, [STATUS.emAndamento]: 1, [STATUS.naoIniciado]: 2 };

// Todos os pré-requisitos (diretos e indiretos) de um conjunto de subtemas.
export const prerequisiteClosure = (index, ids) => {
  const seen = new Set();
  const stack = [...ids];
  while (stack.length) {
    const id = stack.pop();
    (index.get(id)?.prerequisitos || []).forEach((prereq) => {
      if (!seen.has(prereq)) {
        seen.add(prereq);
        stack.push(prereq);
      }
    });
  }
  return seen;
};

// Ordenação topológica com prioridade (método de Kahn, com escolha determinística).
export const orderTrail = (index, ids, statusOf) => {
  const members = new Set(ids);
  const pending = new Map();
  const dependents = new Map();
  members.forEach((id) => {
    const inside = (index.get(id)?.prerequisitos || []).filter((prereq) => members.has(prereq));
    pending.set(id, inside.length);
    inside.forEach((prereq) => {
      if (!dependents.has(prereq)) dependents.set(prereq, []);
      dependents.get(prereq).push(id);
    });
  });
  // Um pré-requisito herda a prioridade mais urgente de quem depende dele: se um tema precisa
  // de revisão, o caminho até ele vem primeiro.
  const effective = new Map();
  const priorityOf = (id) => {
    if (effective.has(id)) return effective.get(id);
    effective.set(id, PRIORITY[statusOf(id)] ?? 3);
    const value = Math.min(effective.get(id), ...(dependents.get(id) || []).map(priorityOf));
    effective.set(id, value);
    return value;
  };
  const key = (id) => [priorityOf(id), index.subtemaOrder.get(id) ?? Infinity];
  const compare = (a, b) => {
    const [pa, oa] = key(a);
    const [pb, ob] = key(b);
    return pa - pb || oa - ob;
  };
  const ready = [...members].filter((id) => pending.get(id) === 0).sort(compare);
  const ordered = [];
  while (ready.length) {
    const id = ready.shift();
    ordered.push(id);
    (dependents.get(id) || []).forEach((next) => {
      pending.set(next, pending.get(next) - 1);
      if (pending.get(next) === 0) {
        ready.push(next);
        ready.sort(compare);
      }
    });
  }
  return ordered;
};

export const recommend = ({ index, etapaId, progress = {} }) => {
  const etapa = index.etapaById.get(etapaId) || null;
  const statusOf = (id) => statusFor(progress[id]);
  const empty = { etapa, semRecomendacao: true, trilha: [], recomendados: [], revisao: [], desafio: [], concluidos: [], proximo: null };
  if (!etapa || etapa.semRecomendacao) return empty;

  const recommended = index.subtemas.filter((node) => node.etapasRecomendadas.includes(etapa.id)).map((node) => node.id);
  const recommendedSet = new Set(recommended);
  const dominated = (id) => statusOf(id) === STATUS.dominado;

  const base = [...prerequisiteClosure(index, recommended)].filter((id) => !recommendedSet.has(id) && !dominated(id));
  const lowAccuracy = index.subtemas.map((node) => node.id).filter((id) => statusOf(id) === STATUS.revisar);
  const revisaoSet = new Set([...base, ...lowAccuracy]);

  // Na trilha: recomendados e base que ainda não foram dominados, mais os que precisam de revisão.
  const trailMembers = new Set([...recommended, ...base, ...lowAccuracy].filter((id) => !dominated(id)));
  const trilha = orderTrail(index, [...trailMembers], statusOf);
  const position = new Map(trilha.map((id, order) => [id, order]));
  const byTrail = (a, b) => position.get(a) - position.get(b);

  const reachable = new Set([...trailMembers, ...index.subtemas.map((node) => node.id).filter(dominated)]);
  const challengeEtapas = new Set(etapa.desafio || []);
  const desafio = index.subtemas
    .filter((node) => node.etapasRecomendadas.some((id) => challengeEtapas.has(id)))
    .map((node) => node.id)
    .filter((id) => !trailMembers.has(id) && !dominated(id))
    // Conteúdo que também é de uma etapa igual ou anterior à atual não é desafio.
    .filter((id) => index.minNivel(id) > etapa.nivel)
    .filter((id) => index.get(id).prerequisitos.every((prereq) => reachable.has(prereq)))
    .sort((a, b) => index.minNivel(a) - index.minNivel(b)
      || index.get(a).dificuldade - index.get(b).dificuldade
      || index.subtemaOrder.get(a) - index.subtemaOrder.get(b))
    .slice(0, MAX_DESAFIOS);

  return {
    etapa,
    semRecomendacao: false,
    trilha,
    recomendados: recommended.filter((id) => trailMembers.has(id) && !revisaoSet.has(id)).sort(byTrail),
    revisao: [...revisaoSet].filter((id) => trailMembers.has(id)).sort(byTrail),
    desafio,
    concluidos: [...new Set([...recommended, ...prerequisiteClosure(index, recommended)])].filter(dominated)
      .sort((a, b) => index.subtemaOrder.get(a) - index.subtemaOrder.get(b)),
    proximo: trilha[0] || null
  };
};

// Pré-requisitos ainda não estudados de uma seleção livre (para avisar, sem bloquear).
// Aceita IDs de subtema, tema ou área; pré-requisitos que também estão na seleção não contam.
export const unstudiedPrerequisites = (index, selectedIds, progress = {}) => {
  const selected = new Set(selectedIds.flatMap((id) => index.subtemasOf(id)));
  const result = [];
  selected.forEach((id) => {
    const missing = (index.get(id)?.prerequisitos || [])
      .filter((prereq) => !selected.has(prereq) && statusFor(progress[prereq]) === STATUS.naoIniciado);
    if (missing.length) result.push({ subtemaId: id, faltando: missing });
  });
  return result.sort((a, b) => index.subtemaOrder.get(a.subtemaId) - index.subtemaOrder.get(b.subtemaId));
};
