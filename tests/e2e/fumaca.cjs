// Teste de fumaça do build: abre dist/index.html no Electron (sem janela visível), escolhe uma
// etapa, passa por todas as abas, responde uma questão, usa as ferramentas e falha se aparecer
// erro ou aviso no console. Uso: npm run test:e2e
const { app, BrowserWindow } = require('electron');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..', '..');
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const failures = [];
const check = (condition, message) => {
  console.log(`${condition ? '✔' : '✖'} ${message}`);
  if (!condition) failures.push(message);
};

setTimeout(() => {
  console.error('Tempo esgotado.');
  app.exit(1);
}, 90000);
app.on('window-all-closed', () => {});

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1280, height: 900, show: false, webPreferences: { sandbox: true, offscreen: true } });
  const consoleProblems = [];
  win.webContents.on('console-message', (event) => {
    if (event.level === 'error' || event.level === 'warning') consoleProblems.push(event.message);
  });
  const js = (code) => win.webContents.executeJavaScript(code);
  const clickText = (text) => js(`(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === ${JSON.stringify(text)} && x.offsetParent); if (!b) return false; b.click(); return true; })()`);
  const setInput = (selector, value) => js(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', { bubbles: true })); })()`);
  const heading = () => js('document.querySelector("main h1")?.innerText || ""');

  await win.loadFile(path.join(projectRoot, 'dist', 'index.html'));
  await js('localStorage.clear()');
  await new Promise((resolve) => { win.webContents.once('did-finish-load', resolve); win.webContents.reload(); });
  await wait(800);

  check(await js('Boolean(document.querySelector(\'meta[http-equiv="Content-Security-Policy"]\'))'), 'build com política de segurança de conteúdo');
  check(/Boas-vindas/.test(await heading()) && await js(`Boolean(document.querySelector('label[for="onboarding-etapa-em-3"]'))`), 'primeiro uso abre a escolha de etapa');
  await js(`document.querySelector('label[for="onboarding-etapa-em-3"]').click()`);
  await clickText('Continuar');
  await wait(400);

  const tabs = await js(`[...document.querySelectorAll('nav button')].filter((b) => b.offsetParent).map((b) => b.innerText.trim())`);
  check(tabs.length === 5, `cinco abas na barra (${tabs.join(', ')})`);
  for (const tab of tabs) {
    await clickText(tab);
    await wait(400);
    const text = await js('document.querySelector("main")?.innerText.length || 0');
    check(text > 200, `aba ${tab} mostra conteúdo (${await heading()})`);
  }

  await js(`document.querySelector('button[aria-label="Sobre o projeto e créditos"]').click()`);
  const credits = await js(`(() => {
    const main = document.querySelector('main');
    const links = [...main.querySelectorAll('a')].map((link) => link.href);
    return links.includes('https://github.com/DiamondDust01/visao-quimica') &&
      links.includes('https://www.ifpi.edu.br/') &&
      [...main.querySelectorAll('button')].some((button) => button.innerText.includes('Para professores'));
  })()`);
  check(credits, 'ícone do cabeçalho abre os créditos e os links para desenvolvedores, IFPI e professores');
  await clickText('Para professores: trilhas de apoio às aulas');
  await wait(300);
  check(await js(`document.querySelector('nav[aria-label="Módulos"] button[aria-current="page"]')?.innerText === 'Fundamentos'`), 'atalho para professores abre Fundamentos');

  await clickText('Fundamentos');
  await wait(300);
  await js('window.scrollTo(0, 1500)');
  await wait(200);
  const header = await js(`(() => { const box = document.querySelector('header').getBoundingClientRect(); return { top: Math.round(box.top), rolagem: Math.round(window.scrollY) }; })()`);
  check(header.rolagem > 0 && header.top === 0, `barra superior fixa ao rolar (rolagem ${header.rolagem}px, topo da barra ${header.top}px)`);

  await clickText('Prática');
  await wait(300);
  await js(`document.querySelector('#selecao-org-nomenclatura-funcoes').click()`);
  await clickText('Começar sessão');
  await wait(1200);
  check(await js(`Boolean(document.querySelector('main figure svg:not(.hidden)'))`), 'questão de Orgânica mostra a estrutura (SMILES)');
  await setInput('main form input[type=text]', 'resposta de teste');
  await clickText('Responder');
  await wait(400);
  check(/Incorreto|Correto/.test(await js('document.querySelector("main").innerText')), 'questão corrigida com retorno');
  await clickText('Encerrar sessão');
  await wait(300);

  await js(`document.querySelector('button[aria-label^="Ferramentas"]').click()`);
  await wait(300);
  check(await js(`document.querySelectorAll('[role=gridcell]').length`) === 118, 'tabela periódica com 118 elementos');
  await clickText('Massa molar');
  await wait(200);
  await setInput('main input[type=text]', 'H2O');
  await wait(200);
  check((await js(`document.querySelector('main strong.text-2xl')?.innerText || ''`)).startsWith('18,01'), 'massa molar da água');
  await clickText('Estruturas');
  await clickText('Cafeína');
  await wait(1000);
  check(/194,19/.test(await js('document.querySelector("main").innerText')), 'estrutura da cafeína com massa molar');

  // Backup em arquivo: exporta (download de verdade) e importa um arquivo com outro progresso.
  await js(`document.querySelector('button[aria-label="Perfil"]').click()`);
  await wait(300);
  const profileText = await js(`document.querySelector('main').innerText`);
  check(profileText.toLowerCase().includes('não há conta nem envio automático') && profileText.includes('Lembrete de backup'), 'Perfil: backup local e lembrete configurável');
  await js(`(() => { const select = document.querySelector('select[aria-label="Frequência do lembrete de backup"]'); select.value = 'semanal'; select.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await wait(100);
  check((await js(`JSON.parse(localStorage.getItem('visao-quimica:lembrete-backup') || '{}').frequencia`)) === 'semanal', 'lembrete semanal persistido no aparelho');
  const backupPath = path.join(require('node:os').tmpdir(), `visao-quimica-backup-${Date.now()}.json`);
  const downloaded = new Promise((resolve) => {
    win.webContents.session.once('will-download', (event, item) => {
      item.setSavePath(backupPath);
      item.once('done', (doneEvent, state) => resolve(state));
    });
  });
  await clickText('Exportar progresso');
  const state = await Promise.race([downloaded, wait(5000).then(() => 'tempo esgotado')]);
  const exported = state === 'completed' ? JSON.parse(require('node:fs').readFileSync(backupPath, 'utf8')) : null;
  check(Boolean(exported) && exported.versao === 1 && Boolean(exported.progresso['org-nomenclatura-funcoes']), 'backup exportado em arquivo com o progresso da questão respondida');
  const incoming = JSON.stringify({ ...exported, progresso: { ...exported.progresso, 'fund-densidade': { respondidas: 2, acertos: 2, atualizadoEm: '2026-10-01T00:00:00.000Z' } } });
  await js(`(() => { const input = document.querySelector('main input[type=file]'); const data = new DataTransfer(); data.items.add(new File([${JSON.stringify(incoming)}], 'backup.json', { type: 'application/json' })); input.files = data.files; input.dispatchEvent(new Event('change', { bubbles: true })); })()`);
  await wait(500);
  const merged = await js(`JSON.parse(localStorage.getItem('visao-quimica:progresso') || '{}')`);
  check(Boolean(merged['fund-densidade']) && Boolean(merged['org-nomenclatura-funcoes']), 'backup importado e juntado ao progresso do aparelho');
  require('node:fs').rmSync(backupPath, { force: true });

  const sharedPath = path.join(require('node:os').tmpdir(), `visao-quimica-share-${Date.now()}.json`);
  const sharedDownload = new Promise((resolve) => {
    win.webContents.session.once('will-download', (event, item) => {
      item.setSavePath(sharedPath);
      item.once('done', (doneEvent, downloadState) => resolve(downloadState));
    });
  });
  await clickText('Compartilhar backup');
  const shareDownloadState = await Promise.race([sharedDownload, wait(5000).then(() => 'tempo esgotado')]);
  const sharedFile = shareDownloadState === 'completed' ? JSON.parse(require('node:fs').readFileSync(sharedPath, 'utf8')) : null;
  check(Boolean(sharedFile) && Boolean(sharedFile.progresso['org-nomenclatura-funcoes']), 'sem Web Share, compartilhar baixa um arquivo JSON para anexar manualmente');
  require('node:fs').rmSync(sharedPath, { force: true });

  await js(`Object.defineProperty(navigator, 'share', { configurable: true, value: async (data) => { window.__sharedFileName = data.files[0].name; } }); Object.defineProperty(navigator, 'canShare', { configurable: true, value: (data) => data.files?.length === 1 });`);
  await clickText('Compartilhar backup');
  await wait(100);
  check(await js(`Boolean(window.__sharedFileName) && document.querySelector('main').innerText.includes('Compartilhamento concluído')`), 'com Web Share, compartilha o arquivo e confirma a conclusão');

  check(consoleProblems.length === 0, `console sem erros nem avisos${consoleProblems.length ? `: ${consoleProblems.join(' | ')}` : ''}`);
  console.log(failures.length ? `\n${failures.length} falha(s).` : '\nTudo certo.');
  app.exit(failures.length ? 1 : 0);
}).catch((error) => {
  console.error('O teste parou com erro:', error);
  app.exit(1);
});
