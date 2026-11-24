import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { buttonPrimary, buttonSecondary, Card, Notice, Bar } from '../components/ui.jsx';
import SubtemaItem from '../components/SubtemaItem.jsx';
import { recommend } from '../domain/recomendador.js';
import { statusFor, summarizeProgress } from '../domain/progresso.js';
import { corDe } from '../app/cores.js';

// Filete com a cor da área no topo do cartão de título.
const HERO = `border-t-4 ${corDe('fundamentos').borda}`;

const PREVIEW = 8;

// Cor de cada lista da trilha, na marca do título e na borda dos temas. Revisão e Concluídos
// seguem as cores de status (revisar e dominado); Recomendados usa a cor de Fundamentos.
const LIST_TONES = {
  revisao: { marca: 'bg-amber-400', borda: 'border-l-amber-400/70' },
  recomendados: { marca: 'bg-indigo-400', borda: 'border-l-indigo-400/70' },
  desafio: { marca: 'bg-violet-400', borda: 'border-l-violet-400/70' },
  concluidos: { marca: 'bg-emerald-400', borda: 'border-l-emerald-400/70' }
};

function SubtemaList({ guia, tone, title, description, ids, index, progress, numbered = false, emptyText, onPractice }) {
  const tom = LIST_TONES[tone];
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? ids : ids.slice(0, PREVIEW);
  const headingId = `lista-${title.toLowerCase().replace(/[^a-z]+/g, '-')}`;
  return (
    <section aria-labelledby={headingId} data-guia={guia} className="space-y-3">
      <div>
        <h2 id={headingId} className="flex items-center gap-2 text-lg font-bold text-white">
          {tom && <span className={`h-5 w-1.5 shrink-0 rounded-full ${tom.marca}`} aria-hidden="true" />}
          <span>{title} <span className="font-mono text-sm text-slate-500">({ids.length})</span></span>
        </h2>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      {ids.length === 0 && <p className="text-sm text-slate-500">{emptyText}</p>}
      <ol className="space-y-2">
        {visible.map((id, order) => {
          const node = index.get(id);
          return (
            <li key={id}>
              <SubtemaItem
                node={node}
                areaNome={index.areaOf(id)?.nome}
                status={statusFor(progress[id])}
                prerequisitos={node.prerequisitos.map((prereq) => index.get(prereq)?.nome)}
                position={numbered ? order + 1 : undefined}
                accent={tom ? `border-l-4 ${tom.borda}` : ''}
                onPractice={onPractice ? () => onPractice([id]) : undefined}
              />
            </li>
          );
        })}
      </ol>
      {ids.length > PREVIEW && (
        <button type="button" onClick={() => setExpanded((value) => !value)} className={buttonSecondary} aria-expanded={expanded}>
          {expanded ? 'Mostrar menos' : `Mostrar todos (${ids.length})`}
        </button>
      )}
    </section>
  );
}

export default function Fundamentos({ index, profile, progress, observacao, onOpenTab, onPractice }) {
  const result = useMemo(() => recommend({ index, etapaId: profile?.etapaId, progress }), [index, profile?.etapaId, progress]);
  const etapa = result.etapa;

  if (result.semRecomendacao) {
    return (
      <div className="space-y-4">
        <Card className={HERO}>
          <h1 className="text-2xl font-black text-white">Fundamentos</h1>
          <p className="mt-2 text-slate-300">Você está em estudo livre, então não há trilha sugerida.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => onOpenTab('pratica')} className={buttonPrimary}>Escolher temas na Prática <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" onClick={() => onOpenTab('perfil')} className={buttonSecondary}>Informar minha etapa</button>
          </div>
        </Card>
      </div>
    );
  }

  const all = [...result.trilha, ...result.concluidos];
  const summary = summarizeProgress(all, progress);
  const next = result.proximo ? index.get(result.proximo) : null;
  const recomendados = result.recomendados.filter((id) => id !== result.proximo);
  const etapaLabel = etapa.grupo === etapa.nome ? etapa.nome : `${etapa.grupo} · ${etapa.nome}`;

  return (
    <div className="space-y-6">
      <Card data-guia="trilha-progresso" className={HERO}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white">Fundamentos</h1>
            <p className="mt-1 text-slate-300">Trilha sugerida para <strong className="text-white">{etapaLabel}</strong>.</p>
          </div>
          <button type="button" onClick={() => onOpenTab('perfil')} className={buttonSecondary}>Mudar etapa</button>
        </div>
        <div className="mt-4">
          <Bar label="Concluído na trilha" value={summary.percentConcluido} />
          <p className="mt-2 text-xs text-slate-500">
            {summary.dominado} de {summary.total} subtemas concluídos · {summary.revisar} para revisar · {summary['em-andamento']} em andamento
          </p>
        </div>
        {etapa.grupo === 'Ensino Médio' && <p className="mt-3 text-xs text-slate-500">{observacao}</p>}
      </Card>

      {next && (
        <Card data-guia="tema-recomendado" className="border-teal-500/40">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-300">Passo 2 · Tema recomendado</p>
          <h2 className="mt-1 text-xl font-black text-white">{next.nome}</h2>
          <p className="mt-1 text-sm text-slate-400">{next.descricao}</p>
          <button type="button" onClick={() => onPractice([next.id])} className={`${buttonPrimary} mt-4`}>Passo 3 · Praticar este tema <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
        </Card>
      )}

      <Notice tone="info">
        A sugestão é só um ponto de partida. Você pode estudar qualquer tema, em qualquer ordem, na Prática.
      </Notice>

      <SubtemaList
        guia="lista-revisao" tone="revisao"
        title="Revisão"
        description="Base de etapas anteriores que esta trilha usa, e temas em que seu acerto ficou baixo."
        ids={result.revisao}
        onPractice={onPractice}
        index={index}
        progress={progress}
        emptyText="Nada para revisar por enquanto."
      />
      <SubtemaList
        guia="lista-recomendados" tone="recomendados"
        title={next ? 'Outros recomendados para você' : 'Recomendados para você'}
        description={next ? 'Depois do tema destacado, na ordem sugerida e respeitando os pré-requisitos.' : 'Na ordem sugerida: cada tema vem depois dos que ele usa como base.'}
        ids={recomendados}
        onPractice={onPractice}
        index={index}
        progress={progress}
        numbered
        emptyText="Você concluiu todos os temas recomendados para a sua etapa."
      />
      <SubtemaList
        guia="lista-desafio" tone="desafio"
        title="Desafio"
        description="Temas da próxima etapa que você já tem base para encarar."
        ids={result.desafio}
        onPractice={onPractice}
        index={index}
        progress={progress}
        emptyText="Não há desafios além desta etapa na taxonomia atual."
      />
      {result.concluidos.length > 0 && (
        <SubtemaList tone="concluidos" title="Concluídos" description="Temas desta trilha em que seu acerto já está alto." ids={result.concluidos} index={index} progress={progress} onPractice={onPractice} />
      )}
    </div>
  );
}
