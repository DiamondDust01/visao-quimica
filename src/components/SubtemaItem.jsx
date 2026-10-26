import React from 'react';
import { CircleCheck, CircleDashed, CircleDot, RotateCcw } from 'lucide-react';
import { STATUS_LABELS } from '../domain/progresso.js';

// O status sempre aparece com ícone e texto, nunca só pela cor.
const STATUS_STYLE = {
  'nao-iniciado': { Icon: CircleDashed, tone: 'text-slate-400' },
  'em-andamento': { Icon: CircleDot, tone: 'text-sky-300' },
  revisar: { Icon: RotateCcw, tone: 'text-amber-300' },
  dominado: { Icon: CircleCheck, tone: 'text-emerald-300' }
};

export function StatusBadge({ status }) {
  const { Icon, tone } = STATUS_STYLE[status] || STATUS_STYLE['nao-iniciado'];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${tone}`}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Difficulty({ value }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((level) => (
          <span key={level} className={`h-1.5 w-1.5 rounded-full ${level <= value ? 'bg-teal-300' : 'bg-slate-700'}`} />
        ))}
      </span>
      Dificuldade {value} de 5
    </span>
  );
}

// Uma linha da trilha: nome, área, dificuldade, status e de quais subtemas ele depende.
export default function SubtemaItem({ node, areaNome, status, prerequisitos = [], position, onPractice }) {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-800 bg-slate-900/85 p-3 backdrop-blur-sm">
      {position !== undefined && (
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 font-mono text-xs font-bold text-slate-300" aria-hidden="true">
          {position}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h3 className="font-bold text-white">{node.nome}</h3>
          <StatusBadge status={status} />
        </div>
        <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-teal-300/80">{areaNome}</p>
        <p className="mt-1 text-sm text-slate-400">{node.descricao}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Difficulty value={node.dificuldade} />
          {prerequisitos.length > 0 && <span className="text-xs text-slate-500">Depende de: {prerequisitos.join(', ')}</span>}
          {onPractice && (
            <button type="button" onClick={onPractice} aria-label={`Praticar ${node.nome}`} className="ml-auto rounded-lg border border-teal-500/50 px-3 py-1 text-xs font-bold text-teal-200 transition hover:bg-teal-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300">
              Praticar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
