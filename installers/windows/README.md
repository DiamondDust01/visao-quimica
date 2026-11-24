# Visão Química para Windows

Pacotes da versão 0.5.0 para Windows 10 e 11 (x64), gerados em 2026-11-23 com o código do commit
`c476c61` de `app-pc`. Os executáveis ficam no **Git LFS**.

| Arquivo | Tamanho | SHA-256 |
|---|---:|---|
| [`Visao-Quimica-Setup-0.5.0.exe`](Visao-Quimica-Setup-0.5.0.exe) (instalador) | 112.408.250 bytes | `6952D44680B58AA110B7106A2F0A793FCF01FE904A138C521E9A8531708BFE12` |
| [`Visao-Quimica-0.5.0-Windows-x64.7z`](Visao-Quimica-0.5.0-Windows-x64.7z) (portátil) | 101.028.057 bytes | `66BED11509D05F9BB042CDE3721F5B902BFD554F8CC5977CD737DB1FD218E1B1` |

O arquivo portátil passou no teste de integridade do 7-Zip (75 arquivos, sem erros). O instalador
foi gerado, mas não testado por instalação nesta máquina.

## Instalação

Abra `Visao-Quimica-Setup-0.5.0.exe` e siga o assistente. A instalação é só para o usuário atual
(não pede administrador), cria atalhos e aparece em "Aplicativos instalados" para desinstalar.
O desinstalador apaga somente os arquivos que instalou.

## Portátil

1. Extraia o `.7z` com o 7-Zip ou o NanaZip.
2. Abra `Visao Quimica.exe` dentro da pasta `Visao Quimica`.
3. Mantenha a pasta inteira: o executável precisa dos outros arquivos.

## Avisos

Os pacotes não têm assinatura digital. O Windows ou uma política da escola pode avisar ou bloquear;
não desative proteções do sistema para contornar isso. A versão 0.5.0 não tem contas, sincronização,
backend ou multiplayer; o progresso fica no aparelho e o backup é manual.

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
