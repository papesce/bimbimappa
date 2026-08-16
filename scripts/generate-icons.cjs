// Generate placeholder PWA icons as simple coral-colored PNGs
// Run: node scripts/generate-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c, table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeData));
  return Buffer.concat([len, typeData, crc]);
}

function generateIcon(size, filename) {
  const r = 255, g = 107, b = 107; // coral
  const rawData = [];
  for (let y = 0; y < size; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < size; x++) {
      // Rounded rectangle with ~20% corner radius
      const cornerR = size * 0.18;
      const inCorner = (x < cornerR || x > size - cornerR) && (y < cornerR || y > size - cornerR);
      const dx = Math.max(0, cornerR - Math.min(x, size - x));
      const dy = Math.max(0, cornerR - Math.min(y, size - y));
      const inRound = dx * dx + dy * dy > cornerR * cornerR;
      if (inRound) {
        rawData.push(255, 255, 255, 0); // transparent
      } else {
        rawData.push(r, g, b, 255);
      }
    }
  }
  const compressed = zlib.deflateSync(Buffer.from(rawData));

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const png = Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);

  fs.writeFileSync(path.join(__dirname, '..', 'public', filename), png);
  console.log(`Created public/${filename} (${size}x${size}, ${png.length} bytes)`);
}

generateIcon(192, 'icon-192.png');
generateIcon(512, 'icon-512.png');
