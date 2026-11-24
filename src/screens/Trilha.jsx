import React, { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { buttonPrimary, buttonSecondary, Notice, Bar } from '../components/ui.jsx';
import SubtemaItem from '../components/SubtemaItem.jsx';
import TopoDaTela from '../components/TopoDaTela.jsx';
import { recommend } from '../domain/recomendador.js';
import { statusFor, summarizeProgress } from '../domain/progresso.js';
import LeituraPainel from '../components/LeituraPainel.jsx';
import { leituraDe } from '../data/leituras/index.js';

// Trilha (aba de id 'fundamentos'): o plano da etapa escolar inteira, em ordem. O próximo
// tema sugerido aparece marcado dentro da própria lista, com o selo "Próximo".

const PREVIEW = 8;

// Cor de cada lista da trilha, na marca do título e na borda dos temas. Revisão e Concluídos
// seguem as cores de status (revisar e dominado); Recomendados usa a cor da Trilha.
const LIST_TONES = {
  revisao: { marca: 'bg-amber-400', borda: 'border-l-amber-400/70' },
  recomendados: { marca: 'bg-indigo-400', borda: 'border-l-indigo-400/70' },
  desafio: { marca: 'bg-violet-400', borda: 'border-l-violet-400/70' },
  concluidos: { marca: 'bg-emerald-400', borda: 'border-l-emerald-400/70' }
};

function SubtemaList({ guia, tone, title, description, ids, index, progress, numbered = false, emptyText, onPractice, onLer, proximoId }) {
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
            <li key={id} {...(id === proximoId ? { 'data-guia': 'tema-recomendado' } : {})}>
              <SubtemaItem
                node={node}
                areaNome={index.areaOf(id)?.nome}
                status={statusFor(progress[id])}
                prerequisitos={node.prerequisitos.map((prereq) => index.get(prereq)?.nome)}
                position={numbered ? order + 1 : undefined}
                accent={tom ? `border-l-4 ${tom.borda}` : ''}
                proximo={id === proximoId}
                onPractice={onPractice ? () => onPractice([id]) : undefined}
                onLer={onLer && leituraDe(id) ? () => onLer(id) : undefined}
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

export default function Trilha({ index, profile, progress, observacao, onOpenTab, onOpenScreen, onPractice }) {
  const result = useMemo(() => recommend({ index, etapaId: profile?.etapaId, progress }), [index, profile?.etapaId, progress]);
  const etapa = result.etapa;
  // Subtema com o material de leitura aberto ("Ler" na lista).
  const [lendoId, setLendoId] = useState(null);
  const mudarEtapa = <button type="button" onClick={() => onOpenScreen('perfil', 'etapa')} className={buttonSecondary}>Mudar etapa</button>;

  if (result.semRecomendacao) {
    return (
      <div className="space-y-4">
        <TopoDaTela tela="fundamentos" data-guia="trilha-progresso">
          <p className="mt-3 text-slate-300">Você está em <strong className="text-white">Estudo livre</strong>, então não há uma trilha em ordem. Escolha uma etapa escolar para ver o plano dela aqui, ou escolha os temas por conta própria na Prática.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => onOpenScreen('perfil', 'etapa')} className={buttonPrimary}>Escolher minha etapa</button>
            <button type="button" onClick={() => onOpenTab('pratica')} className={buttonSecondary}>Ir para a Prática <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>
        </TopoDaTela>
      </div>
    );
  }

  const all = [...result.trilha, ...result.concluidos];
  const summary = summarizeProgress(all, progress);
  const proximoId = result.proximo;
  const etapaLabel = etapa.grupo === etapa.nome ? etapa.nome : `${etapa.grupo} · ${etapa.nome}`;

  return (
    <div className="space-y-6">
      <TopoDaTela tela="fundamentos" data-guia="trilha-progresso" acoes={mudarEtapa}>
        <p className="mt-3 text-sm text-slate-400">Sua etapa: <strong className="text-slate-200">{etapaLabel}</strong></p>
        <div className="mt-3">
          <Bar label="Concluído na trilha" value={summary.percentConcluido} />
          <p className="mt-2 text-xs text-slate-500">
            {summary.dominado} de {summary.total} subtemas concluídos · {summary.revisar} para revisar · {summary['em-andamento']} em andamento
          </p>
        </div>
        {etapa.grupo === 'Ensino Médio' && <p className="mt-3 text-xs text-slate-500">{observacao}</p>}
      </TopoDaTela>

      <Notice tone="info">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="min-w-0 flex-1">A ordem é uma sugestão. Para escolher qualquer tema, de qualquer série, use a Prática.</span>
          <button type="button" onClick={() => onOpenTab('pratica')} className="font-semibold underline underline-offset-2">Ir para a Prática</button>
        </span>
      </Notice>

      <SubtemaList
        guia="lista-revisao" tone="revisao"
        title="Revisão"
        description="Base de etapas anteriores que esta trilha usa, e temas em que seu acerto ficou baixo."
        ids={result.revisao}
        onPractice={onPractice}
        onLer={setLendoId}
        proximoId={proximoId}
        index={index}
        progress={progress}
        emptyText="Nada para revisar por enquanto."
      />
      <SubtemaList
        guia="lista-recomendados" tone="recomendados"
        title="Recomendados para você"
        description="Na ordem sugerida: cada tema vem depois dos que ele usa como base. O próximo aparece em destaque."
        ids={result.recomendados}
        onPractice={onPractice}
        onLer={setLendoId}
        proximoId={proximoId}
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
        onLer={setLendoId}
        index={index}
        progress={progress}
        emptyText="Não há desafios além desta etapa na taxonomia atual."
      />
      {result.concluidos.length > 0 && (
        <SubtemaList tone="concluidos" title="Concluídos" description="Temas desta trilha em que seu acerto já está alto." ids={result.concluidos} index={index} progress={progress} onPractice={onPractice} onLer={setLendoId} />
      )}
      {lendoId && leituraDe(lendoId) && (
        <LeituraPainel leitura={leituraDe(lendoId)} node={index.get(lendoId)} areaNome={index.areaOf(lendoId)?.nome} onClose={() => setLendoId(null)} />
      )}
    </div>
  );
}
