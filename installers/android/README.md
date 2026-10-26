# Visão Química para Android

APK de teste da versão 0.2.0:
[`Visao-Quimica-0.2.0-android.apk`](Visao-Quimica-0.2.0-android.apk).

| | |
|---|---|
| `applicationId` | `com.exemplo.quimicaquest` (provisório) |
| `versionName` / `versionCode` | 0.2.0 / 2 |
| Android mínimo | 7.0 (API 24) |
| Tamanho | 5.965.268 bytes |
| SHA-256 | `9B32B8CF49537BAC615C936684DA285FBAAE44C87847FC93C06281DF08A2E749` |
| Gerado em | 2026-10-26, com o código do commit `a63adc5` de `main` |

## Instalação

1. Baixe o APK no aparelho.
2. Abra o arquivo pelo gerenciador de arquivos.
3. Se o Android pedir, autorize a instalação a partir dessa origem e confirme.

O Android pode avisar que a origem é desconhecida. Instale só se confiar na origem do download.

## O que saber antes

- O APK usa a **chave de depuração**: serve para teste, não para a Play Store, e não identifica
  um publicador.
- O `applicationId` é provisório e precisa ser trocado antes da primeira publicação na loja.
- Não inclui configuração do Firebase: estudo, prática, Mentor e ferramentas funcionam offline;
  as salas de Desafios em sala ficam no modo de demonstração, e a conta na nuvem fica
  indisponível. O backup em arquivo (Perfil → Conta e backup) funciona.
- Conferido: identificador e versão (`aapt2 dump badging`) e os arquivos web do APK num Chromium
  em modo celular Android (`npm run test:android`: toque, tela de Pixel 7, 16 verificações sem
  erros). O APK **ainda não foi aberto num aparelho nem num emulador**: na máquina de build a
  virtualização está desligada no BIOS, e o emulador Android precisa dela.

## Como gerar de novo

Requer Android SDK e JDK 21:

```bash
npm install
npm run android:apk
```

O APK sai em `android/app/build/outputs/apk/debug/app-debug.apk`. Veja também o
[README principal](../../README.md), o [CHANGELOG](../../CHANGELOG.md) e o
[BRANCHES.md](../../BRANCHES.md).
