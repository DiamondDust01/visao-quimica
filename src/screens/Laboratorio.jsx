import React, { useMemo } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { buttonPrimary, Card, Notice } from '../components/ui.jsx';
import { StatusBadge } from '../components/SubtemaItem.jsx';
import { suggestReview, summarizePatterns, JANELA_RECENTE } from '../domain/mentor/revisao.js';
import { statusFor } from '../domain/progresso.js';

// Laboratório do Mentor: diagnóstico local, por regras fixas, a partir do progresso e do
// registro de erros deste aparelho. Não usa IA generativa e não envia nada para fora.
export default function Laboratorio({ index, progress, mentorLog, onPractice }) {
  const suggestions = useMemo(() => suggestReview({ index, progress, log: mentorLog }), [index, progress, mentorLog]);
  const patterns = useMemo(() => summarizePatterns(mentorLog), [mentorLog]);
  const recentErrors = mentorLog.slice(-JANELA_RECENTE).length;
  const answered = Object.values(progress).reduce((sum, entry) => sum + (entry?.respondidas || 0), 0);

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-black text-white">Laboratório do Mentor</h1>
        <p className="mt-2 text-slate-300">
          O Mentor olha suas respostas, reconhece padrões de erro e sugere o que revisar. Na Prática, ele também oferece ajuda em três níveis: uma estratégia geral, a dica da questão e o primeiro passo da resolução.
        </p>
        <p className="mt-3 flex items-start gap-2 text-sm text-slate-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" aria-hidden="true" />
          O Mentor segue regras fixas, escritas para este app. Ele não é uma IA generativa, e nada do que você responde sai deste aparelho.
        </p>
      </Card>

      {answered === 0 && (
        <Notice tone="info">Responda algumas questões na Prática para o Mentor ter o que analisar.</Notice>
      )}

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">O que revisar agora</h2>
            <p className="text-sm text-slate-400">Temas com acerto baixo, a base deles e temas ligados aos seus erros mais repetidos.</p>
          </div>
          {suggestions.length > 0 && (
            <button type="button" onClick={() => onPractice(suggestions.map((item) => item.subtemaId))} className={buttonPrimary}>
              Praticar a revisão <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        {suggestions.length === 0 && answered > 0 && <p className="mt-3 text-sm text-slate-400">Nada pendente: seus erros recentes não formam um padrão, e nenhum tema está com acerto baixo.</p>}
        <ul className="mt-4 space-y-2">
          {suggestions.map(({ subtemaId, motivos }) => {
            const node = index.get(subtemaId);
            return (
              <li key={subtemaId} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-bold text-white">{node.nome}</h3>
                  <StatusBadge status={statusFor(progress[subtemaId])} />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-300/80">{index.areaOf(subtemaId)?.nome}</p>
                <ul className="mt-1 list-disc pl-5 text-sm text-slate-400">
                  {motivos.map((motivo) => <li key={motivo}>{motivo}</li>)}
                </ul>
                <button type="button" onClick={() => onPractice([subtemaId])} aria-label={`Praticar ${node.nome}`} className="mt-2 rounded-lg border border-teal-500/50 px-3 py-1 text-xs font-bold text-teal-200 hover:bg-teal-500/10">
                  Praticar
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-bold text-white">Padrões nos seus erros</h2>
        <p className="text-sm text-slate-400">
          {mentorLog.length
            ? `Com base em ${mentorLog.length} resposta(s) errada(s) registradas neste aparelho (${recentErrors} recentes).`
            : 'Ainda não há respostas erradas registradas.'}
        </p>
        {patterns.length === 0 && mentorLog.length > 0 && (
          <p className="mt-3 text-sm text-slate-400">Os erros registrados foram explicados pelos erros comuns de cada questão, sem um padrão geral repetido.</p>
        )}
        <ul className="mt-4 space-y-2">
          {patterns.map((item) => (
            <li key={item.padrao} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <p className="font-bold text-white">{item.nome} <span className="font-mono text-sm text-slate-400">· {item.vezes} vez(es)</span></p>
              <p className="mt-1 text-sm text-slate-300">{item.dica}</p>
              {item.revisao.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">Para revisar: {item.revisao.map((id) => index.get(id)?.nome).filter(Boolean).join(', ')}.</p>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
