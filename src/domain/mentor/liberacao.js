// Quando o Laboratório do Mentor aparece. Antes disso a aba fica oculta, para não mostrar uma
// tela vazia: ele só é liberado quando já tem o que sugerir para revisar, ou seja, quando há
// um tema com acerto abaixo de 60% (depois de pelo menos 3 respostas), um padrão de erro que se
// repetiu ou um tema com 2 erros recentes. Depois de liberado, o App guarda isso no aparelho.
import { suggestReview } from './revisao.js';

export const mentorTemConteudo = ({ index, progress = {}, log = [] }) => suggestReview({ index, progress, log }).length > 0;
