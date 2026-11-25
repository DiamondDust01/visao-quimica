import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, X } from 'lucide-react';
import { buttonPrimary, buttonSecondary } from './ui.jsx';

export default function OfertaGuia({ onStart, onDismiss }) {
  const startRef = useRef(null);
  const returnFocus = useRef(null);

  const dismiss = () => {
    onDismiss();
    returnFocus.current?.focus?.({ preventScroll: true });
  };

  useEffect(() => {
    returnFocus.current = document.activeElement;
    startRef.current?.focus({ preventScroll: true });
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      dismiss();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/75 p-4 sm:items-center">
      <button type="button" tabIndex={-1} aria-label="Agora não" onClick={dismiss} className="absolute inset-0 h-full w-full cursor-default" />
      <section role="dialog" aria-modal="true" aria-labelledby="oferta-guia-titulo" className="relative w-full max-w-md rounded-2xl border border-teal-400/50 bg-slate-900 p-5 text-slate-100 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-teal-300">
              <BookOpen className="h-4 w-4" aria-hidden="true" /> Guia de uso
            </p>
            <h2 id="oferta-guia-titulo" className="mt-1 text-xl font-black text-white">Quer uma orientação rápida?</h2>
          </div>
          <button type="button" onClick={dismiss} aria-label="Fechar oferta do guia" className="-m-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-3 text-sm text-slate-300">O passeio é opcional: não escolhe uma etapa nem inicia uma sessão.</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={dismiss} className={buttonSecondary}>Agora não</button>
          <button ref={startRef} type="button" onClick={onStart} className={buttonPrimary}>Conhecer o app</button>
        </div>
      </section>
    </div>,
    document.body
  );
}
