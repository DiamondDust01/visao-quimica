import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { buttonPrimary, buttonSecondary, Card, Notice } from '../components/ui.jsx';
import { TABS } from '../app/navigation.js';
import { recommend } from '../domain/recomendador.js';
import NivelCard from '../components/NivelCard.jsx';

export default function Inicio({ firebaseEnabled, authError, onOpenTab, onPractice, index, profile, progress, points = 0 }) {
  const result = useMemo(() => recommend({ index, etapaId: profile?.etapaId, progress }), [index, profile?.etapaId, progress]);
  const etapa = result.etapa;
  const next = result.proximo ? index.get(result.proximo) : null;

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-black text-white sm:text-3xl">Visão Química</h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Estude Química por temas, no seu ritmo: monte sua própria trilha ou siga a recomendada para a sua etapa escolar.
        </p>
        {etapa && (
          <p className="mt-3 text-sm text-slate-400">
            Sua etapa: <strong className="text-slate-200">{etapa.grupo === etapa.nome ? etapa.nome : `${etapa.grupo} · ${etapa.nome}`}</strong>{' '}
            <button type="button" onClick={() => onOpenTab('perfil')} className="font-semibold text-teal-300 underline-offset-2 hover:underline">alterar</button>
          </p>
        )}
        <div className="mt-4 max-w-md"><NivelCard points={points} /></div>
      </Card>

      {next && (
        <Card className="border-teal-500/40">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-300">Próximo passo da sua trilha</p>
          <h2 className="mt-1 text-xl font-black text-white">{next.nome}</h2>
          <p className="mt-1 text-sm text-slate-400">{next.descricao}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => onPractice([next.id])} className={buttonPrimary}>Praticar agora <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" onClick={() => onOpenTab('fundamentos')} className={buttonSecondary}>Ver trilha</button>
            <button type="button" onClick={() => onOpenTab('pratica')} className={buttonSecondary}>Escolher outros temas</button>
          </div>
        </Card>
      )}

      {!firebaseEnabled && (
        <Notice tone="info">
          Este app está funcionando offline. Seu progresso fica salvo neste aparelho, e as salas funcionam como demonstração local.
        </Notice>
      )}
      {authError && <Notice tone="warn">{authError}</Notice>}

      <div className="grid gap-3 sm:grid-cols-2">
        {TABS.filter((tab) => tab.id !== 'inicio').map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onOpenTab(tab.id)}
            className="rounded-2xl border border-slate-800 bg-slate-900/85 p-4 text-left backdrop-blur-sm transition hover:border-teal-500/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300"
          >
            <span className="block font-bold text-white">{tab.label}</span>
            <span className="mt-1 block text-sm text-slate-400">{tab.description}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => onOpenTab('ferramentas')}
          className="rounded-2xl border border-slate-800 bg-slate-900/85 p-4 text-left backdrop-blur-sm transition hover:border-teal-500/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300"
        >
          <span className="block font-bold text-white">Ferramentas</span>
          <span className="mt-1 block text-sm text-slate-400">Tabela periódica interativa e calculadora de massa molar.</span>
        </button>
      </div>
    </div>
  );
}
