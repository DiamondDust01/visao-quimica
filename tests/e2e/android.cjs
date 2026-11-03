// Teste do app Android sem emulador: abre os arquivos web que vão dentro do APK
// (android/app/src/main/assets/public, copiados por `cap sync`) num Chromium em modo celular:
// tela de Pixel 7, densidade 2,625, user agent do Android WebView, toques reais e a ponte do
// Capacitor simulada (window.androidBridge), para o app se identificar como Android.
// Não substitui um aparelho ou emulador: a parte nativa (Capacitor, botão voltar) fica de fora.
// Uso: npm run test:android (roda android:sync antes). Com CAPTURAS=pasta, salva capturas.
const { app, BrowserWindow } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..', '..', 'android', 'app', 'src', 'main', 'assets', 'public');
const out = process.env.CAPTURAS || null;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('timeout'); app.exit(1); }, 120000);
app.on('window-all-closed', () => {});
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.json': 'application/json' };
const results = [];
const check = (ok, label) => { results.push(ok); console.log(`${ok ? '✔' : '✖'} ${label}`); };

app.whenReady().then(async () => {
  const server = http.createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    const target = fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(root, 'index.html');
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' });
    fs.createReadStream(target).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://localhost:${server.address().port}/`;
  const W = 412, H = 915;
  const win = new BrowserWindow({ width: W, height: H, useContentSize: true, show: false, webPreferences: { sandbox: true, offscreen: true } });
  const errors = [];
  win.webContents.on('console-message', (e) => { if (e.level === 'error' || e.level === 'warning') errors.push(e.message.slice(0, 200)); });
  win.webContents.setUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UQ1A.240205.004; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/132.0.0.0 Mobile Safari/537.36');
  // Ligar o depurador numa janela ainda sem página derruba o Electron: carrega uma página vazia antes.
  await win.loadURL('about:blank');
  const dbg = win.webContents.debugger;
  dbg.attach('1.3');
  await dbg.sendCommand('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2.625, mobile: true });
  await dbg.sendCommand('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await dbg.sendCommand('Page.enable');
  await dbg.sendCommand('Page.addScriptToEvaluateOnNewDocument', { source: 'window.androidBridge = { postMessage() {} };' });
  const js = (code) => win.webContents.executeJavaScript(code);
  // Toque de verdade (touchStart/touchEnd) no centro do elemento.
  const tap = async (selector) => {
    const box = await js(`(() => { const el = ${selector}; if (!el) return null; const fixo = getComputedStyle(el.closest('nav, header') || el).position === 'fixed' || el.closest('header'); if (!fixo) { const r0 = el.getBoundingClientRect(); window.scrollTo(0, window.scrollY + r0.top - window.innerHeight / 2); } const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    if (!box) return false;
    await wait(150);
    const point = await js(`(() => { const r = (${selector}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    await dbg.sendCommand('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: point.x, y: point.y }] });
    await dbg.sendCommand('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await wait(350);
    return true;
  };
  const byText = (text, scope = 'document') => `[...${scope}.querySelectorAll('button')].find((b) => b.innerText.trim() === ${JSON.stringify(text)} && b.offsetParent)`;
  const shot = async (name) => { if (!out) return; await wait(400); const image = await new Promise((resolve) => { win.webContents.once('paint', async () => resolve(await win.webContents.capturePage())); win.webContents.invalidate(); }); fs.writeFileSync(path.join(out, `${name}.png`), image.toPNG()); };

  await win.loadURL(url);
  await wait(1500);
  errors.length = 0; // avisos da página vazia inicial não contam
  check(await js(`document.documentElement.classList.contains('android-app')`), 'o app se identifica como Android (classe android-app)');
  check(await js(`Boolean(document.querySelector('meta[http-equiv="Content-Security-Policy"]'))`), 'CSP presente nos arquivos do APK');
  check(await js(`window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0`), 'tela de toque emulada');
  await tap(`document.querySelector('label[for="onboarding-etapa-em-1"]')`);
  await tap(byText('Continuar'));
  const bottomNav = await js(`(() => { const nav = [...document.querySelectorAll('nav')].find((n) => n.className.includes('bottom-0') && getComputedStyle(n).display !== 'none'); return nav ? nav.querySelectorAll('button').length : 0; })()`);
  check(bottomNav === 5, `barra inferior do celular com 5 botões (${bottomNav})`);
  await shot('android-inicio');
  for (const label of ['Trilhas', 'Prática', 'Mentor', 'Ajuda']) {
    await tap(`[...document.querySelectorAll('nav.fixed button')].find((b) => b.innerText.trim() === ${JSON.stringify(label)})`);
    const h1 = await js(`document.querySelector('main h1')?.innerText || ''`);
    check(Boolean(h1), `toque em ${label} abre ${h1}`);
  }
  await tap(`document.querySelector('button[aria-label="Sobre o projeto e créditos"]')`);
  check(await js(`(() => {
    const main = document.querySelector('main');
    const links = [...main.querySelectorAll('a')].map((link) => link.href);
    return links.includes('https://github.com/DiamondDust01/visao-quimica') &&
      links.includes('https://www.ifpi.edu.br/') &&
      [...main.querySelectorAll('button')].some((button) => button.innerText.includes('Para professores'));
  })()`), 'ícone do cabeçalho abre créditos e links para desenvolvedores, IFPI e professores');
  await tap(byText('Para professores: trilhas de apoio às aulas'));
  check(await js(`document.querySelector('main h1')?.innerText === 'Fundamentos'`), 'atalho para professores abre Fundamentos');
  await tap(`[...document.querySelectorAll('nav.fixed button')].find((b) => b.innerText.trim() === 'Trilhas')`);
  await js('window.scrollTo(0, 2000)'); await wait(300);
  const header = await js(`(() => ({ topo: Math.round(document.querySelector('header').getBoundingClientRect().top), rolagem: Math.round(scrollY) }))()`);
  check(header.rolagem > 0 && header.topo === 0, `barra superior fixa ao rolar no celular (rolagem ${header.rolagem}px)`);
  check(await js(`document.documentElement.scrollWidth <= window.innerWidth`), 'sem rolagem horizontal');

  // Uma questão respondida por toque.
  await tap(`[...document.querySelectorAll('nav.fixed button')].find((b) => b.innerText.trim() === 'Prática')`);
  // O tema fica dentro da área recolhida: abre a área antes, como faria quem usa o app.
  await tap(`document.querySelector('#selecao-fund-densidade').closest('details').querySelector('summary')`);
  await tap(`document.querySelector('label[for="selecao-fund-densidade"]') || document.querySelector('#selecao-fund-densidade')`);
  await tap(byText('Começar sessão'));
  await tap(`document.querySelector('main form label:has(input[type=radio])') || document.querySelector('main form input[type=text], main form input[inputmode=decimal]')`);
  await js(`(() => { const i = document.querySelector('main form input[inputmode=decimal]'); if (i && !i.value) { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, '2,7'); i.dispatchEvent(new Event('input', { bubbles: true })); } const u = document.querySelector('main form input[list]'); if (u && !u.value) { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(u, 'g'); u.dispatchEvent(new Event('input', { bubbles: true })); } })()`);
  await tap(byText('Responder'));
  check(/Correto|Incorreto/.test(await js('document.querySelector("main").innerText')), 'questão respondida por toque e corrigida');
  await shot('android-questao');
  await tap(byText('Encerrar sessão'));

  // Ferramentas, estrutura e backup local.
  await tap(`document.querySelector('button[aria-label^="Ferramentas"]')`);
  await tap(byText('Estruturas'));
  await tap(byText('Cafeína'));
  await wait(800);
  check(await js(`Boolean(document.querySelector('main figure svg:not(.hidden)')) && document.querySelector('main').innerText.includes('194,19')`), 'estrutura da cafeína desenhada, com massa molar');
  await shot('android-estrutura');
  await tap(`document.querySelector('button[aria-label="Perfil"]')`);
  const perfil = await js(`document.querySelector('main').innerText`);
  check(perfil.includes('Backup local') && perfil.toLowerCase().includes('não há conta nem envio automático'), 'Perfil: progresso local e sem sincronização de conta');
  check(perfil.includes('Lembrete de backup') && perfil.includes('Não envia e-mail'), 'Perfil: lembrete manual sem envio em segundo plano');
  await shot('android-backup');

  console.log('erros/avisos no console:', errors.length ? errors : 'nenhum');
  check(errors.length === 0, 'console sem erros nem avisos');
  server.close();
  app.exit(results.every(Boolean) ? 0 : 1);
}).catch((error) => { console.error(error); app.exit(1); });
