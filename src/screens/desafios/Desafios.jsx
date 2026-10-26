import React, { useMemo, useState } from 'react';
import { LogIn, PlusCircle } from 'lucide-react';
import { buttonPrimary, buttonSecondary, Card, Notice, inputClass } from '../../components/ui.jsx';
import CriarSala from './CriarSala.jsx';
import PainelHost from './PainelHost.jsx';
import SalaParticipante from './SalaParticipante.jsx';
import { getTransport, readMembership, useRoomData, writeMembership } from '../../app/useRoom.js';
import { isValidRoomCode, normalizeRoomCode } from '../../platform/roomSession.js';

// Desafios em sala: entrada (código ou link), criação pelo professor, painel e participação.
export default function Desafios({ index, questions, etapas, progress, uid, firebaseEnabled, initialRoomCode, recordAnswer }) {
  const [membership, setMembership] = useState(() => readMembership() || (initialRoomCode ? { code: initialRoomCode, papel: 'participante' } : null));
  const [creating, setCreating] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const transport = getTransport();
  // O aluno só lê a lista de participantes depois de entrar (regra do Firestore).
  const { room, participants, error, listError } = useRoomData(membership?.code, { listarParticipantes: membership?.papel === 'host' || Boolean(membership?.entrou) });
  const questionsById = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions]);

  const enter = (value) => {
    setMembership(value);
    writeMembership(value);
  };
  const leave = () => {
    setMembership(null);
    writeMembership(null);
    setCreating(false);
  };

  const join = async (event) => {
    event.preventDefault();
    const code = normalizeRoomCode(codeInput);
    if (!isValidRoomCode(code)) {
      setJoinError('O código tem 6 letras e números.');
      return;
    }
    const info = await transport.roomInfo(code);
    if (!info.exists) {
      setJoinError(firebaseEnabled ? 'Sala não encontrada. Confira o código.' : 'Sala não encontrada. Na demonstração local, a sala precisa estar aberta em outra aba deste mesmo navegador.');
      return;
    }
    setJoinError('');
    enter({ code, papel: 'participante' });
  };

  if (membership) {
    if (error) return <div className="space-y-4"><Notice tone="error">{error}</Notice><button type="button" onClick={leave} className={buttonSecondary}>Voltar</button></div>;
    if (room === undefined) return <Notice tone="info">Conectando à sala {membership.code}…</Notice>;
    if (room === null) {
      return (
        <div className="space-y-4">
          <Notice tone="warn">A sala {membership.code} não foi encontrada{firebaseEnabled ? '' : ' (na demonstração local, ela precisa estar aberta em outra aba deste navegador)'}.</Notice>
          <button type="button" onClick={leave} className={buttonSecondary}>Voltar</button>
        </div>
      );
    }
    const isHost = membership.papel === 'host' && room.hostUid === uid;
    return (
      <div className="space-y-4">
        {listError && <Notice tone="warn">{listError}</Notice>}
        {isHost
          ? <PainelHost code={membership.code} room={room} participants={participants} transport={transport} onLeave={leave} />
          : <SalaParticipante code={membership.code} room={room} participants={participants} joined={Boolean(membership.entrou)} onJoined={() => enter({ ...membership, entrou: true })} transport={transport} uid={uid} index={index} questionsById={questionsById} recordAnswer={recordAnswer} onLeave={leave} />}
      </div>
    );
  }

  if (creating) {
    return <CriarSala index={index} questions={questions} etapas={etapas} progress={progress} hostUid={uid} onCreated={(code) => { setCreating(false); enter({ code, papel: 'host' }); }} onCancel={() => setCreating(false)} />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-black text-white">Desafios em sala</h1>
        <p className="mt-2 text-slate-300">O professor cria uma sala com temas e tempo; a turma responde as mesmas questões e acompanha o ranking.</p>
      </Card>
      {!firebaseEnabled && (
        <Notice tone="info">Demonstração local: sem servidor configurado, a sala funciona entre abas deste mesmo navegador. Crie a sala numa aba e entre com o código em outra.</Notice>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <form onSubmit={join} className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white"><LogIn className="h-5 w-5 text-teal-300" aria-hidden="true" /> Entrar numa sala</h2>
            <label className="flex flex-col gap-1 text-sm text-slate-300">
              Código da sala
              <input type="text" value={codeInput} onChange={(event) => setCodeInput(normalizeRoomCode(event.target.value))} autoComplete="off" autoCapitalize="characters" placeholder="Ex.: ABC234" className={`${inputClass} font-mono text-xl tracking-[0.3em]`} />
            </label>
            {joinError && <Notice tone="warn">{joinError}</Notice>}
            <button type="submit" className={buttonPrimary}>Entrar</button>
          </form>
        </Card>
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-bold text-white"><PlusCircle className="h-5 w-5 text-teal-300" aria-hidden="true" /> Criar uma sala</h2>
          <p className="mt-2 text-sm text-slate-400">Para professores: escolha temas, número de questões e tempo. Você recebe um código e um QR para a turma entrar.</p>
          <button type="button" onClick={() => setCreating(true)} className={`${buttonSecondary} mt-4`}>Criar sala</button>
        </Card>
      </div>
    </div>
  );
}
