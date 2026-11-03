// Abas principais do app. A navegação é por estado (sem rotas de URL), o que funciona
// igual na web, no Android (Capacitor) e no Windows (Electron, que abre por file://).

export const TABS = [
  // `short` é o rótulo da barra inferior do celular; o nome completo fica no aria-label.
  { id: 'inicio', label: 'Início', short: 'Início', description: 'Visão geral do seu estudo.' },
  { id: 'fundamentos', label: 'Fundamentos', short: 'Trilhas', description: 'Trilhas guiadas pela sua etapa escolar.' },
  { id: 'pratica', label: 'Prática', short: 'Prática', description: 'Sessões com os temas que você escolher, com resolução passo a passo.' },
  { id: 'laboratorio', label: 'Laboratório do Mentor', short: 'Mentor', description: 'Padrões nos seus erros e o que revisar, por regras fixas e sem IA generativa.' },
  { id: 'como-funciona', label: 'Como funciona', short: 'Ajuda', description: 'Pontuação, níveis e informações do projeto.' }
];

export const TAB_IDS = TABS.map((tab) => tab.id);
export const DEFAULT_TAB = 'inicio';

export const isTabId = (value) => TAB_IDS.includes(value);
export const getTab = (id) => TABS.find((tab) => tab.id === id) || TABS[0];
