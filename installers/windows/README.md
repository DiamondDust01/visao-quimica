# Visão Química para Windows

Pacotes da versão 0.1.0 para Windows 10 e 11 (x64), gerados em 2026-10-26 a partir do commit
`71ebab8` de `main`. Os dois arquivos ficam no **Git LFS** (veja abaixo como baixar).

| Arquivo | Tamanho | SHA-256 |
|---|---|---|
| [`Visao-Quimica-Setup-0.1.0.exe`](Visao-Quimica-Setup-0.1.0.exe) (instalador) | 112.564.898 bytes | `E4FCDF2DAA2E2C9192836BF78AC4BFC36DA559DF6DA8887A8FF0ED391A531BEC` |
| [`Visao-Quimica-0.1.0-Windows-x64.7z`](Visao-Quimica-0.1.0-Windows-x64.7z) (portátil) | 101.178.300 bytes | `C756F08AF9A27ED1AB17256A0A914B091AD1481F9A370D336FC0DD2A5B1B2874` |

## Instalador

Abra `Visao-Quimica-Setup-0.1.0.exe` e siga o assistente. A instalação é só para o usuário atual
(não pede administrador), na pasta `%LOCALAPPDATA%\Programs\Visao Quimica` por padrão. Cria
atalhos no menu Iniciar e na área de trabalho, e aparece em "Aplicativos instalados" para
desinstalar. O desinstalador apaga só os arquivos que o instalador colocou.

Testado nesta versão, em modo silencioso numa pasta temporária: instalou, abriu a janela do app,
desinstalou e removeu atalhos e registro.

## Portátil

1. Extraia o `.7z` com o 7-Zip ou o NanaZip.
2. Abra `Visao Quimica.exe` dentro da pasta `Visao Quimica`.
3. Mantenha a pasta inteira: o executável precisa dos outros arquivos.

O arquivo foi conferido com `7za t` (75 arquivos, sem erros).

## Avisos

Nenhum dos pacotes tem assinatura digital. O Windows (SmartScreen) ou uma política da escola pode
avisar ou bloquear. Não desative proteções do sistema para contornar isso.

Os pacotes não incluem configuração do Firebase: estudo, prática, Mentor e ferramentas funcionam
offline; as salas de Desafios em sala ficam no modo de demonstração.

## Baixar com Git LFS

Pela página do GitHub, abra o arquivo e use "Download raw". Pelo git:

```bash
git lfs install
git clone --branch app-pc https://github.com/DiamondDust01/visao-quimica.git
```

Sem o Git LFS, o arquivo baixado é só um ponteiro de texto.

## Como gerar de novo

Requer NSIS e 7-Zip (caminhos em `MAKENSIS` e `SEVEN_ZIP`, se não estiverem nas pastas comuns):

```bash
npm install
npm run app:windows:installer
```

Os arquivos saem em `release/windows/`. Veja também o [README principal](../../README.md), o
[CHANGELOG](../../CHANGELOG.md) e o [BRANCHES.md](../../BRANCHES.md).
