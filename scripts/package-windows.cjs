const fs = require('node:fs/promises');
const path = require('node:path');
const { createPackage } = require('@electron/asar');

// Monta o app portátil do Windows: a distribuição do Electron com o build em resources/app.asar.
async function packageWindows() {
  const projectRoot = path.resolve(__dirname, '..');
  const outputRoot = process.env.LOCALAPPDATA || path.join(projectRoot, 'release');
  const portableDirectory = path.join(outputRoot, 'Visao-Quimica', 'portable');
  const stagingDirectory = path.join(outputRoot, 'Visao-Quimica', '.app-staging');
  const electronDistribution = path.join(projectRoot, 'node_modules', 'electron', 'dist');
  const appArchive = path.join(portableDirectory, 'resources', 'app.asar');
  const electronExecutable = path.join(portableDirectory, 'electron.exe');
  const namedExecutable = path.join(portableDirectory, 'Visao Quimica.exe');
  const { version } = require(path.join(projectRoot, 'package.json'));

  await fs.rm(portableDirectory, { recursive: true, force: true });
  await fs.rm(stagingDirectory, { recursive: true, force: true });
  await fs.mkdir(portableDirectory, { recursive: true });
  await fs.cp(electronDistribution, portableDirectory, { recursive: true });

  await fs.mkdir(path.join(stagingDirectory, 'dist'), { recursive: true });
  await fs.mkdir(path.join(stagingDirectory, 'electron'), { recursive: true });
  await fs.cp(path.join(projectRoot, 'dist'), path.join(stagingDirectory, 'dist'), { recursive: true });
  await fs.cp(path.join(projectRoot, 'electron'), path.join(stagingDirectory, 'electron'), { recursive: true });
  await fs.writeFile(path.join(stagingDirectory, 'package.json'), JSON.stringify({
    name: 'visao-quimica',
    productName: 'Visão Química',
    version,
    main: 'electron/main.cjs',
    type: 'commonjs'
  }, null, 2));

  await createPackage(stagingDirectory, appArchive);
  await fs.rename(electronExecutable, namedExecutable);

  // Ícone e dados do executável (aparecem no Explorer, na barra de tarefas e em Propriedades).
  const { rcedit } = await import('rcedit');
  await rcedit(namedExecutable, {
    icon: path.join(projectRoot, 'assets', 'icon.ico'),
    'file-version': version,
    'product-version': version,
    'version-string': {
      ProductName: 'Visão Química',
      FileDescription: 'Visão Química',
      InternalFilename: 'Visao Quimica',
      OriginalFilename: 'Visao Quimica.exe',
      CompanyName: 'Visão Química',
      LegalCopyright: ''
    }
  });
  await fs.writeFile(path.join(portableDirectory, 'LEIA-ME.txt'), 'Execute Visao Quimica.exe. Mantenha esta pasta completa: ela contem os recursos do aplicativo.\r\n');
  await fs.rm(stagingDirectory, { recursive: true, force: true });

  console.log(`App portatil criado em: ${namedExecutable}`);
}

packageWindows().catch((error) => {
  console.error('Falha ao empacotar Visão Química para Windows:', error);
  process.exitCode = 1;
});
