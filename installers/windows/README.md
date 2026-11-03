# Visão Química para Windows

Pacotes da versão 0.3.0 para Windows 10 e 11 (x64), gerados em 2026-11-02 com o código do commit
`f1a9957` de `main`. Os executáveis ficam no **Git LFS**.

| Arquivo | Tamanho | SHA-256 |
|---|---:|---|
| [`Visao-Quimica-Setup-0.3.0.exe`](Visao-Quimica-Setup-0.3.0.exe) (instalador) | 112.380.917 bytes | `BE7FCBCE3B3EE76601E2777DE3CC6877296BB2D0AE1E0B7E668E25E53935FFE6` |
| [`Visao-Quimica-0.3.0-Windows-x64.7z`](Visao-Quimica-0.3.0-Windows-x64.7z) (portátil) | 101.019.949 bytes | `F9A735A7EE607565D50143C38ED87D33CEEB7787213C2B4C71796EF823EF0378` |

O arquivo portátil passou no teste de integridade do 7-Zip (75 arquivos, sem erros). O instalador
foi gerado, mas não testado por instalação nesta máquina.

## Instalação

Abra `Visao-Quimica-Setup-0.3.0.exe` e siga o assistente. A instalação é só para o usuário atual
(não pede administrador), cria atalhos e aparece em "Aplicativos instalados" para desinstalar.
O desinstalador apaga somente os arquivos que instalou.

## Portátil

1. Extraia o `.7z` com o 7-Zip ou o NanaZip.
2. Abra `Visao Quimica.exe` dentro da pasta `Visao Quimica`.
3. Mantenha a pasta inteira: o executável precisa dos outros arquivos.

## Avisos

Os pacotes não têm assinatura digital. O Windows ou uma política da escola pode avisar ou bloquear;
não desative proteções do sistema para contornar isso. A versão 0.3.0 não tem contas, sincronização,
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
