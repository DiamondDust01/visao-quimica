// Conta sem dados pessoais. Não há e-mail, senha nem nome: a conta é um código de acesso
// aleatório gerado no aparelho. Do código saem, no próprio aparelho:
// - o identificador do documento na nuvem (hash SHA-256 do código);
// - a chave AES-GCM que cifra o progresso (PBKDF2 do código).
// O servidor só guarda blocos cifrados num endereço que não revela o código. Quem não tem o
// código não lê nem acha o progresso de ninguém; quem perde o código perde o acesso.
// Usa só a Web Crypto (navegador, Android WebView, Electron e Node).

// Base32 de Crockford (sem I, L, O e U, que confundem com 1, 0 e V).
export const ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const TAMANHO_CODIGO = 20; // 19 símbolos aleatórios (95 bits) + 1 de verificação
export const VERSAO_DADOS = 1;
const ITERACOES = 150000;
const ROTULO_ID = 'visao-quimica/conta/id/v1/';
const SAL_CHAVE = 'visao-quimica/conta/chave/v1';

const subtle = () => {
  const api = globalThis.crypto?.subtle;
  if (!api) throw new Error('Este aparelho não oferece criptografia segura (Web Crypto).');
  return api;
};

// Símbolo de verificação: pega erro de digitação de um caractere e troca de vizinhos.
const checkSymbol = (body) => {
  let sum = 0;
  for (let index = 0; index < body.length; index += 1) sum += (index + 1) * ALFABETO.indexOf(body[index]);
  return ALFABETO[sum % 31];
};

// Gera um código novo. random(n) devolve n bytes aleatórios (padrão: crypto.getRandomValues).
export const gerarCodigo = (random = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n))) => {
  const bytes = random(TAMANHO_CODIGO - 1);
  const body = Array.from(bytes, (byte) => ALFABETO[byte % 32]).join('');
  return body + checkSymbol(body);
};

// Aceita minúsculas, espaços, hífens e as letras confundíveis (O → 0, I e L → 1).
export const normalizarCodigo = (text) => String(text || '')
  .toUpperCase()
  .replace(/[\s-]/g, '')
  .replace(/O/g, '0')
  .replace(/[IL]/g, '1');

export const codigoValido = (text) => {
  const code = normalizarCodigo(text);
  if (code.length !== TAMANHO_CODIGO || [...code].some((char) => !ALFABETO.includes(char))) return false;
  return checkSymbol(code.slice(0, -1)) === code.slice(-1);
};

// "ABCDE-FGHJK-MNPQR-STVWX", para mostrar e anotar.
export const formatarCodigo = (text) => normalizarCodigo(text).match(/.{1,5}/g)?.join('-') || '';

const encoder = new TextEncoder();
const toHex = (buffer) => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
const toBase64 = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)));
const fromBase64 = (text) => Uint8Array.from(atob(text), (char) => char.charCodeAt(0));

// Identificador do documento na nuvem e chave de cifra, ambos derivados do código.
export const derivarConta = async (codigo) => {
  const code = normalizarCodigo(codigo);
  if (!codigoValido(code)) throw new Error('Código inválido. Confira os 20 caracteres.');
  const id = toHex(await subtle().digest('SHA-256', encoder.encode(ROTULO_ID + code)));
  const material = await subtle().importKey('raw', encoder.encode(code), 'PBKDF2', false, ['deriveKey']);
  const chave = await subtle().deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(SAL_CHAVE), iterations: ITERACOES },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  return { id, chave };
};

export const cifrar = async (chave, objeto) => {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const dados = await subtle().encrypt({ name: 'AES-GCM', iv }, chave, encoder.encode(JSON.stringify(objeto)));
  return { versao: VERSAO_DADOS, iv: toBase64(iv), dados: toBase64(dados) };
};

export const decifrar = async (chave, { iv, dados }) => {
  const plain = await subtle().decrypt({ name: 'AES-GCM', iv: fromBase64(iv) }, chave, fromBase64(dados));
  return JSON.parse(new TextDecoder().decode(plain));
};

// O que vai para a nuvem (ou para o arquivo de backup): só dados de estudo.
export const montarInstantaneo = ({ profile, progress, points, mentorLog }, now = new Date().toISOString()) => ({
  versao: VERSAO_DADOS,
  salvoEm: now,
  perfil: profile || null,
  progresso: progress || {},
  pontos: Number.isFinite(points) ? points : 0,
  mentor: Array.isArray(mentorLog) ? mentorLog : []
});

const newer = (a, b) => (String(a || '') >= String(b || ''));

// Junta dois instantâneos (deste aparelho e da nuvem) sem contar nada duas vezes:
// - progresso: por subtema, fica o registro com mais respostas (ou o mais recente, se empatar);
// - pontos: o maior valor;
// - registro do Mentor: união sem repetição, em ordem de data, até o limite;
// - perfil: o escolhido por último.
// Aplicar a mesma junção de novo não muda nada, então sincronizar várias vezes é seguro.
export const mesclarInstantaneos = (local, remoto, limiteMentor = 200) => {
  const a = local || {};
  const b = remoto || {};
  const progresso = { ...(a.progresso || {}) };
  Object.entries(b.progresso || {}).forEach(([id, entry]) => {
    const current = progresso[id];
    const more = !current || (entry?.respondidas || 0) > (current.respondidas || 0)
      || ((entry?.respondidas || 0) === (current.respondidas || 0) && !newer(current.atualizadoEm, entry?.atualizadoEm));
    if (more) progresso[id] = entry;
  });
  const seen = new Set();
  const mentor = [...(a.mentor || []), ...(b.mentor || [])]
    .filter((item) => {
      const key = `${item?.em}|${item?.questaoId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((x, y) => String(x.em).localeCompare(String(y.em)))
    .slice(-limiteMentor);
  const perfil = !a.perfil ? b.perfil || null : !b.perfil ? a.perfil : (newer(a.perfil.atualizadoEm, b.perfil.atualizadoEm) ? a.perfil : b.perfil);
  return {
    versao: VERSAO_DADOS,
    salvoEm: newer(a.salvoEm, b.salvoEm) ? a.salvoEm || null : b.salvoEm || null,
    perfil,
    progresso,
    pontos: Math.max(Number(a.pontos) || 0, Number(b.pontos) || 0),
    mentor
  };
};

// Confere um instantâneo lido de arquivo ou da nuvem antes de usar.
export const instantaneoValido = (value) => Boolean(value)
  && typeof value === 'object'
  && value.versao === VERSAO_DADOS
  && typeof value.progresso === 'object' && value.progresso !== null && !Array.isArray(value.progresso)
  && Number.isFinite(Number(value.pontos))
  && Array.isArray(value.mentor);
