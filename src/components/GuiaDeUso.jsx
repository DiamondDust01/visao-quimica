import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { GUIA_PASSOS, GUIA_SECOES } from '../app/guia.js';
import { buttonPrimary, buttonSecondary } from './ui.jsx';

// Guia de uso: contorna o elemento do passo atual, escurece o resto da tela e mostra um
// pop-up com a explicação. Os passos vêm de src/app/guia.js; `onStep` leva o app até a
// tela do passo antes de procurar o elemento.

const MARGIN = 12;
const GAP = 14;
const PAD = 6;
const MAX_WIDTH = 400;
const FIND_ATTEMPTS = 40;
const OPTIONAL_ATTEMPTS = 8;
const FIND_INTERVAL = 50;

// Primeiro elemento visível com o data-guia pedido (o app tem duas barras de abas, só uma aparece).
const findTarget = (name) => [...document.querySelectorAll(`[data-guia="${name}"]`)].find((element) => {
  const box = element.getBoundingClientRect();
  return element.getClientRects().length > 0 && box.width > 0 && box.height > 0;
}) || null;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Elementos fixos ou grudados (cabeçalho, barras) não rolam com a página.
const isPinned = (element) => {
  for (let node = element; node && node !== document.body; node = node.parentElement) {
    const position = getComputedStyle(node).position;
    if (position === 'fixed' || position === 'sticky') return true;
  }
  return false;
};

// Rola a página para o elemento ficar no alto da área visível (abaixo do cabeçalho), deixando
// espaço embaixo para o pop-up.
const TOP_OFFSET = 88;
const scrollToTarget = (element) => {
  if (isPinned(element)) return;
  const box = element.getBoundingClientRect();
  window.scrollBy({ top: box.top - TOP_OFFSET, behavior: 'instant' });
};

