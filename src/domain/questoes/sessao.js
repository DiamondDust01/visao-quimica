// Montagem e resumo de sessões de prática.
// A sessão reveza entre os subtemas escolhidos (um de cada vez), para que todos apareçam
// mesmo com poucas questões. Dentro de cada subtema, vêm primeiro as questões escritas
// para a etapa mais próxima da do estudante.

export const SESSION_SIZES = [5, 10, 15, 20];

// Embaralhamento de Fisher-Yates com fonte de aleatoriedade injetável (testes usam uma fixa).
export const shuffle = (list, random = Math.random) => {
  const copy = [...list];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
};

export const buildSession = ({ questoes, subtemaIds, quantidade, nivelDaEtapa = () => 0, nivelEstudante = null, random = Math.random }) => {
  const wanted = new Set(subtemaIds);
  const groups = new Map();
  shuffle(questoes.filter((question) => wanted.has(question.temaId)), random).forEach((question) => {
    if (!groups.has(question.temaId)) groups.set(question.temaId, []);
    groups.get(question.temaId).push(question);
  });
  if (nivelEstudante !== null) {
    // Ordenação estável: o embaralhamento acima desempata.
    groups.forEach((list) => list.sort((a, b) => Math.abs(nivelDaEtapa(a.etapa) - nivelEstudante) - Math.abs(nivelDaEtapa(b.etapa) - nivelEstudante)));
  }
  const queues = shuffle([...groups.values()], random);
  const selected = [];
  const limit = quantidade ?? Infinity;
  while (selected.length < limit && queues.some((queue) => queue.length)) {
    queues.forEach((queue) => {
      if (queue.length && selected.length < limit) selected.push(queue.shift());
    });
  }
  return selected;
};

// respostas: [{ questaoId, temaId, status: 'correta' | 'incorreta', dicaUsada, pontos }]
export const summarizeSession = (respostas) => {
  const porSubtema = {};
  respostas.forEach(({ temaId, status }) => {
    porSubtema[temaId] = porSubtema[temaId] || { total: 0, corretas: 0 };
    porSubtema[temaId].total += 1;
    if (status === 'correta') porSubtema[temaId].corretas += 1;
  });
  const corretas = respostas.filter((item) => item.status === 'correta').length;
  return {
    total: respostas.length,
    corretas,
    percentual: respostas.length ? Math.round((corretas / respostas.length) * 100) : 0,
    dicasUsadas: respostas.filter((item) => item.dicaUsada).length,
    pontos: respostas.reduce((sum, item) => sum + (item.pontos || 0), 0),
    porSubtema
  };
};
