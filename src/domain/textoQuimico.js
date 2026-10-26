// Divide um texto com trechos \ce{...} (sintaxe mhchem) em segmentos para exibição:
// texto normal, índice (sub) e expoente (sup). É a exibição provisória até o KaTeX
// com mhchem entrar (Fase 4); o conteúdo já é escrito na sintaxe final.
//   "\ce{2H2O}"       → 2H, ₂O       (o 2 inicial é coeficiente)
//   "\ce{SO4^{2-}}"   → SO, ₄, ²⁻
//   "\ce{A -> B}"     → A → B

const ARROWS = [['<=>', ' ⇌ '], ['<->', ' ⇌ '], ['->', ' → '], ['<-', ' ← ']];

// Encontra o "}" que fecha a chave aberta em `start`.
const closingBrace = (text, start) => {
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    if (text[index] === '{') depth += 1;
    if (text[index] === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
};

const push = (segments, tipo, valor) => {
  if (!valor) return;
  const last = segments[segments.length - 1];
  if (last && last.tipo === tipo) last.valor += valor;
  else segments.push({ tipo, valor });
};

// Lê o conteúdo de um \ce{...}.
export const parseCe = (content) => {
  const segments = [];
  let index = 0;
  let previous = '';
  while (index < content.length) {
    const arrow = ARROWS.find(([token]) => content.startsWith(token, index));
    if (arrow) {
      push(segments, 'texto', arrow[1]);
      index += arrow[0].length;
      previous = ' ';
      continue;
    }
    const char = content[index];
    if (char === '^' || char === '_') {
      const tipo = char === '^' ? 'sup' : 'sub';
      let value;
      if (content[index + 1] === '{') {
        const end = closingBrace(content, index + 1);
        value = content.slice(index + 2, end === -1 ? undefined : end);
        index = end === -1 ? content.length : end + 1;
      } else {
        const match = content.slice(index + 1).match(tipo === 'sup' ? /^\d*[+-]|^\d+/ : /^\d+/);
        value = match ? match[0] : '';
        index += 1 + value.length;
      }
      push(segments, tipo, value.replace(/-/g, '−'));
      previous = 'x';
      continue;
    }
    if (/\d/.test(char) && /[A-Za-z)\]]/.test(previous)) {
      const digits = content.slice(index).match(/^\d+/)[0];
      push(segments, 'sub', digits);
      index += digits.length;
      previous = 'x';
      continue;
    }
    push(segments, 'texto', char);
    previous = char;
    index += 1;
  }
  return segments;
};

export const parseChemText = (text) => {
  const segments = [];
  const source = String(text ?? '');
  let index = 0;
  while (index < source.length) {
    const start = source.indexOf('\\ce{', index);
    if (start === -1) {
      push(segments, 'texto', source.slice(index));
      break;
    }
    push(segments, 'texto', source.slice(index, start));
    const end = closingBrace(source, start + 3);
    if (end === -1) {
      push(segments, 'texto', source.slice(start));
      break;
    }
    parseCe(source.slice(start + 4, end)).forEach((segment) => push(segments, segment.tipo, segment.valor));
    index = end + 1;
  }
  return segments;
};

// Divide o texto em pedaços: { tipo: 'texto', valor } e { tipo: 'ce', valor } (conteúdo do \ce{}).
export const splitCe = (text) => {
  const parts = [];
  const source = String(text ?? '');
  let index = 0;
  while (index < source.length) {
    const start = source.indexOf('\\ce{', index);
    const end = start === -1 ? -1 : closingBrace(source, start + 3);
    if (start === -1 || end === -1) {
      parts.push({ tipo: 'texto', valor: source.slice(index) });
      break;
    }
    if (start > index) parts.push({ tipo: 'texto', valor: source.slice(index, start) });
    parts.push({ tipo: 'ce', valor: source.slice(start + 4, end) });
    index = end + 1;
  }
  return parts;
};

export const extractCe = (text) => splitCe(text).filter((part) => part.tipo === 'ce').map((part) => part.valor);

// Versão em texto puro (para leitores de tela e buscas): índices e expoentes viram texto comum.
export const chemPlainText = (text) => parseChemText(text).map((segment) => segment.valor).join('');
