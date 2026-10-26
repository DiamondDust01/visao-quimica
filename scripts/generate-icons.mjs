// Gera os ícones e a tela de abertura a partir dos SVGs de assets/.
// - public/icon.png: ícone da janela do Electron (o SVG já serve de favicon na web);
// - assets/icon.ico: ícone do executável do Windows (aplicado no empacotamento);
// - Android: ic_launcher, ic_launcher_round e ic_launcher_foreground em cada densidade,
//   e splash.png em cada pasta drawable*, no mesmo tamanho do arquivo que já existe lá.
// Uso: npm run icons (depois de `npx cap add android`).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const asset = (name) => fs.readFileSync(path.join(root, 'assets', name));
const res = path.join(root, 'android', 'app', 'src', 'main', 'res');

// Tamanhos do ícone legado e do primeiro plano adaptável (108 dp) por densidade.
const DENSITIES = { mdpi: [48, 108], hdpi: [72, 162], xhdpi: [96, 216], xxhdpi: [144, 324], xxxhdpi: [192, 432] };
export const ADAPTIVE_BACKGROUND = '#0F3D3A';

const icon = asset('icon.svg');
const foreground = asset('icon-foreground.svg');
const splash = asset('splash.svg');

const png = (svg, size) => sharp(svg, { density: 300 }).resize(size, size).png();

// ICO com as imagens em PNG (aceito desde o Windows Vista): cabeçalho, diretório e imagens.
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];
async function ico(svg) {
  const images = await Promise.all(ICO_SIZES.map((size) => png(svg, size).toBuffer()));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map((image, index) => {
    const entry = Buffer.alloc(16);
    const size = ICO_SIZES[index];
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(image.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += image.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images]);
}

const roundMask = (size) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`);

async function main() {
  await png(icon, 512).toFile(path.join(root, 'public', 'icon.png'));
  fs.writeFileSync(path.join(root, 'assets', 'icon.ico'), await ico(icon));

  if (!fs.existsSync(res)) {
    console.log('Pasta android/ não encontrada: gerei só public/icon.png. Rode `npx cap add android` e depois `npm run icons`.');
    return;
  }

  for (const [density, [legacy, adaptive]] of Object.entries(DENSITIES)) {
    const dir = path.join(res, `mipmap-${density}`);
    fs.mkdirSync(dir, { recursive: true });
    await png(icon, legacy).toFile(path.join(dir, 'ic_launcher.png'));
    await png(icon, legacy).composite([{ input: roundMask(legacy), blend: 'dest-in' }]).toFile(path.join(dir, 'ic_launcher_round.png'));
    await png(foreground, adaptive).toFile(path.join(dir, 'ic_launcher_foreground.png'));
  }

  fs.writeFileSync(path.join(res, 'values', 'ic_launcher_background.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${ADAPTIVE_BACKGROUND}</color>
</resources>
`);

  const splashDirs = fs.readdirSync(res).filter((name) => name.startsWith('drawable') && fs.existsSync(path.join(res, name, 'splash.png')));
  for (const name of splashDirs) {
    const target = path.join(res, name, 'splash.png');
    const { width, height } = await sharp(target).metadata();
    const buffer = await sharp(splash, { density: 150 }).resize(width, height, { fit: 'cover' }).png().toBuffer();
    fs.writeFileSync(target, buffer);
  }

  console.log(`Ícones gerados em ${Object.keys(DENSITIES).length} densidades e ${splashDirs.length} telas de abertura.`);
}

main().catch((error) => {
  console.error('Falha ao gerar os ícones:', error);
  process.exitCode = 1;
});
