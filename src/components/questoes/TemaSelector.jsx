import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { inputClass } from '../ui.jsx';
import { StatusBadge, Difficulty } from '../SubtemaItem.jsx';
import { statusFor, summarizeProgress } from '../../domain/progresso.js';

const normalize = (text) => String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Filtro por status: "pendente" é tudo o que ainda não foi concluído.
const STATUS_FILTERS = {
  todos: () => true,
  pendentes: (status) => status !== 'dominado',
  concluidos: (status) => status === 'dominado',
  revisar: (status) => status === 'revisar'
};

// Checkbox que também mostra o estado "parcial" (alguns filhos marcados).
function TriCheckbox({ checked, partial, onChange, label, disabled }) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      checked={checked}
      disabled={disabled}
      ref={(element) => { if (element) element.indeterminate = partial; }}
      onChange={(event) => onChange(event.target.checked)}
      className="h-5 w-5 shrink-0 accent-teal-500"
    />
  );
}

export default function TemaSelector({ index, progress, questionCount, etapas, selected, onChange }) {
  const [query, setQuery] = useState('');
  const [etapaId, setEtapaId] = useState('');
  const [dificuldade, setDificuldade] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const visible = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return new Set(index.subtemas.filter((node) => {
      if (etapaId && !node.etapasRecomendadas.includes(etapaId)) return false;
      if (dificuldade && node.dificuldade !== Number(dificuldade)) return false;
      if (!STATUS_FILTERS[statusFilter](statusFor(progress[node.id]))) return false;
      if (!terms.length) return true;
      const tema = index.get(node.pai);
      const area = index.get(node.area);
      const haystack = normalize([node.nome, node.descricao, ...node.palavrasChave, tema.nome, area.nome].join(' '));
      return terms.every((term) => haystack.includes(term));
    }).map((node) => node.id));
  }, [index, progress, query, etapaId, dificuldade, statusFilter]);

  const filtering = Boolean(query || etapaId || dificuldade || statusFilter !== 'todos');
  const selectable = (ids) => ids.filter((id) => visible.has(id) && questionCount(id) > 0);

  const toggle = (ids, value) => {
    const next = new Set(selected);
    ids.forEach((id) => (value ? next.add(id) : next.delete(id)));
    onChange(next);
  };
  const groupState = (ids) => {
    const usable = selectable(ids);
    const count = usable.filter((id) => selected.has(id)).length;
    return { usable, checked: usable.length > 0 && count === usable.length, partial: count > 0 && count < usable.length };
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm text-slate-300 sm:col-span-2 lg:col-span-1">
          Buscar
          <span className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex.: pH, isomeria" className={`${inputClass} pl-9`} />
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Etapa
          <select value={etapaId} onChange={(event) => setEtapaId(event.target.value)} className={inputClass}>
            <option value="">Todas</option>
            {etapas.filter((etapa) => !etapa.semRecomendacao).map((etapa) => (
              <option key={etapa.id} value={etapa.id}>{etapa.grupo === etapa.nome ? etapa.nome : `${etapa.nome} (${etapa.grupo})`}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Dificuldade
          <select value={dificuldade} onChange={(event) => setDificuldade(event.target.value)} className={inputClass}>
            <option value="">Todas</option>
            {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>{level} de 5</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Situação
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={inputClass}>
            <option value="todos">Todos</option>
            <option value="pendentes">Pendentes</option>
            <option value="concluidos">Concluídos</option>
            <option value="revisar">Precisam de revisão</option>
          </select>
        </label>
      </div>

      {visible.size === 0 && <p className="text-sm text-slate-400">Nenhum tema encontrado com esses filtros.</p>}

      <ul className="space-y-2">
        {index.areas.map((area) => {
          const areaSubtemas = index.subtemasOf(area.id);
          if (!areaSubtemas.some((id) => visible.has(id))) return null;
          const areaState = groupState(areaSubtemas);
          const areaProgress = summarizeProgress(areaSubtemas, progress);
          return (
            <li key={area.id}>
              <details open={filtering} className="group rounded-2xl border border-slate-800 bg-slate-900/85 backdrop-blur-sm">
                <summary className="flex cursor-pointer list-none items-center gap-3 p-3 marker:hidden">
                  <span onClick={(event) => event.stopPropagation()} className="flex">
                    <TriCheckbox label={`Selecionar toda a área ${area.nome}`} checked={areaState.checked} partial={areaState.partial} disabled={!areaState.usable.length} onChange={(value) => toggle(areaState.usable, value)} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-white">{area.nome}</span>
                    <span className="block text-xs text-slate-400">{areaProgress.dominado} de {areaProgress.total} subtemas concluídos</span>
                  </span>
                  <span className="hidden w-24 sm:block" aria-hidden="true">
                    <span className="block h-2 overflow-hidden rounded-full bg-slate-700/60"><span className="block h-full rounded-full bg-teal-400" style={{ width: `${areaProgress.percentConcluido}%` }} /></span>
                  </span>
                  <span className="text-slate-500 transition group-open:rotate-90" aria-hidden="true">›</span>
                </summary>
                <div className="space-y-3 border-t border-slate-800 p-3">
                  {index.childrenOf(area.id).map((temaId) => {
                    const tema = index.get(temaId);
                    const temaSubtemas = index.subtemasOf(temaId).filter((id) => visible.has(id));
                    if (!temaSubtemas.length) return null;
                    const temaState = groupState(temaSubtemas);
                    const temaProgress = summarizeProgress(index.subtemasOf(temaId), progress);
                    return (
                      <fieldset key={temaId} className="space-y-2">
                        <legend className="flex w-full items-center gap-3">
                          <TriCheckbox label={`Selecionar todo o tema ${tema.nome}`} checked={temaState.checked} partial={temaState.partial} disabled={!temaState.usable.length} onChange={(value) => toggle(temaState.usable, value)} />
                          <span className="font-semibold text-slate-200">{tema.nome}</span>
                          <span className="text-xs text-slate-500">{temaProgress.dominado}/{temaProgress.total}</span>
                        </legend>
                        <ul className="space-y-1 pl-8">
                          {temaSubtemas.map((id) => {
                            const node = index.get(id);
                            const count = questionCount(id);
                            const inputId = `selecao-${id}`;
                            return (
                              <li key={id}>
                                <label htmlFor={inputId} className={`flex items-start gap-3 rounded-xl p-2 ${count ? 'cursor-pointer hover:bg-slate-800/60' : 'opacity-60'}`}>
                                  <input id={inputId} type="checkbox" checked={selected.has(id)} disabled={!count} onChange={(event) => toggle([id], event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-teal-500" />
                                  <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-semibold text-white">{node.nome}</span>
                                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                      <StatusBadge status={statusFor(progress[id])} />
                                      <Difficulty value={node.dificuldade} />
                                      <span className="text-xs text-slate-500">{count ? `${count} questões` : 'sem questões ainda'}</span>
                                    </span>
                                  </span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </fieldset>
                    );
                  })}
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
