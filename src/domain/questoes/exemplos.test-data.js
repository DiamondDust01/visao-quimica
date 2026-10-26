// Uma questão de cada tipo, usadas nos testes do corretor e do validador.
const base = (id, tipo, extra) => ({
  id, temaId: 's2', etapa: 'em-1', dificuldade: 2, tipo, enunciado: 'Enunciado.', dica: 'Dica.',
  resolucaoPassoAPasso: ['Passo 1.'], errosComuns: [{ descricao: 'Erro genérico.' }], revisado: false, ...extra
});

export const EXEMPLOS = {
  multipla: base('ex-mc', 'multipla-escolha', {
    alternativas: [{ id: 'a', texto: 'Um' }, { id: 'b', texto: 'Dois' }, { id: 'c', texto: 'Três' }],
    gabarito: 'b',
    errosComuns: [{ descricao: 'Confundiu com o número de átomos.', resposta: 'c' }]
  }),
  numerica: base('ex-num', 'numerica', {
    gabarito: { valor: 0.5, unidade: 'L', tolerancia: { relativa: 0.02 } },
    verificacao: '250 * 2 / 1000',
    errosComuns: [{ descricao: 'Esqueceu de converter mL em L.', resposta: { valor: 500, unidade: 'L' } }]
  }),
  balanceamento: base('ex-bal', 'balanceamento', {
    equacao: { reagentes: ['H2', 'O2'], produtos: ['H2O'] },
    gabarito: [2, 1, 2],
    errosComuns: [{ descricao: 'Mudou o índice em vez do coeficiente.', resposta: [1, 1, 1] }]
  }),
  nomeParaFormula: base('ex-nf', 'nomenclatura', {
    direcao: 'nome-para-formula', gabarito: { formula: 'H2SO4', nomes: ['ácido sulfúrico'] },
    errosComuns: [{ descricao: 'Confundiu com o ácido sulfuroso.', resposta: 'H2SO3' }]
  }),
  formulaParaNome: base('ex-fn', 'nomenclatura', {
    direcao: 'formula-para-nome', gabarito: { formula: 'NaCl', nomes: ['cloreto de sódio'] },
    errosComuns: [{ descricao: 'Usou o sufixo dos oxiácidos.', resposta: 'clorato de sódio' }]
  }),
  associacao: base('ex-ass', 'associacao', {
    itens: [{ id: 'i1', texto: 'Proveta' }, { id: 'i2', texto: 'Bureta' }],
    opcoes: [{ id: 'o1', texto: 'Medir volume aproximado' }, { id: 'o2', texto: 'Titular' }, { id: 'o3', texto: 'Aquecer' }],
    gabarito: { i1: 'o1', i2: 'o2' }
  }),
  ordenacao: base('ex-ord', 'ordenacao', {
    criterio: 'Do menor para o maior raio atômico.',
    itens: [{ id: 'na', texto: 'Na' }, { id: 'k', texto: 'K' }, { id: 'li', texto: 'Li' }],
    gabarito: ['li', 'na', 'k']
  }),
  tabela: base('ex-tab', 'tabela-periodica', {
    gabarito: { simbolos: ['Na'] },
    errosComuns: [{ descricao: 'Escolheu o elemento do período errado.', resposta: 'K' }]
  })
};
