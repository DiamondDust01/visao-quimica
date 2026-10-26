import React, { useMemo, useState } from 'react';
import { buttonPrimary, buttonSecondary, Card, Notice, inputClass } from '../../components/ui.jsx';
import TemaSelector from '../../components/questoes/TemaSelector.jsx';
import { createRoomState, validateRoomConfig, ROOM_SIZES, ROOM_TIMES } from '../../domain/sala.js';
import { createRoomCode } from '../../platform/roomSession.js';
import { MAX_ROOM_PLAYERS } from '../../platform/competitionRooms.js';
import { getTransport } from '../../app/useRoom.js';

// Formulário do professor: temas, número de questões, tempo e limites de participantes.
export default function CriarSala({ index, questions, etapas, progress, hostUid, onCreated, onCancel }) {
  const [titulo, setTitulo] = useState('Desafio de Química');
  const [selected, setSelected] = useState(() => new Set());
  const [quantidade, setQuantidade] = useState(10);
  const [tempoMin, setTempoMin] = useState(20);
  const [minJogadores, setMinJogadores] = useState(1);
  const [maxJogadores, setMaxJogadores] = useState(MAX_ROOM_PLAYERS);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const counts = useMemo(() => {
    const map = new Map();
    questions.forEach((question) => map.set(question.temaId, (map.get(question.temaId) || 0) + 1));
    return map;
  }, [questions]);
  const disponiveis = [...selected].reduce((sum, id) => sum + (counts.get(id) || 0), 0);

  const create = async (event) => {
    event.preventDefault();
    const config = { subtemaIds: [...selected], quantidade, tempoMin, minJogadores, maxJogadores, disponiveis };
    const check = validateRoomConfig(config);
    if (!check.valid) {
      setError(check.error);
      return;
    }
    setCreating(true);
    setError('');
    try {
      const transport = getTransport();
      let code = createRoomCode();
      // Evita reaproveitar o código de uma sala que já existe.
      for (let attempt = 0; attempt < 5 && (await transport.roomInfo(code)).exists; attempt += 1) code = createRoomCode();
      const state = createRoomState({ titulo: titulo.trim() || 'Desafio de Química', ...config, questoes: questions });
      await transport.createRoom({ code, title: state.titulo, hostUid, state });
      onCreated(code);
    } catch (reason) {
      setError(`Não foi possível criar a sala: ${reason?.message || reason}`);
      setCreating(false);
    }
  };

  const numberField = (label, value, setter, min, max) => (
    <label className="flex flex-col gap-1 text-sm text-slate-300">
      {label}
      <input type="number" min={min} max={max} value={value} onChange={(event) => setter(Number(event.target.value))} className={inputClass} />
    </label>
  );

  return (
    <form onSubmit={create} className="space-y-4 pb-24">
      <Card>
        <h1 className="text-2xl font-black text-white">Criar sala</h1>
        <p className="mt-2 text-slate-300">Escolha os temas e as regras. As questões são sorteadas agora, e todos os participantes vão responder as mesmas.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="flex flex-col gap-1 text-sm text-slate-300 sm:col-span-2 lg:col-span-1">
            Título
            <input type="text" value={titulo} maxLength={60} onChange={(event) => setTitulo(event.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Questões
            <select value={quantidade} onChange={(event) => setQuantidade(Number(event.target.value))} className={inputClass}>
              {ROOM_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Tempo (minutos)
            <select value={tempoMin} onChange={(event) => setTempoMin(Number(event.target.value))} className={inputClass}>
              {ROOM_TIMES.map((minutes) => <option key={minutes} value={minutes}>{minutes}</option>)}
            </select>
          </label>
          {numberField('Mínimo de participantes', minJogadores, setMinJogadores, 1, MAX_ROOM_PLAYERS)}
          {numberField('Máximo de participantes', maxJogadores, setMaxJogadores, 1, MAX_ROOM_PLAYERS)}
        </div>
      </Card>

      <TemaSelector index={index} progress={progress} questionCount={(id) => counts.get(id) || 0} etapas={etapas} selected={selected} onChange={setSelected} />

      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4rem)] z-20 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md md:bottom-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <p className="min-w-0 flex-1 text-sm text-slate-300" aria-live="polite">
            <strong className="text-white">{selected.size}</strong> tema(s) · {disponiveis} questões disponíveis
            {disponiveis > 0 && disponiveis < quantidade && ` (a sala terá ${disponiveis})`}
          </p>
          {error && <div className="w-full sm:w-auto"><Notice tone="error">{error}</Notice></div>}
          <button type="button" onClick={onCancel} className={buttonSecondary}>Cancelar</button>
          <button type="submit" disabled={creating} className={buttonPrimary}>{creating ? 'Criando…' : 'Criar sala'}</button>
        </div>
      </div>
    </form>
  );
}
