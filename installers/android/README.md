# Visão Química para Android

APK de teste da versão 0.1.0:
[`Visao-Quimica-0.1.0-android.apk`](Visao-Quimica-0.1.0-android.apk).

| | |
|---|---|
| `applicationId` | `com.exemplo.quimicaquest` (provisório) |
| `versionName` / `versionCode` | 0.1.0 / 1 |
| Android mínimo | 7.0 (API 24) |
| Tamanho | 6.034.262 bytes |
| SHA-256 | `DB235AE1C0F602B47EA4AAAAAC21CAAEBC1BC5A6FDE7BC9EDE488459F85E7E76` |
| Gerado em | 2026-10-26, a partir do commit `71ebab8` de `main` |

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
  as salas de Desafios em sala ficam no modo de demonstração.
- Foi conferido o conteúdo do pacote (identificador, versão, build web com a política de
  segurança), mas o APK **ainda não foi aberto num aparelho ou emulador**.

## Como gerar de novo

Requer Android SDK e JDK 21:

```bash
npm install
npm run android:apk
```

O APK sai em `android/app/build/outputs/apk/debug/app-debug.apk`. Veja também o
[README principal](../../README.md), o [CHANGELOG](../../CHANGELOG.md) e o
[BRANCHES.md](../../BRANCHES.md).
