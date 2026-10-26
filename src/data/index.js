import etapasData from './etapas.json' with { type: 'json' };
import elementosData from './elementos.json' with { type: 'json' };
import estruturasData from './estruturas.json' with { type: 'json' };
import { TAXONOMY_AREAS, TAXONOMY_META } from './taxonomia/index.js';
import { createTaxonomyIndex } from '../domain/taxonomia.js';

export const ETAPAS = etapasData.etapas;
export const ETAPAS_OBSERVACAO = etapasData.observacao;
export { TAXONOMY_META };

// Elementos (massas da IUPAC/CIAAW; fontes e datas em ELEMENTOS_META.fontes).
export const ELEMENTOS = elementosData.elementos;
export const ELEMENTOS_META = elementosData.meta;

// Galeria de estruturas (SMILES) da tela Ferramentas.
export const ESTRUTURAS = estruturasData.estruturas;

// Índice único usado pelas telas e pelo recomendador.
export const TAXONOMIA = createTaxonomyIndex(TAXONOMY_AREAS, ETAPAS);
