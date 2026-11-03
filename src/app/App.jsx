import React, { useEffect, useRef, useState } from 'react';
import { Atom, BookOpen, FlaskConical, House, Info, TestTubes, UserRound } from 'lucide-react';
import { ELEMENTOS, ELEMENTOS_META, ESTRUTURAS, ETAPAS, ETAPAS_OBSERVACAO, TAXONOMIA } from '../data/index.js';
import { TABS, getTab } from './navigation.js';
import useStudyState from './useStudyState.js';
import ThemeToggle from './ThemeToggle.jsx';
import HexBackdrop from '../components/HexBackdrop.jsx';
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

// Telas fora das abas, abertas por botões do cabeçalho.
const HEADER_SCREENS = ['perfil', 'ferramentas'];

const ETAPA_IDS = ETAPAS.map((etapa) => etapa.id);

const TAB_ICONS = {
  inicio: House,
  fundamentos: BookOpen,
  pratica: TestTubes,
  laboratorio: FlaskConical,
  'como-funciona': Info
};

export default function App() {
  const [activeTab, setActiveTab] = useState('inicio');
  const study = useStudyState(ETAPA_IDS);
  const { profile, progress, points, mentorLog, chooseEtapa, recordAnswer, clearDevice } = study;
  // Pedido de "praticar este tema" vindo de outra tela: { subtemaIds, autoStart }.
  const [practiceRequest, setPracticeRequest] = useState(null);
  const practice = (subtemaIds) => {
    setPracticeRequest({ subtemaIds, autoStart: true });
    setActiveTab('pratica');
  };
  const mainRef = useRef(null);
  const needsOnboarding = !profile && activeTab !== 'como-funciona';

  // Ao trocar de aba, o foco vai para o conteúdo (leitores de tela anunciam a nova tela).
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [activeTab, needsOnboarding]);

  const tab = getTab(activeTab);
  const currentId = HEADER_SCREENS.includes(activeTab) ? activeTab : tab.id;
  let screen;
  if (needsOnboarding) {
    screen = <Onboarding etapas={ETAPAS} observacao={ETAPAS_OBSERVACAO} onChoose={(etapaId) => { chooseEtapa(etapaId); setActiveTab('fundamentos'); }} />;
  } else if (currentId === 'ferramentas') {
    screen = <Ferramentas elementos={ELEMENTOS} meta={ELEMENTOS_META} estruturas={ESTRUTURAS} />;
  } else if (currentId === 'perfil') {
    screen = <Perfil etapas={ETAPAS} profile={profile} points={points} onChooseEtapa={chooseEtapa} study={study} onClearDevice={() => { clearDevice(); setActiveTab('inicio'); }} />;
  } else if (tab.id === 'inicio') {
    screen = <Inicio onOpenTab={setActiveTab} onPractice={practice} index={TAXONOMIA} profile={profile} progress={progress} points={points} />;
  } else if (tab.id === 'fundamentos') {
    screen = <Fundamentos index={TAXONOMIA} profile={profile} progress={progress} observacao={ETAPAS_OBSERVACAO} onOpenTab={setActiveTab} onPractice={practice} />;
  } else if (tab.id === 'pratica') {
    screen = (
      <Pratica
        index={TAXONOMIA}
        questions={QUESTIONS}
        etapas={ETAPAS}
        profile={profile}
        progress={progress}
        recordAnswer={recordAnswer}
        request={practiceRequest}
        onRequestHandled={() => setPracticeRequest(null)}
        onOpenTab={setActiveTab}
      />
    );
  } else if (tab.id === 'laboratorio') {
    screen = <Laboratorio index={TAXONOMIA} progress={progress} mentorLog={mentorLog} onPractice={practice} />;
  } else {
    screen = <ComoFunciona onOpenTab={setActiveTab} studyAvailable={Boolean(profile)} />;
  }

  return (
    <div className="relative min-h-screen text-slate-100">
      <HexBackdrop />
      <a href="#conteudo" className="sr-only z-50 rounded-lg bg-teal-700 px-3 py-2 text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Pular para o conteúdo
      </a>

      {/* Fixa no topo ao rolar a página. */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <button type="button" onClick={() => setActiveTab('inicio')} className="flex items-center gap-2 rounded-lg font-black tracking-tight text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300">
            <FlaskConical className="h-6 w-6 text-teal-300" aria-hidden="true" />
            <span>Visão Química</span>
          </button>
          {!needsOnboarding && (
            <nav aria-label="Módulos" className="hidden md:block">
              <ul className="flex gap-1">
                {TABS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      aria-current={item.id === currentId ? 'page' : undefined}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300 ${item.id === currentId ? 'bg-teal-500/15 text-teal-200' : 'text-slate-400 hover:text-white'}`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <div className="flex items-center gap-1">
            {!needsOnboarding && [['ferramentas', 'Ferramentas: tabela periódica e massa molar', Atom], ['perfil', 'Perfil', UserRound]].map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-label={label}
                aria-current={currentId === id ? 'page' : undefined}
                title={label}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300 ${currentId === id ? 'text-teal-200' : 'text-slate-400'}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setActiveTab('como-funciona')}
              aria-label="Sobre o projeto e créditos"
              aria-current={currentId === 'como-funciona' ? 'page' : undefined}
              title="Sobre o projeto e créditos"
              className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300 ${currentId === 'como-funciona' ? 'text-teal-200' : 'text-slate-400'}`}
            >
              <Info className="h-5 w-5" aria-hidden="true" />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="conteudo" ref={mainRef} tabIndex={-1} className="relative z-10 mx-auto max-w-6xl px-4 pb-32 pt-6 outline-none md:pb-16">
        {screen}
      </main>

      {/* Barra inferior no celular. */}
      {!needsOnboarding && <nav aria-label="Módulos" className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <ul className="grid grid-cols-5">
          {TABS.map((item) => {
            const Icon = TAB_ICONS[item.id];
            const active = item.id === currentId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  aria-label={item.label}
                  className={`flex h-16 w-full flex-col items-center justify-center gap-1 text-[10px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-300 ${active ? 'text-teal-200' : 'text-slate-500'}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="max-w-full truncate px-1">{item.short}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>}

      {/* Na Prática, a barra fixa da seleção ocupa o rodapé; os indicadores sairiam por cima dela. */}
      {currentId !== 'pratica' && <AppVersion />}
    </div>
  );
}
