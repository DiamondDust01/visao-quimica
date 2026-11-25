import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArchiveRestore, Atom, BookOpenText, Calculator, CircleHelp, Hexagon, Info, Moon, Sun, Trash2, UserRound, X } from 'lucide-react';
import { MENU_MAIS } from '../app/navigation.js';
import { useTheme } from '../app/ThemeToggle.jsx';
import { toggleTheme } from '../app/theme.js';
import { COR_DO_GRUPO, corDe } from '../app/cores.js';

// Menu "Mais": painel sob o botão no computador e folha que sobe da base no celular.
// Reúne Ferramentas, Meus dados, Ajuda e Aparência; cada item abre o destino direto.

const ICONS = {
  tabela: Atom,
  'massa-molar': Calculator,
  estruturas: Hexagon,
  etapa: UserRound,
  backup: ArchiveRestore,
  apagar: Trash2,
  guia: CircleHelp,
  regras: Info,
  creditos: BookOpenText
};

const itemClass = 'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-800/80 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-300';

// Itens que pedem cuidado ganham ícone de alerta, além do texto.
const ICONE_ALERTA = { apagar: 'text-rose-300' };

export default function MenuMais({ open, onClose, onSelect, current, fontScale, onFontScaleChange }) {
  const panelRef = useRef(null);
  const returnFocus = useRef(null);
  const theme = useTheme();

  // Ao abrir, o foco vai para o primeiro item; ao fechar sem escolher, volta ao botão "Mais".
  useEffect(() => {
    if (!open) return undefined;
    returnFocus.current = document.activeElement;
    panelRef.current?.querySelector('button[data-menu-item]')?.focus({ preventScroll: true });
    const onKey = (event) => {
      // Com o guia de uso aberto, o Esc é dele.
      if (event.key !== 'Escape' || document.querySelector('[data-guia-overlay]')) return;
      event.preventDefault();
      onClose();
      returnFocus.current?.focus?.({ preventScroll: true });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isCurrent = (item) => item.tela && current?.tela === item.tela && current?.secao === item.secao;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Fechar o menu"
        tabIndex={-1}
        onClick={() => { onClose(); returnFocus.current?.focus?.({ preventScroll: true }); }}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/60 md:bg-transparent"
      />
      <div
        ref={panelRef}
        id="menu-mais"
        data-guia="menu-mais"
        role="dialog"
        aria-label="Mais opções"
        className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border border-slate-700 bg-slate-900 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-2xl md:inset-x-auto md:bottom-auto md:right-[max(1rem,calc((100vw-72rem)/2+1rem))] md:top-[calc(env(safe-area-inset-top)+4.25rem)] md:w-[22rem] md:rounded-2xl md:pb-3"
      >
        <div className="mb-1 flex justify-center pt-1 md:hidden" aria-hidden="true">
          <span className="h-1.5 w-10 rounded-full bg-slate-700" />
        </div>
        <div className="flex items-center justify-between px-2 pb-2">
          <h2 className="text-base font-black text-white">Mais opções</h2>
          <button type="button" onClick={() => { onClose(); returnFocus.current?.focus?.({ preventScroll: true }); }} aria-label="Fechar o menu" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Mais opções" className="space-y-3">
          {MENU_MAIS.map((grupo) => {
            const cor = corDe(COR_DO_GRUPO[grupo.id]);
            return (
            <section key={grupo.id} aria-labelledby={`menu-grupo-${grupo.id}`}>
              <h3 id={`menu-grupo-${grupo.id}`} className={`px-3 pb-1 text-[11px] font-bold uppercase tracking-wider ${cor.titulo}`}>{grupo.titulo}</h3>
              <ul>
                {grupo.itens.map((item) => {
                  if (item.acao === 'tema') {
                    const Icon = theme === 'dark' ? Sun : Moon;
                    return (
                      <li key={item.id}>
                        <button type="button" data-menu-item={item.id} onClick={toggleTheme} className={itemClass}>
                          <Icon className={`h-5 w-5 shrink-0 ${cor.icone}`} aria-hidden="true" />
                          <span className="min-w-0 flex-1 text-sm font-semibold text-slate-100">{theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}</span>
                        </button>
                      </li>
                    );
                  }
                  const Icon = ICONS[item.id];
                  const active = isCurrent(item);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        data-menu-item={item.id}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => onSelect(item)}
                        className={`${itemClass} ${active ? cor.ativo : ''}`}
                      >
                        <Icon className={`h-5 w-5 shrink-0 ${ICONE_ALERTA[item.id] || cor.icone}`} aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className={`block text-sm font-semibold ${active ? cor.texto : 'text-slate-100'}`}>{item.label}</span>
                          {item.descricao && <span className="block text-xs text-slate-500">{item.descricao}</span>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
            );
          })}
        </nav>
        <section aria-label="Tamanho da fonte" className="mt-3 border-t border-slate-800 pt-3">
          <div className="flex items-center justify-between gap-3 px-2">
            <span className="text-sm font-semibold text-slate-100">Tamanho da fonte</span>
            <div role="group" aria-label="Ajustar tamanho da fonte" className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Diminuir tamanho da fonte"
                disabled={fontScale <= 0.8}
                onClick={() => onFontScaleChange(-0.1)}
                className="rounded-lg px-2 py-1 text-sm font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300"
              >
                A−
              </button>
              <span aria-live="polite" className="min-w-10 text-center text-xs tabular-nums text-slate-400">
                {Math.round(fontScale * 100)}%
              </span>
              <button
                type="button"
                aria-label="Aumentar tamanho da fonte"
                disabled={fontScale >= 1.4}
                onClick={() => onFontScaleChange(0.1)}
                className="rounded-lg px-2 py-1 text-sm font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300"
              >
                A+
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>,
    document.body
  );
}
