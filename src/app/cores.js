// Cor de cada área do app: abas, títulos das telas e grupos do menu "Mais" usam a mesma cor,
// para o estudante reconhecer onde está. As cores evitam as de status (azul-céu = em andamento,
// âmbar = revisar, verde-esmeralda = dominado, rosa = erro). O tema claro inverte as escalas
// sozinho (src/themeLight.css). As classes ficam escritas por inteiro para o Tailwind achá-las.
export const CORES = {
  inicio: {
    icone: 'text-teal-300',
    ativo: 'bg-teal-500/15 text-teal-200',
    texto: 'text-teal-200',
    titulo: 'text-teal-300',
    borda: 'border-t-teal-400/70'
  },
  fundamentos: {
    icone: 'text-indigo-300',
    ativo: 'bg-indigo-500/15 text-indigo-200',
    texto: 'text-indigo-200',
    titulo: 'text-indigo-300',
    borda: 'border-t-indigo-400/70'
  },
  pratica: {
    icone: 'text-orange-300',
    ativo: 'bg-orange-500/15 text-orange-200',
    texto: 'text-orange-200',
    titulo: 'text-orange-300',
    borda: 'border-t-orange-400/70'
  },
  laboratorio: {
    icone: 'text-fuchsia-300',
    ativo: 'bg-fuchsia-500/15 text-fuchsia-200',
    texto: 'text-fuchsia-200',
    titulo: 'text-fuchsia-300',
    borda: 'border-t-fuchsia-400/70'
  },
  ferramentas: {
    icone: 'text-lime-300',
    ativo: 'bg-lime-500/15 text-lime-200',
    texto: 'text-lime-200',
    titulo: 'text-lime-300',
    borda: 'border-t-lime-400/70'
  },
  perfil: {
    icone: 'text-yellow-300',
    ativo: 'bg-yellow-500/15 text-yellow-200',
    texto: 'text-yellow-200',
    titulo: 'text-yellow-300',
    borda: 'border-t-yellow-400/70'
  },
  'como-funciona': {
    icone: 'text-sky-300',
    ativo: 'bg-sky-500/15 text-sky-200',
    texto: 'text-sky-200',
    titulo: 'text-sky-300',
    borda: 'border-t-sky-400/70'
  },
  aparencia: {
    icone: 'text-slate-300',
    ativo: 'bg-slate-500/15 text-slate-200',
    texto: 'text-slate-200',
    titulo: 'text-slate-300',
    borda: 'border-t-slate-400/70'
  }
};

export const corDe = (id) => CORES[id] || CORES.inicio;

// Grupos do menu "Mais" → a área (tela) que cada um abre.
export const COR_DO_GRUPO = {
  ferramentas: 'ferramentas',
  dados: 'perfil',
  ajuda: 'como-funciona',
  aparencia: 'aparencia'
};
