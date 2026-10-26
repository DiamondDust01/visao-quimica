import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, Shuffle } from 'lucide-react';
import { buttonPrimary, buttonSecondary, Card, Notice } from '../../components/ui.jsx';
import SessionPlayer from '../../components/questoes/SessionPlayer.jsx';
import { PeerConnectionIndicator } from '../../components/StatusIndicators.jsx';
import Ranking from './Ranking.jsx';
import { useNow } from '../../app/useRoom.js';
import { answerPatch, formatClock, isAnswering, rankParticipants, ROOM_STATUS, secondsLeft } from '../../domain/sala.js';
import { drawNickname } from '../../platform/nicknames.js';
import { PeerPairing } from '../../platform/peerPairing.js';

// Visão do participante: apelido sorteado, espera, questões com relógio e ranking.
export default function SalaParticipante({ code, room, participants, joined, onJoined, transport, uid, index, questionsById, recordAnswer, onLeave }) {
  const [nickname, setNickname] = useState(() => drawNickname());
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [sessionQuestions, setSessionQuestions] = useState(null);
  const [peerStatus, setPeerStatus] = useState({ peers: [] });
  const me = participants.find((participant) => participant.uid === uid) || null;
  const now = useNow(room?.status === ROOM_STATUS.emAndamento);
  const answering = isAnswering(room, now);
  const left = secondsLeft(room, now);
  const ranking = useMemo(() => rankParticipants(participants), [participants]);
  const total = room.questoes.length;
  const remaining = room.questoes.filter((id) => !me?.respostas?.[id] && questionsById.has(id));

  // A lista de questões da sessão é fixada ao começar (ou ao voltar para a sala), para que
  // as respostas gravadas não reiniciem o player.
  useEffect(() => {
    if (answering && me && !me.concluido && !sessionQuestions && remaining.length) {
      setSessionQuestions(remaining.map((id) => questionsById.get(id)));
    }
  }, [answering, me, sessionQuestions, remaining, questionsById]);

  // Conexão direta (WebRTC) entre os aparelhos, só com Firebase, para medir o ping da sala.
  useEffect(() => {
    if (transport.kind !== 'firestore' || !me) return undefined;
    const pairing = new PeerPairing({ roomRef: transport.roomRef(code), uid, onStatus: setPeerStatus });
    pairing.start();
    return () => pairing.close();
  }, [transport, code, uid, Boolean(me)]);

  // Antes de entrar, a contagem vem do documento da sala (mantida pelo host).
  const count = joined ? participants.length : (room.participantes ?? participants.length);

  const join = async () => {
    if (room.status === ROOM_STATUS.lobby && count >= room.config.maxJogadores) {
      setError('A sala está cheia.');
      return;
    }
    setJoining(true);
    try {
      await transport.updateParticipant(code, uid, { apelido: nickname, entrouEm: new Date().toISOString(), pontuacao: 0, respostas: {}, concluido: false });
      onJoined();
    } catch (reason) {
      setError(`Não foi possível entrar: ${reason?.message || reason}`);
      setJoining(false);
    }
  };

  const handleAnswer = (record) => {
    recordAnswer(record);
    transport.updateParticipant(code, uid, answerPatch(me, record)).catch((reason) => setError(`Sua resposta não foi enviada: ${reason?.message || reason}`));
  };

  const finish = () => {
    transport.updateParticipant(code, uid, { concluido: true }).catch(() => {});
    setSessionQuestions([]);
  };

  const position = ranking.find((row) => row.uid === uid);
  const header = (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-teal-300">Sala {code}</p>
          <h1 className="text-xl font-black text-white">{room.titulo}</h1>
          {me && <p className="text-sm text-slate-400">Você é <strong className="text-slate-200">{me.apelido}</strong></p>}
        </div>
        {room.status === ROOM_STATUS.emAndamento && left !== null && (
          <p className="flex items-center gap-2 font-mono text-2xl font-black text-white" role="timer" aria-label={`Tempo restante: ${formatClock(left)}`}>
            <Clock3 className="h-6 w-6 text-teal-300" aria-hidden="true" />{formatClock(left)}
          </p>
        )}
      </div>
      {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
    </Card>
  );

  // Entrou, mas a lista com o próprio registro ainda não chegou.
  if (!me && joined) {
    return <div className="space-y-4">{header}<Notice tone="info">Entrando na sala…</Notice></div>;
  }

  // 1. Ainda não entrou: apelido sorteado.
  if (!me) {
    return (
      <div className="space-y-4">
        {header}
        {room.status === ROOM_STATUS.encerrada ? (
          <Notice tone="info">Esta sala já foi encerrada.</Notice>
        ) : (
          <Card>
            <h2 className="text-lg font-bold text-white">Seu apelido nesta sala</h2>
            <p className="mt-1 text-sm text-slate-400">Para proteger sua privacidade, você não digita nome: o apelido é sorteado.</p>
            <p className="mt-4 text-3xl font-black text-teal-200" aria-live="polite">{nickname}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => setNickname((current) => drawNickname(Math.random, current))} className={buttonSecondary}>
                <Shuffle className="h-4 w-4" aria-hidden="true" /> Sortear outro
              </button>
              <button type="button" disabled={joining} onClick={join} className={buttonPrimary}>Entrar na sala</button>
            </div>
          </Card>
        )}
        <button type="button" onClick={onLeave} className={buttonSecondary}>Voltar</button>
      </div>
    );
  }

  // 2. Respondendo as questões.
  if (answering && sessionQuestions?.length) {
    return (
      <>
        <SessionPlayer
          key={`${code}-${uid}`}
          questions={sessionQuestions}
          index={index}
          allowHelp={false}
          onAnswer={handleAnswer}
          onFinish={finish}
          endLabel="Entregar"
          headerExtra={<span className="font-mono font-bold text-white" role="timer" aria-label={`Tempo restante: ${formatClock(left)}`}>{formatClock(left)}</span>}
        />
        <PeerConnectionIndicator roomCode={transport.kind === 'firestore' ? code : null} peers={peerStatus.peers || []} participants={Object.fromEntries(participants.map((item) => [item.uid, item]))} />
      </>
    );
  }

  // 3. Esperando o início, esperando os outros ou vendo o resultado.
  const ended = room.status === ROOM_STATUS.encerrada || (room.status === ROOM_STATUS.emAndamento && left === 0);
  return (
    <div className="space-y-4">
      {header}
      {room.status === ROOM_STATUS.lobby && (
        <Notice tone="info">Você está na sala. Aguarde o professor iniciar o desafio. ({count} participante(s) até agora.)</Notice>
      )}
      {room.status === ROOM_STATUS.emAndamento && !ended && (
        <Notice tone="success">Você terminou! Seu resultado já foi enviado. Acompanhe o ranking até o fim do tempo.</Notice>
      )}
      {room.status !== ROOM_STATUS.lobby && (
        <Card>
          <h2 className="text-lg font-bold text-white">{ended ? 'Resultado final' : 'Ranking ao vivo'}</h2>
          {position && <p className="mt-1 text-sm text-slate-300">Sua posição: <strong className="text-white">{position.posicao}º</strong> de {ranking.length}, com {position.pontuacao} pontos e {position.corretas} acerto(s) em {total} questões.</p>}
          <div className="mt-3"><Ranking ranking={ranking} totalQuestoes={total} destaque={uid} /></div>
        </Card>
      )}
      <button type="button" onClick={onLeave} className={buttonSecondary}>Sair da sala</button>
    </div>
  );
}
