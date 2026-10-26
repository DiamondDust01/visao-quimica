import React from 'react';
import { Check } from 'lucide-react';

// Escolha da etapa escolar, agrupada (Ensino Fundamental II, Ensino Médio...).
// Radios nativos: funciona com teclado (setas) e leitores de tela.
export default function EtapaPicker({ etapas, value, onChange, name = 'etapa' }) {
  const groups = [];
  etapas.forEach((etapa) => {
    const group = groups.find((item) => item.nome === etapa.grupo);
    if (group) group.etapas.push(etapa);
    else groups.push({ nome: etapa.grupo, etapas: [etapa] });
  });

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <fieldset key={group.nome} className="space-y-2">
          {group.etapas.length > 1 && <legend className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">{group.nome}</legend>}
          <div className={group.etapas.length > 1 ? 'grid gap-2 sm:grid-cols-2 lg:grid-cols-4' : 'grid gap-2'}>
            {group.etapas.map((etapa) => {
              const selected = value === etapa.id;
              const id = `${name}-${etapa.id}`;
              return (
                <label
                  key={etapa.id}
                  htmlFor={id}
                  className={`relative flex cursor-pointer flex-col gap-1 rounded-xl border p-3 pr-10 transition focus-within:outline focus-within:outline-2 focus-within:outline-teal-300 ${selected ? 'border-teal-400 bg-teal-500/10' : 'border-slate-700 bg-slate-900/85 hover:border-slate-500'}`}
                >
                  <input id={id} type="radio" name={name} value={etapa.id} checked={selected} onChange={() => onChange(etapa.id)} className="sr-only" />
                  <span className="font-bold text-white">{group.etapas.length > 1 ? etapa.nome : etapa.grupo}</span>
                  <span className="text-sm text-slate-400">{etapa.descricao}</span>
                  {selected && <Check className="absolute right-3 top-3 h-5 w-5 text-teal-300" aria-hidden="true" />}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
