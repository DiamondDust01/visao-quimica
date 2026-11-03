import React, { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { buttonPrimary, buttonSecondary, Card } from '../components/ui.jsx';
import { recommend } from '../domain/recomendador.js';
import NivelCard from '../components/NivelCard.jsx';

export default function Inicio({ onOpenTab, index, profile, progress, points = 0 }) {
  const result = useMemo(() => recommend({ index, etapaId: profile?.etapaId, progress }), [index, profile?.etapaId, progress]);
  const etapa = result.etapa;
  const next = result.proximo ? index.get(result.proximo) : null;

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-black text-white sm:text-3xl">Visão Química</h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Seu fluxo tem três passos: etapa escolar, escolha de tema e sessão de questões. Siga a trilha recomendada ou escolha temas livremente em Prática.
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
          <p className="text-xs font-bold uppercase tracking-wide text-teal-300">Passo 2 · Escolha um tema da trilha</p>
          <h2 className="mt-1 text-xl font-black text-white">{next.nome}</h2>
          <p className="mt-1 text-sm text-slate-400">{next.descricao}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => onOpenTab('fundamentos')} className={buttonPrimary}>Ver trilha e escolher tema <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>
        </Card>
      )}

      {!next && (
        <Card className="border-teal-500/40">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-300">Passo 2 · Escolha um tema</p>
          <h2 className="mt-1 text-xl font-black text-white">Pronto para estudar?</h2>
          <p className="mt-1 text-sm text-slate-400">Escolha temas e monte sua sessão de prática.</p>
          <button type="button" onClick={() => onOpenTab('pratica')} className={`${buttonPrimary} mt-4`}>Escolher tema na Prática <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
        </Card>
      )}
    </div>
  );
}
