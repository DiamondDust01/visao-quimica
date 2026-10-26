// Registro de erros do Mentor e sugestões de revisão. Tudo fica no aparelho.
// Registro: lista de { em, questaoId, temaId, padroes: [..] }, só de respostas erradas.
import { PADROES } from './diagnostico.js';
import { STATUS, statusFor } from '../progresso.js';

export const MAX_REGISTROS = 200;
export const JANELA_RECENTE = 30;
export const MAX_SUGESTOES = 8;

export const appendLog = (log, entry) => [...(Array.isArray(log) ? log : []), entry].slice(-MAX_REGISTROS);

// Padrões genéricos (sem o "erro previsto"), do mais frequente ao menos.
export const summarizePatterns = (log) => {
  const counts = new Map();
  (log || []).forEach((entry) => (entry.padroes || []).forEach((padrao) => {
    if (padrao !== 'erro-previsto' && PADROES[padrao]) counts.set(padrao, (counts.get(padrao) || 0) + 1);
  }));
  return [...counts.entries()]
    .map(([padrao, vezes]) => ({ padrao, vezes, ...PADROES[padrao] }))
    .sort((a, b) => b.vezes - a.vezes || a.padrao.localeCompare(b.padrao));
};

// Sugestões em ordem de prioridade: [{ subtemaId, motivos: [texto] }].
export const suggestReview = ({ index, progress = {}, log = [] }) => {
  const suggestions = new Map();
  const add = (id, motivo) => {
    const node = index.get(id);
    if (!node || node.nivel !== 'subtema' || statusFor(progress[id]) === STATUS.dominado) return;
    if (!suggestions.has(id)) suggestions.set(id, []);
    if (!suggestions.get(id).includes(motivo)) suggestions.get(id).push(motivo);
  };

  // 1. Acerto baixo, e a base desses temas que ainda não foi dominada.
  index.subtemas.filter((node) => statusFor(progress[node.id]) === STATUS.revisar).forEach((node) => {
    node.prerequisitos.forEach((prereq) => add(prereq, `É base de "${node.nome}", em que seu acerto está baixo.`));
    add(node.id, 'Seu acerto neste tema está abaixo de 60%.');
  });

  // 2. Padrões de erro repetidos apontam para temas de apoio.
  summarizePatterns(log).filter((item) => item.vezes >= 2).forEach((item) => {
    item.revisao.forEach((id) => add(id, `Padrão de erro repetido: ${item.nome.toLowerCase()} (${item.vezes} vezes).`));
  });

  // 3. Temas com vários erros recentes.
  const recent = new Map();
  (log || []).slice(-JANELA_RECENTE).forEach((entry) => recent.set(entry.temaId, (recent.get(entry.temaId) || 0) + 1));
  [...recent.entries()].filter(([, vezes]) => vezes >= 2).sort((a, b) => b[1] - a[1])
    .forEach(([id, vezes]) => add(id, `${vezes} erros nas respostas recentes.`));

  return [...suggestions.entries()].slice(0, MAX_SUGESTOES).map(([subtemaId, motivos]) => ({ subtemaId, motivos }));
};
