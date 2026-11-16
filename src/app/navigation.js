// Abas principais do app. A navegação é por estado (sem rotas de URL), o que funciona
// igual na web, no Android (Capacitor) e no Windows (Electron, que abre por file://).

export const TABS = [
  // `short` é o rótulo da barra inferior do celular; o nome completo fica no aria-label.
  { id: 'inicio', label: 'Início', short: 'Início', description: 'Visão geral do seu estudo.' },
  { id: 'fundamentos', label: 'Fundamentos', short: 'Trilhas', description: 'Trilhas guiadas pela sua etapa escolar.' },
  { id: 'pratica', label: 'Prática', short: 'Prática', description: 'Sessões com os temas que você escolher, com resolução passo a passo.' },
  { id: 'laboratorio', label: 'Laboratório do Mentor', short: 'Mentor', description: 'Padrões nos seus erros e o que revisar, por regras fixas e sem IA generativa.' }
];

export const TAB_IDS = TABS.map((tab) => tab.id);
export const DEFAULT_TAB = 'inicio';

export const isTabId = (value) => TAB_IDS.includes(value);
export const getTab = (id) => TABS.find((tab) => tab.id === id) || TABS[0];

// Telas fora das abas: abertas pelo menu "Mais" (e por atalhos do Início).
export const SCREEN_IDS = ['ferramentas', 'perfil', 'como-funciona'];

// Menu "Mais": o que é de uso ocasional fica agrupado aqui, fora da barra principal.
// Cada item leva direto ao destino ({ tela, secao }) ou faz uma ação ('guia' ou 'tema').
// Assim qualquer lugar do app fica a no máximo três toques: Mais → item → elemento da tela.
export const MENU_MAIS = [
  {
    id: 'ferramentas', titulo: 'Ferramentas',
    itens: [
      { id: 'tabela', label: 'Tabela periódica', descricao: 'Elementos, categorias e detalhes', tela: 'ferramentas', secao: 'tabela' },
      { id: 'massa-molar', label: 'Massa molar', descricao: 'Calculadora a partir da fórmula', tela: 'ferramentas', secao: 'massa-molar' },
      { id: 'estruturas', label: 'Estruturas', descricao: 'Desenho de moléculas', tela: 'ferramentas', secao: 'estruturas' }
    ]
  },
  {
    id: 'dados', titulo: 'Meus dados',
    itens: [
      { id: 'etapa', label: 'Etapa escolar e pontos', descricao: 'Trocar a etapa da trilha', tela: 'perfil', secao: 'etapa' },
      { id: 'backup', label: 'Backup do progresso', descricao: 'Exportar, importar e lembrete', tela: 'perfil', secao: 'backup' },
      { id: 'apagar', label: 'Apagar dados do aparelho', descricao: 'Recomeçar do zero', tela: 'perfil', secao: 'dados' }
    ]
  },
  {
    id: 'ajuda', titulo: 'Ajuda',
    itens: [
      { id: 'guia', label: 'Guia de uso', descricao: 'Tour pelas telas do app', acao: 'guia' },
      { id: 'regras', label: 'Regras e níveis', descricao: 'Pontuação, níveis e progresso', tela: 'como-funciona', secao: 'regras' },
      { id: 'creditos', label: 'Sobre e créditos', descricao: 'Projeto, versão e links', tela: 'como-funciona', secao: 'creditos' }
    ]
  },
  {
    id: 'aparencia', titulo: 'Aparência',
    itens: [{ id: 'tema', label: 'Tema claro ou escuro', acao: 'tema' }]
  }
];
