// Guia de uso: passo a passo que contorna elementos da tela e explica cada um num pop-up.
//
// Cada passo tem:
// - tela: onde o passo acontece. Uma aba ('inicio', 'fundamentos' = Trilha, 'laboratorio'),
//   uma tela do menu "Mais" ('ferramentas', 'perfil'), a Prática ('pratica-lista'), uma
//   sessão de questões de exemplo ('pratica-sessao') ou o menu 'menu-mais' aberto;
// - alvo: valor do atributo data-guia do elemento a destacar; null mostra o pop-up no centro;
// - opcional: se o alvo não existir (por exemplo, sem trilha na etapa "livre"), o passo é pulado.
// Ao mudar de tela, o App leva o estudante até ela (veja App.jsx).

export const GUIA_TELAS = ['menu-mais', 'inicio', 'fundamentos', 'pratica-lista', 'pratica-sessao', 'laboratorio', 'ferramentas', 'perfil'];

// Seção do guia mostrada acima do título do passo.
export const GUIA_SECOES = {
  inicio: 'Início',
  'menu-mais': 'Menu "Mais"',
  fundamentos: 'Trilha',
  'pratica-lista': 'Prática',
  'pratica-sessao': 'Sessão de questões',
  laboratorio: 'Laboratório do Mentor',
  ferramentas: 'Ferramentas',
  perfil: 'Perfil'
};

