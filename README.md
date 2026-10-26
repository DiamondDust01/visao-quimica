# Visão Química

Plataforma de estudo e treino de Química, com trilhas recomendadas por etapa escolar e
seleção livre de temas. Roda na web, no Android (Capacitor) e no Windows (Electron) a
partir do mesmo build, e funciona offline.

> Estado atual (2026-10-26, versão 0.2.0): todos os módulos funcionando e builds web, Android e
> Windows conferidos: Fundamentos (trilha por etapa), Prática (477 questões originais, revisadas
> por IA e ainda sem revisão de professor), Laboratório do Mentor (regras fixas, sem IA
> generativa), Desafios em sala (Firestore ou demonstração local, com pareamento direto entre
> aparelhos), Ferramentas (tabela periódica e massa molar com dados da IUPAC, estruturas a partir
> de SMILES), conta por código de acesso sem dados pessoais e Como funciona.
> Histórico com datas em [CHANGELOG.md](CHANGELOG.md).

## Downloads (versão 0.2.0)

- **Windows:** branch [`app-pc`](https://github.com/DiamondDust01/visao-quimica/tree/app-pc/installers/windows): instalador
  `Visao-Quimica-Setup-0.2.0.exe` ou versão portátil `.7z` (Git LFS).
- **Android:** branch [`app-mobile`](https://github.com/DiamondDust01/visao-quimica/tree/app-mobile/installers/android): APK de teste.
- Como as branches se organizam: [BRANCHES.md](BRANCHES.md).

Nenhum pacote tem assinatura digital; o APK usa a chave de depuração. As questões ainda não
passaram por revisão de um professor de Química (`"revisado": false`); a revisão feita por IA está
em [REVISAO_QUESTOES.md](REVISAO_QUESTOES.md).

## Requisitos

- Node.js 24 e npm 11
- Para o Android: Android SDK e **JDK 21** (o Capacitor 8 não compila com o JDK 17)
- Para os testes com o Firebase emulado (`test:rules`, `test:nuvem`): Java 21 ou mais novo (o
  emulador do Firestore roda em Java). Os emuladores ficam em `.cache/emuladores`, só deste projeto.

## Comandos

| Comando | O que faz |
|---|---|
| `npm install` | Instala as dependências |
| `npm run dev` | Servidor de desenvolvimento em http://localhost:3000 |
| `npm run build` | Gera o build web em `dist/` |
| `npm test` | Testes de unidade (`node --test`) |
| `npm run test:rules` | Sobe o emulador do Firestore e testa `firestore.rules` |
| `npm run test:nuvem` | Firebase emulado: conta entre aparelhos, login após falha de rede e pareamento P2P entre três alunos |
| `npm run verificar` | Roda todas as checagens com o tempo de cada uma (veja [CHECKLIST.md](CHECKLIST.md)); `-- --completo` inclui `test:nuvem` |
| `npm run test:e2e` | Build e teste de fumaça no Electron: todas as abas, barra fixa, uma questão, ferramentas, backup em arquivo, console sem erros |
| `npm run test:android` | Copia o build para o Android e abre os arquivos do APK num Chromium em modo celular (toque, tela de Pixel 7, user agent do WebView); não substitui um aparelho |
| `npm run check:residue` | Procura resquícios do projeto de origem; sai com erro se achar algo |
| `npm run validate:content` | Valida etapas, taxonomia, questões, elementos, fórmulas (mhchem) e estruturas (SMILES) |
| `npm run sync:taxonomia` | Recalcula os campos derivados de temas e áreas depois de editar subtemas |
| `npm run atualizar:elementos` | Baixa as fontes (IUPAC/CIAAW e PubChem) e regenera `src/data/elementos.json` |
| `npm run icons` | Gera ícones e telas de abertura a partir de `assets/*.svg` |
| `npm run android:sync` | Build web e cópia para o projeto Android |
| `npm run android:apk` | APK de debug em `android/app/build/outputs/apk/debug/` |
| `npm run app:windows` | Abre o app no Electron |
| `npm run app:windows:package` | Gera o app portátil em `%LOCALAPPDATA%\Visao-Quimica\portable` |
| `npm run app:windows:installer` | Gera o instalador (Setup) e o portátil em `.7z` em `release/windows/` |

Se o `JAVA_HOME` da máquina apontar para outro JDK, defina-o só para o build do Android:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21...'; npm run android:apk
```

## Builds e instaladores

- **Web:** `npm run build` gera `dist/` (abre de qualquer pasta, `base: './'`). Bibliotecas e
  conteúdo saem em arquivos separados (`react`, `katex`, `firebase`, `conteudo`). O build tem uma
  política de segurança de conteúdo (CSP) no `index.html`: scripts só do próprio app e rede só para
  o Firebase (`vite.config.js`). Em `npm run dev` ela fica desligada.
- **Android:** `npm run android:apk` gera um APK de debug, assinado com a chave de depuração
  (serve para teste, não para a Play Store).
- **Windows:** `npm run app:windows:package` monta o app portátil com ícone e versão no
  executável. `npm run app:windows:installer` gera, a partir dele, o instalador NSIS
  (`Visao-Quimica-Setup-<versão>.exe`, por usuário, sem pedir administrador, com atalhos e
  desinstalador) e o portátil compactado (`.7z`). Precisa do NSIS e do 7-Zip; os caminhos podem
  vir das variáveis `MAKENSIS` e `SEVEN_ZIP`. O desinstalador apaga só os arquivos que instalou.

Os instaladores prontos ficam nas branches `app-pc` (Windows, com Git LFS) e `app-mobile`
(Android); veja [BRANCHES.md](BRANCHES.md). Nenhum pacote tem assinatura digital: o Windows e o
Android podem mostrar avisos ou bloquear. Na máquina de build, o Controle Inteligente de
Aplicativos do Windows bloqueou o instalador 0.2.0 (o portátil abriu normalmente). Não desative
proteções do sistema para contorná-los; a solução definitiva é assinar os executáveis com um
certificado de assinatura de código.

## Conta sem dados pessoais

Em Perfil, a pessoa pode criar uma conta para guardar o progresso e abri-lo em outro aparelho. A
conta foi desenhada para que o projeto não guarde nenhum dado pessoal:

- não há e-mail, senha nem nome: a conta é um **código de acesso** de 20 caracteres, gerado no
  aparelho (95 bits aleatórios e um caractere de verificação contra erro de digitação);
- do código saem, no próprio aparelho, o endereço do documento na nuvem (hash SHA-256) e a chave
  que cifra o progresso (PBKDF2 com 150 000 iterações, AES-GCM de 256 bits);
- o servidor guarda só `{ versao, iv, dados, atualizadoEm }`: dados cifrados num endereço que não
  revela o código. As regras proíbem listar contas, então só quem tem o código acha o documento;
- o login no Firebase é anônimo; o código nunca sai do aparelho.

Num vazamento do banco, apareceriam só blocos cifrados, sem ligação com pessoas. Quem perde o
código perde o acesso: não há recuperação, de propósito. O progresso é mesclado sem contar nada
duas vezes (por subtema fica o registro com mais respostas; pontos, o maior valor) e enviado
sozinho, 2,5 s depois da última mudança. Sem servidor configurado, o mesmo painel oferece backup
em arquivo (exportar e importar). Código em `src/domain/conta.js`, `src/platform/contaNuvem.js`
e `src/app/useConta.js`.

> Isto é uma decisão técnica, não um parecer jurídico. O Firebase (Google) ainda processa dados
> técnicos de acesso, como o endereço IP. Antes de publicar, confira as obrigações da LGPD com
> quem cuida disso na sua instituição.

## Firebase (opcional)

Sem configuração, o app funciona offline: o progresso fica no aparelho e as salas
funcionam como demonstração local (entre abas do mesmo navegador). Para salas reais,
copie `.env.example` para `.env` e preencha `VITE_FIREBASE_CONFIG`. O login é anônimo.

Dados no Firestore, sob `artifacts/{VITE_APP_ID}/`:

| Caminho | Quem escreve |
|---|---|
| `users/{uid}` | o próprio usuário |
| `contas/{hash do código}` | quem tem o código; só campos cifrados, sem listagem |
| `salas/{código}` | só o host da sala |
| `salas/{código}/participantes/{uid}` | só o próprio participante, com campos fixos |
| `salas/{código}/sinais/{uidA__uidB}` | só os dois aparelhos do par (conexão WebRTC) |

Os emuladores usam as portas 8180 (Firestore) e 9199 (Auth), definidas em `firebase.json`.
Para usá-los no app em desenvolvimento, defina `VITE_FIREBASE_EMULATORS=1`.

## Identificador do app

O `applicationId` provisório é `com.exemplo.quimicaquest`. Troque-o pelo definitivo **antes
da primeira publicação** (depois disso ele não pode mudar). Ele aparece em
`capacitor.config.json`, `android/app/build.gradle` (`namespace` e `applicationId`), na
pasta `android/app/src/main/java/com/exemplo/quimicaquest/` (e no `package` do
`MainActivity.java`), em `android/app/src/main/res/values/strings.xml` e em
`electron/main.cjs` (`setAppUserModelId`).

## Conteúdo: etapas e taxonomia

- `src/data/etapas.json`: etapas escolares, com `nivel` (ordem) e `desafio` (etapas
  sugeridas como próximo passo).
- `src/data/taxonomia/*.json`: uma área por arquivo, na ordem de `meta.json`
  (Área → Tema → Subtema). Todo nó tem `id`, `nome`, `descricao`, `area`,
  `prerequisitos`, `etapasRecomendadas`, `dificuldade` (1 a 5) e `palavrasChave`.

Para editar: altere **só os subtemas** e rode `npm run sync:taxonomia`. Em temas e
áreas, `prerequisitos` (os de fora do nó), `etapasRecomendadas` (união) e `dificuldade`
(a menor) são calculados. Depois, `npm run validate:content`. O validador também exige que
nenhum pré-requisito seja recomendado só para uma etapa posterior à do subtema.

O recomendador (`src/domain/recomendador.js`) é determinístico e local: trilha em ordem
topológica dos pré-requisitos; "Revisão" para a base de etapas anteriores e para temas com
acerto abaixo de 60% (com pelo menos 3 respostas); "Desafio" para temas da etapa seguinte
cujos pré-requisitos já estão ao alcance. Acerto de 80% ou mais conta como concluído.

## Banco de questões

Um arquivo por área em `src/data/questoes/<area>.json`, registrado em
`src/data/questoes/index.js`. Todas as questões são originais e começam com
`"revisado": false` até a revisão de um professor de Química. Campos comuns: `id`, `temaId`
(um subtema), `etapa`, `dificuldade`, `tipo`, `enunciado`, `gabarito`, `resolucaoPassoAPasso`,
`dica`, `errosComuns` e `revisado`.

| Tipo | Campos próprios | Gabarito |
|---|---|---|
| `multipla-escolha` | `alternativas` (3 a 5) | id da alternativa |
| `numerica` | `verificacao` (expressão que recalcula o gabarito) | `{ valor, unidade, tolerancia?, exigirUnidade? }` |
| `balanceamento` | `equacao: { reagentes, produtos }` | coeficientes, nos menores inteiros |
| `nomenclatura` | `direcao` (`nome-para-formula` ou `formula-para-nome`) | `{ formula, nomes }` |
| `associacao` | `itens`, `opcoes` | `{ item: opcao }` |
| `ordenacao` | `itens`, `criterio` | lista de ids na ordem certa |
| `tabela-periodica` | | `{ simbolos }` |

Qualquer questão pode ter o campo opcional `estrutura: { smiles, formula }`: a estrutura é
desenhada abaixo do enunciado. O texto para leitores de tela traz só a fórmula molecular, para
não entregar o nome do composto.

Fórmulas no texto usam a sintaxe mhchem (`\ce{H2SO4}`, `\ce{Fe^{3+}}`). Erros comuns com o
campo `resposta` são reconhecidos automaticamente quando o estudante dá aquela resposta.

## Dados dos elementos

`src/data/elementos.json` traz os 118 elementos e, em `meta.fontes`, a origem e a data de
consulta de cada dado:

- **Massa atômica:** pesos atômicos padrão abreviados da IUPAC/CIAAW
  (https://www.ciaaw.org/abridged-atomic-weights.htm). Os elementos radioativos sem peso padrão
  usam o número de massa do isótopo mais estável, entre colchetes, como em [97] para o tecnécio.
- **Eletronegatividade (Pauling) e configuração eletrônica:** PubChem.
- Grupo, período e bloco são calculados a partir do número atômico
  (`src/domain/tabelaPeriodica.js`).

Para atualizar, rode `npm run atualizar:elementos`, confira a diferença no git e rode
`npm run validate:content`.

## Estruturas moleculares (SMILES)

Desenhadas com a [smiles-drawer](https://github.com/reymond-group/smilesDrawer) 2.4.1 (MIT),
que entra no build num arquivo próprio e só é carregada quando uma estrutura aparece; nada vem
da internet. As cores seguem o tema claro ou escuro, e cada átomo diferente de carbono aparece
com o símbolo escrito.

- `src/data/estruturas.json`: galeria de exemplos da tela Ferramentas → Estruturas, onde também
  se pode digitar um SMILES e ver a fórmula molecular e a massa molar.
- `npm run validate:content` confere todo SMILES (galeria e questões) e exige que a fórmula
  informada tenha a mesma composição da fórmula calculada a partir do SMILES.
- A orientação espacial (estereoquímica) não é desenhada nos exemplos.

## Dependências e vulnerabilidades

`npm audit` deve ficar em zero, inclusive nas ferramentas de desenvolvimento (`npm run verificar`
confere). Quando uma dependência indireta corrigida ainda não chegou ao pacote que a usa, ela é
fixada em `overrides` no `package.json`, depois de conferir que a parte usada é compatível:

| Pacote | Versão forçada | Usado por | O que é usado |
|---|---|---|---|
| `basic-ftp` | 6.2.3 | `get-uri` (proxy do firebase-tools) | `Client` |
| `@opentelemetry/core` | 2.12.0 | `@google-cloud/pubsub` (firebase-tools) | `W3CTraceContextPropagator` |
| `uuid` | 11.1.1 | `gaxios` e `xcode` (firebase-tools e Capacitor CLI) | `v4` |
| `@grpc/grpc-js` | 1.14.6 | `@firebase/firestore` (só na versão Node, usada nos testes) | cliente gRPC |

Ao atualizar o `firebase`, o `firebase-tools` ou o `@capacitor/cli`, veja se o override ainda é
necessário (`npm ls <pacote>`) e retire-o quando o pacote de origem já trouxer a versão corrigida.

## Estrutura

```
src/
  app/          casca do app, navegação, tema, estado do estudante
  components/   interface genérica, fundo, indicadores, escolha de etapa
  screens/      telas dos módulos
  data/         etapas e taxonomia (JSON versionado)
  domain/       taxonomia, recomendador, progresso, perfil, validação
  platform/     Firebase, armazenamento local, salas, pareamento P2P, rede
assets/         SVGs do ícone e da tela de abertura
electron/       janela do Windows
scripts/        tema claro, ícones, empacotamento e instalador Windows, validação, busca de resquícios
tests/rules/    testes das regras do Firestore (emulador)
tests/e2e/      fumaça do build, celular Android (arquivos do APK) e Firebase emulado (conta e pareamento)
```

Todas as chaves do `localStorage` usam o prefixo `visao-quimica:` (`src/platform/storage.js`).
