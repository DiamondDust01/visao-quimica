// Teste de ponta a ponta com o Firebase emulado: conta por código entre aparelhos, login que
// volta depois de falha de rede e pareamento P2P entre vários aparelhos (tests/e2e/nuvem.cjs).
// Sobe os emuladores de Auth e Firestore (cache em .cache/emuladores), um servidor do app ligado
// a eles e o Electron; no fim, derruba tudo. Uso: npm run test:nuvem
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const runInside = async () => {
  process.env.VITE_FIREBASE_CONFIG = JSON.stringify({ apiKey: 'demo-key', authDomain: 'demo-visao-quimica.firebaseapp.com', projectId: 'demo-visao-quimica', appId: 'demo-app' });
  process.env.VITE_FIREBASE_EMULATORS = '1';
  const { createServer } = await import('vite');
  const server = await createServer({ root, logLevel: 'error', server: { port: 5176, strictPort: false } });
  await server.listen();
  const url = server.resolvedUrls.local[0];
  const env = { ...process.env, BASE_URL: url };
  delete env.ELECTRON_RUN_AS_NODE;
  const code = await new Promise((resolve) => {
    spawn('npx electron tests/e2e/nuvem.cjs', { cwd: root, shell: true, stdio: 'inherit', env }).on('close', resolve);
  });
  await server.close();
  process.exit(code ?? 1);
};

if (process.argv.includes('--dentro')) {
  await runInside();
} else {
  const child = spawn('npx firebase emulators:exec --only auth,firestore --project demo-visao-quimica "node scripts/test-nuvem.mjs --dentro"', {
    cwd: root,
    shell: true,
    stdio: 'inherit',
    env: { ...process.env, FIREBASE_EMULATORS_PATH: path.join(root, '.cache', 'emuladores') }
  });
  child.on('close', (code) => { process.exitCode = code ?? 1; });
}
