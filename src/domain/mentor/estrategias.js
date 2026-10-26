// Primeiro nível de ajuda do Mentor: uma estratégia geral para o tipo de questão.
// Não revela nada da resposta; só sugere como começar. Textos fixos, escritos para o app.

export const ESTRATEGIAS = {
  'multipla-escolha': 'Leia o enunciado procurando a palavra-chave do que é pedido. Depois, elimine as alternativas que você consegue justificar como erradas antes de escolher.',
  numerica: 'Anote os dados com as unidades, escreva a fórmula que liga os dados ao que é pedido e só então faça a conta. No fim, confira se a unidade e a ordem de grandeza fazem sentido.',
  balanceamento: 'Comece pelo elemento que aparece em menos substâncias e deixe hidrogênio e oxigênio para o fim. Mude só os coeficientes, nunca os índices das fórmulas.',
  nomenclatura: 'Identifique primeiro a função (ácido, base, sal, óxido ou função orgânica). Depois aplique a regra de nome dela: prefixos, sufixos e cargas dos íons.',
  associacao: 'Comece pelos pares de que você tem mais certeza. Os que sobrarem ficam mais fáceis por eliminação.',
  ordenacao: 'Releia o critério de ordenação. Ache primeiro o item de uma das pontas (o maior ou o menor) e depois ordene o restante.',
  'tabela-periodica': 'Localize a região da tabela: período é a linha e grupo é a coluna. Use as tendências (raio, eletronegatividade) para decidir entre vizinhos.'
};

// Os três níveis de ajuda de uma questão, do mais geral ao mais específico.
export const helpLevels = (question) => [
  { nivel: 1, titulo: 'Estratégia', texto: ESTRATEGIAS[question.tipo] },
  { nivel: 2, titulo: 'Dica', texto: question.dica },
  { nivel: 3, titulo: 'Primeiro passo', texto: question.resolucaoPassoAPasso[0] }
].filter((level) => level.texto);
