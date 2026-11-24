# Visão Química para Android

APK de teste da versão 0.6.0, gerado em 2026-11-24 com o código do commit `b4863da` de `main`,
incorporado em `app-mobile` pelo commit `898b1db`:
[`Visao-Quimica-0.6.0-android.apk`](Visao-Quimica-0.6.0-android.apk).

| | |
|---|---|
| `applicationId` | `com.exemplo.quimicaquest` (provisório) |
| `versionName` / `versionCode` | 0.6.0 / 9 |
| Android mínimo | 7.0 (API 24) |
| Tamanho | 5.860.536 bytes |
| SHA-256 | `714C22A63598F04ACCF6EBDDBE9DFE03BB2EC04BC40EA3FF4788D836F121A4AD` |
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
- Conferido com `aapt2 dump badging` (identificador e versão), verificação da assinatura e
  `npm run test:android` (20 verificações de navegação/toque, Mentor, menu, questão, estrutura,
  backup, guia e console).
- O teste Android usa um navegador com viewport e toque emulados; não substitui aparelho físico ou
  emulador Android. Nenhum dispositivo estava conectado nesta rodada.

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
