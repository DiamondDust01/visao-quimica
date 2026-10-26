// Baixa as fontes oficiais e regenera src/data/elementos.json.
//  - CIAAW (IUPAC): pesos atômicos padrão abreviados e isótopos mais estáveis dos radioativos;
//  - PubChem (NIH): configuração eletrônica e eletronegatividade de Pauling.
// Uso: npm run atualizar:elementos            (baixa as fontes)
//      npm run atualizar:elementos -- <pasta> (usa arquivos já baixados nessa pasta)
// Depois de rodar, confira a diferença no git e rode npm run validate:content.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(root, 'src', 'data', 'elementos.json');
const today = new Date().toISOString().slice(0, 10);

const SOURCES = {
  abridged: 'https://www.ciaaw.org/abridged-atomic-weights.htm',
  radioactive: 'https://www.ciaaw.org/radioactive-elements.htm',
  pubchem: 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON'
};
const FILES = { abridged: 'abridged-atomic-weights.htm', radioactive: 'radioactive-elements.htm', pubchem: 'periodictable.json' };

const NOMES = ['Hidrogênio', 'Hélio', 'Lítio', 'Berílio', 'Boro', 'Carbono', 'Nitrogênio', 'Oxigênio', 'Flúor', 'Neônio', 'Sódio', 'Magnésio', 'Alumínio', 'Silício', 'Fósforo', 'Enxofre', 'Cloro', 'Argônio', 'Potássio', 'Cálcio', 'Escândio', 'Titânio', 'Vanádio', 'Cromo', 'Manganês', 'Ferro', 'Cobalto', 'Níquel', 'Cobre', 'Zinco', 'Gálio', 'Germânio', 'Arsênio', 'Selênio', 'Bromo', 'Criptônio', 'Rubídio', 'Estrôncio', 'Ítrio', 'Zircônio', 'Nióbio', 'Molibdênio', 'Tecnécio', 'Rutênio', 'Ródio', 'Paládio', 'Prata', 'Cádmio', 'Índio', 'Estanho', 'Antimônio', 'Telúrio', 'Iodo', 'Xenônio', 'Césio', 'Bário', 'Lantânio', 'Cério', 'Praseodímio', 'Neodímio', 'Promécio', 'Samário', 'Európio', 'Gadolínio', 'Térbio', 'Disprósio', 'Hólmio', 'Érbio', 'Túlio', 'Itérbio', 'Lutécio', 'Háfnio', 'Tântalo', 'Tungstênio', 'Rênio', 'Ósmio', 'Irídio', 'Platina', 'Ouro', 'Mercúrio', 'Tálio', 'Chumbo', 'Bismuto', 'Polônio', 'Astato', 'Radônio', 'Frâncio', 'Rádio', 'Actínio', 'Tório', 'Protactínio', 'Urânio', 'Netúnio', 'Plutônio', 'Amerício', 'Cúrio', 'Berquélio', 'Califórnio', 'Einstênio', 'Férmio', 'Mendelévio', 'Nobélio', 'Laurêncio', 'Rutherfórdio', 'Dúbnio', 'Seabórgio', 'Bóhrio', 'Hássio', 'Meitnério', 'Darmstádio', 'Roentgênio', 'Copernício', 'Nihônio', 'Fleróvio', 'Moscóvio', 'Livermório', 'Tenesso', 'Oganessônio'];

const CATEGORIAS = {
  'Nonmetal': 'ametal', 'Noble gas': 'gas-nobre', 'Alkali metal': 'metal-alcalino', 'Alkaline earth metal': 'metal-alcalinoterroso',
  'Metalloid': 'semimetal', 'Halogen': 'halogenio', 'Post-transition metal': 'outros-metais', 'Transition metal': 'metal-de-transicao',
  'Lanthanide': 'lantanideo', 'Actinide': 'actinideo'
};

const strip = (html) => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;?/g, ' ').replace(/&plusmn;/g, '±').replace(/[ \t]+/g, ' ');

