// Glossário embutido: encontra, num texto, as palavras menos comuns que têm explicação
// (src/data/glossario.json) e as separa em segmentos para a tela marcar como clicáveis.
// A busca ignora maiúsculas, só aceita palavras inteiras e prefere a forma mais longa
// ("ponto de equivalência" antes de "equivalência"). Cada termo é marcado só na
// primeira vez em que aparece em cada texto, para não encher a frase de sublinhados.

const LETRA = '\\p{L}\\p{N}';

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const criarBuscador = (termos = []) => {
  const porForma = new Map();
  termos.forEach((entrada) => {
    entrada.formas.forEach((forma) => porForma.set(forma.toLocaleLowerCase('pt-BR'), entrada));
  });
  const formas = [...porForma.keys()].sort((a, b) => b.length - a.length);
  const regex = formas.length
    ? new RegExp(`(?<![${LETRA}])(?:${formas.map(escapeRegex).join('|')})(?![${LETRA}])`, 'giu')
    : null;
  return { regex, porForma };
};

// Um item de `temas` vale para o subtema com esse id ou, se terminar em "*", para
// todos os subtemas com aquele começo ("termo-*").
const temaCombina = (padrao, temaId) => (padrao.endsWith('*') ? temaId.startsWith(padrao.slice(0, -1)) : padrao === temaId);

// Antes da resposta, um termo que é o próprio assunto cobrado no subtema da questão
// não é explicado: a explicação entregaria o gabarito.
export const termoBloqueado = (entrada, temaId, respondida) =>
  !respondida && Boolean(temaId) && (entrada.temas || []).some((padrao) => temaCombina(padrao, temaId));

// Divide `texto` em segmentos { tipo: 'texto', valor } e { tipo: 'termo', valor, entrada }.
// `bloqueado(entrada)` permite pular termos (os do assunto da questão, antes da resposta).
export const marcarTermos = (texto, buscador, bloqueado = () => false) => {
  if (!texto || !buscador?.regex) return [{ tipo: 'texto', valor: texto || '' }];
  const segmentos = [];
  const usados = new Set();
  let ultimo = 0;
  for (const achado of texto.matchAll(buscador.regex)) {
    const entrada = buscador.porForma.get(achado[0].toLocaleLowerCase('pt-BR'));
    if (!entrada || usados.has(entrada.id) || bloqueado(entrada)) continue;
    usados.add(entrada.id);
    if (achado.index > ultimo) segmentos.push({ tipo: 'texto', valor: texto.slice(ultimo, achado.index) });
    segmentos.push({ tipo: 'termo', valor: achado[0], entrada });
    ultimo = achado.index + achado[0].length;
  }
  if (ultimo < texto.length) segmentos.push({ tipo: 'texto', valor: texto.slice(ultimo) });
  return segmentos.length ? segmentos : [{ tipo: 'texto', valor: texto }];
};
