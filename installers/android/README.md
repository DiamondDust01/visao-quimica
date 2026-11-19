# Visão Química para Android

APK de teste da versão 0.4.0, gerado em 2026-11-19 com o código do commit `5c87424` de `main`:
[`Visao-Quimica-0.4.0-android.apk`](Visao-Quimica-0.4.0-android.apk).

| | |
|---|---|
| `applicationId` | `com.exemplo.quimicaquest` (provisório) |
| `versionName` / `versionCode` | 0.4.0 / 6 |
| Android mínimo | 7.0 (API 24) |
| Tamanho | 5.747.129 bytes |
| SHA-256 | `CC4BF1E1661768A97FF8F74AA8744871762A22A2CFCE8A5591A6FA575C46FD45` |
| Assinatura | chave de depuração; não serve para a Play Store |

## Instalação

1. Baixe o APK no aparelho.
2. Abra o arquivo pelo gerenciador de arquivos.
3. Se o Android pedir, autorize a instalação a partir dessa origem e confirme.

Instale somente se confiar na origem do download. O `applicationId` ainda é provisório e deve ser
definido antes de uma publicação em loja.

## O que saber antes

- Perfil e progresso ficam no aparelho. Não há conta, sincronização, backend ou multiplayer; o
  backup é exportado e compartilhado manualmente pelo usuário.
- Conferido com `aapt2 dump badging` (identificador e versão) e
  `npm run test:android` (20 verificações: navegação e toque, menu "Mais", créditos, questão,
  estrutura, backup, guia de uso e console).
- O APK não foi aberto em aparelho físico ou emulador nesta rodada.

Versões anteriores ainda podem ser baixadas nesta pasta, mas não recebem mais atualizações.

## Como gerar de novo

Requer Android SDK e JDK 21:

```bash
npm install
npm run android:apk
```

O APK sai em `android/app/build/outputs/apk/debug/app-debug.apk`. Veja também o
[README principal](../../README.md), o [CHANGELOG](../../CHANGELOG.md) e o
[BRANCHES.md](../../BRANCHES.md).
