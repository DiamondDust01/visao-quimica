// Taxonomia pequena usada nos testes do recomendador e do validador.
//   s1 (ef-9) → s2 (em-1) → s3 (em-1) → s5 (em-2)
//   s4 (em-1) → s6 (em-2)
//   s8 (superior) → s7 (em-2)
export const ETAPAS_TESTE = [
  { id: 'ef-9', nome: '9º ano', grupo: 'EF', descricao: 'x', nivel: 4, linguagem: 'simples', desafio: ['em-1'] },
  { id: 'em-1', nome: '1ª série', grupo: 'EM', descricao: 'x', nivel: 5, linguagem: 'intermediaria', desafio: ['em-2'] },
  { id: 'em-2', nome: '2ª série', grupo: 'EM', descricao: 'x', nivel: 6, linguagem: 'intermediaria', desafio: [] },
  { id: 'superior', nome: 'Superior', grupo: 'Sup', descricao: 'x', nivel: 10, linguagem: 'tecnica', desafio: [] },
  { id: 'livre', nome: 'Livre', grupo: 'Livre', descricao: 'x', nivel: 0, linguagem: 'intermediaria', desafio: [], semRecomendacao: true }
];

const sub = (id, prerequisitos, etapasRecomendadas, dificuldade = 2) => ({
  id, nome: `Subtema ${id}`, descricao: 'Descrição.', prerequisitos, etapasRecomendadas, dificuldade, palavrasChave: ['teste']
});

export const AREAS_TESTE_BRUTAS = [
  {
    id: 'area-a', nome: 'Área A', descricao: 'Descrição.', palavrasChave: ['a'],
    temas: [
      { id: 't1', nome: 'Tema 1', descricao: 'Descrição.', palavrasChave: ['t1'], subtemas: [sub('s1', [], ['ef-9'], 1), sub('s2', ['s1'], ['em-1']), sub('s3', ['s2'], ['em-1'], 3)] },
      { id: 't2', nome: 'Tema 2', descricao: 'Descrição.', palavrasChave: ['t2'], subtemas: [sub('s4', [], ['em-1']), sub('s5', ['s3'], ['em-2'], 3), sub('s6', ['s4'], ['em-2'], 2)] },
      { id: 't3', nome: 'Tema 3', descricao: 'Descrição.', palavrasChave: ['t3'], subtemas: [sub('s7', ['s8'], ['em-2'], 1), sub('s8', [], ['superior'], 4)] }
    ]
  }
];
