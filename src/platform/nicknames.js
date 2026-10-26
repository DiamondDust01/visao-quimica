// Apelidos sorteados para as salas (termo de Química + adjetivo, com concordância de
// gênero em pt-BR). O participante não digita nome; só pode sortear outro apelido.

export const NICKNAME_NOUNS = [
  { name: 'Átomo', gender: 'm' }, { name: 'Próton', gender: 'm' }, { name: 'Nêutron', gender: 'm' },
  { name: 'Elétron', gender: 'm' }, { name: 'Íon', gender: 'm' }, { name: 'Isótopo', gender: 'm' },
  { name: 'Catalisador', gender: 'm' }, { name: 'Béquer', gender: 'm' }, { name: 'Cristal', gender: 'm' },
  { name: 'Polímero', gender: 'm' }, { name: 'Orbital', gender: 'm' }, { name: 'Erlenmeyer', gender: 'm' },
  { name: 'Molécula', gender: 'f' }, { name: 'Partícula', gender: 'f' }, { name: 'Enzima', gender: 'f' },
  { name: 'Proveta', gender: 'f' }, { name: 'Bureta', gender: 'f' }, { name: 'Pipeta', gender: 'f' },
  { name: 'Solução', gender: 'f' }, { name: 'Ligação', gender: 'f' }, { name: 'Reação', gender: 'f' },
  { name: 'Valência', gender: 'f' }, { name: 'Chama', gender: 'f' }, { name: 'Faísca', gender: 'f' }
];

export const NICKNAME_ADJECTIVES = [
  { m: 'Curioso', f: 'Curiosa' }, { m: 'Atento', f: 'Atenta' }, { m: 'Esperto', f: 'Esperta' },
  { m: 'Criativo', f: 'Criativa' }, { m: 'Corajoso', f: 'Corajosa' }, { m: 'Paciente', f: 'Paciente' },
  { m: 'Investigador', f: 'Investigadora' }, { m: 'Sabido', f: 'Sabida' }, { m: 'Focado', f: 'Focada' },
  { m: 'Pensador', f: 'Pensadora' }, { m: 'Calmo', f: 'Calma' }, { m: 'Veloz', f: 'Veloz' },
  { m: 'Estável', f: 'Estável' }, { m: 'Brilhante', f: 'Brilhante' }, { m: 'Questionador', f: 'Questionadora' },
  { m: 'Estudioso', f: 'Estudiosa' }
];

export const NICKNAME_COMBINATIONS = NICKNAME_NOUNS.length * NICKNAME_ADJECTIVES.length;

const pick = (list, random) => list[Math.min(list.length - 1, Math.floor(random() * list.length))];

export const buildNickname = (noun, adjective) => `${noun.name} ${adjective[noun.gender]}`;

// Sorteia um apelido diferente de `previous` (quando possível).
export const drawNickname = (random = Math.random, previous = '') => {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const nickname = buildNickname(pick(NICKNAME_NOUNS, random), pick(NICKNAME_ADJECTIVES, random));
    if (nickname !== previous) return nickname;
  }
  const fallbackNoun = NICKNAME_NOUNS.find((noun) => !previous.startsWith(noun.name)) || NICKNAME_NOUNS[0];
  return buildNickname(fallbackNoun, NICKNAME_ADJECTIVES[0]);
};

const ALL_NICKNAMES = new Set(NICKNAME_NOUNS.flatMap((noun) => NICKNAME_ADJECTIVES.map((adjective) => buildNickname(noun, adjective))));

// Só aceita apelidos que o próprio sorteio pode gerar (impede texto livre, como nomes).
export const isDrawnNickname = (nickname) => ALL_NICKNAMES.has(nickname);
