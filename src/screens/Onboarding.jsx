import React, { useState } from 'react';
import { ArrowRight, FlaskConical, Zap } from 'lucide-react';
import { buttonPrimary, Card } from '../components/ui.jsx';
import EtapaPicker from '../components/EtapaPicker.jsx';

// Primeiro uso: o estudante informa a etapa escolar para receber uma trilha sugerida,
// ou começa direto por um tema rápido, sem escolher etapa.
// temasRapidos: [{ id, titulo, etapaNome, total, subtemaIds }]
export default function Onboarding({ etapas, observacao, onChoose, temasRapidos = [], onQuickStart }) {
  const [etapaId, setEtapaId] = useState('');
  const showQuick = temasRapidos.length > 0 && Boolean(onQuickStart);

  const submit = (event) => {
    event.preventDefault();
    if (etapaId) onChoose(etapaId);
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-3">
          <FlaskConical className="h-8 w-8 shrink-0 text-teal-300" aria-hidden="true" />
          <h1 className="text-2xl font-black text-white sm:text-3xl">Boas-vindas ao Visão Química</h1>
        </div>
        <p className="mt-3 max-w-2xl text-slate-300">
          Escolha sua etapa para receber uma trilha sugerida, ou selecione Estudo livre para escolher os temas por conta própria. Você pode mudar essa opção depois, em Perfil.
          {showQuick && ' Se preferir, comece agora por um tema rápido.'}
        </p>
      </Card>

      {showQuick && (
        <Card>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
            <h2 id="temas-rapidos-titulo" className="text-lg font-bold text-white">Temas rápidos</h2>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Uma sessão curta, sem precisar escolher a etapa. A série indicada é só uma referência.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {temasRapidos.map((tema) => (
              <li key={tema.id}>
                <button
                  type="button"
                  data-tema-rapido={tema.id}
                  onClick={() => onQuickStart(tema.subtemaIds)}
                  className="group flex h-full w-full items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-3 text-left transition hover:border-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-teal-300">{tema.etapaNome}</span>
                    <span className="block font-semibold text-slate-100">{tema.titulo}</span>
                    <span className="block text-xs text-slate-500">{tema.total} questões</span>
                  </span>
                  <ArrowRight className="h-5 w-5 shrink-0 text-slate-500 transition group-hover:text-teal-300" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <form onSubmit={submit}>
        <Card>
          <EtapaPicker etapas={etapas} value={etapaId} onChange={setEtapaId} name="onboarding-etapa" />
          <p className="mt-4 text-xs text-slate-500">{observacao}</p>
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={!etapaId} className={buttonPrimary}>Continuar</button>
          </div>
        </Card>
      </form>
    </div>
  );
}