export const GUIA_PASSOS = [
  {
    id: 'boas-vindas', tela: 'inicio', alvo: null,
    titulo: 'Bem-vindo ao guia de uso',
    texto: 'Em poucos minutos você conhece cada parte do app. Vou destacar um elemento de cada vez e explicar para que ele serve. Use "Próximo" e "Anterior", as setas do teclado, ou "Sair do guia" (tecla Esc) quando quiser. Nada do que você vê aqui é alterado pelo guia.'
  },
  {
    id: 'abas', tela: 'inicio', alvo: 'abas',
    titulo: 'Os quatro módulos',
    texto: 'Cada módulo responde a uma pergunta. Início: "o que eu faço agora?", com um botão para continuar. Trilha: "qual é o plano da minha série?", com todos os temas da sua etapa em ordem. Prática: "quero escolher qualquer tema", sem ordem sugerida. Laboratório do Mentor: "onde eu estou errando?". No celular, estes botões ficam na barra de baixo, junto com o "Mais".',
    // Antes de o Mentor ser liberado, a aba dele não aparece (veja montarGuia).
    semMentor: {
      titulo: 'Os módulos',
      texto: 'Cada módulo responde a uma pergunta. Início: "o que eu faço agora?", com um botão para continuar. Trilha: "qual é o plano da minha série?", com todos os temas da sua etapa em ordem. Prática: "quero escolher qualquer tema", sem ordem sugerida. Um quarto módulo, o Laboratório do Mentor ("onde eu estou errando?"), aparece sozinho depois dos primeiros erros, quando ele já tiver o que sugerir. No celular, estes botões ficam na barra de baixo, junto com o "Mais".'
    }
  },
  {
    id: 'inicio-nivel', tela: 'inicio', alvo: 'nivel',
    titulo: 'Seu nível e seus pontos',
    texto: 'Cada acerto soma pontos (10 × a dificuldade da questão) e os pontos sobem seu nível, de Átomo até Laboratório. Pedir ajuda ao Mentor numa questão desconta uma parte dos pontos dela, e erros nunca tiram pontos.'
  },
  {
    id: 'inicio-continuar', tela: 'inicio', alvo: 'continuar',
    titulo: 'Continuar',
    texto: '"Praticar agora" mostra o próximo tema da sua trilha e pede a sua confirmação; em "Sim, começar", a sessão abre sem passar por outra tela. Em Estudo livre, este cartão leva à Prática. Abaixo dele aparecem, quando houver, a sua última sessão (para repetir os temas) e as sugestões do Mentor.'
  },
  {
    id: 'mais', tela: 'inicio', alvo: 'btn-mais',
    titulo: 'Menu "Mais"',
    texto: 'Tudo o que não é aba fica aqui: ferramentas, seus dados, ajuda e o tema claro ou escuro. No computador ele fica no canto do cabeçalho; no celular, é o último botão da barra de baixo.'
  },
  {
    id: 'mais-menu', tela: 'menu-mais', alvo: 'menu-mais',
    titulo: 'O que tem no "Mais"',
    texto: 'Ferramentas: tabela periódica, massa molar e estruturas. Meus dados: etapa escolar e pontos, backup do progresso e apagar dados. Ajuda: este guia, as regras de pontuação e níveis e os créditos. Aparência: tema claro ou escuro. Cada item abre direto no lugar certo.'
  },

  {
    id: 'fund-progresso', tela: 'fundamentos', alvo: 'trilha-progresso', opcional: true,
    titulo: 'Sua trilha',
    texto: 'O plano da sua etapa escolar inteira. A barra mostra quanto dela você já concluiu. Um tema conta como concluído com 80% de acerto ou mais, depois de pelo menos 3 respostas. Em "Mudar etapa" você escolhe outra etapa.'
  },
  {
    id: 'fund-recomendado', tela: 'fundamentos', alvo: 'tema-recomendado', opcional: true,
    titulo: 'O próximo tema',
    texto: 'O selo "Próximo" marca o tema por onde continuar, o mesmo do botão do Início. Pré-requisitos vêm sempre antes, e temas que precisam de revisão passam à frente. "Praticar" mostra o tema e o número de questões e só começa depois de você confirmar.'
  },
  {
    id: 'fund-revisao', tela: 'fundamentos', alvo: 'lista-revisao', opcional: true,
    titulo: 'Revisão',
    texto: 'Base de etapas anteriores que a trilha usa, mais os temas em que seu acerto ficou abaixo de 60%. Cada linha mostra o status (com ícone e texto), a dificuldade, os pré-requisitos e o botão "Praticar".'
  },
  {
    id: 'fund-recomendados', tela: 'fundamentos', alvo: 'lista-recomendados', opcional: true,
    titulo: 'Recomendados para você',
    texto: 'Os temas da sua etapa, numerados na ordem sugerida. A ordem é só um ponto de partida: para escolher qualquer tema, de qualquer série, use a Prática.'
  },
  {
    id: 'fund-desafio', tela: 'fundamentos', alvo: 'lista-desafio', opcional: true,
    titulo: 'Desafio',
    texto: 'Temas da etapa seguinte que você já tem base para encarar. Servem para ir além quando a trilha estiver tranquila.'
  },

  {
    id: 'prat-filtros', tela: 'pratica-lista', alvo: 'filtros',
    titulo: 'Escolha livre',
    texto: 'Aqui não há ordem sugerida: estão todos os temas, de todas as séries. Procure pelo nome ou por palavras-chave (por exemplo "pH" ou "isomeria") e filtre por etapa, dificuldade e situação: pendentes, concluídos ou que precisam de revisão.'
  },
  {
    id: 'prat-temas', tela: 'pratica-lista', alvo: 'lista-temas',
    titulo: 'Escolha dos temas',
    texto: 'Os temas ficam agrupados em área, tema e subtema. Marque um subtema, um tema inteiro ou uma área toda; a caixa fica "parcial" quando só parte está marcada. Temas sem questões aparecem desabilitados.'
  },
  {
    id: 'prat-barra', tela: 'pratica-lista', alvo: 'barra-sessao',
    titulo: 'Barra da sessão',
    texto: 'Mostra quantos temas e questões você escolheu e avisa quando algum tema usa conteúdos que você ainda não estudou (sem bloquear nada). Defina de 5 a 20 questões e toque em "Começar sessão": o app mostra o que vai ser estudado e pede confirmação. Sem nenhum tema marcado, ele avisa que é preciso escolher um primeiro. Em seguida vou abrir uma sessão de exemplo para mostrar como ela funciona.'
  },

  {
    id: 'sessao-topo', tela: 'pratica-sessao', alvo: 'sessao-topo',
    titulo: 'Andamento da sessão',
    texto: 'A sessão abre numa tela própria, por cima do módulo de onde você começou, e no fim volta para ele. Aqui aparecem em qual questão você está, o tempo de estudo (o relógio pausa quando o app fica em segundo plano) e o progresso da sessão. "Encerrar sessão" termina antes do fim: o que você já respondeu fica salvo.'
  },
  {
    id: 'sessao-enunciado', tela: 'pratica-sessao', alvo: 'enunciado',
    titulo: 'A questão',
    texto: 'No topo estão o subtema, o tipo da questão (múltipla escolha, numérica, balanceamento, nomenclatura, associação, ordenação ou tabela periódica) e a dificuldade. Abaixo vem o enunciado, às vezes com a estrutura da molécula desenhada. Palavras com sublinhado pontilhado têm explicação: toque nelas e confirme no balão. Consultar essas explicações não desconta pontos.'
  },
  {
    id: 'sessao-resposta', tela: 'pratica-sessao', alvo: 'resposta',
    titulo: 'Onde você responde',
    texto: 'O campo muda conforme o tipo: alternativas, número com unidade (aceita vírgula, ponto e "× 10^"), coeficientes de uma equação, nome ou fórmula, listas para associar ou ordenar, ou a tabela periódica. Respostas que não puderam ser lidas não contam como erro: é só corrigir e enviar de novo.'
  },
  {
    id: 'sessao-acoes', tela: 'pratica-sessao', alvo: 'acoes',
    titulo: 'Responder e pedir ajuda',
    texto: '"Responder" corrige na hora. "Pedir ajuda ao Mentor" mostra até três níveis, do mais geral ao mais específico: estratégia, dica e primeiro passo. Cada ajuda usada desconta 25% dos pontos da questão. Se você não conhece o assunto, "Não sei este conteúdo" abre um texto curto que explica o tema, sem descontar pontos. Depois de responder aparecem o resultado, o erro comum previsto (se houver), o que o Mentor notou, a resposta esperada, os pontos ganhos e a resolução passo a passo.'
  },

  {
    id: 'lab-revisar', tela: 'laboratorio', alvo: 'lab-revisar',
    titulo: 'O que revisar agora',
    texto: 'O Mentor junta os temas com acerto baixo, a base deles e os temas ligados aos seus erros mais repetidos. "Praticar a revisão" junta todos eles numa sessão, depois da sua confirmação.'
  },
  {
    id: 'lab-padroes', tela: 'laboratorio', alvo: 'lab-padroes',
    titulo: 'Padrões nos seus erros',
    texto: 'Cada resposta errada é analisada por regras fixas, como unidade trocada, potência de 10, átomos não conservados ou sufixo errado na nomenclatura. Aqui aparece quantas vezes cada padrão se repetiu, com a dica e os temas para revisar. O Mentor não usa IA generativa e nada sai do seu aparelho.'
  },

  {
    id: 'ferr-abas', tela: 'ferramentas', alvo: 'ferr-abas',
    titulo: 'Três ferramentas',
    texto: 'Tabela periódica: clique num elemento (ou use as setas do teclado) para ver os detalhes e clique numa categoria para destacá-la. Massa molar: digite uma fórmula, como H2O ou Ca(OH)2, e veja a conta elemento por elemento. Estruturas: desenhos de moléculas com fórmula e massa molar.'
  },
  {
    id: 'ferr-conteudo', tela: 'ferramentas', alvo: 'ferr-conteudo',
    titulo: 'Área da ferramenta',
    texto: 'A ferramenta escolhida aparece aqui. As massas atômicas vêm da IUPAC (CIAAW), e as fontes dos dados ficam listadas logo abaixo da tabela periódica.'
  },

  {
    id: 'perfil-etapa', tela: 'perfil', alvo: 'perfil-etapa',
    titulo: 'Etapa escolar',
    texto: 'Escolha a etapa e toque em "Salvar etapa": a Trilha é recalculada na hora. Seu progresso e seus pontos são mantidos.'
  },
  {
    id: 'perfil-backup', tela: 'perfil', alvo: 'perfil-backup',
    titulo: 'Backup local',
    texto: 'Não há conta nem envio automático: tudo fica neste aparelho. Para levar o progresso a outro aparelho, exporte ou compartilhe um arquivo de backup e importe-o lá; o app junta sem duplicar. Você ainda pode ligar um lembrete semanal ou mensal, que só aparece quando você abre o Perfil.'
  },
  {
    id: 'perfil-dados', tela: 'perfil', alvo: 'perfil-dados',
    titulo: 'Dados deste aparelho',
    texto: 'Apaga etapa, progresso, pontos, histórico do Mentor, lembrete e preferências. Não dá para desfazer, por isso o app pede uma segunda confirmação. Faça um backup antes, se quiser guardar seu progresso.'
  },

  {
    id: 'fim', tela: 'inicio', alvo: null,
    titulo: 'Pronto para estudar!',
    texto: 'Esse é o app inteiro. Para seguir a ordem da sua série, use "Praticar agora" no Início; para escolher qualquer tema, a Prática. Para rever este guia, abra "Mais" e escolha "Guia de uso".'
  }
];

