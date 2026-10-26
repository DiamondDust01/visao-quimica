// Valida todo o conteúdo versionado do app. Sai com código 1 se houver erro.
// Uso: npm run validate:content
// Cobre etapas, taxonomia, banco de questões, dados dos elementos, fórmulas (mhchem) e
// estruturas (SMILES).
import SmilesDrawer from 'smiles-drawer';
import { validateEtapas, validateTaxonomy } from '../src/domain/validacao/taxonomia.js';
import { validateQuestions } from '../src/domain/validacao/questoes.js';
import { validateElements } from '../src/domain/validacao/elementos.js';
import { validateChemFormulas, questionTexts } from '../src/domain/validacao/formulas.js';
import { validateStructures } from '../src/domain/validacao/estruturas.js';
import { createTaxonomyIndex, flattenTaxonomy } from '../src/domain/taxonomia.js';
import { extractCe } from '../src/domain/textoQuimico.js';
import { TAXONOMY_AREAS, TAXONOMY_AREA_IDS_WITH_FILE, TAXONOMY_META } from '../src/data/taxonomia/index.js';
import { QUESTION_FILES, QUESTIONS } from '../src/data/questoes/index.js';
import etapasData from '../src/data/etapas.json' with { type: 'json' };
import elementosData from '../src/data/elementos.json' with { type: 'json' };
import estruturasData from '../src/data/estruturas.json' with { type: 'json' };

const sections = [];
const warnings = [];

sections.push(['Etapas escolares', validateEtapas(etapasData.etapas)]);

const orphanFiles = TAXONOMY_AREA_IDS_WITH_FILE.filter((id) => !TAXONOMY_META.ordemAreas.includes(id))
  .map((id) => `área "${id}" tem arquivo, mas não está em meta.json.`);
const taxonomyErrors = [...orphanFiles, ...validateTaxonomy({ areas: TAXONOMY_AREAS, meta: TAXONOMY_META, etapas: etapasData.etapas })];
sections.push(['Taxonomia', taxonomyErrors]);

let questionTotal = 0;
if (!taxonomyErrors.length) {
  const index = createTaxonomyIndex(TAXONOMY_AREAS, etapasData.etapas);
  const withFile = new Set(QUESTION_FILES.map((file) => file.area));
  const result = validateQuestions({
    arquivos: QUESTION_FILES,
    index,
    areasSemArquivo: TAXONOMY_META.ordemAreas.filter((id) => !withFile.has(id))
  });
  sections.push(['Questões', result.erros]);
  warnings.push(...result.avisos);
  questionTotal = result.total;
} else {
  sections.push(['Questões', ['não validadas: corrija a taxonomia primeiro.']]);
}

sections.push(['Elementos (tabela periódica)', validateElements(elementosData)]);

// Toda fórmula \ce{...} do conteúdo precisa ser aceita pelo KaTeX com mhchem.
const texts = [
  ...QUESTIONS.flatMap(questionTexts),
  ...flattenTaxonomy(TAXONOMY_AREAS.filter(Boolean)).flatMap((node) => [node.nome, node.descricao].map((texto) => ({ onde: `taxonomia "${node.id}"`, texto })))
];
const formulaCount = texts.reduce((sum, item) => sum + extractCe(item.texto).length, 0);
sections.push(['Fórmulas (mhchem)', validateChemFormulas(texts)]);

// Toda estrutura precisa de SMILES válido e fórmula igual à que sai do SMILES.
sections.push(['Estruturas (SMILES)', validateStructures({ SmilesDrawer, galeria: estruturasData, questoes: QUESTIONS })]);
const structureCount = estruturasData.estruturas.length + QUESTIONS.filter((question) => question.estrutura).length;

let total = 0;
sections.forEach(([name, errors]) => {
  console.log(`${errors.length ? '✖' : '✔'} ${name}${errors.length ? `: ${errors.length} erro(s)` : ''}`);
  errors.forEach((error) => console.log(`   - ${error}`));
  total += errors.length;
});
if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} aviso(s) para revisão humana:`);
  warnings.forEach((warning) => console.log(`   - ${warning}`));
}

const subtemas = TAXONOMY_AREAS.filter(Boolean).flatMap((area) => area.temas.flatMap((tema) => tema.subtemas));
console.log(`\nTaxonomia ${TAXONOMY_META.versao}: ${TAXONOMY_AREAS.length} áreas, ${TAXONOMY_AREAS.filter(Boolean).reduce((sum, area) => sum + area.temas.length, 0)} temas, ${subtemas.length} subtemas.`);
console.log(`Questões: ${questionTotal} em ${QUESTION_FILES.length} de ${TAXONOMY_META.ordemAreas.length} áreas.`);
console.log(`Elementos: ${elementosData.elementos.length} (massas: ${elementosData.meta.fontes.massaAtomica.instituicao}, consultado em ${elementosData.meta.fontes.massaAtomica.consultadoEm}). Fórmulas conferidas: ${formulaCount}. Estruturas: ${structureCount}.`);
if (total) {
  console.log(`\n${total} erro(s) encontrados.`);
  process.exitCode = 1;
} else {
  console.log('Conteúdo válido.');
}
