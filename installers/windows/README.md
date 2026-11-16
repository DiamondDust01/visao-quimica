# Visão Química para Windows

Pacotes da versão 0.4.0 para Windows 10 e 11 (x64), gerados em 2026-11-16 com o código do commit
`299e82c` de `app-pc`. Os executáveis ficam no **Git LFS**.

| Arquivo | Tamanho | SHA-256 |
|---|---:|---|
| [`Visao-Quimica-Setup-0.4.0.exe`](Visao-Quimica-Setup-0.4.0.exe) (instalador) | 112.411.599 bytes | `38D25282353A0E240F0E09ED9426B24A82B7DCA2B45166D8F5C002BA50226DFA` |
| [`Visao-Quimica-0.4.0-Windows-x64.7z`](Visao-Quimica-0.4.0-Windows-x64.7z) (portátil) | 101.027.351 bytes | `0659CA8AAD89A51AFAF7A386AB6F098AB3E231D5D7ECB39706B781BFD38E752D` |

O arquivo portátil passou no teste de integridade do 7-Zip (75 arquivos, sem erros). O instalador
foi gerado, mas não testado por instalação nesta máquina.

## Instalação

Abra `Visao-Quimica-Setup-0.4.0.exe` e siga o assistente. A instalação é só para o usuário atual
(não pede administrador), cria atalhos e aparece em "Aplicativos instalados" para desinstalar.
O desinstalador apaga somente os arquivos que instalou.

## Portátil

1. Extraia o `.7z` com o 7-Zip ou o NanaZip.
2. Abra `Visao Quimica.exe` dentro da pasta `Visao Quimica`.
3. Mantenha a pasta inteira: o executável precisa dos outros arquivos.

## Avisos

Os pacotes não têm assinatura digital. O Windows ou uma política da escola pode avisar ou bloquear;
não desative proteções do sistema para contornar isso. A versão 0.4.0 não tem contas, sincronização,
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
