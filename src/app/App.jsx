import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Brain, FlaskConical, House, Menu, TestTubes } from 'lucide-react';
import { ELEMENTOS, ELEMENTOS_META, ESTRUTURAS, ETAPAS, ETAPAS_OBSERVACAO, TAXONOMIA } from '../data/index.js';
import { SCREEN_IDS, TABS, getTab } from './navigation.js';
import useStudyState from './useStudyState.js';
import HexBackdrop from '../components/HexBackdrop.jsx';
import GuiaDeUso from '../components/GuiaDeUso.jsx';
import GuiaIndice from '../components/GuiaIndice.jsx';
import DicaGuia from '../components/DicaGuia.jsx';
import OfertaGuia from '../components/OfertaGuia.jsx';
import MenuMais from '../components/MenuMais.jsx';
import { STORAGE_KEYS, readJson, readValue, writeJson, writeValue } from '../platform/storage.js';
import { AppVersion } from '../components/StatusIndicators.jsx';
import Inicio from '../screens/Inicio.jsx';
import Onboarding from '../screens/Onboarding.jsx';
import Perfil from '../screens/Perfil.jsx';
import Trilha from '../screens/Trilha.jsx';
import Pratica from '../screens/Pratica.jsx';
import Sessao from '../screens/Sessao.jsx';
import ConfirmarSessao from '../components/ConfirmarSessao.jsx';
import { buildSession, summarizeSession } from '../domain/questoes/sessao.js';
import { QUESTIONS } from '../data/questoes/index.js';
import ComoFunciona from '../screens/ComoFunciona.jsx';
import Ferramentas from '../screens/Ferramentas.jsx';
import Laboratorio from '../screens/Laboratorio.jsx';
import { TEMAS_RAPIDOS } from './temasRapidos.js';
import { corDe } from './cores.js';
import { montarGuia } from './guia.js';
import { mentorTemConteudo } from '../domain/mentor/liberacao.js';

const ETAPA_IDS = ETAPAS.map((etapa) => etapa.id);

// Telas que pedem a etapa escolar antes: as outras funcionam sem ela.
const STAGE_SCREENS = ['inicio', 'fundamentos'];

// Telas que rolam sozinhas até a seção pedida pelo menu "Mais" (com useSectionFocus).
const SECTION_SCROLL_SCREENS = ['perfil', 'como-funciona'];

const defaultFontScale = () => (
  typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? 0.9 : 1
);

// Temas rápidos da tela de boas-vindas, com o nome da etapa e o total de questões já resolvidos.
const QUICK_TOPICS = TEMAS_RAPIDOS.map((tema) => ({
  ...tema,
  etapaNome: ETAPAS.find((etapa) => etapa.id === tema.etapaId)?.nome || '',
  total: QUESTIONS.filter((questao) => tema.subtemaIds.includes(questao.temaId)).length
})).filter((tema) => tema.total > 0);

const TAB_ICONS = {
  inicio: House,
  fundamentos: BookOpen,
  pratica: TestTubes,
  laboratorio: Brain
};