const download = async (dir) => {
  fs.mkdirSync(dir, { recursive: true });
  for (const [key, url] of Object.entries(SOURCES)) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${response.status}`);
    fs.writeFileSync(path.join(dir, FILES[key]), await response.text());
    console.log(`Baixado: ${url}`);
  }
};

const parseAbridged = (html) => {
  const result = {};
  strip(html).split('\n').forEach((line) => {
    const match = line.match(/^\s*(\d{1,3}) ([A-Z][a-z]?) ([a-z]+) +([\d.]+) ± ([\d.]+)/);
    if (match) result[Number(match[1])] = { simbolo: match[2], valor: Number(match[4]), texto: match[4], incerteza: Number(match[5]) };
  });
  return result;
};

// "43 Tc technetium 97 4.21(16) Ma", seguido de linhas alternativas como "98 4.2(3) Ma".
const parseRadioactive = (html) => {
  const result = {};
  let current = null;
  strip(html).split('\n').forEach((line) => {
    let match = line.match(/^\s*(\d{1,3}) ([A-Z][a-z]?) ([a-z]+) (\d{1,3}) /);
    if (match) {
      current = Number(match[1]);
      result[current] = { simbolo: match[2], massa: Number(match[4]), alternativas: [] };
      return;
    }
    match = line.match(/^\s*(\d{2,3}) [\d.]+\(/);
    if (match && current) result[current].alternativas.push(Number(match[1]));
    else if (line.trim() && !/^\s*\d/.test(line)) current = null;
  });
  return result;
};

const main = async () => {
  const dir = process.argv[2] ? path.resolve(process.argv[2]) : path.join(os.tmpdir(), 'visao-quimica-fontes');
  if (!process.argv[2]) await download(dir);
  const abridged = parseAbridged(fs.readFileSync(path.join(dir, FILES.abridged), 'utf8'));
  const radioactive = parseRadioactive(fs.readFileSync(path.join(dir, FILES.radioactive), 'utf8'));
  const table = JSON.parse(fs.readFileSync(path.join(dir, FILES.pubchem), 'utf8')).Table;
  const col = (name) => table.Columns.Column.indexOf(name);

  const elementos = table.Row.map(({ Cell: cell }) => {
    const z = Number(cell[col('AtomicNumber')]);
    const simbolo = cell[col('Symbol')];
    const base = abridged[z];
    const radio = radioactive[z];
    if (base && base.simbolo !== simbolo) throw new Error(`Símbolo divergente entre as fontes em Z=${z}.`);
    if (!base && !radio) throw new Error(`Sem massa atômica para Z=${z}.`);
    const categoria = CATEGORIAS[cell[col('GroupBlock')]];
    if (!categoria) throw new Error(`Categoria desconhecida "${cell[col('GroupBlock')]}" em Z=${z}.`);
    const en = cell[col('Electronegativity')];
    return {
      numeroAtomico: z,
      simbolo,
      nome: NOMES[z - 1],
      massaAtomica: base ? base.valor : radio.massa,
      massaAtomicaTexto: base ? base.texto : `[${radio.massa}]`,
      massaAtomicaTipo: base ? 'peso-atomico-padrao' : 'numero-de-massa-do-isotopo-mais-estavel',
      ...(base ? { incertezaMassa: base.incerteza } : { isotoposMaisEstaveis: [radio.massa, ...radio.alternativas] }),
      categoria,
      eletronegatividade: en === '' ? null : Number(en),
      configuracaoEletronica: String(cell[col('ElectronConfiguration')]).replace(/\s*\((calculated|predicted)\)\s*/i, '').replace(/\]\s*/, '] ').trim()
    };
  });

  const meta = {
    versao: '1.0.0',
    geradoEm: today,
    fontes: {
      massaAtomica: {
        descricao: 'Pesos atômicos padrão abreviados (Abridged Standard Atomic Weights), baseados no relatório Atomic Weights 2021, com as revisões de 2024 para Gd, Lu e Zr.',
        instituicao: 'IUPAC, Commission on Isotopic Abundances and Atomic Weights (CIAAW)',
        url: SOURCES.abridged,
        consultadoEm: today
      },
      radioativos: {
        descricao: 'Elementos sem peso atômico padrão: número de massa do isótopo mais estável, segundo a avaliação NUBASE2020 compilada pela CIAAW. Quando há mais de um candidato, o primeiro listado é usado em massaAtomica e todos ficam em isotoposMaisEstaveis.',
        instituicao: 'IUPAC, CIAAW',
        url: SOURCES.radioactive,
        consultadoEm: today
      },
      eletronegatividadeEConfiguracao: {
        descricao: 'Eletronegatividade na escala de Pauling e configuração eletrônica do estado fundamental (calculada para os elementos superpesados).',
        instituicao: 'PubChem, National Library of Medicine (NIH)',
        url: SOURCES.pubchem,
        consultadoEm: today
      }
    },
    observacoes: [
      'Grupo e período são calculados a partir do número atômico (src/domain/tabelaPeriodica.js).',
      'Lantanídeos (La–Lu) e actinídeos (Ac–Lr) aparecem em linhas separadas, como na maioria dos livros didáticos brasileiros. A IUPAC discute desde 2015 se o grupo 3 deve conter Lu e Lr ou La e Ac.',
      'Nomes em português segundo o uso brasileiro.',
      'Gerado por scripts/atualizar-elementos.mjs.'
    ]
  };

  fs.writeFileSync(outFile, `${JSON.stringify({ meta, elementos }, null, 2)}\n`);
  console.log(`${elementos.length} elementos gravados em ${path.relative(root, outFile)} (${Object.keys(abridged).length} com peso padrão, ${Object.keys(radioactive).length} radioativos).`);
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
