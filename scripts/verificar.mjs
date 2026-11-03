// Verificação de entrega: roda as checagens do projeto, mede o tempo de cada uma e falha se
// alguma falhar. Uso: npm run verificar [-- --sem-e2e]
// - etapas independentes rodam em paralelo;
// - o build só é refeito se algum arquivo de entrada mudou;
// - cada arquivo JavaScript do build tem orçamento de tamanho.
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// Orçamento por arquivo JavaScript do build (bytes, sem compressão).
export const JS_BUDGET = 700 * 1024;
// Fora de dist/: o que está em dist/ vai para o APK e para o app do Windows.
const HASH_FILE = path.join(root, '.cache', 'hash-build');
const BUILD_INPUTS = ['src', 'public', 'index.html', 'vite.config.js', 'package-lock.json'];

// remove: variáveis de ambiente a tirar (ELECTRON_RUN_AS_NODE, que o VS Code define, faz o
// Electron rodar como Node).
const run = (command, commandArgs, { remove = [] } = {}) => new Promise((resolve) => {
  const started = Date.now();
  const env = { ...process.env };
  remove.forEach((name) => delete env[name]);
  // Comando inteiro numa string (os argumentos são fixos deste script): no Windows o npm é um
  // .cmd e precisa do shell.
  const child = spawn([command, ...commandArgs].join(' '), { cwd: root, shell: true, env });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  // eslint-disable-next-line no-control-regex
  child.on('close', (code) => resolve({ ok: code === 0, output: output.replace(/\x1b\[[0-9;]*m/g, ''), segundos: (Date.now() - started) / 1000 }));
});

const listFiles = (entry) => {
  const full = path.join(root, entry);
  if (!fs.existsSync(full)) return [];
  if (fs.statSync(full).isFile()) return [full];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap((item) => listFiles(path.join(entry, item.name)));
};

const inputHash = () => {
  const hash = crypto.createHash('sha256');
  BUILD_INPUTS.flatMap(listFiles).sort().forEach((file) => {
    hash.update(path.relative(root, file));
    hash.update(fs.readFileSync(file));
  });
  return hash.digest('hex');
};

const lastLine = (text, pattern) => text.split(/\r?\n/).filter((line) => pattern.test(line)).pop()?.trim() || '';

const steps = [];
const outputs = new Map();
const record = (etapa, result, detalhe) => {
  steps.push({ etapa, ok: result.ok, segundos: Number(result.segundos.toFixed(1)), detalhe });
  outputs.set(etapa, result.output || '');
};

// 1. Etapas independentes, em paralelo.
const [unit, content, residue, auditProd, auditAll] = await Promise.all([
  run(npm, ['test']),
  run(npm, ['run', 'validate:content']),
  run(npm, ['run', 'check:residue']),
  run(npm, ['audit', '--omit=dev']),
  run(npm, ['audit'])
]);
const testCount = (output) => {
  const pass = lastLine(output, /^ℹ pass /).replace('ℹ pass ', '');
  const fail = lastLine(output, /^ℹ fail /).replace('ℹ fail ', '');
  return `${pass || '?'} passaram, ${fail || '?'} falharam`;
};
record('Testes de unidade', unit, testCount(unit.output));
record('Conteúdo (validate:content)', content, lastLine(content.output, /Conteúdo válido|erro\(s\)/));
record('Resquícios (check:residue)', residue, lastLine(residue.output, /arquivos verificados/));
record('Vulnerabilidades do app', auditProd, lastLine(auditProd.output, /vulnerabilit/));
record('Vulnerabilidades (com ferramentas)', auditAll, lastLine(auditAll.output, /vulnerabilit/));

// 2. Build, só se a entrada mudou.
const hash = inputHash();
const cached = fs.existsSync(HASH_FILE) && fs.readFileSync(HASH_FILE, 'utf8') === hash;
let build = { ok: true, output: '', segundos: 0 };
if (!cached) {
  build = await run(npm, ['run', 'build']);
  if (build.ok) {
    fs.mkdirSync(path.dirname(HASH_FILE), { recursive: true });
    fs.writeFileSync(HASH_FILE, hash);
  }
}
record('Build web', build, cached ? 'reaproveitado (entrada sem mudança)' : lastLine(build.output, /built in/));

// 3. Orçamento de tamanho.
const assets = fs.existsSync(path.join(root, 'dist', 'assets')) ? fs.readdirSync(path.join(root, 'dist', 'assets')) : [];
const jsSizes = assets.filter((name) => name.endsWith('.js')).map((name) => ({ name, size: fs.statSync(path.join(root, 'dist', 'assets', name)).size }));
const overBudget = jsSizes.filter((item) => item.size > JS_BUDGET);
const biggest = jsSizes.sort((a, b) => b.size - a.size)[0];
record('Orçamento de tamanho', { ok: build.ok && jsSizes.length > 0 && overBudget.length === 0, segundos: 0 },
  overBudget.length ? `acima de ${JS_BUDGET / 1024} kB: ${overBudget.map((item) => item.name).join(', ')}` : `maior arquivo: ${biggest ? `${biggest.name} (${Math.round(biggest.size / 1024)} kB)` : 'nenhum'}`);

// 4. Teste de fumaça no Electron.
if (!args.has('--sem-e2e') && build.ok) {
  const e2e = await run('npx', ['electron', 'tests/e2e/fumaca.cjs'], { remove: ['ELECTRON_RUN_AS_NODE'] });
  record('Teste de fumaça (Electron)', e2e, lastLine(e2e.output, /Tudo certo|falha/));
}

// Relatório.
const width = Math.max(...steps.map((step) => step.etapa.length));
console.log('');
steps.forEach((step) => console.log(`${step.ok ? '✔' : '✖'} ${step.etapa.padEnd(width)}  ${String(step.segundos).padStart(5)} s  ${step.detalhe}`));
const total = steps.reduce((sum, step) => sum + step.segundos, 0);
const failed = steps.filter((step) => !step.ok);
console.log(`\n${failed.length ? `${failed.length} etapa(s) com falha.` : 'Tudo certo.'} Tempo somado das etapas: ${total.toFixed(1)} s.`);
fs.mkdirSync(path.join(root, 'release'), { recursive: true });
fs.writeFileSync(path.join(root, 'release', 'verificacao.json'), JSON.stringify({ em: new Date().toISOString(), etapas: steps }, null, 2));
if (failed.length) {
  failed.forEach((step) => console.log(`\n--- ${step.etapa} (fim da saída) ---\n${outputs.get(step.etapa).trim().split(/\r?\n/).slice(-15).join('\n')}`));
  process.exitCode = 1;
}
