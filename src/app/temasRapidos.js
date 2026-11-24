// Temas rápidos da tela de boas-vindas: quem não quer escolher a etapa agora começa direto
// uma sessão curta. Cada tema junta três subtemas próximos (três questões cada) e indica a
// etapa em que o assunto costuma aparecer, só como referência; nada é salvo no perfil.
export const TEMAS_RAPIDOS = [
  {
    id: 'misturas',
    etapaId: 'ef-6',
    titulo: 'Misturas e separação',
    subtemaIds: ['fund-misturas-tipos', 'fund-separacao-heterogeneas', 'fund-separacao-homogeneas']
  },
  {
    id: 'modelos-atomicos',
    etapaId: 'ef-9',
    titulo: 'Modelos atômicos',
    subtemaIds: ['atom-modelos-classicos', 'atom-modelo-bohr', 'atom-particulas-subatomicas']
  },
  {
    id: 'ligacoes',
    etapaId: 'em-1',
    titulo: 'Ligações químicas',
    subtemaIds: ['lig-regra-octeto', 'lig-ionica', 'lig-covalente']
  },
  {
    id: 'endo-exo',
    etapaId: 'em-2',
    titulo: 'Reações endotérmicas e exotérmicas',
    subtemaIds: ['termo-processos', 'termo-entalpia-diagramas', 'termo-equacoes-termoquimicas']
  },
  {
    id: 'funcoes-organicas',
    etapaId: 'em-3',
    titulo: 'Funções orgânicas',
    subtemaIds: ['org-hidrocarbonetos', 'org-oxigenadas', 'org-nitrogenadas-halogenadas']
  },
  {
    id: 'estequiometria',
    etapaId: 'enem',
    titulo: 'Estequiometria',
    subtemaIds: ['reac-mol-avogadro', 'reac-calculo-estequiometrico', 'reac-reagente-limitante']
  }
];
