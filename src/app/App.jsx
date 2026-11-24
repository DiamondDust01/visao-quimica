import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Brain, FlaskConical, House, Menu, TestTubes } from 'lucide-react';
import { ELEMENTOS, ELEMENTOS_META, ESTRUTURAS, ETAPAS, ETAPAS_OBSERVACAO, TAXONOMIA } from '../data/index.js';
import { SCREEN_IDS, TABS, getTab } from './navigation.js';
import useStudyState from './useStudyState.js';
import HexBackdrop from '../components/HexBackdrop.jsx';
import GuiaDeUso from '../components/GuiaDeUso.jsx';
import MenuMais from '../components/MenuMais.jsx';
import { STORAGE_KEYS, readValue, writeValue } from '../platform/storage.js';
import { AppVersion } from '../components/StatusIndicators.jsx';
import Inicio from '../screens/Inicio.jsx';
import Onboarding from '../screens/Onboarding.jsx';
import Perfil from '../screens/Perfil.jsx';
import Fundamentos from '../screens/Fundamentos.jsx';
import Pratica from '../screens/Pratica.jsx';
import { QUESTIONS } from '../data/questoes/index.js';
import ComoFunciona from '../screens/ComoFunciona.jsx';
import Ferramentas from '../screens/Ferramentas.jsx';
import Laboratorio from '../screens/Laboratorio.jsx';
import { TEMAS_RAPIDOS } from './temasRapidos.js';
import { corDe } from './cores.js';

const ETAPA_IDS = ETAPAS.map((etapa) => etapa.id);

