# Visão Química para Windows

Pacotes da versão 0.2.1 para Windows 10 e 11 (x64), gerados em 2026-11-02 com o código do commit
`a5c6ae5` de `main`. Os dois arquivos ficam no **Git LFS** (veja abaixo como baixar).

| Arquivo | Tamanho | SHA-256 |
|---|---|---|
| [`Visao-Quimica-Setup-0.2.1.exe`](Visao-Quimica-Setup-0.2.1.exe) (instalador) | 112.552.369 bytes | `5C0001C75A4346634D655880934BA0672EFE0F57CDBBFBEC8EF6A27A8624E4C3` |
| [`Visao-Quimica-0.2.1-Windows-x64.7z`](Visao-Quimica-0.2.1-Windows-x64.7z) (portátil) | 101.183.377 bytes | `345FAFD71CFBA128D587387EE2E873E25E0CEBF356938320FC82FC9629955F81` |

## Instalador

Abra `Visao-Quimica-Setup-0.2.1.exe` e siga o assistente. A instalação é só para o usuário atual
(não pede administrador), na pasta `%LOCALAPPDATA%\Programs\Visao Quimica` por padrão. Cria
atalhos no menu Iniciar e na área de trabalho, e aparece em "Aplicativos instalados" para
desinstalar. O desinstalador apaga só os arquivos que o instalador colocou.

O instalador 0.1.0, gerado pelo mesmo script, foi testado em modo silencioso numa pasta temporária:
instalou, abriu a janela do app, desinstalou e removeu atalhos e registro. O 0.2.0 foi bloqueado pelo
Controle Inteligente de Aplicativos do Windows na máquina de build, por não ter assinatura digital.
O instalador 0.2.1 foi gerado, mas não foi aberto nesta máquina. Se o Windows bloquear o instalador
no seu computador, use o portátil.

## Portátil

1. Extraia o `.7z` com o 7-Zip ou o NanaZip.
2. Abra `Visao Quimica.exe` dentro da pasta `Visao Quimica`.
3. Mantenha a pasta inteira: o executável precisa dos outros arquivos.

O arquivo 0.2.1 foi conferido com `7za t` (75 arquivos, sem erros). O app ainda não foi aberto
a partir do pacote portátil nesta máquina.

## Avisos

Nenhum dos pacotes tem assinatura digital. O Windows (SmartScreen ou Controle Inteligente de
Aplicativos) ou uma política da escola pode avisar ou bloquear. Não desative proteções do sistema
para contornar isso; a solução definitiva é assinar os executáveis com um certificado de
assinatura de código.

Os pacotes não incluem configuração do Firebase: estudo, prática, Mentor e ferramentas funcionam
offline; as salas de Desafios em sala ficam no modo de demonstração, e a conta na nuvem fica
indisponível. O backup em arquivo (Perfil → Conta e backup) funciona.

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
