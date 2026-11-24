import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, X } from 'lucide-react';
import ChemText from './ChemText.jsx';
import { GlossarioContexto } from './glossarioContexto.js';
import { criarBuscador, termoBloqueado } from '../domain/glossario.js';
import { GLOSSARIO } from '../data/index.js';

// Dicionário embutido das questões. As palavras menos comuns ficam sublinhadas; ao
// tocar numa delas, um balão pergunta se o estudante quer a explicação. Consultar o
// glossário não desconta pontos. Antes da resposta, os termos que são o próprio
// assunto cobrado na questão não aparecem marcados (ver termoBloqueado).

const BUSCADOR = criarBuscador(GLOSSARIO);
const MARGEM = 16;
const LARGURA = 320;

export function GlossarioProvider({ temaId, respondida, children }) {
  const [aberto, setAberto] = useState(null);
  const bloqueado = useCallback((entrada) => termoBloqueado(entrada, temaId, respondida), [temaId, respondida]);
  const valor = useMemo(() => ({ buscador: BUSCADOR, bloqueado, aberto, setAberto, Termo: TermoGlossario }), [bloqueado, aberto]);
  return <GlossarioContexto.Provider value={valor}>{children}</GlossarioContexto.Provider>;
}

// Posição do balão: abaixo da palavra ou, sem espaço, acima; sempre dentro da tela.
const posicionar = (botao, balao) => {
  const alvo = botao.getBoundingClientRect();
  const largura = Math.min(LARGURA, window.innerWidth - MARGEM * 2);
  const altura = balao?.offsetHeight || 160;
  const left = Math.min(Math.max(alvo.left, MARGEM), window.innerWidth - largura - MARGEM);
  const cabeAbaixo = alvo.bottom + 8 + altura <= window.innerHeight - MARGEM;
  const top = cabeAbaixo ? alvo.bottom + 8 : Math.max(MARGEM, alvo.top - 8 - altura);
  return { left, top, width: largura };
};

function TermoGlossario({ texto, entrada, contexto }) {
  const id = useId();
  const { aberto, setAberto } = contexto;
  const estaAberto = aberto === id;
  const [etapa, setEtapa] = useState('pergunta');
  const [estilo, setEstilo] = useState(null);
  const botaoRef = useRef(null);
  const balaoRef = useRef(null);

  const fechar = useCallback((devolverFoco = true) => {
    setAberto((atual) => (atual === id ? null : atual));
    if (devolverFoco) botaoRef.current?.focus();
  }, [id, setAberto]);

  const alternar = () => {
    setEtapa('pergunta');
    setAberto(estaAberto ? null : id);
  };

  useLayoutEffect(() => {
    if (!estaAberto || !botaoRef.current) return undefined;
    const atualizar = () => setEstilo(posicionar(botaoRef.current, balaoRef.current));
    atualizar();
    window.addEventListener('resize', atualizar);
    window.addEventListener('scroll', atualizar, true);
    return () => {
      window.removeEventListener('resize', atualizar);
      window.removeEventListener('scroll', atualizar, true);
    };
  }, [estaAberto, etapa]);

  // Foco no primeiro botão do balão a cada etapa.
  useEffect(() => {
    if (estaAberto) balaoRef.current?.querySelector('button')?.focus();
  }, [estaAberto, etapa]);

  // Fecha ao tocar fora do balão.
  useEffect(() => {
    if (!estaAberto) return undefined;
    const fora = (event) => {
      if (balaoRef.current?.contains(event.target) || botaoRef.current?.contains(event.target)) return;
      fechar(false);
    };
    document.addEventListener('pointerdown', fora);
    return () => document.removeEventListener('pointerdown', fora);
  }, [estaAberto, fechar]);

  const teclas = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      fechar();
    }
  };

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        onClick={alternar}
        aria-haspopup="dialog"
        aria-expanded={estaAberto}
        data-termo={entrada.id}
        title="Palavra com explicação no glossário"
        className="cursor-help rounded-sm underline decoration-sky-400 decoration-dotted decoration-2 underline-offset-4 transition hover:bg-sky-500/15 hover:decoration-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300"
      >
        {texto}
      </button>
      {estaAberto && createPortal(
        <div
          ref={balaoRef}
          role="dialog"
          aria-label={`Glossário: ${entrada.termo}`}
          data-glossario-balao=""
          onKeyDown={teclas}
          style={estilo ? { position: 'fixed', ...estilo } : { position: 'fixed', visibility: 'hidden' }}
          className="z-[70] rounded-xl border border-sky-500/50 bg-slate-900 p-4 text-left text-sm font-normal leading-relaxed text-slate-100 shadow-2xl shadow-black/40"
        >
          {etapa === 'pergunta' ? (
            <div className="space-y-3">
              <p className="flex items-start gap-2">
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" aria-hidden="true" />
                <span>Quer uma explicação de <strong className="text-white">“{texto}”</strong>?</span>
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setEtapa('explicacao')} className="rounded-lg bg-sky-700 px-3 py-2 font-bold text-white hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300">Sim, explicar</button>
                <button type="button" onClick={() => fechar()} className="rounded-lg border border-slate-600 px-3 py-2 font-semibold text-slate-200 hover:border-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300">Agora não</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-sky-200 first-letter:uppercase">{entrada.termo}</p>
                <button type="button" onClick={() => fechar()} aria-label="Fechar explicação" className="-m-1 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              {entrada.sinonimo && <p className="text-slate-300"><span className="font-semibold text-slate-200">Em outras palavras: </span>{entrada.sinonimo}</p>}
              <p><ChemText text={entrada.explicacao} semGlossario /></p>
              <p className="text-xs text-slate-500">Consultar o glossário não desconta pontos.</p>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
