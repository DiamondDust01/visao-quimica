# Visão Química para Android

APK de teste da versão 0.3.0, gerado em 2026-11-02 com o código do commit `f1a9957` de `main`:
[`Visao-Quimica-0.3.0-android.apk`](Visao-Quimica-0.3.0-android.apk).

| | |
|---|---|
| `applicationId` | `com.exemplo.quimicaquest` (provisório) |
| `versionName` / `versionCode` | 0.3.0 / 4 |
| Android mínimo | 7.0 (API 24) |
| Tamanho | 5.736.417 bytes |
| SHA-256 | `5B529BE69B2105DA58D5631CEAF19CFBAA9F0D7F0E683C6B7502C13867F7A3FA` |
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
  `npm run test:android` (17 verificações de navegação, toque, créditos, conteúdo e console).
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
