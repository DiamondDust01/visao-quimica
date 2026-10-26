// Recalcula os campos derivados de temas e áreas (area, prerequisitos, etapasRecomendadas,
// dificuldade) a partir dos subtemas e regrava os JSON da taxonomia em formato padrão.
// Uso: npm run sync:taxonomia   (depois de editar subtemas)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { aggregateTaxonomy } from '../src/domain/taxonomia.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'src', 'data', 'taxonomia');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

// JSON com 2 espaços, mas listas de textos curtos numa linha só (mais fácil de revisar).
export const formatJson = (value, indent = '') => {
  const next = `${indent}  `;
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.every((item) => typeof item !== 'object' || item === null)) return `[${value.map((item) => JSON.stringify(item)).join(', ')}]`;
    return `[\n${value.map((item) => `${next}${formatJson(item, next)}`).join(',\n')}\n${indent}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);
    return `{\n${entries.map(([key, item]) => `${next}${JSON.stringify(key)}: ${formatJson(item, next)}`).join(',\n')}\n${indent}}`;
  }
  return JSON.stringify(value);
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const meta = readJson(path.join(dir, 'meta.json'));
  const { etapas } = readJson(path.join(root, 'src', 'data', 'etapas.json'));
  const files = meta.ordemAreas.map((id) => path.join(dir, `${id}.json`));
  const missing = files.filter((file) => !fs.existsSync(file));
  if (missing.length) {
    console.error(`Arquivos de área não encontrados: ${missing.map((file) => path.basename(file)).join(', ')}`);
    process.exit(1);
  }
  const areas = aggregateTaxonomy(files.map(readJson), etapas);
  let changed = 0;
  areas.forEach((area, index) => {
    const content = `${formatJson(area)}\n`;
    if (fs.readFileSync(files[index], 'utf8').replace(/\r\n/g, '\n') !== content) {
      fs.writeFileSync(files[index], content);
      changed += 1;
    }
  });
  console.log(`${areas.length} áreas verificadas, ${changed} arquivo(s) atualizado(s).`);
}
