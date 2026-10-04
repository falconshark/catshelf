const fs = require('fs/promises');

// Type detection is done on the file contents. Anything the client says about
// the file (name, extension, Content-Type) is never trusted.
const IMAGE_SIGNATURES = [
  { ext: '.png', test: (b) => b.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) },
  { ext: '.jpg', test: (b) => b.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex')) },
  { ext: '.gif', test: (b) => ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('latin1')) },
  {
    ext: '.webp',
    test: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
];

// Returns '.png' / '.jpg' / '.gif' / '.webp', or null when it isn't a supported image.
function sniffImageExt(buf) {
  return IMAGE_SIGNATURES.find((s) => s.test(buf))?.ext ?? null;
}

// An EPUB is a zip archive.
function looksLikeZip(buf) {
  return buf.subarray(0, 4).equals(Buffer.from('504b0304', 'hex'));
}

async function readHead(filePath, length = 16) {
  const handle = await fs.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buf, 0, length, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

// Best-effort delete: a missing file is fine.
function removeQuietly(filePath) {
  return filePath ? fs.rm(filePath, { force: true }).catch(() => {}) : Promise.resolve();
}

module.exports = { sniffImageExt, looksLikeZip, readHead, removeQuietly };
