# Organização das branches

| Branch | Para que serve | O que tem a mais |
|---|---|---|
| `main` | Branch geral: o código completo do app (web, Android e Windows), testes e documentação. | — |
| `app-pc` | Distribuição para Windows. | `installers/windows/`: instalador (Setup) e versão portátil (`.7z`), guardados com Git LFS. |
| `app-mobile` | Distribuição para Android. | `installers/android/`: APK de teste. |

As branches de plataforma são cópias completas de `main` mais a pasta `installers/`: os builds de
Android e Windows usam os mesmos arquivos React/Vite, então nenhum código é removido nelas.

## Fluxo

1. Desenvolver em `main` (ou numa branch de trabalho que depois entra em `main`).
2. Antes de gerar instaladores, atualizar a branch de plataforma a partir de `main`
   (`git checkout app-pc && git merge main`).
3. Gerar o pacote (`npm run app:windows:installer` ou `npm run android:apk`), copiar para
   `installers/`, atualizar o README da pasta (versão, tamanho e SHA-256) e fazer o commit.
4. Correções feitas numa branch de plataforma voltam para `main`; nenhuma funcionalidade fica só
   numa delas.

## Git LFS

Os arquivos do Windows passam de 100 MB (limite do GitHub por arquivo) ou chegam perto dele, por
isso ficam no Git LFS (regras em `.gitattributes` da branch `app-pc`). Para baixá-los ao clonar:

```bash
git lfs install
git checkout app-pc
git lfs pull
```

Sem o Git LFS, o arquivo baixado é só um ponteiro de texto, não o instalador.