// Telas que rolam sozinhas até a seção pedida pelo menu "Mais" (com useSectionFocus).
const SECTION_SCROLL_SCREENS = ['perfil', 'como-funciona'];

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
  const study = useStudyState(ETAPA_IDS);
  const { profile, progress, points, mentorLog, chooseEtapa, recordAnswer, clearDevice } = study;

  const openScreen = (tela, secao = null) => {
    setMenuOpen(false);
    setTarget((current) => ({ secao, visit: current.visit + 1 }));
    setActiveTab(tela);
  };
  const openTab = (tela) => openScreen(tela);

  // Pedido de "praticar este tema" vindo de outra tela: { subtemaIds, autoStart }.
  const [practiceRequest, setPracticeRequest] = useState(null);
  const practice = (subtemaIds) => {
    setPracticeRequest({ subtemaIds, autoStart: true });
    openScreen('pratica');
  };
  const mainRef = useRef(null);

  // Guia de uso: abre sobre as telas e leva o estudante até a tela de cada passo.
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideOffer, setGuideOffer] = useState(() => readValue(STORAGE_KEYS.guiaVisto) !== '1');
  const [praticaKey, setPraticaKey] = useState(0);
  const guideTela = useRef(null);
  // Subtema da sessão de exemplo do guia: o primeiro que tem questões.
  const demoSubtema = QUESTIONS[0]?.temaId;
  const dismissGuideOffer = () => {
    writeValue(STORAGE_KEYS.guiaVisto, '1');
    setGuideOffer(false);
  };
  const startGuide = () => {
    dismissGuideOffer();
    setMenuOpen(false);
    guideTela.current = null;
    setGuideOpen(true);
  };
  const closeGuide = () => {
    // Sai da sessão de exemplo, para o estudante não ficar numa sessão que não pediu.
    if (guideTela.current === 'pratica-sessao') setPraticaKey((key) => key + 1);
    guideTela.current = null;
    setMenuOpen(false);
    setGuideOpen(false);
  };
  const goToGuideStep = (step) => {
    const previous = guideTela.current;
    guideTela.current = step.tela;
    if (step.tela === 'pratica-sessao') {
      if (previous !== 'pratica-sessao') practice([demoSubtema]);
      return;
    }
    if (step.tela === 'menu-mais') {
      setActiveTab('inicio');
      setMenuOpen(true);
      return;
    }
    if (step.tela === 'pratica-lista') {
      if (previous === 'pratica-sessao') setPraticaKey((key) => key + 1);
      openScreen('pratica');
      return;
    }
    openScreen(step.tela);
  };

  const selectMenuItem = (item) => {
    if (item.acao === 'guia') startGuide();
    else openScreen(item.tela, item.secao);
  };

  // As telas guiadas pela etapa (Início, Fundamentos e Mentor) pedem a etapa primeiro. A Prática
  // (como Estudo livre, inclusive pelos temas rápidos) e as telas do menu "Mais" (ferramentas,
  // perfil e ajuda) funcionam sem ela. A barra de cima, a de baixo e o "Mais" ficam sempre visíveis.
  const needsOnboarding = !profile && !SCREEN_IDS.includes(activeTab) && activeTab !== 'pratica';

  // Ao trocar de tela, o foco vai para o conteúdo (leitores de tela anunciam a nova tela).
  // Com uma seção pedida em Perfil ou Ajuda, quem rola até ela é a própria tela. Ferramentas
  // abre a seção como aba, então volta ao topo como as demais.
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
    if (!target.secao || !SECTION_SCROLL_SCREENS.includes(activeTab)) window.scrollTo({ top: 0 });
  }, [activeTab, needsOnboarding, target.visit]); // eslint-disable-line react-hooks/exhaustive-deps

  const tab = getTab(activeTab);
  const onScreen = SCREEN_IDS.includes(activeTab);
  const currentId = onScreen ? activeTab : tab.id;
  // Na escolha de etapa nenhuma aba fica marcada: a tela ainda não é a da aba.
  const activeTabId = needsOnboarding ? null : currentId;
  const secao = target.secao;
  let screen;
  if (needsOnboarding) {
    screen = <Onboarding etapas={ETAPAS} observacao={ETAPAS_OBSERVACAO} onChoose={(etapaId) => { chooseEtapa(etapaId); openScreen('fundamentos'); }} temasRapidos={QUICK_TOPICS} onQuickStart={practice} />;
  } else if (currentId === 'ferramentas') {
    screen = <Ferramentas key={target.visit} initialSection={secao} elementos={ELEMENTOS} meta={ELEMENTOS_META} estruturas={ESTRUTURAS} />;
  } else if (currentId === 'perfil') {
    screen = <Perfil key={target.visit} focusSection={secao} etapas={ETAPAS} profile={profile} points={points} onChooseEtapa={chooseEtapa} study={study} onClearDevice={() => { clearDevice(); setGuideOffer(true); openScreen('inicio'); }} />;
  } else if (currentId === 'como-funciona') {
    screen = <ComoFunciona key={target.visit} focusSection={secao} onOpenTab={openTab} studyAvailable={Boolean(profile)} onStartGuide={startGuide} />;
  } else if (tab.id === 'inicio') {
    screen = <Inicio onOpenTab={openTab} onOpenScreen={openScreen} index={TAXONOMIA} profile={profile} progress={progress} points={points} guideOffer={guideOffer} onStartGuide={startGuide} onDismissGuide={dismissGuideOffer} />;
  } else if (tab.id === 'fundamentos') {
    screen = <Fundamentos index={TAXONOMIA} profile={profile} progress={progress} observacao={ETAPAS_OBSERVACAO} onOpenTab={openTab} onPractice={practice} />;
  } else if (tab.id === 'pratica') {
    screen = (
      <Pratica
        key={praticaKey}
        index={TAXONOMIA}
        questions={QUESTIONS}
        etapas={ETAPAS}
        profile={profile}
        progress={progress}
        recordAnswer={recordAnswer}
        request={practiceRequest}
        onRequestHandled={() => setPracticeRequest(null)}
        onOpenTab={openTab}
      />
    );
  } else {
    screen = <Laboratorio index={TAXONOMIA} progress={progress} mentorLog={mentorLog} onPractice={practice} />;
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
              {TABS.map((item) => {
                const Icon = TAB_ICONS[item.id];
                const cor = corDe(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openScreen(item.id)}
                      aria-current={item.id === activeTabId ? 'page' : undefined}
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
        {screen}
      </main>

      {/* Barra inferior no celular: as quatro abas e o "Mais". */}
      <nav aria-label="Módulos" data-guia="abas" className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <ul className="grid grid-cols-5">
          {TABS.map((item) => {
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
      {currentId !== 'pratica' && <AppVersion />}

      <MenuMais open={menuOpen} onClose={() => setMenuOpen(false)} onSelect={selectMenuItem} current={onScreen ? { tela: activeTab, secao } : null} semEtapa={!profile} />
      {guideOpen && !needsOnboarding && <GuiaDeUso onStep={goToGuideStep} onClose={closeGuide} />}
    </div>
  );
}
