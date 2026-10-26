import React, { useMemo, useRef, useState } from 'react';
import { CATEGORY_LABELS, blockOf, configSegments, gridPosition, groupOf, periodOf } from '../domain/tabelaPeriodica.js';

// Cores por categoria. A categoria também aparece em texto (legenda, rótulo acessível e
// painel de detalhes), então a cor nunca é a única forma de informação.
export const CATEGORY_STYLES = {
  'metal-alcalino': 'bg-rose-500/25 border-rose-400/60',
  'metal-alcalinoterroso': 'bg-orange-500/25 border-orange-400/60',
  'metal-de-transicao': 'bg-amber-500/20 border-amber-400/50',
  lantanideo: 'bg-lime-500/20 border-lime-400/50',
  actinideo: 'bg-emerald-500/20 border-emerald-400/50',
  'outros-metais': 'bg-teal-500/20 border-teal-400/50',
  semimetal: 'bg-cyan-500/25 border-cyan-400/60',
  ametal: 'bg-sky-500/25 border-sky-400/60',
  halogenio: 'bg-indigo-500/30 border-indigo-400/60',
  'gas-nobre': 'bg-violet-500/30 border-violet-400/60'
};

const formatNumber = (value) => String(value).replace('.', ',');

export function ElementDetails({ element }) {
  if (!element) return <p className="text-sm text-slate-400">Escolha um elemento para ver os detalhes.</p>;
  const z = element.numeroAtomico;
  const group = groupOf(z);
  const rows = [
    ['Número atômico', z],
    ['Massa atômica', `${formatNumber(element.massaAtomicaTexto)} u${element.massaAtomicaTipo === 'peso-atomico-padrao' ? '' : ' (isótopo mais estável)'}`],
    ['Grupo', group ?? (element.categoria === 'lantanideo' ? 'Série dos lantanídeos' : 'Série dos actinídeos')],
    ['Período', periodOf(z)],
    ['Bloco', blockOf(z)],
    ['Categoria', CATEGORY_LABELS[element.categoria]],
    ['Eletronegatividade (Pauling)', element.eletronegatividade === null ? 'não definida' : formatNumber(element.eletronegatividade)]
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border ${CATEGORY_STYLES[element.categoria]}`}>
          <span className="text-[10px] text-slate-300">{z}</span>
          <span className="text-2xl font-black text-white">{element.simbolo}</span>
        </div>
        <div>
          <h3 className="text-xl font-black text-white">{element.nome}</h3>
          <p className="text-sm text-slate-400">{CATEGORY_LABELS[element.categoria]}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {rows.map(([label, value]) => (
          <React.Fragment key={label}>
            <dt className="text-slate-400">{label}</dt>
            <dd className="font-semibold text-slate-100">{value}</dd>
          </React.Fragment>
        ))}
        <dt className="text-slate-400">Configuração eletrônica</dt>
        <dd className="font-mono text-slate-100">
          {configSegments(element.configuracaoEletronica).map((segment, index) => (segment.tipo === 'sup' ? <sup key={index}>{segment.valor}</sup> : <React.Fragment key={index}>{segment.valor}</React.Fragment>))}
        </dd>
      </dl>
    </div>
  );
}

// Tabela periódica interativa.
// - mode="explorar": clicar mostra os detalhes (com legenda e destaque por categoria).
// - mode="selecionar": clicar escolhe o elemento (questões); os detalhes ficam ocultos
//   para não entregar a resposta.
export default function TabelaPeriodica({ elementos, mode = 'explorar', selected = null, onSelect, label = 'Tabela periódica' }) {
  const [active, setActive] = useState(selected || 'H');
  const [highlight, setHighlight] = useState(null);
  const buttons = useRef(new Map());

  const positions = useMemo(() => elementos.map((element) => ({ element, ...gridPosition(element.numeroAtomico) })), [elementos]);
  const bySymbol = useMemo(() => new Map(elementos.map((element) => [element.simbolo, element])), [elementos]);
  const current = bySymbol.get(mode === 'selecionar' ? selected : active) || null;

  const choose = (symbol) => {
    setActive(symbol);
    onSelect?.(symbol);
  };

  // Setas: vai para o elemento mais próximo na direção escolhida.
  const move = (symbol, dx, dy) => {
    const from = positions.find((item) => item.element.simbolo === symbol);
    const candidates = positions.filter((item) => (dx ? Math.sign(item.col - from.col) === dx && item.row === from.row : Math.sign(item.row - from.row) === dy));
    if (!candidates.length) return;
    const target = candidates.sort((a, b) => (Math.abs(a.row - from.row) + Math.abs(a.col - from.col) * (dx ? 1 : 0.5)) - (Math.abs(b.row - from.row) + Math.abs(b.col - from.col) * (dx ? 1 : 0.5)))[0];
    setActive(target.element.simbolo);
    buttons.current.get(target.element.simbolo)?.focus();
  };

  const onKeyDown = (event, symbol) => {
    const keys = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
    if (keys[event.key]) {
      event.preventDefault();
      move(symbol, ...keys[event.key]);
    }
  };

  const focusSymbol = (mode === 'selecionar' && selected) || active;

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 md:hidden">Deslize a tabela para os lados para ver todos os grupos.</p>
      <div className="overflow-x-auto pb-2">
        <div role="grid" aria-label={label} className="grid min-w-[44rem] gap-0.5" style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))', gridTemplateRows: 'repeat(7, auto) 0.5rem repeat(2, auto)' }}>
          {positions.map(({ element, row, col }) => {
            const isSelected = element.simbolo === (mode === 'selecionar' ? selected : active);
            const dimmed = highlight && element.categoria !== highlight;
            return (
              <button
                key={element.simbolo}
                type="button"
                role="gridcell"
                ref={(node) => { if (node) buttons.current.set(element.simbolo, node); }}
                tabIndex={element.simbolo === focusSymbol ? 0 : -1}
                aria-pressed={isSelected}
                aria-label={`${element.nome}, ${element.simbolo}, número atômico ${element.numeroAtomico}, ${CATEGORY_LABELS[element.categoria]}`}
                onClick={() => choose(element.simbolo)}
                onKeyDown={(event) => onKeyDown(event, element.simbolo)}
                style={{ gridRow: row, gridColumn: col }}
                className={`flex aspect-square min-h-9 flex-col items-center justify-center rounded border text-center leading-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white ${CATEGORY_STYLES[element.categoria]} ${dimmed ? 'opacity-25' : ''} ${isSelected ? 'ring-2 ring-white' : 'hover:brightness-125'}`}
              >
                <span className="text-[8px] text-slate-300 sm:text-[9px]">{element.numeroAtomico}</span>
                <span className="text-xs font-black text-white sm:text-sm">{element.simbolo}</span>
              </button>
            );
          })}
          {/* Lugares das séries f na tabela principal. */}
          <div aria-hidden="true" style={{ gridRow: 6, gridColumn: 3 }} className={`flex items-center justify-center rounded border border-dashed text-[8px] text-slate-400 ${CATEGORY_STYLES.lantanideo}`}>57–71</div>
          <div aria-hidden="true" style={{ gridRow: 7, gridColumn: 3 }} className={`flex items-center justify-center rounded border border-dashed text-[8px] text-slate-400 ${CATEGORY_STYLES.actinideo}`}>89–103</div>
        </div>
      </div>

      {mode === 'explorar' && (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Destacar categoria">
            {Object.entries(CATEGORY_LABELS).map(([key, text]) => (
              <button
                key={key}
                type="button"
                aria-pressed={highlight === key}
                onClick={() => setHighlight((value) => (value === key ? null : key))}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-slate-100 ${CATEGORY_STYLES[key]} ${highlight === key ? 'ring-2 ring-white' : ''}`}
              >
                {text}
              </button>
            ))}
          </div>
          <div aria-live="polite" className="rounded-2xl border border-slate-800 bg-slate-900/85 p-4 backdrop-blur-sm">
            <ElementDetails element={current} />
          </div>
        </>
      )}
      {mode === 'selecionar' && (
        <p aria-live="polite" className="text-sm text-slate-300">
          {current ? <>Selecionado: <strong className="text-white">{current.nome} ({current.simbolo})</strong></> : 'Nenhum elemento selecionado.'}
        </p>
      )}
    </div>
  );
}
