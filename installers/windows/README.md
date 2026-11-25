# Visão Química para Windows

Pacotes da versão 0.7.0 para Windows 10 e 11 (x64), gerados em 2026-11-25 com o código do commit
`714ab35` de `main`, incorporado em `app-pc` pelo commit `7b9473a`. Os executáveis ficam no
**Git LFS**.

| Arquivo | Tamanho | SHA-256 |
|---|---:|---|
| [`Visao-Quimica-Setup-0.7.0.exe`](Visao-Quimica-Setup-0.7.0.exe) (instalador) | 112.472.654 bytes | `F05C469A8A44FE058FF8AAF84ACE0C3BE1DA05ED6D8F5223D740381430335450` |
| [`Visao-Quimica-0.7.0-Windows-x64.7z`](Visao-Quimica-0.7.0-Windows-x64.7z) (portátil) | 101.100.815 bytes | `02AFF8EE9E571E4BB696236983B8FB6F0C344D322033CFEC8EB3E8E2FE6CD81B` |

O arquivo portátil passou no teste de integridade do 7-Zip (75 arquivos, sem erros) e foi
extraído e aberto com sucesso em pasta temporária. O instalador foi instalado silenciosamente em
uma pasta temporária, aberto com sucesso e desinstalado; a pasta, as chaves de registro e os
atalhos de teste foram removidos.

## Instalação

Abra `Visao-Quimica-Setup-0.7.0.exe` e siga o assistente. A instalação é só para o usuário atual
(não pede administrador), cria atalhos e aparece em "Aplicativos instalados" para desinstalar.
O desinstalador apaga somente os arquivos que instalou.

## Portátil

1. Extraia o `.7z` com o 7-Zip ou o NanaZip.
2. Abra `Visao Quimica.exe` dentro da pasta `Visao Quimica`.
3. Mantenha a pasta inteira: o executável precisa dos outros arquivos.

## Avisos

Os pacotes não têm assinatura digital. O Windows ou uma política da escola pode avisar ou bloquear;
não desative proteções do sistema para contornar isso. A versão 0.7.0 não tem contas, sincronização,
backend ou multiplayer; o progresso fica no aparelho e o backup é manual. Ela inclui o ajuste de
tamanho da fonte e o guia progressivo e opcional, com oferta inicial em pop-up.

Versões anteriores ainda podem ser baixadas nesta pasta, mas não recebem mais atualizações.

## Baixar com Git LFS

Pela página do GitHub, abra o arquivo e use "Download raw". Pelo git:

```bash
git lfs install
git clone --branch app-pc https://github.com/DiamondDust01/visao-quimica.git
```

Sem o Git LFS, o arquivo baixado é só um ponteiro de texto.

## Como gerar de novo

Requer JDK 21, NSIS e 7-Zip:

```bash
npm install
npm run app:windows:installer
```

Os arquivos saem em `release/windows/`. Veja também o [README principal](../../README.md), o
[CHANGELOG](../../CHANGELOG.md) e o [BRANCHES.md](../../BRANCHES.md).
