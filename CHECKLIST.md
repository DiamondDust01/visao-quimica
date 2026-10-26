# Checklist de entrega

Dois usos: a lista fixa que vale para toda versão e o registro da rodada de trabalho atual.
A parte automática roda com `npm run verificar` (veja "Verificação automática").

## Toda versão

- [ ] `npm run verificar -- --completo` sem falhas (testes, conteúdo, resquícios,
      vulnerabilidades, build, orçamento de tamanho, teste de fumaça, regras do Firestore e o
      teste com o Firebase emulado: conta entre aparelhos e pareamento P2P).
- [ ] Versão igual em `package.json`, `android/app/build.gradle` (`versionName` e `versionCode`)
      e no `CHANGELOG.md`.
- [ ] `CHANGELOG.md` com data; `README.md` sem informação desatualizada.
- [ ] APK gerado (`npm run android:apk`) e conferido com `aapt2 dump badging`.
- [ ] Instalador e portátil do Windows gerados (`npm run app:windows:installer`); instalador
      testado em modo silencioso (instalar, abrir, desinstalar). Se o Windows bloquear o arquivo
      sem assinatura, registre o bloqueio e teste o portátil; não desative proteções.
- [ ] `npm run test:android` sem falhas (arquivos do APK em modo celular).
- [ ] READMEs de `installers/` nas branches `app-pc` e `app-mobile` com tamanho e SHA-256.
- [ ] Branches `main`, `app-pc` e `app-mobile` atualizadas e enviadas; objetos do Git LFS
      conferidos no GitHub.

## Verificação automática

`npm run verificar` roda as etapas e mostra uma tabela com resultado e tempo de cada uma:

- as etapas independentes (testes de unidade, conteúdo, resquícios e vulnerabilidades) rodam
  em paralelo;
- o build só é refeito se algum arquivo de entrada mudou (hash guardado em
  `.cache/hash-build`, fora do que vai para os pacotes);
- cada arquivo JavaScript do build tem um orçamento de tamanho;
- o resultado fica em `release/verificacao.json`.

Opções: `--sem-regras` pula o teste das regras do Firestore (precisa de Java),
`--sem-e2e` pula o teste de fumaça no Electron e `--completo` inclui `npm run test:nuvem`
(Firebase emulado, cerca de 1 minuto).

## Rodada de 2026-10-26 (segunda entrega)

| # | Tarefa | Situação |
|---|---|---|
| 1 | Checklist e verificação automática | feito |
| 2 | Barra superior fixa ao rolar | feito; conferida no teste de fumaça |
| 3 | Vulnerabilidades das ferramentas de desenvolvimento | feito: 16 → 0 (firebase-tools 15.33.0, sharp 0.35.5, overrides) |
| 4 | Conta sem dados pessoais para salvar o progresso | feito; 7 testes de unidade, 3 de regras, 18 de ponta a ponta |
| 5 | Revisão das 477 questões | feito por IA: nenhum gabarito errado, 8 textos melhorados ([REVISAO_QUESTOES.md](REVISAO_QUESTOES.md)) |
| 6 | Pareamento entre vários aparelhos | feito: 3 alunos conectados direto (4 a 6 ms) |
| 7 | App Android em emulador | emulador impossível (virtualização desligada no BIOS); arquivos do APK testados em modo celular: `npm run test:android`, 16 verificações |
| 8 | Documentação | feito: README, CHANGELOG (0.2.0), CHECKLIST, REVISAO_QUESTOES, roteiro de slides |
| 9 | Instaladores | APK 0.2.0 e Windows 0.2.0 gerados; portátil testado; Setup bloqueado pelo Windows (sem assinatura) |
| 10 | Branches no GitHub | feito: `main`, `app-pc` (LFS conferido no GitHub) e `app-mobile` enviadas |

### Eficiência nesta rodada

- Verificação: etapas independentes em paralelo; build reaproveitado quando a entrada não muda.
- Emuladores com cache próprio do projeto (`.cache/emuladores`): não disputam arquivos com outros
  projetos abertos na máquina.
- O servidor de desenvolvimento deixou de vigiar `.cache`, `release`, `android` e `dist`.
- Conta e pareamento testados no mesmo ciclo de emuladores; processos de teste encerrados no fim.
- Emulador Android: a falta de virtualização foi conferida antes de baixar emulador e imagem
  (cerca de 2 GB), e o teste foi feito com os arquivos do próprio APK.
- APK e Windows gerados a partir do build da verificação (sem refazer o build três vezes).
- Arquivos temporários de teste e pacotes da versão anterior removidos de `release/`.
- Sincronização da conta: espera 2,5 s para juntar respostas seguidas num envio só e não reenvia
  o que não mudou.

### Fechamento da rodada

- Última `npm run verificar -- --completo`: 10 etapas sem falha, 94 s somados (o build entra uma
  vez; com a entrada sem mudança, a verificação seguinte levou 32 s).
- Testes: 127 de unidade, 15 de regras, 18 no teste de fumaça, 16 no teste Android e 22 no teste
  com o Firebase emulado.
- Pendências que dependem de você: assinar os executáveis (o Windows bloqueou o instalador sem
  assinatura), ligar a virtualização no BIOS para um emulador Android de verdade, configurar um
  projeto Firebase para a conta e as salas funcionarem fora do modo de demonstração, trocar o
  `applicationId` provisório e a revisão das questões por um professor.
