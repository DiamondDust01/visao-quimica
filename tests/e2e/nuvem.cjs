// Conta por código entre dois aparelhos, nova tentativa de login e pareamento P2P entre vários
// aparelhos numa sala, com os emuladores do Firebase. Cada "aparelho" é uma sessão separada do
// Electron (armazenamento e login anônimo próprios). Rode com: npm run test:nuvem
// (scripts/test-nuvem.mjs sobe os emuladores e um servidor do app ligado a eles).
// Com CAPTURAS=pasta, salva capturas de tela.
const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const out = process.env.CAPTURAS || null;
const base = process.env.BASE_URL;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('timeout'); app.exit(1); }, 300000);

const errors = [];
const results = [];
const check = (ok, label) => { results.push([ok, label]); console.log(`${ok ? '✔' : '✖'} ${label}`); };

const open = async (name, url, perfil = 'em-3') => {
  const win = new BrowserWindow({ width: 1100, height: 1000, show: false, webPreferences: { sandbox: true, offscreen: true, partition: `nuvem-${name}-${Date.now()}` } });
  win.webContents.on('console-message', (e) => { if (e.level === 'error') errors.push(`[${name}] ${e.message.slice(0, 200)}`); });
  const js = (code) => win.webContents.executeJavaScript(code).catch((error) => { console.log(`FALHOU [${name}]:`, code.slice(0, 140), error.message); throw error; });
  await win.loadURL(url);
  if (perfil) {
    await js(`localStorage.setItem('visao-quimica:perfil', JSON.stringify({ etapaId: '${perfil}', atualizadoEm: '2026-10-26T00:00:00.000Z' }))`);
    await new Promise((resolve) => { win.webContents.once('did-finish-load', resolve); win.webContents.reload(); });
  }
  await wait(1500);
  const h = {
    win,
    js,
    clickText: (text) => js(`(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim() === ${JSON.stringify(text)} && !x.disabled); if (!b) return false; b.click(); return true; })()`),
    text: () => js('document.querySelector("main")?.innerText || ""'),
    fill: (selector, value) => js(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`),
    store: (key) => js(`JSON.parse(localStorage.getItem('visao-quimica:${key}') || 'null')`),
    shot: async (file) => { if (!out) return; const image = await new Promise((resolve) => { win.webContents.once('paint', (e, d, img) => resolve(img)); win.webContents.invalidate(); }); fs.writeFileSync(path.join(out, `${file}.png`), image.toPNG()); }
  };
  h.waitFor = async (code, label, tries = 40) => {
    for (let i = 0; i < tries; i += 1) {
      if (await js(code)) return true;
      await wait(300);
    }
    console.log(`   (não apareceu: ${label})`);
    return false;
  };
  h.perfil = async () => { await js(`document.querySelector('button[aria-label="Perfil"]').click()`); await wait(400); };
  // Responde a primeira questão de uma sessão de Prática no subtema pedido.
  h.praticar = async (subtemaId) => {
    await h.clickText('Prática'); await wait(400);
    await js(`document.querySelector('#selecao-${subtemaId}').click()`);
    await h.clickText('Começar sessão'); await wait(800);
    await js(`document.querySelector('main form input[type=radio]')?.click()`);
    await js(`(() => { const i = document.querySelector('main form input[type=text], main form input[inputmode=decimal]'); if (i) { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, '1'); i.dispatchEvent(new Event('input', { bubbles: true })); } })()`);
    await h.clickText('Responder'); await wait(400);
    await h.clickText('Encerrar sessão'); await wait(300);
  };
  return h;
};

const firestoreDocs = async (pathSuffix) => {
  const response = await fetch(`http://127.0.0.1:8180/v1/projects/demo-visao-quimica/databases/(default)/documents/artifacts/visao-quimica/${pathSuffix}`, { headers: { Authorization: 'Bearer owner' } });
  return response.json();
};

app.on('window-all-closed', () => {});
app.whenReady().then(async () => {
  await fetch('http://127.0.0.1:8180/emulator/v1/projects/demo-visao-quimica/databases/(default)/documents', { method: 'DELETE' });
  // ---------- Conta entre dois aparelhos ----------
  const a = await open('A', base);
  await a.perfil();
  check(await a.waitFor(`[...document.querySelectorAll('button')].some((b) => b.innerText.trim() === 'Criar conta')`, 'botão criar conta'), 'aparelho A: Perfil oferece criar conta');
  await a.clickText('Criar conta');
  await a.waitFor(`Boolean(document.querySelector('[role=alert] p.font-mono'))`, 'código novo');
  const code = await a.js(`document.querySelector('[role=alert] p.font-mono').innerText`);
  check(/^[0-9A-Z]{5}(-[0-9A-Z]{5}){3}$/.test(code), `aparelho A: código gerado (${code.slice(0, 5)}-…)`);
  await a.shot('f8-codigo');
  await a.clickText('Já guardei o código');
  await a.praticar('org-polimeros-reciclagem');
  await a.perfil();
  check(await a.waitFor(`document.querySelector('main').innerText.includes('Progresso salvo na nuvem')`, 'sincronizado', 40), 'aparelho A: resposta enviada à nuvem sozinha');
  const progressA = await a.store('progresso');
  check(Boolean(progressA['org-polimeros-reciclagem']), 'aparelho A: resposta registrada no progresso');
  const pointsA = await a.store('pontos');

  const contas = await firestoreDocs('contas');
  const docs = contas.documents || [];
  const fields = docs[0] ? Object.keys(docs[0].fields).sort().join(',') : '';
  const raw = JSON.stringify(docs);
  check(docs.length === 1 && fields === 'atualizadoEm,dados,iv,versao', `nuvem: 1 documento só com campos cifrados (${fields})`);
  check(!raw.includes('org-polimeros-reciclagem') && !raw.includes('em-3') && !raw.includes(code.replace(/-/g, '')), 'nuvem: sem subtema, etapa ou código legíveis');
  check(/\/contas\/[0-9a-f]{64}$/.test(docs[0]?.name || ''), 'nuvem: endereço é um hash de 64 caracteres');

  const b = await open('B', base, 'ef-9');
  await b.perfil();
  await b.waitFor(`Boolean(document.querySelector('input[placeholder^="XXXXX"]'))`, 'campo de código');
  await b.fill('input[placeholder^="XXXXX"]', code.toLowerCase().replace(/-/g, ' '));
  await b.clickText('Entrar');
  check(await b.waitFor(`document.querySelector('main').innerText.includes('progresso da conta foi juntado')`, 'entrou'), 'aparelho B: entrou com o código (digitado em minúsculas e com espaços)');
  const progressB = await b.store('progresso');
  check(JSON.stringify(progressB) === JSON.stringify(progressA), 'aparelho B: recebeu o progresso do aparelho A');
  check(await b.store('pontos') === pointsA, `aparelho B: mesmos pontos (${pointsA})`);
  check((await b.store('perfil'))?.etapaId === 'ef-9', 'aparelho B: perfil escolhido por último (o de B) prevalece');

  await b.praticar('fund-densidade');
  await b.perfil();
  await b.waitFor(`document.querySelector('main').innerText.includes('Progresso salvo na nuvem')`, 'B sincronizado');
  await wait(3000);
  await a.clickText('Sincronizar agora');
  await a.waitFor(`Boolean(JSON.parse(localStorage.getItem('visao-quimica:progresso') || '{}')['fund-densidade'])`, 'A recebeu de B');
  const progressA2 = await a.store('progresso');
  check(Boolean(progressA2['fund-densidade']) && Boolean(progressA2['org-polimeros-reciclagem']), 'aparelho A: recebeu a resposta feita no aparelho B, sem perder a sua');
  check(progressA2['org-polimeros-reciclagem'].respondidas === 1, 'aparelho A: nada contado duas vezes');

  const c = await open('C', base);
  await c.perfil();
  await c.waitFor(`Boolean(document.querySelector('input[placeholder^="XXXXX"]'))`, 'campo C');
  await c.fill('input[placeholder^="XXXXX"]', code.slice(0, -1) + (code.endsWith('A') ? 'B' : 'A'));
  await c.clickText('Entrar');
  check(await c.waitFor(`document.querySelector('main').innerText.includes('Código inválido')`, 'erro'), 'aparelho C: código com erro de digitação é recusado');
  const fake = await c.js(`(async () => { const m = await import('/src/domain/conta.js'); return m.gerarCodigo(); })()`);
  await c.fill('input[placeholder^="XXXXX"]', fake);
  await c.clickText('Entrar');
  check(await c.waitFor(`document.querySelector('main').innerText.includes('Nenhum progresso salvo')`, 'sem conta'), 'aparelho C: código válido sem conta avisa e não entra');

  await b.clickText('Sair desta conta');
  check(await b.store('conta') === null && Boolean((await b.store('progresso'))['fund-densidade']), 'aparelho B: sair esquece o código e mantém o progresso');
  await a.clickText('Apagar conta da nuvem'); await wait(200);
  await a.clickText('Sim, apagar da nuvem');
  await a.waitFor(`document.querySelector('main').innerText.includes('Conta apagada da nuvem')`, 'apagada');
  check(((await firestoreDocs('contas')).documents || []).length === 0, 'aparelho A: apagar conta remove o documento da nuvem');
  await a.shot('f8-perfil-conta');

  // ---------- Login volta sozinho depois de uma falha de rede ----------
  {
    const { session } = require('electron');
    const partition = `nuvem-D-${Date.now()}`;
    let blocked = true;
    session.fromPartition(partition).webRequest.onBeforeRequest({ urls: ['http://127.0.0.1:9199/*'] }, (details, callback) => callback({ cancel: blocked }));
    const win = new BrowserWindow({ show: false, webPreferences: { sandbox: true, offscreen: true, partition } });
    await win.loadURL(base);
    await win.webContents.executeJavaScript(`localStorage.setItem('visao-quimica:perfil', JSON.stringify({ etapaId: 'em-1', atualizadoEm: 'x' })); document.querySelector('button[aria-label="Perfil"]')?.click(); true`);
    await new Promise((resolve) => { win.webContents.once('did-finish-load', resolve); win.webContents.reload(); });
    await wait(2500);
    await win.webContents.executeJavaScript(`document.querySelector('button[aria-label="Perfil"]').click()`);
    await wait(500);
    const semRede = await win.webContents.executeJavaScript(`[...document.querySelectorAll('button')].some((b) => b.innerText.trim() === 'Criar conta')`);
    blocked = false;
    let voltou = false;
    for (let i = 0; i < 40 && !voltou; i += 1) {
      await wait(500);
      voltou = await win.webContents.executeJavaScript(`[...document.querySelectorAll('button')].some((b) => b.innerText.trim() === 'Criar conta')`);
    }
    check(!semRede && voltou, 'login: sem acesso ao servidor a conta espera; quando a rede volta, conecta sozinho');
    win.destroy();
  }

  // ---------- Pareamento entre vários aparelhos ----------
  const prof = await open('prof', base, 'em-1');
  await prof.clickText('Desafios em sala');
  await prof.waitFor(`[...document.querySelectorAll('button')].some((x) => x.innerText.trim() === 'Criar sala')`, 'salas');
  await prof.clickText('Criar sala'); await wait(400);
  await prof.js(`document.querySelector('#selecao-fund-densidade').click(); document.querySelector('#selecao-tab-periodos-grupos').click();`);
  await prof.clickText('Criar sala');
  await prof.waitFor(`Boolean(document.querySelector('main p.font-mono'))`, 'código da sala');
  const room = await prof.js(`document.querySelector('main p.font-mono').innerText`);
  const students = [];
  for (const name of ['S1', 'S2', 'S3']) {
    const s = await open(name, `${base}?sala=${room}`, null);
    await s.waitFor(`[...document.querySelectorAll('button')].some((x) => x.innerText.trim() === 'Entrar na sala')`, `entrada ${name}`);
    await s.clickText('Entrar na sala');
    students.push(s);
  }
  check(await prof.waitFor(`document.querySelectorAll('[aria-label="Participantes na sala"] li').length === 3`, 'três participantes'), 'sala: três aparelhos de alunos entraram');
  await prof.clickText('Iniciar desafio');
  for (const s of students) await s.waitFor(`Boolean(document.querySelector('main form'))`, 'questões');
  // Dá tempo para a sinalização e algumas medições de ping.
  let summaries = [];
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await wait(1000);
    summaries = await Promise.all(students.map((s) => s.js(`(() => { const d = document.querySelector('details summary'); const rows = [...document.querySelectorAll('details li')].map((li) => li.innerText.replace(/\\s+/g, ' ')); return { resumo: d?.innerText || '', pares: rows }; })()`)));
    if (summaries.every((item) => /\d+ ms/.test(item.resumo))) break;
  }
  summaries.forEach((item, index) => console.log(`   aluno ${index + 1}: ${item.resumo} | ${item.pares.join(' ; ')}`));
  check(summaries.every((item) => /Ping P2P: \d+ ms/.test(item.resumo)), 'pareamento: os três alunos mediram ping por conexão direta');
  const peerCounts = await Promise.all(students.map((s) => s.js(`document.querySelectorAll('details li').length`)));
  check(peerCounts.every((count) => count >= 2), `pareamento: cada aluno vê os outros dois aparelhos (${peerCounts.join(', ')})`);
  await students[0].js(`document.querySelector('details').open = true`);
  await students[0].shot('f8-pareamento');
  const signals = await firestoreDocs(`salas/${room}/sinais`);
  check((signals.documents || []).length >= 3, `pareamento: ${(signals.documents || []).length} canais de sinalização (um por par de alunos)`);

  // Um aluno sai: os outros percebem.
  students[2].win.destroy();
  await wait(8000);
  const after = await students[0].js(`document.querySelector('details summary')?.innerText || ''`);
  console.log(`   aluno 1 depois que o aluno 3 fechou o app: ${after}`);

  console.log('\nerros no console:', errors.length ? errors : 'nenhum');
  const failed = results.filter(([ok]) => !ok).length;
  console.log(failed ? `${failed} falha(s).` : 'Tudo certo.');
  app.exit(failed ? 1 : 0);
}).catch((error) => { console.error(error); app.exit(1); });
