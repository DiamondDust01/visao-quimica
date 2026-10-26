// Posição dos elementos na tabela periódica, calculada a partir do número atômico.
// Lantanídeos (57–71) e actinídeos (89–103) ficam em duas linhas separadas, abaixo da
// tabela principal, como na maioria dos livros didáticos brasileiros.

// Último número atômico de cada período.
export const PERIOD_LIMITS = [2, 10, 18, 36, 54, 86, 118];

export const periodOf = (z) => PERIOD_LIMITS.findIndex((limit) => z <= limit) + 1;

export const isFBlock = (z) => (z >= 57 && z <= 71) || (z >= 89 && z <= 103);

// Grupo de 1 a 18; null para lantanídeos e actinídeos.
export const groupOf = (z) => {
  if (isFBlock(z)) return null;
  const period = periodOf(z);
  if (period === 1) return z === 1 ? 1 : 18;
  const index = z - PERIOD_LIMITS[period - 2] - 1;
  if (period <= 3) return index < 2 ? index + 1 : index + 11;
  if (period <= 5) return index + 1;
  return index < 2 ? index + 1 : index - 13;
};

export const blockOf = (z) => {
  if (isFBlock(z)) return 'f';
  const group = groupOf(z);
  if (z === 2 || group <= 2) return 's';
  if (group >= 13) return 'p';
  return 'd';
};

// Linha e coluna na grade de exibição (linha 8 fica vazia, separando as séries f).
export const gridPosition = (z) => {
  if (z >= 57 && z <= 71) return { row: 9, col: 3 + (z - 57) };
  if (z >= 89 && z <= 103) return { row: 10, col: 3 + (z - 89) };
  return { row: periodOf(z), col: groupOf(z) };
};

export const CATEGORY_LABELS = {
  'metal-alcalino': 'Metais alcalinos',
  'metal-alcalinoterroso': 'Metais alcalinoterrosos',
  'metal-de-transicao': 'Metais de transição',
  lantanideo: 'Lantanídeos',
  actinideo: 'Actinídeos',
  'outros-metais': 'Outros metais',
  semimetal: 'Semimetais',
  ametal: 'Ametais',
  halogenio: 'Halogênios',
  'gas-nobre': 'Gases nobres'
};

const CORE_ELECTRONS = { He: 2, Ne: 10, Ar: 18, Kr: 36, Xe: 54, Rn: 86 };

// Soma os elétrons de uma configuração como "[Ar] 3d5 4s1".
export const electronCount = (config) => {
  const core = String(config).match(/^\[(\w+)\]/);
  const base = core ? CORE_ELECTRONS[core[1]] ?? NaN : 0;
  const shells = [...String(config).matchAll(/\d[spdf](\d+)/g)].map((match) => Number(match[1]));
  return base + shells.reduce((sum, value) => sum + value, 0);
};

// "[Ar] 3d5 4s1" → segmentos para exibir os expoentes como sobrescrito.
export const configSegments = (config) => {
  const segments = [];
  String(config).split(' ').forEach((part, index) => {
    if (index > 0) segments.push({ tipo: 'texto', valor: ' ' });
    const match = part.match(/^(\d[spdf])(\d+)$/);
    if (match) {
      segments.push({ tipo: 'texto', valor: match[1] });
      segments.push({ tipo: 'sup', valor: match[2] });
    } else {
      segments.push({ tipo: 'texto', valor: part });
    }
  });
  return segments;
};
