// Regras dos Desafios em sala. O host (professor) é o único que escreve o estado da sala;
// cada participante escreve só o próprio registro. As questões são sorteadas uma vez, na
// criação, e todos respondem a mesma lista, na mesma ordem.
import { validateRoomSettings } from '../platform/competitionRooms.js';
import { buildSession } from './questoes/sessao.js';
import { toCsv } from '../platform/roomSession.js';

export const ROOM_STATUS = { lobby: 'lobby', emAndamento: 'em-andamento', encerrada: 'encerrada' };
export const ROOM_SIZES = [5, 10, 15, 20];
export const ROOM_TIMES = [10, 20, 30, 45];

export const validateRoomConfig = ({ subtemaIds, quantidade, tempoMin, minJogadores, maxJogadores, disponiveis }) => {
  if (!subtemaIds?.length) return { valid: false, error: 'Escolha ao menos um tema.' };
  if (!Number.isInteger(quantidade) || quantidade < 1) return { valid: false, error: 'Escolha quantas questões a sala terá.' };
  if (disponiveis !== undefined && disponiveis < 1) return { valid: false, error: 'Os temas escolhidos ainda não têm questões.' };
  return validateRoomSettings({ timeMinutes: tempoMin, minPlayers: minJogadores, maxPlayers: maxJogadores });
};

// Estado inicial da sala, com as questões já sorteadas.
export const createRoomState = ({ titulo, subtemaIds, quantidade, tempoMin, minJogadores, maxJogadores, questoes, random = Math.random }) => ({
  status: ROOM_STATUS.lobby,
  titulo,
  config: { subtemaIds: [...subtemaIds], quantidade, tempoMin, minJogadores, maxJogadores },
  questoes: buildSession({ questoes, subtemaIds, quantidade, random }).map((question) => question.id)
});

export const startPatch = (room, now = Date.now()) => ({
  status: ROOM_STATUS.emAndamento,
  iniciadaEm: now,
  encerraEm: now + room.config.tempoMin * 60 * 1000
});

export const endPatch = (now = Date.now()) => ({ status: ROOM_STATUS.encerrada, encerradaEm: now });

// Segundos restantes; null quando a sala ainda não começou.
export const secondsLeft = (room, now = Date.now()) => {
  if (!room?.encerraEm) return null;
  return Math.max(0, Math.ceil((room.encerraEm - now) / 1000));
};

export const isAnswering = (room, now = Date.now()) => room?.status === ROOM_STATUS.emAndamento && secondsLeft(room, now) > 0;

export const formatClock = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

// Registro de uma resposta no documento do participante (merge profundo).
export const answerPatch = (participant, record) => {
  const respostas = { ...(participant?.respostas || {}), [record.questaoId]: { correta: record.status === 'correta', pontos: record.pontos } };
  return {
    respostas: { [record.questaoId]: respostas[record.questaoId] },
    pontuacao: Object.values(respostas).reduce((sum, item) => sum + (item.pontos || 0), 0)
  };
};

// Ranking: mais pontos, depois mais acertos, depois quem chegou antes à pontuação.
// Empates completos dividem a mesma posição.
export const rankParticipants = (participants) => {
  const rows = (participants || []).map((participant) => {
    const respostas = Object.values(participant.respostas || {});
    return {
      uid: participant.uid,
      apelido: participant.apelido || 'Participante',
      pontuacao: participant.pontuacao || 0,
      corretas: respostas.filter((item) => item.correta).length,
      respondidas: respostas.length,
      concluido: Boolean(participant.concluido),
      atualizadoEm: participant.atualizadoEm || ''
    };
  });
  rows.sort((a, b) => b.pontuacao - a.pontuacao || b.corretas - a.corretas || String(a.atualizadoEm).localeCompare(String(b.atualizadoEm)) || a.apelido.localeCompare(b.apelido));
  rows.forEach((row, index) => {
    const previous = rows[index - 1];
    row.posicao = previous && previous.pontuacao === row.pontuacao && previous.corretas === row.corretas ? previous.posicao : index + 1;
  });
  return rows;
};

// Planilha do resultado: só apelidos sorteados e números, sem dados pessoais.
export const resultsCsv = (ranking, totalQuestoes) => toCsv([
  ['Posição', 'Apelido', 'Pontos', 'Acertos', 'Respondidas', 'Total de questões', 'Concluiu'],
  ...ranking.map((row) => [row.posicao, row.apelido, row.pontuacao, row.corretas, row.respondidas, totalQuestoes, row.concluido ? 'sim' : 'não'])
]);

// Mapa { uid: participante } no formato de getRoomStartState (competitionRooms.js).
export const asPlayersMap = (participants) => Object.fromEntries((participants || []).map((participant) => [participant.uid, participant]));
