# Visão Química para Windows

Pacotes da versão 0.4.1 para Windows 10 e 11 (x64), gerados em 2026-11-20 com o código do commit
`ebbaf6a` de `app-pc`. Os executáveis ficam no **Git LFS**.

| Arquivo | Tamanho | SHA-256 |
|---|---:|---|
| [`Visao-Quimica-Setup-0.4.1.exe`](Visao-Quimica-Setup-0.4.1.exe) (instalador) | 112.390.767 bytes | `1106DDD6472862A965B9794E0C815DCAAB6F7FE8CB756E7F8A3A488A21CEEA15` |
| [`Visao-Quimica-0.4.1-Windows-x64.7z`](Visao-Quimica-0.4.1-Windows-x64.7z) (portátil) | 101.025.264 bytes | `4BD1812DEB011D86EFFA7D74944171E9C0FEA73693DC93CFF707E9FA644F32DC` |

O arquivo portátil passou no teste de integridade do 7-Zip (75 arquivos, sem erros). O instalador
foi gerado, mas não testado por instalação nesta máquina.

## Instalação

Abra `Visao-Quimica-Setup-0.4.1.exe` e siga o assistente. A instalação é só para o usuário atual
(não pede administrador), cria atalhos e aparece em "Aplicativos instalados" para desinstalar.
O desinstalador apaga somente os arquivos que instalou.

## Portátil

1. Extraia o `.7z` com o 7-Zip ou o NanaZip.
2. Abra `Visao Quimica.exe` dentro da pasta `Visao Quimica`.
3. Mantenha a pasta inteira: o executável precisa dos outros arquivos.

## Avisos

Os pacotes não têm assinatura digital. O Windows ou uma política da escola pode avisar ou bloquear;
não desative proteções do sistema para contornar isso. A versão 0.4.1 não tem contas, sincronização,
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
