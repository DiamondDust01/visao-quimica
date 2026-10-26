import React, { useMemo } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import ChemText from '../ChemText.jsx';
import { inputClass } from '../ui.jsx';
import { unitDimension, unitsOfDimension } from '../../domain/unidades.js';
import { shuffle } from '../../domain/questoes/sessao.js';
import { normalizeSymbol } from '../../domain/questoes/correcao.js';
import { ELEMENTOS } from '../../data/index.js';
import TabelaPeriodica from '../TabelaPeriodica.jsx';

// Campo de resposta de cada tipo de questão. `value` e `onChange` guardam a resposta
// no formato que o corretor espera (src/domain/questoes/correcao.js).

const smallInput = 'w-16 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-center text-base text-white focus:border-teal-400 focus:outline-none disabled:opacity-70';

function MultipleChoice({ question, value, onChange, disabled }) {
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">Alternativas</legend>
      {question.alternativas.map((alt) => {
        const id = `${question.id}-${alt.id}`;
        const selected = value === alt.id;
        return (
          <label key={alt.id} htmlFor={id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition focus-within:outline focus-within:outline-2 focus-within:outline-teal-300 ${selected ? 'border-teal-400 bg-teal-500/10' : 'border-slate-700 bg-slate-950/60 hover:border-slate-500'} ${disabled ? 'cursor-default' : ''}`}>
            <input id={id} type="radio" name={question.id} value={alt.id} checked={selected} disabled={disabled} onChange={() => onChange(alt.id)} className="mt-1 h-4 w-4 accent-teal-500" />
            <span className="font-mono font-bold text-slate-400">{alt.id.toUpperCase()})</span>
            <ChemText text={alt.texto} className="text-slate-100" />
          </label>
        );
      })}
    </fieldset>
  );
}

function Numeric({ question, value = {}, onChange, disabled }) {
  const unit = question.gabarito.unidade;
  const suggestions = useMemo(() => (unit ? unitsOfDimension(unitDimension(unit)) : []), [unit]);
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex min-w-40 flex-1 flex-col gap-1 text-sm text-slate-300">
        Valor
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={value.valor || ''}
          disabled={disabled}
          onChange={(event) => onChange({ ...value, valor: event.target.value })}
          placeholder="Ex.: 0,5 ou 6,02 × 10^23"
          className={inputClass}
        />
      </label>
      {unit && (
        <label className="flex w-40 flex-col gap-1 text-sm text-slate-300">
          Unidade
          <input
            type="text"
            autoComplete="off"
            list={`${question.id}-unidades`}
            value={value.unidade || ''}
            disabled={disabled}
            onChange={(event) => onChange({ ...value, unidade: event.target.value })}
            placeholder="Ex.: g, mL, mol/L"
            className={inputClass}
          />
          <datalist id={`${question.id}-unidades`}>
            {suggestions.map((item) => <option key={item} value={item} />)}
          </datalist>
        </label>
      )}
    </div>
  );
}

function Balancing({ question, value = [], onChange, disabled }) {
  const { reagentes, produtos } = question.equacao;
  const set = (index, text) => {
    const next = [...value];
    next[index] = text.replace(/[^\d]/g, '');
    onChange(next);
  };
  const term = (species, index) => (
    <span key={species + index} className="inline-flex items-center gap-1">
      <input
        type="text"
        inputMode="numeric"
        aria-label={`Coeficiente de ${species}`}
        value={value[index] || ''}
        disabled={disabled}
        onChange={(event) => set(index, event.target.value)}
        className={smallInput}
      />
      <ChemText text={`\\ce{${species}}`} className="text-lg text-white" />
    </span>
  );
  const side = (list, offset) => list.map((species, index) => (
    <React.Fragment key={species + index}>
      {index > 0 && <span className="text-slate-400" aria-hidden="true">+</span>}
      {term(species, index + offset)}
    </React.Fragment>
  ));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {side(reagentes, 0)}
        <span className="px-1 text-xl text-slate-300" aria-label="produz">→</span>
        {side(produtos, reagentes.length)}
      </div>
      <p className="text-xs text-slate-500">Escreva 1 quando o coeficiente for 1.</p>
    </div>
  );
}

function Naming({ question, value = '', onChange, disabled }) {
  const toFormula = question.direcao === 'nome-para-formula';
  return (
    <div className="space-y-2">
      <label className="flex flex-col gap-1 text-sm text-slate-300">
        {toFormula ? 'Fórmula' : 'Nome'}
        <input
          type="text"
          autoComplete="off"
          autoCapitalize={toFormula ? 'characters' : 'none'}
          spellCheck={!toFormula}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={toFormula ? 'Ex.: H2SO4, Ca(OH)2, SO4^2-' : 'Ex.: cloreto de sódio'}
          className={inputClass}
        />
      </label>
      {toFormula && (
        <p className="text-xs text-slate-500">
          Use maiúsculas e minúsculas como nos símbolos (Co ≠ CO) e ^ para cargas.
          {value.trim() && <> Você escreveu: <ChemText text={`\\ce{${value.trim()}}`} className="text-base text-slate-200" /></>}
        </p>
      )}
    </div>
  );
}

function Matching({ question, value = {}, onChange, disabled }) {
  return (
    <div className="space-y-3">
      {question.itens.map((item) => (
        <label key={item.id} className="grid gap-2 sm:grid-cols-2 sm:items-center">
          <ChemText text={item.texto} className="text-slate-100" />
          <select
            value={value[item.id] || ''}
            disabled={disabled}
            onChange={(event) => onChange({ ...value, [item.id]: event.target.value })}
            className={inputClass}
          >
            <option value="">Escolha…</option>
            {question.opcoes.map((option) => <option key={option.id} value={option.id}>{option.texto.replace(/\\ce\{([^}]*)\}/g, '$1')}</option>)}
          </select>
        </label>
      ))}
    </div>
  );
}

// Ordem inicial embaralhada e nunca igual à resposta.
export const initialOrder = (question, random = Math.random) => {
  const ids = question.itens.map((item) => item.id);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const order = shuffle(ids, random);
    if (order.some((id, index) => id !== question.gabarito[index])) return order;
  }
  return [...ids].reverse();
};

function Ordering({ question, value, onChange, disabled }) {
  const order = value || [];
  const move = (index, delta) => {
    const next = [...order];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  };
  const label = (id) => question.itens.find((item) => item.id === id)?.texto || id;
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-300">{question.criterio}</p>
      <ol className="space-y-2">
        {order.map((id, index) => (
          <li key={id} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/60 p-2">
            <span className="w-6 text-center font-mono text-sm text-slate-400">{index + 1}</span>
            <ChemText text={label(id)} className="flex-1 text-slate-100" />
            <button type="button" disabled={disabled || index === 0} onClick={() => move(index, -1)} aria-label={`Mover ${label(id).replace(/\\ce\{([^}]*)\}/g, '$1')} para cima`} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 disabled:opacity-30">
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" disabled={disabled || index === order.length - 1} onClick={() => move(index, 1)} aria-label={`Mover ${label(id).replace(/\\ce\{([^}]*)\}/g, '$1')} para baixo`} className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 disabled:opacity-30">
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

// Escolha pela tabela (clique ou setas) ou digitando o símbolo; os dois ficam sincronizados.
function PeriodicTable({ value = '', onChange, disabled }) {
  const selected = normalizeSymbol(value);
  return (
    <div className="space-y-3">
      <fieldset disabled={disabled} className={disabled ? 'pointer-events-none opacity-80' : ''}>
        <legend className="sr-only">Escolha o elemento na tabela</legend>
        <TabelaPeriodica elementos={ELEMENTOS} mode="selecionar" selected={ELEMENTOS.some((element) => element.simbolo === selected) ? selected : null} onSelect={onChange} label="Tabela periódica: escolha o elemento" />
      </fieldset>
      <label className="flex max-w-xs flex-col gap-1 text-sm text-slate-300">
        Ou digite o símbolo
        <input type="text" autoComplete="off" maxLength={3} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} placeholder="Ex.: Na" className={inputClass} />
      </label>
    </div>
  );
}

const INPUTS = {
  'multipla-escolha': MultipleChoice,
  numerica: Numeric,
  balanceamento: Balancing,
  nomenclatura: Naming,
  associacao: Matching,
  ordenacao: Ordering,
  'tabela-periodica': PeriodicTable
};

export default function AnswerInput(props) {
  const Input = INPUTS[props.question.tipo];
  return Input ? <Input {...props} /> : null;
}
