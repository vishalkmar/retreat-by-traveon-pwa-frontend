// Tiny PNG icon generator using only Node built-ins (zlib + crypto). Runs
// at install time via `npm run prepare` (also wired into the build script).
//
// The result is a solid teal square with a centred white "R" — enough for
// install/manifest validation. Replace with branded artwork when ready.

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');

// 5x7 dot-matrix glyph for "R"
const R_GLYPH = [
  '11110',
  '10001',
  '10001',
  '11110',
  '10100',
  '10010',
  '10001',
];

const TEAL = [15, 118, 110];
const WHITE = [255, 255, 255];

const crc32 = (buf) => {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c;
  }
  let crc = 0xFFFFFFFF;
  for (const b of buf) crc = table[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
};

const buildPng = (size) => {
  const glyphScale = Math.floor(size / 16);
  const glyphW = 5 * glyphScale;
  const glyphH = 7 * glyphScale;
  const offX = Math.floor((size - glyphW) / 2);
  const offY = Math.floor((size - glyphH) / 2);

  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    row[0] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const gx = x - offX;
      const gy = y - offY;
      let color = TEAL;
      if (gx >= 0 && gx < glyphW && gy >= 0 && gy < glyphH) {
        const gRow = Math.floor(gy / glyphScale);
        const gCol = Math.floor(gx / glyphScale);
        if (R_GLYPH[gRow] && R_GLYPH[gRow][gCol] === '1') color = WHITE;
      }
      row[1 + x * 3] = color[0];
      row[2 + x * 3] = color[1];
      row[3 + x * 3] = color[2];
    }
    rows.push(row);
  }

  const raw = Buffer.concat(rows);
  const idat = zlib.deflateSync(raw);

  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
};

if (!existsSync(PUBLIC)) mkdirSync(PUBLIC, { recursive: true });
writeFileSync(join(PUBLIC, 'pwa-192.png'), buildPng(192));
writeFileSync(join(PUBLIC, 'pwa-512.png'), buildPng(512));
writeFileSync(join(PUBLIC, 'apple-touch-icon.png'), buildPng(180));
console.log('Generated pwa-192.png, pwa-512.png, apple-touch-icon.png');
