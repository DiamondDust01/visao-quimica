// Leitura da taxonomia (Área → Tema → Subtema) e cálculo dos campos derivados.
//
// Só os subtemas são editados à mão. Em temas e áreas, os campos `area`,
// `prerequisitos`, `etapasRecomendadas` e `dificuldade` são derivados dos subtemas
// (aggregateTaxonomy) e gravados nos JSON pelo `npm run sync:taxonomia`:
// - prerequisitos: pré-requisitos dos subtemas que ficam fora do próprio nó;
// - etapasRecomendadas: união das etapas dos subtemas, na ordem de etapas.json;
// - dificuldade: a menor dificuldade entre os subtemas (o ponto de entrada).

export const NODE_KEYS = ['id', 'nome', 'descricao', 'area', 'prerequisitos', 'etapasRecomendadas', 'dificuldade', 'palavrasChave'];

const childKey = (level) => (level === 'area' ? 'temas' : level === 'tema' ? 'subtemas' : null);

// Lista plana de todos os nós, na ordem dos arquivos.
export const flattenTaxonomy = (areas) => {
  const nodes = [];
  areas.forEach((area) => {
    nodes.push({ ...area, nivel: 'area', pai: null });
    (area.temas || []).forEach((tema) => {
      nodes.push({ ...tema, nivel: 'tema', pai: area.id });
      (tema.subtemas || []).forEach((subtema) => nodes.push({ ...subtema, nivel: 'subtema', pai: tema.id }));
    });
  });
  return nodes;
};

const orderBy = (values, order) => [...new Set(values)].sort((a, b) => (order.get(a) ?? Infinity) - (order.get(b) ?? Infinity));

// Reescreve as áreas com os campos derivados preenchidos e as chaves na ordem padrão.
export const aggregateTaxonomy = (areas, etapas) => {
  const etapaOrder = new Map(etapas.map((etapa, index) => [etapa.id, index]));
  const subtemaOrder = new Map(flattenTaxonomy(areas).filter((node) => node.nivel === 'subtema').map((node, index) => [node.id, index]));

  const canonical = (node, extra) => {
    const output = {};
    NODE_KEYS.forEach((key) => { output[key] = node[key]; });
    return { ...output, ...extra };
  };

  const aggregate = (node, areaId, level) => {
    const key = childKey(level);
    if (!key) {
      return canonical({
        ...node,
        area: areaId,
        prerequisitos: orderBy(node.prerequisitos || [], subtemaOrder),
        etapasRecomendadas: orderBy(node.etapasRecomendadas || [], etapaOrder)
      });
    }
    const children = (node[key] || []).map((child) => aggregate(child, areaId, level === 'area' ? 'tema' : 'subtema'));
    const subtemas = level === 'area' ? children.flatMap((tema) => tema.subtemas) : children;
    const own = new Set(subtemas.map((subtema) => subtema.id));
    return canonical({
      ...node,
      area: areaId,
      prerequisitos: orderBy(subtemas.flatMap((subtema) => subtema.prerequisitos).filter((id) => !own.has(id)), subtemaOrder),
      etapasRecomendadas: orderBy(subtemas.flatMap((subtema) => subtema.etapasRecomendadas), etapaOrder),
      dificuldade: subtemas.length ? Math.min(...subtemas.map((subtema) => subtema.dificuldade)) : node.dificuldade
    }, { [key]: children });
  };

  return areas.map((area) => aggregate(area, area.id, 'area'));
};

// Índice de consulta usado pelas telas e pelo recomendador.
export const createTaxonomyIndex = (areas, etapas) => {
  const nodes = flattenTaxonomy(areas);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const subtemas = nodes.filter((node) => node.nivel === 'subtema');
  const subtemaOrder = new Map(subtemas.map((node, index) => [node.id, index]));
  const etapaById = new Map(etapas.map((etapa) => [etapa.id, etapa]));
  const children = new Map();
  nodes.forEach((node) => {
    if (!node.pai) return;
    if (!children.has(node.pai)) children.set(node.pai, []);
    children.get(node.pai).push(node.id);
  });

  const subtemasOf = (id) => {
    const node = byId.get(id);
    if (!node) return [];
    if (node.nivel === 'subtema') return [id];
    return (children.get(id) || []).flatMap(subtemasOf);
  };

  // Menor nível de etapa em que o subtema é recomendado (ignora etapas sem nível, como "livre").
  const minNivel = (id) => {
    const levels = (byId.get(id)?.etapasRecomendadas || []).map((etapaId) => etapaById.get(etapaId)?.nivel).filter((nivel) => nivel > 0);
    return levels.length ? Math.min(...levels) : Infinity;
  };

  return {
    areas: nodes.filter((node) => node.nivel === 'area'),
    temas: nodes.filter((node) => node.nivel === 'tema'),
    subtemas,
    nodes,
    byId,
    etapas,
    etapaById,
    subtemaOrder,
    get: (id) => byId.get(id) || null,
    childrenOf: (id) => children.get(id) || [],
    subtemasOf,
    minNivel,
    areaOf: (id) => byId.get(byId.get(id)?.area) || null
  };
};
