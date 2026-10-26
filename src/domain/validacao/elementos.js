// Validação de src/data/elementos.json.
import { ELEMENT_SYMBOLS } from '../formula.js';
import { CATEGORY_LABELS, electronCount, groupOf } from '../tabelaPeriodica.js';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIPOS = ['peso-atomico-padrao', 'numero-de-massa-do-isotopo-mais-estavel'];

export const validateElements = ({ meta, elementos }) => {
  const errors = [];
  if (!meta?.fontes || !Object.keys(meta.fontes).length) errors.push('meta.fontes ausente.');
  Object.entries(meta?.fontes || {}).forEach(([key, fonte]) => {
    if (!/^https:\/\//.test(fonte.url || '')) errors.push(`meta.fontes.${key}: "url" ausente ou sem https.`);
    if (!DATE.test(fonte.consultadoEm || '')) errors.push(`meta.fontes.${key}: "consultadoEm" deve ser AAAA-MM-DD.`);
    if (!fonte.instituicao) errors.push(`meta.fontes.${key}: "instituicao" ausente.`);
  });
  if (!Array.isArray(elementos) || elementos.length !== 118) {
    errors.push(`devem existir 118 elementos (há ${elementos?.length ?? 0}).`);
    return errors;
  }
  elementos.forEach((element, index) => {
    const z = index + 1;
    const where = `elemento ${z} (${element.simbolo || '?'})`;
    if (element.numeroAtomico !== z) errors.push(`${where}: numeroAtomico deveria ser ${z}.`);
    if (element.simbolo !== ELEMENT_SYMBOLS[index]) errors.push(`${where}: símbolo deveria ser ${ELEMENT_SYMBOLS[index]}.`);
    if (!element.nome) errors.push(`${where}: nome vazio.`);
    if (!(element.massaAtomica > 0)) errors.push(`${where}: massa atômica inválida.`);
    if (!TIPOS.includes(element.massaAtomicaTipo)) errors.push(`${where}: massaAtomicaTipo inválido.`);
    if (Number(String(element.massaAtomicaTexto).replace(/[[\]]/g, '')) !== element.massaAtomica) errors.push(`${where}: massaAtomicaTexto não corresponde a massaAtomica.`);
    if (element.massaAtomicaTipo === 'numero-de-massa-do-isotopo-mais-estavel' && !Number.isInteger(element.massaAtomica)) errors.push(`${where}: número de massa deve ser inteiro.`);
    if (!CATEGORY_LABELS[element.categoria]) errors.push(`${where}: categoria "${element.categoria}" desconhecida.`);
    if (element.eletronegatividade !== null && !(element.eletronegatividade >= 0.7 && element.eletronegatividade <= 4)) errors.push(`${where}: eletronegatividade fora de 0,7 a 4,0.`);
    if (electronCount(element.configuracaoEletronica) !== z) errors.push(`${where}: a configuração "${element.configuracaoEletronica}" soma ${electronCount(element.configuracaoEletronica)} elétrons.`);

    // Coerência entre categoria e posição.
    const group = groupOf(z);
    if (group === null && !['lantanideo', 'actinideo'].includes(element.categoria)) errors.push(`${where}: elemento do bloco f deveria ser lantanídeo ou actinídeo.`);
    if (group === 1 && z !== 1 && element.categoria !== 'metal-alcalino') errors.push(`${where}: grupo 1 deveria ser metal alcalino.`);
    if (group === 2 && element.categoria !== 'metal-alcalinoterroso') errors.push(`${where}: grupo 2 deveria ser metal alcalinoterroso.`);
    if (group === 18 && z <= 86 && element.categoria !== 'gas-nobre') errors.push(`${where}: grupo 18 deveria ser gás nobre.`);
  });
  // Massas crescem com Z, com as inversões conhecidas (Ar/K, Co/Ni, Te/I, Th/Pa, U/Np...): só um alerta grosseiro.
  for (let index = 1; index < elementos.length; index += 1) {
    if (elementos[index].massaAtomica < elementos[index - 1].massaAtomica - 3) errors.push(`elemento ${index + 1}: massa muito menor que a do anterior; confira o dado.`);
  }
  return errors;
};
