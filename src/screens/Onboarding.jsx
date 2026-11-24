import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Brain, FlaskConical, TestTubes, Zap } from 'lucide-react';
import { buttonPrimary, Card } from '../components/ui.jsx';
import EtapaPicker from '../components/EtapaPicker.jsx';
import { getTab } from '../app/navigation.js';
import { corDe } from '../app/cores.js';

// Primeiro acesso: "como você quer estudar?". Três caminhos, cada um com a cor e a pergunta
// da aba aonde leva, para o estudante já entrar sabendo qual tela vai usar:
// - seguir a trilha da série (escolhe a etapa e abre a Trilha);
// - escolher temas livremente (Estudo livre, abre a Prática);
// - começar já por um tema rápido (sessão curta, sem salvar etapa).
// temasRapidos: [{ id, titulo, etapaNome, total, subtemaIds }]

function Caminho({ id, tela, rotulo, Icon, titulo, texto, acao, ativo, onClick }) {
  const cor = corDe(tela);
  return (
    <button
      type="button"
      data-caminho={id}
      onClick={onClick}
      aria-expanded={ativo === undefined ? undefined : ativo}
      className={`flex h-full w-full flex-col items-start gap-2 rounded-2xl border border-t-4 bg-slate-900/85 p-4 text-left backdrop-blur-sm transition hover:border-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 ${cor.borda} ${ativo ? 'border-slate-500 ring-1 ring-slate-500' : 'border-slate-800'}`}
    >
      <span className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${cor.titulo}`}>
        <Icon className={`h-4 w-4 ${cor.icone}`} aria-hidden="true" />
        {rotulo || getTab(tela).label}
      </span>
      <span className="text-lg font-black text-white">{titulo}</span>
      <span className="text-sm text-slate-400">{texto}</span>
      <span className={`mt-auto inline-flex items-center gap-1 pt-2 text-sm font-bold ${cor.texto}`}>{acao} <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
    </button>
  );
}

export default function Onboarding({ etapas, observacao, onChoose, onFreeStudy, temasRapidos = [], onQuickStart }) {
  const [modo, setModo] = useState(null);
  const [etapaId, setEtapaId] = useState('');
  const detalheRef = useRef(null);
  const showQuick = temasRapidos.length > 0 && Boolean(onQuickStart);
  const etapasDaTrilha = etapas.filter((etapa) => !etapa.semRecomendacao);

  // Ao abrir a escolha de etapa ou os temas rápidos, rola até eles.
  useEffect(() => {
    if (modo) detalheRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [modo]);

  const submit = (event) => {
    event.preventDefault();
    if (etapaId) onChoose(etapaId);
  };
  const alternar = (valor) => setModo((atual) => (atual === valor ? null : valor));

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-3">
          <FlaskConical className="h-8 w-8 shrink-0 text-teal-300" aria-hidden="true" />
          <h1 className="text-2xl font-black text-white sm:text-3xl">Boas-vindas ao Visão Química</h1>
        </div>
        <p className="mt-3 max-w-2xl text-slate-300">
          <strong className="text-white">Como você quer estudar?</strong> Cada caminho leva a uma parte diferente do app. Dá para usar todas depois, e mudar de ideia quando quiser.
        </p>
      </Card>

      <ul className="grid gap-3 md:grid-cols-3" aria-label="Caminhos para começar">
        <li>
          <Caminho
            id="trilha" tela="fundamentos" Icon={BookOpen} ativo={modo === 'trilha'} onClick={() => alternar('trilha')}
            titulo="Seguir a trilha da minha série"
            texto="Você informa a etapa escolar e recebe os temas dela em ordem, com o próximo sempre indicado."
            acao="Escolher minha etapa"
          />
        </li>
        <li>
          <Caminho
            id="livre" tela="pratica" Icon={TestTubes} onClick={onFreeStudy}
            titulo="Escolher os temas livremente"
            texto="Sem ordem sugerida: você marca os temas que quiser, de qualquer série, e monta a sessão."
            acao="Ir para a Prática"
          />
        </li>
        {showQuick && (
          <li>
            <Caminho
              id="rapido" tela="inicio" rotulo="Sessão rápida" Icon={Zap} ativo={modo === 'rapido'} onClick={() => alternar('rapido')}
              titulo="Começar agora"
              texto="Uma sessão curta num tema pronto, como reações endotérmicas e exotérmicas. Nada é salvo no perfil."
              acao="Ver os temas rápidos"
            />
          </li>
        )}
      </ul>

      <p className="flex items-start gap-2 px-1 text-sm text-slate-400">
        <Brain className={`mt-0.5 h-4 w-4 shrink-0 ${corDe('laboratorio').icone}`} aria-hidden="true" />
        <span>Depois dos primeiros erros aparece um quarto lugar, o <strong className="text-slate-200">Laboratório do Mentor</strong>: ele mostra onde você está errando e o que revisar.</span>
      </p>

      <div ref={detalheRef} className="scroll-mt-24">
        {modo === 'trilha' && (
          <form onSubmit={submit}>
            <Card>
              <h2 className="text-lg font-bold text-white">Qual é a sua etapa escolar?</h2>
              <p className="mt-1 mb-4 text-sm text-slate-400">A trilha é montada a partir dela. Você pode trocar depois, em "Mais" → Etapa escolar.</p>
              <EtapaPicker etapas={etapasDaTrilha} value={etapaId} onChange={setEtapaId} name="onboarding-etapa" />
              <p className="mt-4 text-xs text-slate-500">{observacao}</p>
              <div className="mt-4 flex justify-end">
                <button type="submit" disabled={!etapaId} className={buttonPrimary}>Ver minha trilha</button>
              </div>
            </Card>
          </form>
        )}

        {modo === 'rapido' && showQuick && (
          <Card>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
              <h2 id="temas-rapidos-titulo" className="text-lg font-bold text-white">Temas rápidos</h2>
            </div>
            <p className="mt-1 text-sm text-slate-400">Uma sessão curta, sem escolher a etapa. A série indicada é só uma referência.</p>
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
      </div>
    </div>
  );
}