// O guia completo de acordo com o que o estudante já liberou: sem o Mentor, os passos do
// Laboratório saem e o passo das abas explica quando ele aparece.
export const montarGuia = ({ mentorLiberado }) => GUIA_PASSOS
  .filter((passo) => mentorLiberado || passo.tela !== 'laboratorio')
  .map(({ semMentor, ...passo }) => (mentorLiberado || !semMentor ? passo : { ...passo, ...semMentor }));

// Tutorial curto que abre uma vez, quando o Mentor é liberado. O primeiro passo não troca de
// tela (tela: null): ele aparece onde o estudante estiver, em geral no resultado da sessão,
// e destaca a aba nova. Os seguintes mostram o Laboratório.
export const GUIA_MENTOR = [
  {
    id: 'mentor-liberado', tela: null, secao: 'Novo módulo', alvo: 'aba-laboratorio',
    titulo: 'Laboratório do Mentor liberado',
    texto: 'Com as suas primeiras respostas erradas, o Mentor já tem o que sugerir. A aba dele apareceu aqui e fica disponível daqui em diante. Toque em "Próximo" para conhecê-la, ou em "Sair do guia" para ver depois.'
  },
  ...GUIA_PASSOS.filter((passo) => passo.tela === 'laboratorio'),
  {
    id: 'mentor-fim', tela: 'laboratorio', alvo: null,
    titulo: 'Use o Mentor para revisar',
    texto: 'Depois de cada sessão, passe por aqui: as sugestões mudam conforme você acerta e erra. Durante as questões, o Mentor também ajuda em três níveis (estratégia, dica e primeiro passo). Para rever este tutorial, abra "Mais" e escolha "Guia de uso".'
  }
];
