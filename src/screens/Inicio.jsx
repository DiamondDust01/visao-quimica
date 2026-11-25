import React, { useMemo } from 'react';
import { ArrowRight, Brain, History, Play } from 'lucide-react';
import { buttonPrimary, buttonSecondary, Card } from '../components/ui.jsx';
import TopoDaTela from '../components/TopoDaTela.jsx';
import NivelCard from '../components/NivelCard.jsx';
import { recommend } from '../domain/recomendador.js';
import { suggestReview } from '../domain/mentor/revisao.js';
import { formatarDuracao } from '../domain/tempo.js';

// Início: "o que eu faço agora?". Um botão principal começa direto a próxima sessão (sem
// passar por outra aba); abaixo, a última sessão e o aviso do Mentor, quando houver.
// O plano completo fica na Trilha e a escolha livre de temas, na Prática.
// ultimaSessao: { em, corretas, total, subtemaIds } | null

const MAX_NOMES = 3;

const nomesDe = (index, ids) => {
  const nomes = ids.map((id) => index.get(id)?.nome).filter(Boolean);
  return nomes.length > MAX_NOMES ? `${nomes.slice(0, MAX_NOMES).join(', ')} e mais ${nomes.length - MAX_NOMES}` : nomes.join(', ');
};

const dataCurta = (iso) => {
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? '' : data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
};

function Continuar({ result, index, ultimaSessao, onStart, onOpenTab }) {
  const next = result.proximo ? index.get(result.proximo) : null;
  if (next) {
    return (
      <Card data-guia="continuar" className="border-teal-500/50">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-300">Continuar a trilha</p>
        <h2 className="mt-1 text-xl font-black text-white">{next.nome}</h2>
        <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{index.areaOf(next.id)?.nome}</p>
        <p className="mt-1 text-sm text-slate-400">{next.descricao}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => onStart([next.id])} className={buttonPrimary}><Play className="h-4 w-4" aria-hidden="true" /> Praticar agora</button>
          <button type="button" onClick={() => onOpenTab('fundamentos')} className={buttonSecondary}>Ver a trilha completa</button>
        </div>
      </Card>
    );
  }
  if (!result.semRecomendacao) {
    return (
      <Card data-guia="continuar" className="border-teal-500/50">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-300">Trilha concluída</p>
        <h2 className="mt-1 text-xl font-black text-white">Você concluiu os temas da sua etapa</h2>
        <p className="mt-1 text-sm text-slate-400">Encare os desafios da próxima etapa na Trilha, ou escolha qualquer tema na Prática.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => onOpenTab('fundamentos')} className={buttonPrimary}>Ver os desafios <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" onClick={() => onOpenTab('pratica')} className={buttonSecondary}>Escolher na Prática</button>
        </div>
      </Card>
    );
  }
  return (
    <Card data-guia="continuar" className="border-teal-500/50">
      <p className="text-xs font-bold uppercase tracking-wide text-teal-300">Estudo livre</p>
      <h2 className="mt-1 text-xl font-black text-white">Escolha o que estudar</h2>
      <p className="mt-1 text-sm text-slate-400">Sem etapa escolhida não há trilha em ordem: você monta as sessões com os temas que quiser.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => onOpenTab('pratica')} className={buttonPrimary}>Escolher temas na Prática <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
        {ultimaSessao && <button type="button" onClick={() => onStart(ultimaSessao.subtemaIds)} className={buttonSecondary}>Repetir a última sessão</button>}
      </div>
    </Card>
  );
}

export default function Inicio({ index, profile, progress, points = 0, mentorLog = [], mentorLiberado = false, ultimaSessao, onOpenTab, onOpenScreen, onStart }) {
  const result = useMemo(() => recommend({ index, etapaId: profile?.etapaId, progress }), [index, profile?.etapaId, progress]);
  const sugestoes = useMemo(() => (mentorLiberado ? suggestReview({ index, progress, log: mentorLog }) : []), [mentorLiberado, index, progress, mentorLog]);
  const etapa = result.etapa;
  const data = ultimaSessao ? dataCurta(ultimaSessao.em) : '';

  return (
    <div className="space-y-4">
      <TopoDaTela tela="inicio">
        {etapa && (
          <p className="mt-3 text-sm text-slate-400">
            Sua etapa: <strong className="text-slate-200">{etapa.grupo === etapa.nome ? etapa.nome : `${etapa.grupo} · ${etapa.nome}`}</strong>{' '}
            <button type="button" onClick={() => onOpenScreen('perfil', 'etapa')} className="font-semibold text-teal-300 underline-offset-2 hover:underline">alterar</button>
          </p>
        )}
        <div data-guia="nivel" className="mt-4 max-w-md"><NivelCard points={points} /></div>
      </TopoDaTela>

      <Continuar result={result} index={index} ultimaSessao={ultimaSessao} onStart={onStart} onOpenTab={onOpenTab} />

      {(ultimaSessao || sugestoes.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {ultimaSessao && (
            <Card data-guia="ultima-sessao">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white"><History className="h-5 w-5 text-slate-400" aria-hidden="true" /> Última sessão</h2>
              <p className="mt-1 text-sm text-slate-300">
                {data ? `Em ${data}, você acertou ` : 'Você acertou '}
                <strong className="text-white">{ultimaSessao.corretas} de {ultimaSessao.total}</strong> em {nomesDe(index, ultimaSessao.subtemaIds)}{ultimaSessao.segundos > 0 ? `, estudando por ${formatarDuracao(ultimaSessao.segundos)}` : ''}.
              </p>
              <button type="button" onClick={() => onStart(ultimaSessao.subtemaIds)} className={`${buttonSecondary} mt-3`}>Repetir esses temas</button>
            </Card>
          )}
          {sugestoes.length > 0 && (
            <Card data-guia="aviso-mentor">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white"><Brain className="h-5 w-5 text-fuchsia-300" aria-hidden="true" /> O Mentor tem sugestões</h2>
              <p className="mt-1 text-sm text-slate-300">
                {sugestoes.length === 1 ? 'Um tema' : `${sugestoes.length} temas`} para revisar, a começar por <strong className="text-white">{index.get(sugestoes[0].subtemaId)?.nome}</strong>.
              </p>
              <button type="button" onClick={() => onOpenTab('laboratorio')} className={`${buttonSecondary} mt-3`}>Abrir o Mentor</button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
