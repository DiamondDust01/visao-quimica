// Procura resquícios do projeto de origem em todos os arquivos versionáveis: código,
// comentários, testes, chaves de armazenamento, coleções do Firestore, strings do
// Android e do Electron, documentação e configurações.
// Uso: npm run check:residue   (sai com código 1 se encontrar algo)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Pastas geradas ou de terceiros não entram na busca.
const IGNORED_DIRS = new Set(['node_modules', 'dist', '.git', 'build', '.gradle', '.idea', 'release', '.vite']);
// O detector e o teste dele contêm os próprios termos buscados.
const IGNORED_FILES = new Set(['package-lock.json', 'check-residue.mjs', 'check-residue.test.mjs']);
const TEXT_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.json', '.md', '.html', '.css', '.svg', '.xml', '.gradle', '.properties', '.java', '.kt', '.rules', '.txt', '.pro', '.yml', '.yaml', '']);

export const RESIDUE_PATTERNS = [
  { label: 'OBI (sigla)', pattern: /\bOBI\b/ },
  { label: 'obi-quest / obique', pattern: /obi[-_ ]?quest|obique/i },
  { label: 'Olimpíada de Informática', pattern: /olimp[ií]ada[s]? (brasileira )?de inform[aá]tica/i },
  { label: 'olimpíada (verificar contexto)', pattern: /olimp[ií]ada/i },
  { label: 'informática', pattern: /inform[aá]tica/i },
  { label: 'Pensa Comigo', pattern: /pensa[-_ ]?comigo|pensaComigo/i },
  { label: 'programação', pattern: /programa[çc][ãa]o/i },
  { label: 'algoritmo', pattern: /algoritm/i },
  { label: 'linguagens do projeto de origem', pattern: /\b(c\+\+|cpp|python)\b/i },
  { label: 'juiz/veredito de código', pattern: /\bjuiz(es)?\b|wrong answer|\baccepted\b/i },
  { label: 'componentes do projeto de origem', pattern: /CodeEditor|BinaryBackdrop|SelectorBackdrop|ModeSelector|appMode/ }
];

// Ocorrências legítimas no app novo, com o motivo.
export const ALLOWED = [
  { pattern: /olimp[ií]adas?[- ](de[- ])?qu[ií]mica/i, reason: 'etapa escolar "Olimpíadas de Química" (id olimpiadas-quimica) do app novo' },
  { pattern: /AaptAssets\.cpp/, reason: 'link para o código do Android no comentário do template do Capacitor' }
];

const walk = (dir, files = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) walk(path.join(dir, entry.name), files);
    } else if (!IGNORED_FILES.has(entry.name) && TEXT_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
};

export const findResidue = (text) => {
  const hits = [];
  text.split(/\r?\n/).forEach((line, index) => {
    const cleaned = ALLOWED.reduce((current, { pattern }) => current.replace(new RegExp(pattern.source, `${pattern.flags.replace('g', '')}g`), ''), line);
    RESIDUE_PATTERNS.forEach(({ label, pattern }) => {
      if (pattern.test(cleaned)) hits.push({ line: index + 1, label, text: line.trim().slice(0, 160) });
    });
  });
  return hits;
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = walk(root);
  let total = 0;
  for (const file of files) {
    const hits = findResidue(fs.readFileSync(file, 'utf8'));
    hits.forEach((hit) => console.log(`${path.relative(root, file)}:${hit.line}  [${hit.label}]  ${hit.text}`));
    total += hits.length;
  }
  console.log(`\n${files.length} arquivos verificados, ${total} ocorrência(s).`);
  if (total > 0) process.exitCode = 1;
}
