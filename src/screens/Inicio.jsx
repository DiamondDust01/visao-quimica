import React, { useMemo } from 'react';
import { ArchiveRestore, ArrowRight, Atom, Calculator, Hexagon } from 'lucide-react';
import { buttonPrimary, buttonSecondary, Card, Notice } from '../components/ui.jsx';
import { recommend } from '../domain/recomendador.js';
import NivelCard from '../components/NivelCard.jsx';
import { corDe } from '../app/cores.js';

// Filete com a cor da área no topo do cartão de título.
const HERO = `border-t-4 ${corDe('inicio').borda}`;

// Atalhos do Início: o que os estudantes mais usam fora das abas, a um toque.
const ATALHOS = [
  { id: 'tabela', label: 'Tabela periódica', tela: 'ferramentas', secao: 'tabela', Icon: Atom },
  { id: 'massa-molar', label: 'Massa molar', tela: 'ferramentas', secao: 'massa-molar', Icon: Calculator },
  { id: 'estruturas', label: 'Estruturas', tela: 'ferramentas', secao: 'estruturas', Icon: Hexagon },
  { id: 'backup', label: 'Backup do progresso', tela: 'perfil', secao: 'backup', Icon: ArchiveRestore }
];

export default function Inicio({ onOpenTab, onOpenScreen, index, profile, progress, points = 0, guideOffer = false, onStartGuide, onDismissGuide }) {
  const result = useMemo(() => recommend({ index, etapaId: profile?.etapaId, progress }), [index, profile?.etapaId, progress]);
  const etapa = result.etapa;
  const next = result.proximo ? index.get(result.proximo) : null;

  return (
    <div className="space-y-4">
      {guideOffer && (
        <Notice tone="info">
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="min-w-0 flex-1"><strong>Primeira vez por aqui?</strong> O guia de uso destaca cada parte do app e explica para que ela serve.</span>
            <span className="flex gap-2">
              <button type="button" onClick={onStartGuide} className={buttonPrimary}>Começar o guia</button>
              <button type="button" onClick={onDismissGuide} className={buttonSecondary}>Agora não</button>
            </span>
          </span>
        </Notice>
      )}

      <Card className={HERO}>
        <h1 className="text-2xl font-black text-white sm:text-3xl">Visão Química</h1>
        <p className="mt-2 max-w-2xl text-slate-300">
          Seu fluxo tem três passos: etapa escolar, escolha de tema e sessão de questões. Siga a trilha recomendada ou escolha temas livremente em Prática.
        </p>
        {etapa && (
          <p className="mt-3 text-sm text-slate-400">
            Sua etapa: <strong className="text-slate-200">{etapa.grupo === etapa.nome ? etapa.nome : `${etapa.grupo} · ${etapa.nome}`}</strong>{' '}
            <button type="button" onClick={() => onOpenScreen('perfil', 'etapa')} className="font-semibold text-teal-300 underline-offset-2 hover:underline">alterar</button>
          </p>
        )}
        <div data-guia="nivel" className="mt-4 max-w-md"><NivelCard points={points} /></div>
      </Card>

      {next && (
        <Card data-guia="proximo-passo" className="border-teal-500/40">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-300">Passo 2 · Escolha um tema da trilha</p>
          <h2 className="mt-1 text-xl font-black text-white">{next.nome}</h2>
          <p className="mt-1 text-sm text-slate-400">{next.descricao}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => onOpenTab('fundamentos')} className={buttonPrimary}>Ver trilha e escolher tema <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>
        </Card>
      )}

      {!next && (
        <Card data-guia="proximo-passo" className="border-teal-500/40">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-300">Passo 2 · Escolha um tema</p>
          <h2 className="mt-1 text-xl font-black text-white">Pronto para estudar?</h2>
          <p className="mt-1 text-sm text-slate-400">Escolha temas e monte sua sessão de prática.</p>
          <button type="button" onClick={() => onOpenTab('pratica')} className={`${buttonPrimary} mt-4`}>Escolher tema na Prática <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
        </Card>
      )}

      <Card data-guia="atalhos">
        <h2 className="text-lg font-bold text-white">Atalhos</h2>
        <p className="mt-1 text-sm text-slate-400">Ferramentas e backup a um toque. Tudo o mais fica no menu "Mais".</p>
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ATALHOS.map(({ id, label, tela, secao, Icon }) => (
            <li key={id}>
              <button type="button" data-atalho={id} onClick={() => onOpenScreen(tela, secao)} className="flex h-full w-full flex-col items-start gap-2 rounded-xl border border-slate-700 bg-slate-950/50 p-3 text-left text-sm font-semibold text-slate-100 transition hover:border-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300">
                <Icon className={`h-5 w-5 ${corDe(tela).icone}`} aria-hidden="true" />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