// Retângulo do destaque, limitado à área visível (elementos altos não cabem inteiros).
const measure = (element) => {
  const box = element.getBoundingClientRect();
  const top = clamp(box.top - PAD, MARGIN / 2, window.innerHeight - MARGIN / 2);
  const bottom = clamp(box.bottom + PAD, MARGIN / 2, window.innerHeight - MARGIN / 2);
  const left = clamp(box.left - PAD, MARGIN / 2, window.innerWidth - MARGIN / 2);
  const right = clamp(box.right + PAD, MARGIN / 2, window.innerWidth - MARGIN / 2);
  return { top, left, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
};

export default function GuiaDeUso({ onStep, onClose }) {
  const [position, setPosition] = useState(0);
  const [rect, setRect] = useState(null);
  const [popup, setPopup] = useState({ top: 0, left: 0, width: MAX_WIDTH, ready: false });
  const [missing, setMissing] = useState(false);
  const targetRef = useRef(null);
  const direction = useRef(1);
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;

  const step = GUIA_PASSOS[position];
  const last = position === GUIA_PASSOS.length - 1;

  const go = useCallback((delta) => {
    direction.current = delta;
    setPosition((current) => clamp(current + delta, 0, GUIA_PASSOS.length - 1));
  }, []);

  // Leva o app até a tela do passo e espera o elemento aparecer.
  useEffect(() => {
    let cancelled = false;
    let timer = null;
    let attempts = 0;
    targetRef.current = null;
    setRect(null);
    setMissing(false);
    setPopup((current) => ({ ...current, ready: false }));
    onStepRef.current?.(step);

    const settle = () => {
      if (cancelled) return;
      if (!step.alvo) {
        setMissing(false);
        setPopup((current) => ({ ...current, ready: true }));
        return;
      }
      const element = findTarget(step.alvo);
      if (element) {
        targetRef.current = element;
        scrollToTarget(element);
        // Espera a rolagem terminar antes de medir.
        timer = setTimeout(() => {
          if (!cancelled) {
            setRect(measure(element));
            setPopup((current) => ({ ...current, ready: true }));
          }
        }, 60);
        return;
      }
      attempts += 1;
      if (attempts < (step.opcional ? OPTIONAL_ATTEMPTS : FIND_ATTEMPTS)) {
        timer = setTimeout(settle, FIND_INTERVAL);
        return;
      }
      // Não achou: pula passos opcionais; os demais aparecem no centro.
      if (step.opcional) {
        const next = position + direction.current;
        if (next >= 0 && next < GUIA_PASSOS.length) setPosition(next);
        else onClose();
        return;
      }
      setMissing(true);
      setPopup((current) => ({ ...current, ready: true }));
    };
    timer = setTimeout(settle, FIND_INTERVAL);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  // Reposiciona ao redimensionar ou rolar.
  useEffect(() => {
    const update = () => {
      if (targetRef.current && document.contains(targetRef.current)) setRect(measure(targetRef.current));
    };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, []);

  // Posição do pop-up: abaixo do destaque, ou acima, ou fixo na base se não couber.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !popup.ready) return;
    const width = Math.min(MAX_WIDTH, window.innerWidth - MARGIN * 2);
    const height = dialog.offsetHeight;
    let top;
    let left;
    if (!rect) {
      top = Math.max(MARGIN, (window.innerHeight - height) / 2);
      left = (window.innerWidth - width) / 2;
    } else {
      const below = window.innerHeight - (rect.top + rect.height) - GAP - MARGIN;
      const above = rect.top - GAP - MARGIN;
      if (below >= height) top = rect.top + rect.height + GAP;
      else if (above >= height) top = rect.top - GAP - height;
      else top = window.innerHeight - height - MARGIN;
      top = clamp(top, MARGIN, Math.max(MARGIN, window.innerHeight - height - MARGIN));
      left = clamp(rect.left + rect.width / 2 - width / 2, MARGIN, window.innerWidth - width - MARGIN);
    }
    setPopup((current) => (current.top === top && current.left === left && current.width === width ? current : { ...current, top, left, width }));
  }, [rect, popup.ready, position, missing]);

  // Foco no título a cada passo (leitores de tela anunciam o pop-up).
  useEffect(() => {
    if (popup.ready) headingRef.current?.focus({ preventScroll: true });
  }, [popup.ready, position]);

  // Teclado: Esc sai, setas navegam, Tab fica dentro do pop-up.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (position < GUIA_PASSOS.length - 1) go(1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (position > 0) go(-1);
      } else if (event.key === 'Tab' && dialogRef.current) {
        const focusable = [...dialogRef.current.querySelectorAll('button:not([disabled])')];
        if (!focusable.length) return;
        const first = focusable[0];
        const lastButton = focusable[focusable.length - 1];
        if (!dialogRef.current.contains(document.activeElement)) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          lastButton.focus();
        } else if (!event.shiftKey && document.activeElement === lastButton) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [position, go, onClose]);

  const section = GUIA_SECOES[step.tela];
  return createPortal(
    <div className="fixed inset-0 z-[100]" data-guia-overlay="">
      {/* Bloqueia cliques na tela por baixo enquanto o guia está aberto. */}
      <div className="absolute inset-0" aria-hidden="true" />
      {rect ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-xl border-2 border-teal-300 transition-all duration-200 motion-reduce:transition-none"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.74)' }}
        />
      ) : (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-slate-950/75" />
      )}

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guia-titulo"
        aria-describedby="guia-texto"
        className="absolute rounded-2xl border border-teal-400/60 bg-slate-900 p-4 text-slate-100 shadow-2xl"
        style={{ top: popup.top, left: popup.left, width: popup.width, visibility: popup.ready ? 'visible' : 'hidden' }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-300">{section} · passo {position + 1} de {GUIA_PASSOS.length}</p>
          <button type="button" onClick={onClose} aria-label="Fechar o guia" title="Fechar o guia (Esc)" className="-mr-1 -mt-1 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <h2 id="guia-titulo" ref={headingRef} tabIndex={-1} className="mt-1 text-lg font-black text-white outline-none">{step.titulo}</h2>
        <p id="guia-texto" className="mt-2 text-sm leading-relaxed text-slate-300">{step.texto}</p>
        {missing && <p className="mt-2 text-xs text-amber-200">Este item não aparece na tela agora, mas a explicação continua valendo.</p>}
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-700/70" aria-hidden="true">
          <div className="h-full rounded-full bg-teal-400" style={{ width: `${Math.round(((position + 1) / GUIA_PASSOS.length) * 100)}%` }} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-slate-400 underline-offset-2 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300">
            {last ? 'Fechar' : 'Sair do guia'}
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={() => go(-1)} disabled={position === 0} className={buttonSecondary}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Anterior
            </button>
            {last
              ? <button type="button" onClick={onClose} className={buttonPrimary}>Concluir</button>
              : <button type="button" onClick={() => go(1)} className={buttonPrimary}>Próximo <ChevronRight className="h-4 w-4" aria-hidden="true" /></button>}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
