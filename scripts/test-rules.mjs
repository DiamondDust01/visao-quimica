// Testa firestore.rules no emulador do Firestore. Os emuladores ficam numa pasta de cache só
// deste projeto (.cache/emuladores): o firebase-tools apaga versões antigas do cache comum ao
// iniciar, o que falha se outro projeto estiver com um emulador aberto.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const command = 'npx firebase emulators:exec --only firestore --project demo-visao-quimica "node --test tests/rules/*.test.mjs"';
const child = spawn(command, {
  cwd: root,
  shell: true,
  stdio: 'inherit',
  env: { ...process.env, FIREBASE_EMULATORS_PATH: path.join(root, '.cache', 'emuladores') }
});
child.on('close', (code) => { process.exitCode = code ?? 1; });
