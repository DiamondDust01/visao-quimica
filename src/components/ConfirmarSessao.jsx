import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, TriangleAlert, X } from 'lucide-react';
import { buttonPrimary, buttonSecondary } from './ui.jsx';
import { Difficulty } from './SubtemaItem.jsx';
import { unstudiedPrerequisites } from '../domain/recomendador.js';

// Confirmação antes de começar a estudar: toda sessão de questões (Início, Trilha, Prática,
// Mentor, temas rápidos e "repetir") passa por aqui. Mostra o que vai ser estudado e quantas
// questões, e só começa com "Sim, começar". Esc, "Cancelar" ou um toque fora desistem.
// pedido: { subtemaIds, questions, origemNome }
const MAX_LISTA = 6;

export default function ConfirmarSessao({ pedido, index, progress, onConfirm, onCancel }) {
  const tituloId = useId();
  const painelRef = useRef(null);
  const voltarFoco = useRef(null);
  const ids = pedido.subtemaIds;
  const nodes = ids.map((id) => index.get(id)).filter(Boolean);
  const unico = nodes.length === 1 ? nodes[0] : null;
  const faltando = unstudiedPrerequisites(index, ids, progress);
  const nomesFaltando = [...new Set(faltando.flatMap((item) => item.faltando))].map((id) => index.get(id)?.nome).filter(Boolean);

  useEffect(() => {
    voltarFoco.current = document.activeElement;
    painelRef.current?.querySelector('[data-confirmar]')?.focus({ preventScroll: true });
    const teclas = (event) => {
      if (event.key !== 'Escape' || document.querySelector('[data-guia-overlay]')) return;
      event.preventDefault();
      cancelar();
    };
    document.addEventListener('keydown', teclas);
    return () => document.removeEventListener('keydown', teclas);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelar = () => {
    onCancel();
    voltarFoco.current?.focus?.({ preventScroll: true });
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center">
      <button type="button" tabIndex={-1} aria-label="Cancelar" onClick={cancelar} className="absolute inset-0 h-full w-full cursor-default bg-slate-950/70" />
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        data-confirmar-sessao=""
        className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-teal-300">Confirmar tema de estudo</p>
            <h2 id={tituloId} className="mt-1 text-xl font-black text-white">
              {unico ? 'Estudar este tema agora?' : `Estudar estes ${nodes.length} temas agora?`}
            </h2>
          </div>
          <button type="button" onClick={cancelar} aria-label="Cancelar" className="-m-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {unico ? (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
            <p className="font-bold text-white">{unico.nome}</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-300/80">{index.areaOf(unico.id)?.nome}</p>
            <p className="mt-1 text-sm text-slate-400">{unico.descricao}</p>
            <div className="mt-2"><Difficulty value={unico.dificuldade} /></div>
          </div>
        ) : (
          <ul className="mt-4 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-sm">
            {nodes.slice(0, MAX_LISTA).map((node) => (
              <li key={node.id}><span className="font-semibold text-slate-100">{node.nome}</span> <span className="text-slate-500">· {index.areaOf(node.id)?.nome}</span></li>
            ))}
            {nodes.length > MAX_LISTA && <li className="text-slate-500">e mais {nodes.length - MAX_LISTA} tema(s).</li>}
          </ul>
        )}

        <p className="mt-3 text-sm text-slate-300">
          <strong className="text-white">{pedido.questions.length} {pedido.questions.length === 1 ? 'questão' : 'questões'}</strong>, uma por vez, com a resolução depois de cada resposta. Dá para encerrar quando quiser: o que você responder fica salvo, e no fim você volta para {pedido.origemNome}.
        </p>

        {nomesFaltando.length > 0 && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Este estudo usa conteúdos que você ainda não praticou: {nomesFaltando.slice(0, 3).join(', ')}{nomesFaltando.length > 3 ? ` e mais ${nomesFaltando.length - 3}` : ''}. Dá para continuar mesmo assim.</span>
          </p>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={cancelar} className={buttonSecondary}>Cancelar</button>
          <button type="button" data-confirmar="" onClick={onConfirm} className={buttonPrimary}><Play className="h-4 w-4" aria-hidden="true" /> Sim, começar</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
