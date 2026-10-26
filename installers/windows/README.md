# Visão Química para Windows

Pacotes da versão 0.2.0 para Windows 10 e 11 (x64), gerados em 2026-10-26 com o código do commit
`a63adc5` de `main`. Os dois arquivos ficam no **Git LFS** (veja abaixo como baixar).

| Arquivo | Tamanho | SHA-256 |
|---|---|---|
| [`Visao-Quimica-Setup-0.2.0.exe`](Visao-Quimica-Setup-0.2.0.exe) (instalador) | 112.558.865 bytes | `139740D0485A0D034BF9D0F6ED6A0DC6B2CACB064BF70297D1F5A028DF04BE90` |
| [`Visao-Quimica-0.2.0-Windows-x64.7z`](Visao-Quimica-0.2.0-Windows-x64.7z) (portátil) | 101.183.151 bytes | `A0FF4E46937426E7DA39C121D07EDB9FEC233799528F276F5686275526496490` |

## Instalador

Abra `Visao-Quimica-Setup-0.2.0.exe` e siga o assistente. A instalação é só para o usuário atual
(não pede administrador), na pasta `%LOCALAPPDATA%\Programs\Visao Quimica` por padrão. Cria
atalhos no menu Iniciar e na área de trabalho, e aparece em "Aplicativos instalados" para
desinstalar. O desinstalador apaga só os arquivos que o instalador colocou.

O instalador 0.1.0, gerado pelo mesmo script, foi testado em modo silencioso numa pasta temporária:
instalou, abriu a janela do app, desinstalou e removeu atalhos e registro. O 0.2.0 **não pôde ser
executado** na máquina de build: o Controle Inteligente de Aplicativos do Windows bloqueou o
arquivo, que não tem assinatura digital. Os arquivos que ele instala são os mesmos do portátil
0.2.0, que foi aberto e funciona. Se o Windows bloquear o instalador no seu computador, use o
portátil.

## Portátil

1. Extraia o `.7z` com o 7-Zip ou o NanaZip.
2. Abra `Visao Quimica.exe` dentro da pasta `Visao Quimica`.
3. Mantenha a pasta inteira: o executável precisa dos outros arquivos.

O arquivo foi conferido com `7za t` (75 arquivos, sem erros), e o app portátil 0.2.0 foi aberto
nesta máquina.

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
