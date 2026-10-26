// Confere se cada trecho \ce{...} do conteúdo é aceito pelo KaTeX com a extensão mhchem,
// a mesma usada na tela. Um erro aqui apareceria em vermelho para o estudante.
import katex from 'katex';
import 'katex/contrib/mhchem';
import { extractCe } from '../textoQuimico.js';

export const renderCe = (content) => katex.renderToString(`\\ce{${content}}`, { throwOnError: true, output: 'html' });

// textos: [{ onde, texto }]. Devolve a lista de erros.
export const validateChemFormulas = (textos) => {
  const errors = [];
  textos.forEach(({ onde, texto }) => {
    extractCe(texto).forEach((content) => {
      try {
        renderCe(content);
      } catch (error) {
        errors.push(`${onde}: \\ce{${content}} não é aceito pelo mhchem (${String(error.message).split('\n')[0]}).`);
      }
    });
  });
  return errors;
};

// Todos os textos exibidos de uma questão.
export const questionTexts = (question) => {
  const where = `questão "${question.id}"`;
  const list = [question.enunciado, question.dica, ...(question.resolucaoPassoAPasso || []), ...(question.errosComuns || []).map((erro) => erro.descricao)];
  (question.alternativas || []).forEach((alt) => list.push(alt.texto));
  (question.itens || []).forEach((item) => list.push(item.texto));
  (question.opcoes || []).forEach((opcao) => list.push(opcao.texto));
  if (question.equacao) [...question.equacao.reagentes, ...question.equacao.produtos].forEach((species) => list.push(`\\ce{${species}}`));
  if (question.tipo === 'nomenclatura') list.push(`\\ce{${question.gabarito.formula}}`);
  return list.filter(Boolean).map((texto) => ({ onde: where, texto }));
};
