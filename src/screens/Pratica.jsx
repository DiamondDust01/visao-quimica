import React, { useEffect, useMemo, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Bar, buttonPrimary, buttonSecondary, Card, Notice, inputClass } from '../components/ui.jsx';
import TemaSelector from '../components/questoes/TemaSelector.jsx';
import SessionPlayer from '../components/questoes/SessionPlayer.jsx';
import { unstudiedPrerequisites } from '../domain/recomendador.js';
import { buildSession, summarizeSession, SESSION_SIZES } from '../domain/questoes/sessao.js';

const MAX_WARNINGS = 5;

function SessionResult({ summary, index, onRepeat, onChooseAgain, onOpenTab }) {
  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-black text-white">Resultado da sessão</h1>
        <p className="mt-2 text-slate-300">
          Você acertou <strong className="text-white">{summary.corretas}</strong> de <strong className="text-white">{summary.total}</strong> questões
          {summary.dicasUsadas > 0 && `, com ajuda do Mentor em ${summary.dicasUsadas}`}, e somou <strong className="text-teal-200">{summary.pontos} pontos</strong>.
        </p>
        <div className="mt-4"><Bar label="Acertos" value={summary.percentual} large /></div>
      </Card>
      {summary.total > 0 && (
        <Card>
          <h2 className="text-lg font-bold text-white">Por subtema</h2>
          <ul className="mt-3 space-y-3">
            {Object.entries(summary.porSubtema).map(([id, item]) => (
              <li key={id}>
                <Bar label={index.get(id)?.nome || id} value={item.corretas} max={item.total} suffix={` de ${item.total}`} />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">O progresso já foi salvo. Temas com acerto baixo voltam para a revisão em Fundamentos.</p>
        </Card>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onRepeat} className={buttonPrimary}>Nova sessão com os mesmos temas</button>
        <button type="button" onClick={onChooseAgain} className={buttonSecondary}>Escolher outros temas</button>
        <button type="button" onClick={() => onOpenTab('fundamentos')} className={buttonSecondary}>Ver minha trilha</button>
      </div>
    </div>
  );
}

export default function Pratica({ index, questions, etapas, profile, progress, recordAnswer, request, onRequestHandled, onOpenTab }) {
  const [selected, setSelected] = useState(() => new Set());
  const [quantidade, setQuantidade] = useState(10);
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [notice, setNotice] = useState('');

  const countBySubtema = useMemo(() => {
    const counts = new Map();
    questions.forEach((question) => counts.set(question.temaId, (counts.get(question.temaId) || 0) + 1));
    return counts;
  }, [questions]);
  const questionCount = (id) => countBySubtema.get(id) || 0;

  const studentLevel = index.etapaById.get(profile?.etapaId)?.nivel || null;
  const start = (ids, size = quantidade) => {
    const built = buildSession({
      questoes: questions,
      subtemaIds: [...ids],
      quantidade: size,
      nivelDaEtapa: (etapaId) => index.etapaById.get(etapaId)?.nivel ?? 0,
      nivelEstudante: studentLevel
    });
    if (!built.length) return;
    setSummary(null);
    setSession({ id: Date.now(), questions: built, subtemaIds: [...ids] });
  };

  // Pedido vindo de Fundamentos ou do Início: "praticar este tema".
  useEffect(() => {
    if (!request) return;
    const ids = request.subtemaIds.filter((id) => questionCount(id) > 0);
    setSelected(new Set(ids));
    setNotice(ids.length ? '' : 'Esse tema ainda não tem questões. Escolha outro tema abaixo.');
    if (request.autoStart && ids.length) start(ids);
    onRequestHandled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  const warnings = useMemo(() => unstudiedPrerequisites(index, [...selected], progress), [index, selected, progress]);
  const missingIds = [...new Set(warnings.flatMap((warning) => warning.faltando))].filter((id) => questionCount(id) > 0);
  const available = [...selected].reduce((sum, id) => sum + questionCount(id), 0);

  const handleAnswer = (record) => recordAnswer(record);

  if (session && !summary) {
    return (
      <SessionPlayer
        key={session.id}
        questions={session.questions}
        index={index}
        onAnswer={handleAnswer}
        onFinish={(answers) => setSummary(summarizeSession(answers))}
      />
    );
  }

  if (summary) {
    return (
      <SessionResult
        summary={summary}
        index={index}
        onRepeat={() => start(session.subtemaIds)}
        onChooseAgain={() => { setSession(null); setSummary(null); }}
        onOpenTab={onOpenTab}
      />
    );
  }

  return (
    <div className="space-y-4 pb-40">
      <Card>
        <h1 className="text-2xl font-black text-white">Prática</h1>
        <p className="mt-2 text-slate-300">Escolha um ou mais temas e monte sua sessão de questões. A resolução passo a passo aparece depois de cada resposta.</p>
      </Card>
      {notice && <Notice tone="warn">{notice}</Notice>}

      <TemaSelector index={index} progress={progress} questionCount={questionCount} etapas={etapas} selected={selected} onChange={setSelected} />

      {/* Barra fixa com o resumo da seleção. */}
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+4rem)] z-20 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md md:bottom-0">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-3">
          {warnings.length > 0 && (
            <Notice tone="warn">
              <span className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Alguns temas usam conteúdos que você ainda não estudou. Você pode continuar mesmo assim.
                  <ul className="mt-1 list-disc pl-5">
                    {warnings.slice(0, MAX_WARNINGS).map((warning) => (
                      <li key={warning.subtemaId}>{index.get(warning.subtemaId).nome} usa: {warning.faltando.map((id) => index.get(id).nome).join(', ')}</li>
                    ))}
                    {warnings.length > MAX_WARNINGS && <li>e mais {warnings.length - MAX_WARNINGS} tema(s).</li>}
                  </ul>
                  {missingIds.length > 0 && (
                    <button type="button" onClick={() => setSelected(new Set([...selected, ...missingIds]))} className="mt-2 font-semibold underline underline-offset-2">
                      Incluir esses pré-requisitos na sessão
                    </button>
                  )}
                </span>
              </span>
            </Notice>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <p className="min-w-0 flex-1 text-sm text-slate-300" aria-live="polite">
              <strong className="text-white">{selected.size}</strong> tema(s) · {available} questões disponíveis
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              Questões
              <select value={quantidade} onChange={(event) => setQuantidade(Number(event.target.value))} className={`${inputClass} w-20 py-2`}>
                {SESSION_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            {selected.size > 0 && <button type="button" onClick={() => setSelected(new Set())} className={buttonSecondary}>Limpar</button>}
            <button type="button" disabled={!available} onClick={() => start(selected)} className={buttonPrimary}>Começar sessão</button>
          </div>
        </div>
      </div>
    </div>
  );
}
