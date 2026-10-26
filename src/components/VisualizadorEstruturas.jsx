import React, { useState } from 'react';
import EstruturaMolecular from './EstruturaMolecular.jsx';
import { inputClass } from './ui.jsx';
import { molarMass } from '../domain/massaMolar.js';

const fmt = (value) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Galeria de estruturas e campo livre de SMILES, com fórmula molecular e massa molar.
export default function VisualizadorEstruturas({ estruturas, elementos }) {
  const [smiles, setSmiles] = useState(estruturas[0].smiles);
  const [formula, setFormula] = useState(null);
  const selected = estruturas.find((item) => item.smiles === smiles.trim()) || null;
  let massa = null;
  try {
    massa = formula ? molarMass(formula, elementos) : null;
  } catch {
    massa = null;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">
        Escolha um exemplo ou digite um SMILES, a notação em texto das estruturas moleculares
        (por exemplo, <code className="text-slate-300">CCO</code> é o etanol). Os hidrogênios ligados a carbono ficam implícitos no desenho.
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Exemplos de estruturas">
        {estruturas.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected?.id === item.id}
            onClick={() => setSmiles(item.smiles)}
            className={`rounded-full border px-3 py-1 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300 ${selected?.id === item.id ? 'border-teal-400 bg-teal-500/15 text-teal-100' : 'border-slate-700 text-slate-300 hover:border-slate-500'}`}
          >
            {item.nome}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-sm text-slate-300">
        SMILES
        <input type="text" value={smiles} onChange={(event) => setSmiles(event.target.value)} autoComplete="off" spellCheck={false} className={`${inputClass} font-mono`} />
      </label>
      <div className="grid gap-4 md:grid-cols-[minmax(0,360px)_1fr] md:items-start">
        <EstruturaMolecular smiles={smiles} descricao={selected ? `Estrutura: ${selected.nome}` : `Estrutura do SMILES ${smiles}`} mostrarFormula width={360} height={260} onAnalise={setFormula} />
        <div className="space-y-2 text-sm text-slate-300" aria-live="polite">
          {selected && <h2 className="text-lg font-bold text-white">{selected.nome}</h2>}
          {selected && <p>{selected.descricao}</p>}
          {massa && <p>Massa molar: <strong className="text-white">{fmt(massa.total)} g/mol</strong>{massa.aproximada ? ' (aproximada)' : ''}</p>}
        </div>
      </div>
    </div>
  );
}