export default function App() {
  const [activeTab, setActiveTab] = useState('inicio');
  // Seção pedida dentro de Ferramentas, Perfil ou Ajuda (ex.: 'backup'). `visit` muda a cada
  // navegação, para a tela abrir de novo na seção certa mesmo se já estiver aberta.
  const [target, setTarget] = useState({ secao: null, visit: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [fontScale, setFontScale] = useState(() => {
    const stored = readValue(STORAGE_KEYS.tamanhoFonte);
    const saved = Number(stored);
    return stored !== null && Number.isFinite(saved) && saved >= 0.8 && saved <= 1.4
      ? saved
      : defaultFontScale();
  });
  const baseFontSize = useRef(null);
  const study = useStudyState(ETAPA_IDS);
  const { profile, progress, points, mentorLog, chooseEtapa, recordAnswer, clearDevice } = study;

  useEffect(() => {
    const root = document.documentElement;
    if (baseFontSize.current === null) {
      baseFontSize.current = Number.parseFloat(window.getComputedStyle(root).fontSize);
    }
    root.style.fontSize = `${baseFontSize.current * fontScale}px`;
  }, [fontScale]);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const updateDefault = () => {
      if (readValue(STORAGE_KEYS.tamanhoFonte) === null) setFontScale(defaultFontScale());
    };
    mobileQuery.addEventListener('change', updateDefault);
    return () => mobileQuery.removeEventListener('change', updateDefault);
  }, []);

  const adjustFontScale = (change) => {
    const next = Math.min(1.4, Math.max(0.8, Math.round((fontScale + change) * 10) / 10));
    setFontScale(next);
    writeValue(STORAGE_KEYS.tamanhoFonte, next);
  };

  const openScreen = (tela, secao = null) => {
    setMenuOpen(false);
    setSessao(null);
    setPedidoSessao(null);
    setTarget((current) => ({ secao, visit: current.visit + 1 }));
    setActiveTab(tela);
  };
  const openTab = (tela) => openScreen(tela);

  // Temas a deixar marcados na Prática: { subtemaIds }.
  const [practiceRequest, setPracticeRequest] = useState(null);
  const mainRef = useRef(null);

  // Sessão de questões: uma tela própria, aberta por cima da aba de onde o estudante começou
  // (origem). { id, questions, subtemaIds, origem, summary }. Trocar de aba encerra a sessão;
  // as respostas já dadas ficam salvas.
  const [sessao, setSessao] = useState(null);
  const [ultimaSessao, setUltimaSessao] = useState(() => {
    const salva = readJson(STORAGE_KEYS.ultimaSessao);
    return salva && Array.isArray(salva.subtemaIds) && salva.subtemaIds.length ? salva : null;
  });
  // Pedido de sessão aguardando a confirmação do estudante (ConfirmarSessao):
  // { subtemaIds, questions, origem, origemNome }.
  const [pedidoSessao, setPedidoSessao] = useState(null);
  const openSession = ({ subtemaIds, questions, origem }) => {
    setPedidoSessao(null);
    setMenuOpen(false);
    setActiveTab(origem);
    setSessao({ id: Date.now(), questions, subtemaIds: [...subtemaIds], origem, summary: null });
  };
  // Toda sessão pede confirmação antes de começar.
  const startSession = (subtemaIds, { origem = 'pratica', quantidade = 10 } = {}) => {
    const questions = buildSession({
      questoes: QUESTIONS,
      subtemaIds,
      quantidade,
      nivelDaEtapa: (etapaId) => TAXONOMIA.etapaById.get(etapaId)?.nivel ?? 0,
      nivelEstudante: TAXONOMIA.etapaById.get(profile?.etapaId)?.nivel || null
    });
    // Tema sem questões: abre a Prática com ele marcado, que avisa e deixa escolher outro.
    if (!questions.length) {
      openScreen('pratica');
      setPracticeRequest({ subtemaIds });
      return;
    }
    const pedido = { subtemaIds: [...subtemaIds], questions, origem, origemNome: getTab(origem).label };
    setPedidoSessao(pedido);
  };
  const finishSession = (answers, segundos = 0) => {
    const summary = { ...summarizeSession(answers), segundos };
    setSessao((atual) => (atual ? { ...atual, summary } : atual));
    if (summary.total > 0 && sessao) {
      const registro = { em: new Date().toISOString(), corretas: summary.corretas, total: summary.total, segundos, subtemaIds: sessao.subtemaIds };
      writeJson(STORAGE_KEYS.ultimaSessao, registro);
      setUltimaSessao(registro);
    }
  };
  const leaveSession = () => {
    const atual = sessao;
    setSessao(null);
    // De volta à Prática, os temas da sessão continuam marcados.
    if (atual?.origem === 'pratica') setPracticeRequest({ subtemaIds: atual.subtemaIds });
  };
  // "Praticar" vindo de cada aba: a sessão abre por cima dela.
  const practiceFrom = (origem) => (subtemaIds) => startSession(subtemaIds, { origem });

  // Laboratório do Mentor: a aba fica oculta até o Mentor ter o que sugerir (veja
  // domain/mentor/liberacao.js). Liberado uma vez, continua liberado neste aparelho.
  const mentorPronto = useMemo(() => mentorTemConteudo({ index: TAXONOMIA, progress, log: mentorLog }), [progress, mentorLog]);
  const [mentorLiberado, setMentorLiberado] = useState(() => readValue(STORAGE_KEYS.mentorLiberado) === '1');
  useEffect(() => {
    if (!mentorPronto || mentorLiberado) return;
    writeValue(STORAGE_KEYS.mentorLiberado, '1');
    setMentorLiberado(true);
  }, [mentorPronto, mentorLiberado]);
  const visibleTabs = mentorLiberado ? TABS : TABS.filter((item) => item.id !== 'laboratorio');

  // Guia de uso: abre sobre as telas e leva o estudante até a tela de cada passo.
  // guidePassos guarda a parte escolhida; null abre o índice do guia.
  const [guideOpen, setGuideOpen] = useState(false);
  const [guidePassos, setGuidePassos] = useState(null);
  const [guideOffer, setGuideOffer] = useState(() => readValue(STORAGE_KEYS.guiaVisto) !== '1');
  const dismissGuideOffer = () => {
    writeValue(STORAGE_KEYS.guiaVisto, '1');
    setGuideOffer(false);
  };
  const startGuide = (parte = 'completo') => {
    if (parte === 'primeiros-passos') dismissGuideOffer();
    setMenuOpen(false);
    setGuidePassos(montarGuia({
      mentorLiberado,
      etapaEscolhida: Boolean(profile?.etapaId && profile.etapaId !== 'livre'),
      parte
    }));
    setGuideOpen(true);
  };
  const openGuideIndex = () => {
    setMenuOpen(false);
    setGuidePassos(null);
    setGuideOpen(true);
  };
  const closeGuide = () => {
    setMenuOpen(false);
    setGuideOpen(false);
    setGuidePassos(null);
  };
  const goToGuideStep = (step) => {
    // Informational steps stay on the current screen.
    if (!step.tela) return;
    if (step.tela === 'menu-mais') {
      setActiveTab('inicio');
      setMenuOpen(true);
      return;
    }
    if (step.tela === 'pratica-lista') {
      openScreen('pratica');
      return;
    }
    openScreen(step.tela);
  };

  const selectMenuItem = (item) => {
    if (item.acao === 'guia') openGuideIndex();
    else openScreen(item.tela, item.secao);
  };

  // O Laboratório oculto nunca abre: quem chegar nele (por um estado antigo) vê o Início.
  const shownTab = activeTab === 'laboratorio' && !mentorLiberado ? 'inicio' : activeTab;

  // As telas guiadas pela etapa (Início e Trilha) pedem a etapa primeiro. A Prática (como
  // Estudo livre, inclusive pelos temas rápidos), o Mentor e as telas do menu "Mais"
  // (ferramentas, perfil e ajuda) funcionam sem ela. As barras e o "Mais" ficam sempre visíveis.
  const needsOnboarding = !sessao && !profile && STAGE_SCREENS.includes(shownTab);

  // Ao trocar de tela, o foco vai para o conteúdo (leitores de tela anunciam a nova tela).
  // Com uma seção pedida em Perfil ou Ajuda, quem rola até ela é a própria tela. Ferramentas
  // abre a seção como aba, então volta ao topo como as demais.
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
    if (!target.secao || !SECTION_SCROLL_SCREENS.includes(activeTab)) window.scrollTo({ top: 0 });
  }, [activeTab, needsOnboarding, target.visit, sessao?.id, Boolean(sessao), Boolean(sessao?.summary)]); // eslint-disable-line react-hooks/exhaustive-deps

  const tab = getTab(shownTab);
  const onScreen = SCREEN_IDS.includes(activeTab);
  const currentId = onScreen ? activeTab : tab.id;
  const guideHintArea = needsOnboarding
    ? null
    : sessao
      ? 'sessao'
      : currentId === 'fundamentos'
        ? 'fundamentos'
        : currentId === 'como-funciona'
          ? null
          : currentId;
  // Na escolha de etapa nenhuma aba fica marcada: a tela ainda não é a da aba.
  const activeTabId = needsOnboarding ? null : currentId;
  const secao = target.secao;
  let screen;
  if (sessao) {
    screen = (
      <Sessao
        sessao={sessao}
        index={TAXONOMIA}
        origemNome={getTab(sessao.origem).label}
        onAnswer={recordAnswer}
        onFinish={finishSession}
        onRepeat={() => startSession(sessao.subtemaIds, { origem: sessao.origem })}
        onBack={leaveSession}
      />
    );
  } else if (needsOnboarding) {
    screen = (
      <Onboarding
        etapas={ETAPAS}
        observacao={ETAPAS_OBSERVACAO}
        onChoose={(etapaId) => { chooseEtapa(etapaId); openScreen('fundamentos'); }}
        onFreeStudy={() => { chooseEtapa('livre'); openScreen('pratica'); }}
        temasRapidos={QUICK_TOPICS}
        onQuickStart={practiceFrom('inicio')}
      />
    );
  } else if (currentId === 'ferramentas') {
    screen = <Ferramentas key={target.visit} initialSection={secao} elementos={ELEMENTOS} meta={ELEMENTOS_META} estruturas={ESTRUTURAS} />;
  } else if (currentId === 'perfil') {
    screen = <Perfil key={target.visit} focusSection={secao} etapas={ETAPAS} profile={profile} points={points} onChooseEtapa={chooseEtapa} study={study} onClearDevice={() => { clearDevice(); setFontScale(defaultFontScale()); setGuideOffer(true); setMentorLiberado(false); setUltimaSessao(null); openScreen('inicio'); }} />;
  } else if (currentId === 'como-funciona') {
    screen = <ComoFunciona key={target.visit} focusSection={secao} onOpenTab={openTab} studyAvailable={Boolean(profile)} onStartGuide={openGuideIndex} />;
  } else if (tab.id === 'inicio') {
    screen = (
      <Inicio
        index={TAXONOMIA}
        profile={profile}
        progress={progress}
        points={points}
        mentorLog={mentorLog}
        mentorLiberado={mentorLiberado}
        ultimaSessao={ultimaSessao}
        onOpenTab={openTab}
        onOpenScreen={openScreen}
        onStart={practiceFrom('inicio')}
      />
    );
  } else if (tab.id === 'fundamentos') {
    screen = <Trilha index={TAXONOMIA} profile={profile} progress={progress} observacao={ETAPAS_OBSERVACAO} onOpenTab={openTab} onOpenScreen={openScreen} onPractice={practiceFrom('fundamentos')} />;
  } else if (tab.id === 'pratica') {
    screen = (
      <Pratica
        index={TAXONOMIA}
        questions={QUESTIONS}
        etapas={ETAPAS}
        progress={progress}
        request={practiceRequest}
        onRequestHandled={() => setPracticeRequest(null)}
        onStart={(subtemaIds, quantidade) => startSession(subtemaIds, { origem: 'pratica', quantidade })}
      />
    );
  } else {
    screen = <Laboratorio index={TAXONOMIA} progress={progress} mentorLog={mentorLog} onPractice={practiceFrom('laboratorio')} />;
  }

  // "Mais" aparece ativo quando a tela aberta é uma das que ele guarda.
  const moreActive = menuOpen || onScreen;
  // Com uma tela do "Mais" aberta, o botão ganha a cor dela; só com o menu aberto, fica neutro.
  const moreColor = corDe(onScreen ? activeTab : 'aparencia');
  const moreButton = (extra) => ({
    type: 'button',
    'data-guia': 'btn-mais',
    onClick: () => setMenuOpen((value) => !value),
    'aria-expanded': menuOpen,
    'aria-controls': 'menu-mais',
    'aria-haspopup': 'dialog',
    'aria-current': onScreen ? 'page' : undefined,
    ...extra
  });

  return (
    <div className="relative min-h-screen text-slate-100">
      <HexBackdrop />
      <a href="#conteudo" className="sr-only z-50 rounded-lg bg-teal-700 px-3 py-2 text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Pular para o conteúdo
      </a>

      {/* Fixa no topo ao rolar a página. */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <button type="button" onClick={() => openScreen('inicio')} className="flex items-center gap-2 rounded-lg font-black tracking-tight text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300">
            <FlaskConical className="h-6 w-6 text-teal-300" aria-hidden="true" />
            <span>Visão Química</span>
          </button>
          <nav aria-label="Módulos" data-guia="abas" className="hidden md:block">
            <ul className="flex gap-1">
              {visibleTabs.map((item) => {
                const Icon = TAB_ICONS[item.id];
                const cor = corDe(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openScreen(item.id)}
                      aria-current={item.id === activeTabId ? 'page' : undefined}
                      data-guia={`aba-${item.id}`}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300 ${item.id === activeTabId ? cor.ativo : 'text-slate-400 hover:text-white'}`}
                    >
                      <Icon className={`hidden h-4 w-4 lg:block ${cor.icone}`} aria-hidden="true" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          <button
            {...moreButton({
              className: `hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300 md:flex ${moreActive ? moreColor.ativo : 'text-slate-400 hover:text-white'}`
            })}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
            Mais
          </button>
        </div>
      </header>

      <main id="conteudo" ref={mainRef} tabIndex={-1} className="relative z-10 mx-auto max-w-6xl px-4 pb-32 pt-6 outline-none md:pb-16">
        {guideHintArea && (
          <div className="mb-4">
            <DicaGuia
              key={guideHintArea}
              area={guideHintArea}
              onStart={(area) => startGuide(
                area === 'fundamentos' ? 'trilha' : area === 'laboratorio' ? 'mentor' : area
              )}
            />
          </div>
        )}
        {screen}
      </main>

      {/* Barra inferior no celular: as quatro abas e o "Mais". */}
      <nav aria-label="Módulos" data-guia="abas" className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <ul className={`grid ${visibleTabs.length === 4 ? 'grid-cols-5' : 'grid-cols-4'}`}>
          {visibleTabs.map((item) => {
            const Icon = TAB_ICONS[item.id];
            const cor = corDe(item.id);
            const active = item.id === activeTabId && !menuOpen;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => openScreen(item.id)}
                  aria-current={item.id === activeTabId ? 'page' : undefined}
                  aria-label={item.label}
                  data-guia={`aba-${item.id}`}
                  className={`flex h-16 w-full flex-col items-center justify-center gap-1 text-[10px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-300 ${active ? cor.texto : 'text-slate-500'}`}
                >
                  <Icon className={`h-5 w-5 ${cor.icone} ${active ? '' : 'opacity-60'}`} aria-hidden="true" />
                  <span className="max-w-full truncate px-1">{item.short}</span>
                </button>
              </li>
            );
          })}
          <li>
            <button
              {...moreButton({
                'aria-label': 'Mais opções',
                className: `flex h-16 w-full flex-col items-center justify-center gap-1 text-[10px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-300 ${moreActive ? moreColor.texto : 'text-slate-500'}`
              })}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
              <span className="max-w-full truncate px-1">Mais</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* Na Prática, a barra fixa da seleção ocupa o rodapé; os indicadores sairiam por cima dela. */}
      {(currentId !== 'pratica' || sessao) && <AppVersion />}

      {pedidoSessao && (
        <ConfirmarSessao
          pedido={pedidoSessao}
          index={TAXONOMIA}
          progress={progress}
          onConfirm={() => openSession(pedidoSessao)}
          onCancel={() => setPedidoSessao(null)}
        />
      )}
      {needsOnboarding && guideOffer && !guideOpen && (
        <OfertaGuia onStart={() => startGuide('primeiros-passos')} onDismiss={dismissGuideOffer} />
      )}
      <MenuMais
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSelect={selectMenuItem}
        current={onScreen ? { tela: activeTab, secao } : null}
        fontScale={fontScale}
        onFontScaleChange={adjustFontScale}
      />
      {guideOpen && (guidePassos
        ? <GuiaDeUso passos={guidePassos} onStep={goToGuideStep} onClose={closeGuide} />
        : <GuiaIndice
          mentorLiberado={mentorLiberado}
          etapaEscolhida={Boolean(profile?.etapaId && profile.etapaId !== 'livre')}
          onSelect={startGuide}
          onClose={closeGuide}
        />)}
    </div>
  );
}
