/* frontend/scripts/generateIcons.js */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');
const iconsDir = path.join(publicDir, 'icons');
const sourceIcon = path.join(publicDir, 'icons', 'icon-512.png');

async function makeRoundedFavicon(sourceBuffer, size) {
  const pad = Math.round(size * 0.125);
  const innerSize = size - (pad * 2);
  const rx = Math.round(innerSize * 0.22);

  const maskSvg = `<svg width="${size}" height="${size}"><rect x="${pad}" y="${pad}" width="${innerSize}" height="${innerSize}" rx="${rx}" ry="${rx}" fill="#fff"/></svg>`;

  return await sharp(sourceBuffer)
    .resize(size, size)
    .composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function generateAll() {
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const sourceBuffer = fs.readFileSync(sourceIcon);

  // 1. Resized PNG icons in public/icons
  const sizes = [48, 72, 96, 128, 192, 256, 512];
  for (const s of sizes) {
    const targetFile = path.join(iconsDir, 'icon-' + s + '.png');
    await sharp(sourceBuffer)
      .resize(s, s)
      .png()
      .toFile(targetFile);
    console.log('Generated icon-' + s + '.png');
  }

  // 2. Favicons in public (con bordes redondeados y padding)
  const fav16 = await makeRoundedFavicon(sourceBuffer, 16);
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), fav16);

  const fav32 = await makeRoundedFavicon(sourceBuffer, 32);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), fav32);

  await sharp(sourceBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated favicons and apple-touch-icon (180x180)');

  // 3. Multi-size favicon.ico (16, 32, 48) con bordes redondeados
  const fav48 = await makeRoundedFavicon(sourceBuffer, 48);
  const pngBuffers = [
    { size: 16, buffer: fav16 },
    { size: 32, buffer: fav32 },
    { size: 48, buffer: fav48 }
  ];

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngBuffers.length, 4);

  let offset = 6 + (16 * pngBuffers.length);
  const dirEntries = [];
  for (const item of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.size === 256 ? 0 : item.size, 0);
    entry.writeUInt8(item.size === 256 ? 0 : item.size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(item.buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    offset += item.buffer.length;
  }

  const finalIco = Buffer.concat([header, ...dirEntries, ...pngBuffers.map(p => p.buffer)]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), finalIco);
  console.log('Generated favicon.ico successfully (' + finalIco.length + ' bytes)!');
}

generateAll().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
