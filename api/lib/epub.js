const yauzl = require('yauzl');
const { XMLParser } = require('fast-xml-parser');

// Limits against zip bombs and absurd files. Entries are only ever read into
// memory (never extracted to disk), so there is no path traversal to worry about.
const MAX_ENTRIES = 20000;
const MAX_XML_BYTES = 2 * 1024 * 1024;
const MAX_COVER_BYTES = 10 * 1024 * 1024;

const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  // dc:title is sometimes <dc:title id="t1">Name</dc:title>
  textNodeName: '#text',
  processEntities: true,
});

const asArray = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);
const textOf = (v) => String(typeof v === 'object' && v !== null ? (v['#text'] ?? '') : v).trim();

function openZip(filePath) {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true, validateEntrySizes: true, autoClose: false }, (err, zip) => (err ? reject(err) : resolve(zip)));
  });
}

function indexEntries(zip) {
  return new Promise((resolve, reject) => {
    const entries = new Map();
    zip.on('entry', (entry) => {
      if (entries.size >= MAX_ENTRIES) return reject(new Error('Too many entries in EPUB'));
      entries.set(entry.fileName, entry);
      zip.readEntry();
    });
    zip.on('end', () => resolve(entries));
    zip.on('error', reject);
    zip.readEntry();
  });
}

function readEntry(zip, entry, maxBytes) {
  return new Promise((resolve, reject) => {
    if (entry.uncompressedSize > maxBytes) return reject(new Error(`${entry.fileName} is too large`));
    zip.openReadStream(entry, (err, stream) => {
      if (err) return reject(err);
      const chunks = [];
      let size = 0;
      stream.on('data', (chunk) => {
        size += chunk.length;
        if (size > maxBytes) {
          stream.destroy();
          reject(new Error(`${entry.fileName} is too large`));
        } else {
          chunks.push(chunk);
        }
      });
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  });
}

// Resolve an href from the OPF relative to the OPF's own directory, staying inside the archive.
function resolveInArchive(opfPath, href) {
  const base = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
  const parts = [];
  for (const seg of (base + decodeURIComponent(href.split('#')[0])).split('/')) {
    if (seg === '..') parts.pop();
    else if (seg && seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}

// Returns { title, authors, coverData } where coverData is a Buffer or null.
// Image type is not decided here; the caller sniffs the bytes.
async function parseEpub(filePath) {
  const zip = await openZip(filePath);
  try {
    const entries = await indexEntries(zip);
    const read = (name, max) => {
      const entry = entries.get(name);
      if (!entry) throw new Error(`Missing ${name}`);
      return readEntry(zip, entry, max);
    };

    const container = xml.parse((await read('META-INF/container.xml', MAX_XML_BYTES)).toString('utf8'));
    const opfPath = asArray(container.container?.rootfiles?.rootfile)[0]?.['@_full-path'];
    if (!opfPath) throw new Error('No rootfile in container.xml');

    const pkg = xml.parse((await read(opfPath, MAX_XML_BYTES)).toString('utf8')).package;
    if (!pkg) throw new Error('Invalid OPF');

    const title = textOf(asArray(pkg.metadata?.title)[0] ?? '') || 'Unknown Title';
    const authors = asArray(pkg.metadata?.creator).map(textOf).filter(Boolean);

    // EPUB2: <meta name="cover" content="<manifest id>">; EPUB3: manifest item with properties="cover-image"
    const items = asArray(pkg.manifest?.item);
    const coverMetaId = asArray(pkg.metadata?.meta).find((m) => m['@_name'] === 'cover')?.['@_content'];
    const coverItem =
      items.find((i) => String(i['@_properties'] ?? '').split(/\s+/).includes('cover-image')) ??
      items.find((i) => i['@_id'] === coverMetaId);

    let coverData = null;
    if (coverItem?.['@_href']) {
      const entry = entries.get(resolveInArchive(opfPath, coverItem['@_href']));
      if (entry) coverData = await readEntry(zip, entry, MAX_COVER_BYTES).catch(() => null);
    }

    return { title, authors, coverData };
  } finally {
    zip.close();
  }
}

module.exports = { parseEpub };
