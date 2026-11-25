import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { GUIA_PARTES } from '../app/guia.js';
import { buttonSecondary } from './ui.jsx';

export default function GuiaIndice({ mentorLiberado, etapaEscolhida, onSelect, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-3 sm:p-6">
      <section role="dialog" aria-modal="true" aria-labelledby="guia-indice-titulo" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-teal-400/60 bg-slate-900 p-4 text-slate-100 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="guia-indice-titulo" className="text-xl font-black text-white">Guia de uso</h2>
            <p className="mt-1 text-sm text-slate-300">Escolha uma parte. Você pode fechar ou sair de qualquer passeio quando quiser.</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Fechar guia de uso" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {GUIA_PARTES.map((parte) => {
            const bloqueada = (parte.precisaEtapa && !etapaEscolhida) || (parte.precisaMentor && !mentorLiberado);
            return (
              <button
                key={parte.id}
                data-guia-parte={parte.id}
                type="button"
                disabled={bloqueada}
                onClick={() => onSelect(parte.id)}
                className={`rounded-xl border border-slate-700 p-3 text-left transition hover:border-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300 disabled:cursor-not-allowed disabled:opacity-50 ${parte.id === 'completo' ? 'sm:col-span-2' : ''}`}
              >
                <span className="block font-bold text-white">{parte.titulo}</span>
                <span className="mt-1 block text-sm text-slate-400">{parte.descricao}</span>
                {bloqueada && <span className="mt-1 block text-xs text-amber-200">{parte.precisaEtapa ? 'Disponível depois de escolher uma etapa.' : 'Disponível quando o Mentor tiver sugestões.'}</span>}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className={buttonSecondary}>Agora não</button>
        </div>
      </section>
    </div>,
    document.body
  );
}
