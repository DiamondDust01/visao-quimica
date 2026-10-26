// Pontuação e níveis.
// - Acerto: 10 pontos × dificuldade da questão (1 a 5).
// - Cada nível de ajuda do Mentor usado tira 25% dos pontos daquela questão (mínimo de 25%).
// - Erro: 0 pontos (não há pontos negativos).

export const PONTOS_POR_DIFICULDADE = 10;
export const DESCONTO_POR_AJUDA = 0.25;
export const FATOR_MINIMO = 0.25;

export const pointsFor = ({ dificuldade, status, nivelAjuda = 0 }) => {
  if (status !== 'correta') return 0;
  const factor = Math.max(FATOR_MINIMO, 1 - DESCONTO_POR_AJUDA * nivelAjuda);
  return Math.round(PONTOS_POR_DIFICULDADE * dificuldade * factor);
};

export const NIVEIS = [
  { nivel: 1, nome: 'Átomo', minimo: 0 },
  { nivel: 2, nome: 'Molécula', minimo: 100 },
  { nivel: 3, nome: 'Composto', minimo: 300 },
  { nivel: 4, nome: 'Reação', minimo: 700 },
  { nivel: 5, nome: 'Catalisador', minimo: 1500 },
  { nivel: 6, nome: 'Laboratório', minimo: 3000 }
];

// Nível atual e quanto falta para o próximo.
export const levelFor = (pontos) => {
  const total = Math.max(0, Math.floor(pontos || 0));
  const index = NIVEIS.reduce((found, level, position) => (total >= level.minimo ? position : found), 0);
  const current = NIVEIS[index];
  const next = NIVEIS[index + 1] || null;
  return {
    ...current,
    pontos: total,
    proximo: next,
    faltam: next ? next.minimo - total : 0,
    percentual: next ? Math.round(((total - current.minimo) / (next.minimo - current.minimo)) * 100) : 100
  };
};
