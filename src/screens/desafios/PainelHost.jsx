import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, Download, Users } from 'lucide-react';
import { buttonDanger, buttonPrimary, buttonSecondary, Card, Notice, QrCode, downloadText } from '../../components/ui.jsx';
import Ranking from './Ranking.jsx';
import { useNow } from '../../app/useRoom.js';
import { asPlayersMap, endPatch, formatClock, rankParticipants, resultsCsv, ROOM_STATUS, secondsLeft, startPatch } from '../../domain/sala.js';
import { getRoomStartState } from '../../platform/competitionRooms.js';
import { buildJoinUrl, resolveJoinBaseUrl } from '../../platform/roomSession.js';

// Painel do professor: código e QR, lista de espera, início, relógio, ranking ao vivo,
// encerramento e exportação do resultado.
export default function PainelHost({ code, room, participants, transport, onLeave }) {
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [error, setError] = useState('');
  const running = room.status === ROOM_STATUS.emAndamento;
  const now = useNow(running);
  const left = secondsLeft(room, now);
  const ranking = useMemo(() => rankParticipants(participants), [participants]);
  const total = room.questoes.length;
  const start = getRoomStartState({ status: room.status, minPlayers: room.config.minJogadores, maxPlayers: room.config.maxJogadores, players: asPlayersMap(participants) });
  const { baseUrl, warning } = resolveJoinBaseUrl({ configuredUrl: import.meta.env.VITE_PUBLIC_APP_URL, location: typeof window !== 'undefined' ? window.location : null });
  const joinUrl = buildJoinUrl(baseUrl, code);

  const run = async (patch) => {
    try {
      setError('');
      await transport.updateRoom(code, patch);
    } catch (reason) {
      setError(`Não foi possível atualizar a sala: ${reason?.message || reason}`);
    }
  };

  // Contagem pública de participantes no documento da sala: quem ainda vai entrar não pode
  // ler a lista (regra do Firestore), mas precisa saber se a sala está cheia.
  useEffect(() => {
    if (room.participantes !== participants.length) run({ participantes: participants.length });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants.length, room.participantes]);

  // Quando o tempo acaba, o painel do professor encerra a sala.
  useEffect(() => {
    if (running && left === 0) run(endPatch());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, left]);

  const exportCsv = () => downloadText(`sala-${code}-resultado.csv`, resultsCsv(ranking, total), 'text/csv;charset=utf-8');

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-teal-300">Painel do professor</p>
            <h1 className="text-2xl font-black text-white">{room.titulo}</h1>
            <p className="mt-1 text-sm text-slate-400">{total} questões · {room.config.tempoMin} minutos · {room.config.subtemaIds.length} tema(s)</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-400">Código da sala</p>
            <p className="font-mono text-4xl font-black tracking-[0.2em] text-white" aria-label={`Código da sala: ${code.split('').join(' ')}`}>{code}</p>
          </div>
        </div>
        {room.status === ROOM_STATUS.lobby && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {joinUrl && <QrCode value={joinUrl} size={160} />}
            <div className="min-w-0 flex-1 space-y-2 text-sm text-slate-300">
              <p>Os alunos entram em <strong>Desafios em sala</strong> digitando o código{joinUrl ? ' ou lendo o QR code' : ''}.</p>
              {joinUrl && <p className="break-all text-xs text-slate-500">{joinUrl}</p>}
              {warning && <p className="text-xs text-amber-200">{warning}</p>}
            </div>
          </div>
        )}
        {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
      </Card>

      {room.status === ROOM_STATUS.lobby && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-slate-200">
              <Users className="h-5 w-5 text-teal-300" aria-hidden="true" />
              <strong>{start.playerCount}</strong> participante(s) · mínimo {start.minPlayers}, máximo {start.maxPlayers}
            </p>
            <button type="button" disabled={!start.canStart} onClick={() => run(startPatch(room))} className={buttonPrimary}>Iniciar desafio</button>
          </div>
          {start.playersNeeded > 0 && <p className="mt-2 text-sm text-slate-400">Faltam {start.playersNeeded} participante(s) para poder começar.</p>}
          {start.playerCount > start.maxPlayers && <p className="mt-2 text-sm text-amber-200">Há mais participantes que o máximo definido.</p>}
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Participantes na sala">
            {participants.map((participant) => <li key={participant.uid} className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-200">{participant.apelido}</li>)}
          </ul>
        </Card>
      )}

      {room.status !== ROOM_STATUS.lobby && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">{running ? 'Ranking ao vivo' : 'Resultado final'}</h2>
            {running && (
              <p className="flex items-center gap-2 font-mono text-2xl font-black text-white" role="timer" aria-label={`Tempo restante: ${formatClock(left ?? 0)}`}>
                <Clock3 className="h-6 w-6 text-teal-300" aria-hidden="true" />{formatClock(left ?? 0)}
              </p>
            )}
          </div>
          <div className="mt-3"><Ranking ranking={ranking} totalQuestoes={total} /></div>
          <div className="mt-4 flex flex-wrap gap-2">
            {running && !confirmEnd && <button type="button" onClick={() => setConfirmEnd(true)} className={buttonDanger}>Encerrar agora</button>}
            {running && confirmEnd && (
              <>
                <button type="button" onClick={() => run(endPatch())} className={buttonDanger}>Sim, encerrar</button>
                <button type="button" onClick={() => setConfirmEnd(false)} className={buttonSecondary}>Continuar</button>
              </>
            )}
            {!running && (
              <button type="button" onClick={exportCsv} className={buttonSecondary}>
                <Download className="h-4 w-4" aria-hidden="true" /> Baixar resultado (CSV)
              </button>
            )}
          </div>
          {!running && <p className="mt-2 text-xs text-slate-500">A planilha tem só apelidos sorteados e números, sem dados pessoais.</p>}
        </Card>
      )}

      <button type="button" onClick={onLeave} className={buttonSecondary}>{room.status === ROOM_STATUS.encerrada ? 'Criar outra sala' : 'Sair do painel'}</button>
    </div>
  );
}
