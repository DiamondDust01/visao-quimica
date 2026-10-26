const fs = require('node:fs/promises');
const { existsSync, readdirSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');

// Gera os pacotes de distribuição do Windows a partir do app portátil já montado
// (npm run app:windows:package):
// - release/windows/Visao-Quimica-Setup-<versão>.exe: instalador NSIS;
// - release/windows/Visao-Quimica-<versão>-Windows-x64.7z: app portátil compactado.
// Precisa do NSIS (makensis) e do 7-Zip (7z ou 7za). Os caminhos podem vir de MAKENSIS e
// SEVEN_ZIP; sem eles, o script procura nas pastas de instalação comuns.

const localAppData = process.env.LOCALAPPDATA || '';
const builderCache = path.join(localAppData, 'electron-builder', 'Cache');

function findInCache(prefix, relative) {
  const base = path.join(builderCache, prefix);
  if (!existsSync(base)) return null;
  for (const entry of readdirSync(base)) {
    const candidate = path.join(base, entry, relative);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function findTool(envName, candidates, label) {
  const fromEnv = process.env[envName];
  if (fromEnv) {
    if (!existsSync(fromEnv)) throw new Error(`${envName} aponta para um arquivo que não existe: ${fromEnv}`);
    return fromEnv;
  }
  const found = candidates.find((candidate) => candidate && existsSync(candidate));
  if (!found) throw new Error(`${label} não encontrado. Instale-o ou defina ${envName} com o caminho do executável.`);
  return found;
}

function run(tool, args) {
  const result = spawnSync(tool, args, { stdio: 'inherit' });
  if (result.error) throw new Error(`Falha ao executar ${path.basename(tool)}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${path.basename(tool)} terminou com código ${result.status}.`);
}

async function listFiles(dir, base = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  const dirs = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await listFiles(full, base);
      files.push(...nested.files);
      dirs.push(...nested.dirs, path.relative(base, full));
    } else {
      files.push(path.relative(base, full));
    }
  }
  return { files, dirs };
}

async function sha256(file) {
  const hash = crypto.createHash('sha256');
  const handle = await fs.open(file);
  for await (const chunk of handle.createReadStream()) hash.update(chunk);
  return hash.digest('hex').toUpperCase();
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const { version } = require(path.join(projectRoot, 'package.json'));
  const portableDirectory = path.join(localAppData || path.join(projectRoot, 'release'), 'Visao-Quimica', 'portable');
  const outputDirectory = path.join(projectRoot, 'release', 'windows');
  const installerPath = path.join(outputDirectory, `Visao-Quimica-Setup-${version}.exe`);
  const archivePath = path.join(outputDirectory, `Visao-Quimica-${version}-Windows-x64.7z`);
  const fileListPath = path.join(outputDirectory, 'arquivos-instalados.nsh');

  if (!existsSync(path.join(portableDirectory, 'Visao Quimica.exe'))) {
    throw new Error(`App portátil não encontrado em ${portableDirectory}. Rode antes: npm run app:windows:package`);
  }

  const makensis = findTool('MAKENSIS', [
    'C:\\Program Files (x86)\\NSIS\\makensis.exe',
    'C:\\Program Files\\NSIS\\makensis.exe',
    findInCache('nsis-3.0.4.1', 'makensis.exe')
  ], 'NSIS (makensis)');
  const sevenZip = findTool('SEVEN_ZIP', [
    'C:\\Program Files\\7-Zip\\7z.exe',
    'C:\\Program Files (x86)\\7-Zip\\7z.exe',
    findInCache('7zip@1.0.0', path.join('bin', '7za.exe'))
  ], '7-Zip');

  await fs.mkdir(outputDirectory, { recursive: true });
  await fs.rm(installerPath, { force: true });
  await fs.rm(archivePath, { force: true });

  // Lista para o desinstalador: arquivos primeiro, depois as pastas, das mais fundas às rasas.
  const { files, dirs } = await listFiles(portableDirectory);
  const lines = [
    ...files.map((file) => `  Delete "$INSTDIR\\${file}"`),
    ...dirs.sort((a, b) => b.length - a.length).map((dir) => `  RMDir "$INSTDIR\\${dir}"`)
  ];
  await fs.writeFile(fileListPath, `${lines.join('\r\n')}\r\n`, 'utf8');

  run(makensis, [
    '-WX',
    '-INPUTCHARSET', 'UTF8',
    `-DAPP_DIR=${portableDirectory}`,
    `-DOUTPUT_FILE=${installerPath}`,
    `-DPRODUCT_VERSION=${version}`,
    `-DICON_FILE=${path.join(projectRoot, 'assets', 'icon.ico')}`,
    `-DFILE_LIST=${fileListPath}`,
    path.join(projectRoot, 'scripts', 'windows-installer.nsi')
  ]);
  await fs.rm(fileListPath, { force: true });

  // A pasta dentro do .7z leva o nome do app, para não espalhar arquivos ao extrair.
  const archiveRoot = path.join(outputDirectory, 'Visao Quimica');
  await fs.rm(archiveRoot, { recursive: true, force: true });
  await fs.cp(portableDirectory, archiveRoot, { recursive: true });
  run(sevenZip, ['a', '-t7z', '-mx=9', '-mmt=on', archivePath, archiveRoot]);
  await fs.rm(archiveRoot, { recursive: true, force: true });

  for (const file of [installerPath, archivePath]) {
    const { size } = await fs.stat(file);
    console.log(`${path.basename(file)}: ${size} bytes, SHA-256 ${await sha256(file)}`);
  }
  console.log('Os pacotes não têm assinatura digital. Teste o instalador numa pasta ou máquina de teste antes de distribuir.');
}

main().catch((error) => {
  console.error('Falha ao gerar os pacotes do Windows:', error.message || error);
  process.exitCode = 1;
});
