# Checklist de entrega

## Versão 0.3.0

- [ ] `npm run verificar` sem falhas (testes, conteúdo, resquícios, auditoria, build e fumaça).
- [ ] Versão consistente em `package.json`, `android/app/build.gradle` e `CHANGELOG.md`.
- [ ] README e changelog atualizados, sem descrever funcionalidades removidas como atuais.
- [ ] APK gerado (`npm run android:apk`) e conferido com `aapt2 dump badging`.
- [ ] Instalador e portátil do Windows gerados (`npm run app:windows:installer`) e testados.
- [ ] `npm run test:android` sem falhas.
- [ ] READMEs de `installers/` nas branches `app-pc` e `app-mobile` com tamanho e SHA-256.
- [ ] Branches `main`, `app-pc` e `app-mobile` atualizadas; objetos do Git LFS conferidos.

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
- A tela de créditos, aberta pelo ícone junto ao seletor de tema, reúne links de apoio do projeto.
- O código da versão Android deve aumentar a cada nova versão distribuída.

## Distribuição

- Nenhum pacote tem assinatura digital; registre avisos do Windows e teste o portátil sem desativar
  proteções do sistema.
- A branch `app-pc` contém os instaladores Windows com Git LFS; `app-mobile` contém o APK.
- Não publicar arquivos antes de conferir os hashes SHA-256 dos artefatos gerados.
