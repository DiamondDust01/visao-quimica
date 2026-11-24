# Checklist de entrega

## Versão 0.6.0

- [x] `npm run verificar` sem falhas (testes, conteúdo, resquícios, auditoria, build e fumaça).
- [x] Versão consistente em `package.json`, `package-lock.json`, `android/app/build.gradle` e `CHANGELOG.md`.
- [x] README e changelog atualizados, sem descrever funcionalidades removidas como atuais.
- [x] APK gerado (`npm run android:apk`), metadados conferidos com `aapt2 dump badging` e assinatura
  verificada.
- [x] Instalador e portátil do Windows gerados (`npm run app:windows:installer`); `.7z` passou no
  teste de integridade e hashes foram conferidos.
- [x] `npm run test:android` sem falhas (emulação de tela/toque; não substitui aparelho físico).
- [ ] Instalador Windows testado por instalação em uma máquina ou pasta de teste.
- [x] READMEs de `installers/` nas branches `app-pc` e `app-mobile` com tamanho e SHA-256.
- [x] Branches `main`, `app-pc` e `app-mobile` atualizadas; objetos do Git LFS conferidos.
- [x] Release `v0.6.0` publicada com instaladores e APK anexados.

## Checklist funcional atual

Inventário das funções que devem continuar disponíveis na versão distribuída. Os itens abaixo
descrevem o escopo do app; esta lista não substitui os testes automáticos nem o teste manual em
aparelhos físicos.

### Entrada e navegação

- [x] Tela de boas-vindas oferece trilha por etapa, escolha livre de temas e temas rápidos.
- [x] Tema sugerido de reações endotérmicas e exotérmicas, com resumo, etapa, total de questões e
  confirmação antes de começar.
- [x] Quatro abas principais: Início, Trilha, Prática e Laboratório do Mentor (este aparece quando
  já pode sugerir revisão).
- [x] Menu Mais reúne ferramentas, perfil/dados, guia e ajuda, créditos e aparência.
- [x] Navegação adaptada a telas largas e celulares; sessões abrem em tela própria e retornam à
  área de origem.

### Estudo e acompanhamento

- [x] Trilha escolar ordena temas e pré-requisitos, distingue revisão, recomendação, desafio e
  temas concluídos.
- [x] Prática permite escolher temas livremente; sessões podem ser iniciadas por diferentes telas
  com confirmação e opção de cancelar.
- [x] Questões incluem múltipla escolha, resposta numérica, balanceamento, nomenclatura, associação, ordenação e tabela periódica.
- [x] Questões mostram dicas, resolução e erros comuns; glossário contextual e material de leitura
  ajudam sem revelar antecipadamente a resposta.
- [x] Pontuação considera dificuldade e ajudas usadas; erros não retiram pontos e leituras não descontam pontos.
- [x] Relógio da sessão pausa quando o app vai para segundo plano; resumo e última sessão mostram resultado e duração.
- [x] Mentor determinístico analisa erros e indica padrões e temas para revisar, sem IA generativa.

### Perfil, ferramentas e informações

- [x] Perfil mantém etapa escolar, progresso, pontos e histórico localmente no aparelho.
- [x] Backup de progresso pode ser exportado, importado e mesclado manualmente; há opção de apagar os dados locais.
- [x] Lembrete de estudo semanal ou mensal é local e aparece no Perfil quando o app está aberto.
- [x] Ferramentas incluem tabela periódica, calculadora de massa molar e desenho de estruturas moleculares por SMILES.
- [x] Guia de uso, ajuda sobre módulos/regras/pontuação, tema claro/escuro e créditos do projeto.
- [x] App funciona offline na web, Android e Windows; não há contas nem sincronização automática.

## Verificação automática

`npm run verificar` executa em paralelo os testes de unidade, validação do conteúdo, busca por
resquícios e auditorias de dependências. Depois, atualiza o build se as entradas mudaram, confere o
orçamento dos arquivos JavaScript e executa o teste de fumaça no Electron. O relatório é gravado em
`release/verificacao.json`.

Use `npm run test:e2e` para executar o teste de fumaça isoladamente e `npm run test:android` para
testar os arquivos sincronizados para o Android em modo celular. Esse teste não substitui aparelho
ou emulador Android.

## Escopo do aplicativo

- O progresso fica no aparelho. O backup é manual, compatível com JSON versão 1 e pode ser
  compartilhado pelo usuário; o lembrete semanal/mensal só aparece ao abrir Perfil.
- Não há contas, sincronização automática, backend, multiplayer ou salas.
- A tela de créditos, aberta por "Mais" → "Sobre e créditos", reúne links de apoio do projeto.
- O menu "Mais" leva a Ferramentas, Meus dados, Ajuda e Aparência; nenhum destino fica a mais de três toques.
- O código da versão Android deve aumentar a cada nova versão distribuída.

## Distribuição

- Nenhum pacote tem assinatura digital; registre avisos do Windows e teste o portátil sem desativar
  proteções do sistema.
- A branch `app-pc` contém os instaladores Windows com Git LFS; `app-mobile` contém o APK.
- Não publicar arquivos antes de conferir os hashes SHA-256 dos artefatos gerados.
