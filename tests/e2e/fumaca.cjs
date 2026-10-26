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
  check(tabs.length === 6, `seis abas na barra (${tabs.join(', ')})`);
  for (const tab of tabs) {
    await clickText(tab);
    await wait(400);
    const text = await js('document.querySelector("main")?.innerText.length || 0');
    check(text > 200, `aba ${tab} mostra conteúdo (${await heading()})`);
  }

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

  check(consoleProblems.length === 0, `console sem erros nem avisos${consoleProblems.length ? `: ${consoleProblems.join(' | ')}` : ''}`);
  console.log(failures.length ? `\n${failures.length} falha(s).` : '\nTudo certo.');
  app.exit(failures.length ? 1 : 0);
}).catch((error) => {
  console.error('O teste parou com erro:', error);
  app.exit(1);
});
