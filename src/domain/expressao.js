// Avaliador de expressões aritméticas, usado só pelo validador de conteúdo para conferir
// gabaritos numéricos. Não usa eval: lê números, + - * / ^, parênteses e algumas funções.
//   "(2*1.008 + 16.00) * 3"   "-log10(0.01)"   "0.5^(30/5730)"   "8.314*298*ln(10)"

const FUNCTIONS = {
  log10: Math.log10, log: Math.log10, ln: Math.log, exp: Math.exp, sqrt: Math.sqrt, abs: Math.abs, round: Math.round
};

export class ExpressionError extends Error {}

const tokenize = (text) => {
  const tokens = [];
  let index = 0;
  while (index < text.length) {
    const rest = text.slice(index);
    const space = rest.match(/^\s+/);
    if (space) { index += space[0].length; continue; }
    const number = rest.match(/^(\d+\.?\d*|\.\d+)(e[-+]?\d+)?/i);
    if (number) { tokens.push({ type: 'num', value: Number(number[0]) }); index += number[0].length; continue; }
    const name = rest.match(/^[a-z][a-z0-9]*/i);
    if (name) { tokens.push({ type: 'name', value: name[0] }); index += name[0].length; continue; }
    if ('+-*/^(),'.includes(rest[0])) { tokens.push({ type: 'op', value: rest[0] }); index += 1; continue; }
    throw new ExpressionError(`Caractere inesperado "${rest[0]}".`);
  }
  return tokens;
};

export const evaluate = (text) => {
  const tokens = tokenize(String(text));
  let position = 0;
  const peek = () => tokens[position];
  const take = (value) => {
    const token = tokens[position];
    if (!token || (value && token.value !== value)) throw new ExpressionError(`Esperava "${value || 'algo'}".`);
    position += 1;
    return token;
  };

  // soma := produto (('+'|'-') produto)*
  const sum = () => {
    let value = product();
    while (peek()?.type === 'op' && (peek().value === '+' || peek().value === '-')) {
      value = take().value === '+' ? value + product() : value - product();
    }
    return value;
  };
  // produto := unário (('*'|'/') unário)*
  const product = () => {
    let value = unary();
    while (peek()?.type === 'op' && (peek().value === '*' || peek().value === '/')) {
      value = take().value === '*' ? value * unary() : value / unary();
    }
    return value;
  };
  // unário := '-' unário | potência
  const unary = () => {
    if (peek()?.value === '-') { take(); return -unary(); }
    if (peek()?.value === '+') { take(); return unary(); }
    return power();
  };
  // potência := átomo ('^' unário)?   (associativa à direita)
  const power = () => {
    const base = atom();
    if (peek()?.value === '^') { take(); return base ** unary(); }
    return base;
  };
  const atom = () => {
    const token = take();
    if (token.type === 'num') return token.value;
    if (token.type === 'name') {
      const fn = FUNCTIONS[token.value];
      if (!fn) throw new ExpressionError(`Função desconhecida "${token.value}".`);
      take('(');
      const value = sum();
      take(')');
      return fn(value);
    }
    if (token.value === '(') {
      const value = sum();
      take(')');
      return value;
    }
    throw new ExpressionError(`Símbolo inesperado "${token.value}".`);
  };

  const result = sum();
  if (position < tokens.length) throw new ExpressionError(`Sobrou "${tokens[position].value}" no fim da expressão.`);
  if (!Number.isFinite(result)) throw new ExpressionError('O resultado não é um número finito.');
  return result;
};
