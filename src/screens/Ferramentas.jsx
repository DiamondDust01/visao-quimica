import React, { useState } from 'react';
import { Card } from '../components/ui.jsx';
import TabelaPeriodica from '../components/TabelaPeriodica.jsx';
import CalculadoraMassaMolar from '../components/CalculadoraMassaMolar.jsx';
import VisualizadorEstruturas from '../components/VisualizadorEstruturas.jsx';

const SECTIONS = [
  { id: 'tabela', label: 'Tabela periódica' },
  { id: 'massa-molar', label: 'Massa molar' },
  { id: 'estruturas', label: 'Estruturas' }
];

export default function Ferramentas({ elementos, meta, estruturas }) {
  const [section, setSection] = useState('tabela');
  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-black text-white">Ferramentas</h1>
        <p className="mt-2 text-slate-300">Tabela periódica interativa, calculadora de massa molar e visualizador de estruturas, funcionando sem internet.</p>
        <div role="tablist" aria-label="Ferramentas" className="mt-4 flex flex-wrap gap-2">
          {SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={section === item.id}
              onClick={() => setSection(item.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300 ${section === item.id ? 'bg-teal-500/15 text-teal-200' : 'text-slate-400 hover:text-white'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        {section === 'tabela' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">Clique num elemento (ou use as setas do teclado) para ver os detalhes. Clique numa categoria para destacá-la.</p>
            <TabelaPeriodica elementos={elementos} />
            <details className="text-xs text-slate-500">
              <summary className="cursor-pointer font-semibold text-slate-400">Fontes dos dados</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {Object.values(meta.fontes).map((fonte) => (
                  <li key={fonte.url}>{fonte.descricao} {fonte.instituicao}, consultado em {fonte.consultadoEm.split('-').reverse().join('/')}.</li>
                ))}
                {meta.observacoes.slice(1, 2).map((text) => <li key={text}>{text}</li>)}
              </ul>
            </details>
          </div>
        )}
        {section === 'massa-molar' && <CalculadoraMassaMolar elementos={elementos} fonte={meta.fontes.massaAtomica} />}
        {section === 'estruturas' && <VisualizadorEstruturas estruturas={estruturas} elementos={elementos} />}
      </Card>
    </div>
  );
}
