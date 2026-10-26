// Progresso por subtema: quantas questões foram respondidas e quantas certas.
// Formato: { [subtemaId]: { respondidas, acertos, atualizadoEm } }
// As funções são puras; quem grava no aparelho é src/app/useStudyState.js.

export const MIN_RESPOSTAS = 3;
export const LIMITE_REVISAR = 0.6;
export const LIMITE_DOMINADO = 0.8;

export const STATUS = {
  naoIniciado: 'nao-iniciado',
  emAndamento: 'em-andamento',
  revisar: 'revisar',
  dominado: 'dominado'
};

export const STATUS_LABELS = {
  'nao-iniciado': 'Não iniciado',
  'em-andamento': 'Em andamento',
  revisar: 'Precisa de revisão',
  dominado: 'Concluído'
};

const toCount = (value) => (Number.isInteger(value) && value >= 0 ? value : 0);

export const normalizeEntry = (entry) => {
  const respondidas = toCount(entry?.respondidas);
  return { respondidas, acertos: Math.min(toCount(entry?.acertos), respondidas), atualizadoEm: entry?.atualizadoEm || null };
};

export const accuracy = (entry) => {
  const { respondidas, acertos } = normalizeEntry(entry);
  return respondidas ? acertos / respondidas : null;
};

// Status de um subtema. Com menos de MIN_RESPOSTAS respostas ainda não há como julgar.
export const statusFor = (entry) => {
  const { respondidas } = normalizeEntry(entry);
  if (respondidas === 0) return STATUS.naoIniciado;
  if (respondidas < MIN_RESPOSTAS) return STATUS.emAndamento;
  const rate = accuracy(entry);
  if (rate < LIMITE_REVISAR) return STATUS.revisar;
  if (rate >= LIMITE_DOMINADO) return STATUS.dominado;
  return STATUS.emAndamento;
};

export const registerAnswer = (progress, subtemaId, correct, now = new Date().toISOString()) => {
  const current = normalizeEntry(progress?.[subtemaId]);
  return {
    ...(progress || {}),
    [subtemaId]: { respondidas: current.respondidas + 1, acertos: current.acertos + (correct ? 1 : 0), atualizadoEm: now }
  };
};

// Resumo de um conjunto de subtemas (um tema, uma área ou uma trilha).
export const summarizeProgress = (subtemaIds, progress) => {
  const counts = { total: subtemaIds.length, 'nao-iniciado': 0, 'em-andamento': 0, revisar: 0, dominado: 0 };
  subtemaIds.forEach((id) => { counts[statusFor(progress?.[id])] += 1; });
  return { ...counts, percentConcluido: counts.total ? Math.round((counts.dominado / counts.total) * 100) : 0 };
};
