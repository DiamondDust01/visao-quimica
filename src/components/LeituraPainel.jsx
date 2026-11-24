import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Lightbulb, X } from 'lucide-react';
import ChemText from './ChemText.jsx';
import { buttonPrimary } from './ui.jsx';

// Material de leitura de um subtema, aberto quando o estudante diz que não sabe o conteúdo
// (na questão, na confirmação da sessão ou na Trilha). Abre por cima da tela e, ao fechar,
// devolve o foco a quem abriu. Ler o material não desconta pontos.
// leitura: { subtemaId, introducao, secoes: [{ titulo, texto }], pontosChave: [], exemplo }
export default function LeituraPainel({ leitura, node, areaNome, voltarLabel = 'Fechar', onClose }) {
  const tituloId = useId();
  const painelRef = useRef(null);
  const voltarFoco = useRef(null);

  useEffect(() => {
    voltarFoco.current = document.activeElement;
    painelRef.current?.focus({ preventScroll: true });
    const teclas = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      fechar();
    };
    document.addEventListener('keydown', teclas, true);
    return () => document.removeEventListener('keydown', teclas, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fechar = () => {
    onClose();
    voltarFoco.current?.focus?.({ preventScroll: true });
  };

  return createPortal(
    <div className="fixed inset-0 z-[65] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" tabIndex={-1} aria-label={voltarLabel} onClick={fechar} className="absolute inset-0 h-full w-full cursor-default bg-slate-950/75" />
      <article
        ref={painelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        data-leitura={leitura.subtemaId}
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-3xl border border-slate-700 bg-slate-900 shadow-2xl outline-none sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-800 p-5 pb-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-sky-300">
              <BookOpen className="h-4 w-4" aria-hidden="true" /> Material de leitura
            </p>
            <h2 id={tituloId} className="mt-1 text-xl font-black text-white">{node?.nome}</h2>
            {areaNome && <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{areaNome}</p>}
          </div>
          <button type="button" onClick={fechar} aria-label={voltarLabel} className="-m-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto p-5 text-slate-200">
          <p className="leading-relaxed"><ChemText text={leitura.introducao} /></p>
          {leitura.secoes.map((secao) => (
            <section key={secao.titulo}>
              <h3 className="font-bold text-white">{secao.titulo}</h3>
              <p className="mt-1 leading-relaxed text-slate-300"><ChemText text={secao.texto} /></p>
            </section>
          ))}
          {leitura.exemplo && (
            <div className="rounded-xl border border-teal-500/40 bg-teal-500/10 p-3">
              <p className="flex items-center gap-2 text-sm font-bold text-teal-200"><Lightbulb className="h-4 w-4" aria-hidden="true" /> Exemplo</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-200"><ChemText text={leitura.exemplo} /></p>
            </div>
          )}
          <section>
            <h3 className="font-bold text-white">Para lembrar</h3>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-300">
              {leitura.pontosChave.map((ponto) => <li key={ponto}><ChemText text={ponto} /></li>)}
            </ul>
          </section>
          <p className="text-xs text-slate-500">Texto original do app, ainda sem revisão de professor. Ler o material não desconta pontos.</p>
        </div>

        <footer className="flex justify-end border-t border-slate-800 p-4">
          <button type="button" onClick={fechar} className={buttonPrimary}>{voltarLabel}</button>
        </footer>
      </article>
    </div>,
    document.body
  );
}
