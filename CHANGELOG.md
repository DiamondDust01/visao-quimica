# Registro de alterações

Todas as mudanças relevantes do Visão Química ficam registradas aqui, com a data (AAAA-MM-DD).
Formato inspirado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/); versões seguem
[SemVer](https://semver.org/lang/pt-BR/).

## [Não lançado]

## [0.1.0] - 2026-10-26

Primeira versão, construída em sete fases a partir da estrutura técnica de outro projeto (só a
arquitetura foi reaproveitada; nenhum conteúdo dele permanece, conferido por
`npm run check:residue`).

### Finalização (2026-10-26)
- `npm run test:e2e`: teste de fumaça do build no Electron (CSP presente, escolha de etapa, seis
  abas, questão com estrutura corrigida, tabela periódica, massa molar, estruturas e console sem
  erros nem avisos).
- `BRANCHES.md`: branches `main` (geral), `app-pc` (instaladores do Windows, com Git LFS) e
  `app-mobile` (APK). README com a seção de downloads.
- Repositório publicado no GitHub com as três branches.

### Fase 7: estruturas moleculares com SMILES (concluída em 2026-10-26)
- `smiles-drawer` 2.4.1 (versão exata), carregada sob demanda num arquivo próprio do build
  (196 kB); sem acesso à rede e compatível com a CSP.
- Ferramentas → Estruturas: galeria com 14 moléculas (`src/data/estruturas.json`), campo livre de
  SMILES, fórmula molecular e massa molar calculadas a partir da estrutura. Cores próprias para os
  temas claro e escuro; mesma escala de desenho para todas as moléculas.
- Campo opcional `estrutura: { smiles, formula }` nas questões, desenhado abaixo do enunciado.
  Adicionado em 14 questões de Química Orgânica (cadeias, funções, nomenclatura, isomeria óptica,
  adição).
- `npm run validate:content` ganhou a seção "Estruturas (SMILES)": SMILES válido e fórmula igual à
  calculada. SMILES com anel aberto ("C1CC") ou ligação sem átomo no fim ("C=") são recusados,
  porque a biblioteca os aceitaria desenhando outra molécula.
- Testes: 5 novos (120 no total). Conferido no Electron: galeria, troca de tema, SMILES inválido,
  questões com estrutura e tela de celular, sem erros no console.

### Fase 6: builds web, Android e Windows (concluída em 2026-10-26)
- Web: o pacote único de 1,8 MB foi dividido em `react`, `katex`, `firebase`, `conteudo` e o
  código do app (o maior arquivo tem 673 kB), e o aviso de tamanho do Vite foi ajustado.
- Política de segurança de conteúdo (CSP) no build: scripts e estilos só do próprio app, rede só
  para o Firebase, `object-src 'none'`. Some o aviso de segurança do Electron. O modo de
  desenvolvimento continua sem CSP.
- Windows: o executável ganhou o ícone do app e os dados de versão (`rcedit` 5.0.2, ícone
  `assets/icon.ico` gerado por `npm run icons`).
- Windows: `npm run app:windows:installer` gera o instalador NSIS (por usuário, atalhos no menu
  Iniciar e na área de trabalho, desinstalador que apaga só o que instalou) e o portátil em `.7z`.
- Conferido: todas as abas, as 7 formas de resposta, a tabela periódica e uma sala local com
  professor e dois alunos no build com CSP, sem erros nem avisos no console; APK de debug
  (`com.exemplo.quimicaquest`, 0.1.0, 5,9 MB) com o build e a CSP dentro; instalador testado em
  modo silencioso numa pasta temporária (instalou, abriu a janela, desinstalou e manteve um
  arquivo do usuário que estava na pasta).
- Não conferido: o APK num aparelho ou emulador (a máquina de build não tem virtualização).

### Fase 5: Laboratório do Mentor e Desafios em sala (concluída em 2026-10-26)
- Mentor por regras fixas, sem IA generativa e sem enviar nada para fora do aparelho:
  - ajuda em três níveis na Prática (estratégia do tipo de questão, dica da questão, primeiro
    passo da resolução); cada nível usado desconta 25% dos pontos da questão;
  - detecção de padrões de erro: conversão de unidades, potência de 10, sinal trocado, divisão
    invertida, fator de proporção, kelvin/Celsius, unidade de outra grandeza, balanceamento não
    simplificado, átomos ou carga não conservados, sufixo de nomenclatura trocado, índices da
    fórmula, grupo ou período errados na tabela;
  - tela Laboratório do Mentor com os padrões mais frequentes e sugestões de revisão (temas
    com acerto baixo, a base deles e temas ligados a erros repetidos), com botão para praticar.
- Pontuação (10 × dificuldade por acerto) e níveis (Átomo a Laboratório), mostrados no Início e
  no Perfil; "Como funciona" descreve pontuação, níveis, progresso e salas.
- Desafios em sala:
  - o professor escolhe temas, número de questões, tempo e limites de participantes; as
    questões são sorteadas uma vez e todos respondem as mesmas;
  - entrada por código ou QR, apelido sorteado, espera, relógio, ranking ao vivo (pontos,
    acertos, ordem de chegada), encerramento manual ou por tempo e resultado em CSV só com
    apelidos;
  - sem ajuda do Mentor na sala; pareamento P2P (WebRTC) com medição de ping quando há Firebase;
  - funciona com Firestore e, sem servidor, como demonstração entre abas do mesmo navegador.
- Regras do Firestore: pontuação do participante limitada a 0–1000; leitura da lista de
  participantes separada da leitura de um registro (`list` só para quem está na sala e para o
  host). Antes de entrar, o aluno vê a contagem de participantes que o host mantém na sala.
- Testado de ponta a ponta com professor e dois alunos no modo local e com os emuladores do
  Firebase (Auth e Firestore). O teste com emulador encontrou e permitiu corrigir a leitura da
  lista de participantes antes de o aluno entrar, que as regras bloqueavam.

### Fase 4: recursos de Química (concluída em 2026-10-26)
- Fórmulas renderizadas com KaTeX 0.18.11 e a extensão mhchem (`\ce{...}`), com saída em MathML
  para leitores de tela. Fontes e estilos entram no build: nada é baixado em tempo de execução.
- `src/data/elementos.json`: 118 elementos com número atômico, símbolo, nome em português,
  massa atômica, categoria, eletronegatividade de Pauling e configuração eletrônica.
  - Massas: pesos atômicos padrão abreviados 2024 da IUPAC/CIAAW (84 elementos) e, para os 34
    radioativos, o número de massa do isótopo mais estável (NUBASE2020, compilado pela CIAAW).
  - Eletronegatividade e configuração: PubChem (NIH).
  - Fontes, endereços e data de consulta (2026-10-26) registrados no próprio arquivo.
  - `npm run atualizar:elementos` baixa as fontes de novo e regenera o arquivo; a regeneração
    feita para conferir produziu dados idênticos.
- Tabela periódica interativa em Ferramentas: navegação por setas, categoria em texto e na
  legenda (não só pela cor), destaque por categoria, painel de detalhes e rolagem horizontal
  própria no celular.
- Questões do tipo tabela periódica respondidas clicando na tabela (detalhes ocultos para não
  entregar a resposta) ou digitando o símbolo.
- Calculadora de massa molar com contribuição por elemento, aviso para elementos radioativos e
  suporte a parênteses, colchetes, cargas e hidratos.
- `npm run validate:content` ganhou as seções "Elementos" (118 elementos, símbolos, elétrons da
  configuração = Z, categoria coerente com o grupo, fontes com data) e "Fórmulas (mhchem)": os
  647 trechos `\ce{...}` do conteúdo são aceitos pelo mhchem em modo estrito.
- Corrigido: a regra global `div { min-width: 0 }` ficava fora das camadas do Tailwind 4 e
  anulava classes como `min-w-*`. As regras de elemento foram para `@layer base`.

### Fase 3: seleção de temas, Prática e banco de questões (concluída em 2026-10-26)

#### 2026-10-26
- Banco de questões completo: lotes 2 a 20, cobrindo as 20 áreas. Total: 477 questões, todas
  originais e com `"revisado": false` (3 por subtema de Fundamental II e Médio, 1 por subtema
  só de Técnico, Superior ou Olimpíadas de Química). `npm run validate:content` sem erros e sem
  avisos.
- Corrigido: a sessão quebrava (tela vazia, "r.map is not a function") quando uma questão de
  ordenação vinha logo depois de outro tipo, porque a resposta anterior ainda estava no estado.
  Cada questão agora é um componente próprio, recriado a cada troca (`key={question.id}`).
- Texto de uma questão de poluição reescrito para não disparar o aviso de termo sensível
  ("crescimento acelerado de algas").
- `CHANGELOG.md` criado; README com o estado atual datado e o formato do banco de questões.
- Tela Prática: busca, filtros (etapa, dificuldade, situação), seleção múltipla por área, tema
  e subtema, progresso por tema e por área, e aviso de pré-requisitos não estudados (sem bloquear).
- Sessão de questões: dica opcional, correção imediata, erro comum detectado, resposta esperada,
  resolução passo a passo e resultado por subtema; o progresso é gravado a cada resposta.
- Botões "Praticar" em Fundamentos e no Início.
- Validador: tolerância numérica `absoluta: 0` passa a ser aceita (respostas inteiras exatas).
- Os indicadores flutuantes de conexão e versão ficam ocultos na Prática, onde cobriam a barra
  de seleção.

#### 2026-10-25
- Motor de correção com 7 tipos: múltipla escolha, numérica (tolerância e conversão de
  unidades; campo `exigirUnidade` para questões de conversão), balanceamento (conservação de
  átomos e carga, menores inteiros), nomenclatura nos dois sentidos, associação, ordenação e
  tabela periódica.
- Bibliotecas: leitura de fórmulas químicas (`src/domain/formula.js`), unidades
  (`src/domain/unidades.js`), avaliador de expressões sem `eval` (`src/domain/expressao.js`) e
  formatador provisório de `\ce{...}` (`src/domain/textoQuimico.js`).
- `npm run validate:content` passa a validar questões: esquema, IDs únicos, `temaId` existente,
  etapa compatível com o subtema, gabarito aceito pelo próprio corretor, equações balanceadas,
  conferência das contas pela expressão `verificacao` e cobertura mínima (3 questões por subtema
  de Fundamental II e Médio; 1 nos demais).
- Lote 1 do banco de questões: Fundamentos (39 questões).

### Fase 2: taxonomia, perfil escolar e recomendador (2026-10-25)
- Taxonomia em JSON versionado: 20 áreas, 62 temas, 171 subtemas (`src/data/taxonomia/`).
- Etapas escolares (`src/data/etapas.json`), com observação sobre a BNCC do Ensino Médio.
- `npm run sync:taxonomia` (campos derivados de temas e áreas) e validação da taxonomia
  (IDs, pré-requisitos, ciclos, etapas, coerência entre etapas de pré-requisitos).
- Recomendador determinístico: Recomendados, Revisão, Desafio e trilha em ordem topológica,
  priorizando temas com acerto baixo e o caminho até eles.
- Escolha de etapa no primeiro uso, tela de Perfil (trocar etapa, apagar dados do aparelho)
  e tela Fundamentos com a trilha.

### Fase 1: limpeza e rebranding (2026-10-25)
- Projeto novo em `quimica-quest/`, com repositório git próprio; o projeto de origem não foi
  alterado.
- Nome Visão Química; applicationId provisório `com.exemplo.quimicaquest` (trocar antes da
  primeira publicação).
- Infraestrutura reaproveitada: Vite, React, Tailwind, temas claro/escuro, Firebase opcional
  com login anônimo, salas com escritor único, pareamento P2P, indicadores de rede.
- Coleções novas no Firestore (`salas`, `participantes`, `sinais`) e regras testadas no
  emulador (`npm run test:rules`, portas 8180 e 9199).
- Ícone, tela de abertura e projeto Android recriado; empacotamento portátil do Windows.
- `npm run check:residue` para detectar resquícios do projeto de origem.
- Fontes do sistema no lugar de fontes baixadas da internet (o app funciona offline).
