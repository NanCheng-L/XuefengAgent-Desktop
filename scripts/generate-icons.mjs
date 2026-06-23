import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join } from 'path';

const SOURCE = '高考志愿助手 1.png';
const ICONS_DIR = 'src-tauri/icons';

const sizes = [
  { name: '32x32.png', size: 32 },
  { name: '128x128.png', size: 128 },
  { name: '128x128@2x.png', size: 256 },
  { name: 'icon.png', size: 512 },
  { name: 'Square30x30Logo.png', size: 30 },
  { name: 'Square44x44Logo.png', size: 44 },
  { name: 'Square71x71Logo.png', size: 71 },
  { name: 'Square89x89Logo.png', size: 89 },
  { name: 'Square107x107Logo.png', size: 107 },
  { name: 'Square142x142Logo.png', size: 142 },
  { name: 'Square150x150Logo.png', size: 150 },
  { name: 'Square284x284Logo.png', size: 284 },
  { name: 'Square310x310Logo.png', size: 310 },
  { name: 'StoreLogo.png', size: 50 },
];

async function generateIcons() {
  const source = sharp(SOURCE);
  const metadata = await source.metadata();
  console.log(`Source: ${SOURCE} (${metadata.width}x${metadata.height})`);

  for (const { name, size } of sizes) {
    await source
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(join(ICONS_DIR, name));
    console.log(`Generated: ${name} (${size}x${size})`);
  }

  // Generate ICO (Windows) with multiple sizes
  const icoSizes = [16, 32, 48, 64, 128, 256];
  const icoBuffers = await Promise.all(
    icoSizes.map(s => source.resize(s, s, { fit: 'cover' }).png().toBuffer())
  );
  
  // Build ICO file manually
  const icoHeader = Buffer.alloc(6);
  icoHeader.writeUInt16LE(0, 0);      // Reserved
  icoHeader.writeUInt16LE(1, 2);      // Type: ICO
  icoHeader.writeUInt16LE(icoSizes.length, 4); // Number of images

  let dataOffset = 6 + (icoSizes.length * 16);
  const entries = [];
  const images = [];

  for (let i = 0; i < icoSizes.length; i++) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(icoSizes[i] === 256 ? 0 : icoSizes[i], 0); // Width
    entry.writeUInt8(icoSizes[i] === 256 ? 0 : icoSizes[i], 1); // Height
    entry.writeUInt8(0, 2);  // Color palette
    entry.writeUInt8(0, 3);  // Reserved
    entry.writeUInt16LE(1, 4);  // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(icoBuffers[i].length, 8);  // Data size
    entry.writeUInt32LE(dataOffset, 12); // Data offset
    entries.push(entry);
    images.push(icoBuffers[i]);
    dataOffset += icoBuffers[i].length;
  }

  const icoFile = Buffer.concat([icoHeader, ...entries, ...images]);
  writeFileSync(join(ICONS_DIR, 'icon.ico'), icoFile);
  console.log('Generated: icon.ico');

  // Generate ICNS (macOS) - simplified: just use 512x512 PNG wrapped in ICNS
  const icns512 = await source.resize(512, 512, { fit: 'cover' }).png().toBuffer();
  const icns1024 = await source.resize(1024, 1024, { fit: 'cover' }).png().toBuffer();
  
  function makeIcnsEntry(type, data) {
    const entry = Buffer.alloc(8 + data.length);
    entry.write(type, 0, 4, 'ascii');
    entry.writeUInt32BE(8 + data.length, 4);
    data.copy(entry, 8);
    return entry;
  }

  const icnsEntries = [
    makeIcnsEntry('ic07', icns512),   // 512x512
    makeIcnsEntry('ic09', icns1024),  // 1024x1024
  ];

  const icnsBody = Buffer.concat(icnsEntries);
  const icnsHeader = Buffer.alloc(8);
  icnsHeader.write('icns', 0, 4, 'ascii');
  icnsHeader.writeUInt32BE(8 + icnsBody.length, 4);
  
  const icnsFile = Buffer.concat([icnsHeader, icnsBody]);
  writeFileSync(join(ICONS_DIR, 'icon.icns'), icnsFile);
  console.log('Generated: icon.icns');

  console.log('\nAll icons generated!');
}

generateIcons().catch(console.error);
