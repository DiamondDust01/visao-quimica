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
  // Abre o menu "Mais" (o botão visível) e escolhe um item.
  const openMore = () => js(`[...document.querySelectorAll('[data-guia="btn-mais"]')].find((b) => b.offsetParent).click()`);
  const menu = async (item) => {
    await openMore();
    await wait(200);
    await js(`document.querySelector('[data-menu-item="${item}"]').click()`);
    await wait(400);
  };

  await win.loadFile(path.join(projectRoot, 'dist', 'index.html'));
  await js('localStorage.clear()');
  await new Promise((resolve) => { win.webContents.once('did-finish-load', resolve); win.webContents.reload(); });
  await wait(800);

  check(await js('Boolean(document.querySelector(\'meta[http-equiv="Content-Security-Policy"]\'))'), 'build com política de segurança de conteúdo');
  const caminhos = await js(`[...document.querySelectorAll('[data-caminho]')].map((b) => b.dataset.caminho)`);
  check(/Boas-vindas/.test(await heading()) && caminhos.join(',') === 'trilha,livre,rapido', `primeiro uso pergunta como estudar, com três caminhos (${caminhos.join(', ')})`);
  const firstUseBar = await js(`[...document.querySelectorAll('header button')].filter((b) => b.offsetParent).map((b) => b.innerText.trim())`);
  check(['Início', 'Trilha', 'Prática', 'Mais'].every((label) => firstUseBar.includes(label)), `barra superior completa já no primeiro uso (${firstUseBar.join(', ')})`);
  check(!firstUseBar.includes('Laboratório do Mentor'), 'Laboratório do Mentor oculto antes de haver o que revisar');
  await openMore();
  await wait(300);
  check(await js(`document.querySelector('[data-menu-item="guia"]')?.disabled === true && document.querySelector('[data-menu-item="tabela"]')?.disabled === false`), 'sem etapa, o "Mais" abre as ferramentas e bloqueia só o guia');
  await js(`document.querySelector('[data-menu-item="tabela"]').click()`);
  await wait(400);
  check(/Ferramentas/.test(await heading()), 'sem etapa, a tabela periódica abre pelo "Mais"');
  await clickText('Início');
  await wait(400);
  check(/Boas-vindas/.test(await heading()), 'sem etapa, as abas de estudo levam à escolha de etapa');
  await js(`document.querySelector('[data-caminho="rapido"]').click()`);
  await wait(300);
  const quickTopics = await js(`[...document.querySelectorAll('[data-tema-rapido]')].map((b) => b.dataset.temaRapido)`);
  check(quickTopics.length === 6 && quickTopics.includes('endo-exo'), `temas rápidos na tela de boas-vindas (${quickTopics.join(', ')})`);
  await js(`document.querySelector('[data-tema-rapido="endo-exo"]').click()`);
  await wait(500);
  check(await js(`/Questão 1 de 9/.test(document.querySelector('main').innerText) && !localStorage.getItem('visao-quimica:perfil')`), 'tema rápido abre uma sessão de 9 questões sem salvar etapa');
  check(await js(`document.querySelector('header nav button[aria-current="page"]')?.innerText.trim() === 'Início'`), 'a sessão abre por cima da aba de onde começou (Início)');
  await clickText('Início');
  await wait(400);
  check(/Boas-vindas/.test(await heading()), 'depois do tema rápido, o Início volta à escolha de etapa');
  await js(`document.querySelector('[data-caminho="trilha"]').click()`);
  await wait(300);
  await js(`document.querySelector('label[for="onboarding-etapa-em-3"]').click()`);
  await clickText('Ver minha trilha');
  await wait(400);
  check(/Trilha/.test(await heading()) && await js(`Boolean(document.querySelector('[data-guia="tema-recomendado"]'))`), 'escolher a etapa abre a Trilha, com o próximo tema marcado na lista');

  const tabs = await js(`[...document.querySelectorAll('nav button')].filter((b) => b.offsetParent).map((b) => b.innerText.trim())`);
  check(tabs.length === 3 && !tabs.includes('Laboratório do Mentor'), `três abas na barra, sem o Mentor ainda (${tabs.join(', ')})`);
  for (const tab of tabs) {
    await clickText(tab);
    await wait(400);
    const text = await js('document.querySelector("main")?.innerText.length || 0');
    check(text > 200, `aba ${tab} mostra conteúdo (${await heading()})`);
  }

  // Menu "Mais": quatro grupos, fecha com Esc; o Início tem os atalhos.
  await clickText('Início');
  await wait(300);
  check(await js(`Boolean(document.querySelector('[data-guia="continuar"]')) && !document.querySelector('[data-atalho]') && !/Passo \\d/.test(document.querySelector('main').innerText)`), 'Início mostra o cartão "Continuar", sem atalhos repetidos nem "Passo"');
  await openMore();
  await wait(200);
  check(await js(`document.querySelectorAll('#menu-mais section').length === 4 && document.querySelectorAll('[data-menu-item]').length === 10`), 'menu "Mais" reúne ferramentas, dados, ajuda e aparência');
  await js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await wait(200);
  check(await js(`!document.querySelector('#menu-mais')`), 'Esc fecha o menu "Mais"');

  // Guia de uso: abre pelo menu "Mais", destaca o primeiro alvo, avança e fecha com Esc.
  check(await js(`[...document.querySelectorAll('button')].some((b) => b.innerText.trim() === 'Começar o guia')`), 'Início oferece o guia de uso na primeira vez');
  await menu('guia');
  await wait(200);
  check(await js(`document.querySelector('[role=dialog] h2')?.innerText === 'Bem-vindo ao guia de uso'`), 'guia de uso abre com o pop-up de boas-vindas');
  await clickText('Próximo');
  await wait(900);
  check(await js(`Boolean(document.querySelector('[data-guia-overlay] .border-teal-300')) && document.querySelector('[role=dialog] h2')?.innerText === 'Os módulos' && /aparece sozinho/.test(document.querySelector('[role=dialog]').innerText)`), 'guia contorna o elemento do passo e, sem o Mentor liberado, explica quando ele aparece');
  await js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await wait(300);
  check(await js(`!document.querySelector('[role=dialog]')`), 'Esc fecha o guia de uso');

  await menu('creditos');
  const credits = await js(`(() => {
    const main = document.querySelector('main');
    const links = [...main.querySelectorAll('a')].map((link) => link.href);
    return links.includes('https://github.com/DiamondDust01/visao-quimica') &&
      links.includes('https://www.ifpi.edu.br/') &&
      [...main.querySelectorAll('button')].some((button) => button.innerText.includes('estudantes e professores'));
  })()`);
  check(credits && await js(`document.activeElement?.id === 'ajuda-creditos'`), '"Mais" → Sobre e créditos abre a seção com os links para desenvolvedores, IFPI e professores');
  await clickText('Trilhas de Química para estudantes e professores');
  await wait(300);
  check(await js(`document.querySelector('nav[aria-label="Módulos"] button[aria-current="page"]')?.innerText === 'Trilha'`), 'atalho para professores abre a Trilha');

  await clickText('Trilha');
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

  // Um segundo erro no mesmo tema dá ao Mentor o que sugerir: a aba aparece na hora, mas o
  // tutorial só abre quando a sessão termina.
  check(!(await js(`[...document.querySelectorAll('header nav button')].some((b) => b.innerText.trim() === 'Laboratório do Mentor')`)), 'um erro só ainda não libera o Mentor');
  await clickText('Nova sessão com os mesmos temas');
  await wait(1000);
  await setInput('main form input[type=text]', 'outra resposta de teste');
  await clickText('Responder');
  await wait(1000);
  check(await js(`[...document.querySelectorAll('header nav button')].some((b) => b.innerText.trim() === 'Laboratório do Mentor') && !document.querySelector('[data-guia-overlay]')`), 'segundo erro libera a aba do Mentor sem interromper a sessão');
  await clickText('Encerrar sessão');
  await wait(1200);
  check(await js(`document.querySelector('[role=dialog] h2')?.innerText === 'Laboratório do Mentor liberado' && Boolean(document.querySelector('[data-guia-overlay] .border-teal-300'))`), 'ao fim da sessão, o tutorial do Mentor destaca a aba nova');
  await clickText('Próximo');
  await wait(900);
  check(/Laboratório do Mentor/.test(await heading()) && await js(`document.querySelector('[role=dialog] h2')?.innerText === 'O que revisar agora'`), 'tutorial leva ao Laboratório, já com sugestões');
  await js(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await wait(300);
  check(await js(`!document.querySelector('[role=dialog]') && localStorage.getItem('visao-quimica:mentor-tour') === 'visto'`), 'tutorial do Mentor fecha e não volta a abrir');

  // Glossário: a palavra sublinhada abre um balão que pergunta antes de explicar. Antes da
  // resposta, o termo que é o assunto cobrado (destilação, neste subtema) não é marcado.
  await clickText('Prática');
  await wait(300);
  await js(`document.querySelector('#selecao-fund-separacao-homogeneas').click()`);
  await clickText('Começar sessão');
  await wait(1000);
  check(await js(`document.querySelectorAll('main [data-termo]').length > 0 && !document.querySelector('main [data-termo="destilacao"]')`), 'glossário marca palavras da questão, menos o assunto cobrado antes da resposta');
  await js(`document.querySelector('main [data-termo]').click()`);
  await wait(200);
  check(await js(`/Quer uma explicação/.test(document.querySelector('[data-glossario-balao]')?.innerText || '')`), 'tocar na palavra pergunta se o estudante quer a explicação');
  await js(`document.querySelector('[data-glossario-balao] button').click()`);
  await wait(200);
  check(await js(`/não desconta pontos/.test(document.querySelector('[data-glossario-balao]')?.innerText || '')`), '"Sim, explicar" mostra a explicação do termo');
  await js(`document.querySelector('[data-glossario-balao]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
  await wait(200);
  check(await js(`!document.querySelector('[data-glossario-balao]') && Boolean(document.activeElement?.dataset.termo)`), 'Esc fecha o balão e devolve o foco à palavra');
  await clickText('Encerrar sessão');
  await wait(300);
  check(await js(`[...document.querySelectorAll('main button')].some((b) => b.innerText.includes('Voltar para Prática'))`), 'o resultado da sessão volta para a aba de onde ela começou');

  // A sessão abre por cima da aba de origem: "Praticar" na Trilha não leva para a Prática.
  await clickText('Trilha');
  await wait(300);
  await js(`document.querySelector('[data-guia="tema-recomendado"] button[aria-label^="Praticar"]').click()`);
  await wait(600);
  check(await js(`document.querySelector('header nav button[aria-current="page"]')?.innerText.trim() === 'Trilha' && /Questão 1 de/.test(document.querySelector('main').innerText)`), '"Praticar" na Trilha abre a sessão sem trocar de aba');
  await clickText('Encerrar sessão');
  await wait(300);
  await clickText('Início');
  await wait(300);
  check(await js(`Boolean(document.querySelector('[data-guia="ultima-sessao"]')) && Boolean(document.querySelector('[data-guia="aviso-mentor"]'))`), 'Início mostra a última sessão e o aviso do Mentor');

  await js('window.scrollTo(0, document.documentElement.scrollHeight)');
  await wait(100);
  await menu('tabela');
  check(await js('window.scrollY') === 0, 'Ferramentas pelo "Mais" abre no topo, mesmo vindo de uma tela rolada');
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
  await menu('backup');
  check(await js(`document.activeElement?.id === 'perfil-backup'`), '"Mais" → Backup leva direto à seção de backup do Perfil');
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
