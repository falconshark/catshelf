const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const EPub = require('epub');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const EPUB_DIR = path.join(__dirname, '..', 'epub');

// Store uploads temporarily, then we rename them
const upload = multer({ dest: path.join(EPUB_DIR, 'tmp') });

function randomName() {
  return crypto.randomBytes(6).toString('hex');
}

// Parse EPUB metadata and extract cover image
function parseEpub(filePath) {
  return new Promise((resolve, reject) => {
    const epub = new EPub(filePath);

    epub.on('end', () => {
      const creatorRaw = epub.metadata.creator;
      const authors = creatorRaw
        ? (Array.isArray(creatorRaw) ? creatorRaw : [creatorRaw])
        : [];

      const coverId = epub.metadata.cover;

      if (coverId) {
        epub.getImage(coverId, (err, data, mimeType) => {
          if (err || !data) {
            resolve({ title: epub.metadata.title || 'Unknown Title', authors, coverData: null, coverExt: null });
          } else {
            const ext = mimeType && mimeType.includes('png') ? '.png' : '.jpg';
            resolve({ title: epub.metadata.title || 'Unknown Title', authors, coverData: data, coverExt: ext });
          }
        });
      } else {
        resolve({ title: epub.metadata.title || 'Unknown Title', authors, coverData: null, coverExt: null });
      }
    });

    epub.on('error', reject);
    epub.parse();
  });
}

// Clean up a tmp upload file if something goes wrong
function cleanupTmp(file) {
  if (file && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
}

// Remove an epub or cover file by its stored URL path (e.g. /epub/abc123.epub)
function removeStoredFile(urlPath) {
  if (!urlPath) return;
  const filename = path.basename(urlPath);
  const fullPath = path.join(EPUB_DIR, filename);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

// GET /api/v1/book/
router.get('/book/', requireAuth, async (req, res) => {
  try {
    const [books] = await db.query('SELECT * FROM books ORDER BY created_at DESC');
    res.json(books);
  } catch (error) {
    console.error('List books error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/v1/book/:id/
router.get('/book/:id/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Book not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/book/
// Multipart: file (epub)
router.post('/book/', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No EPUB file uploaded' });

  const name = randomName();
  const epubPath = path.join(EPUB_DIR, `${name}.epub`);

  try {
    fs.renameSync(req.file.path, epubPath);

    const meta = await parseEpub(epubPath);

    const fileUrl = `/epub/${name}.epub`;
    let coverUrl = '';

    if (meta.coverData && meta.coverExt) {
      const coverFilename = `${name}${meta.coverExt}`;
      fs.writeFileSync(path.join(EPUB_DIR, coverFilename), meta.coverData);
      coverUrl = `/epub/${coverFilename}`;
    }

    const [result] = await db.query(
      'INSERT INTO books (title, author, file, cover) VALUES (?, ?, ?, ?)',
      [meta.title, JSON.stringify(meta.authors), fileUrl, coverUrl]
    );

    res.json({
      id: result.insertId,
      title: meta.title,
      author: meta.authors,
      file: fileUrl,
      cover: coverUrl,
    });
  } catch (error) {
    if (fs.existsSync(epubPath)) fs.unlinkSync(epubPath);
    cleanupTmp(req.file);
    console.error('Create book error:', error);
    res.status(500).json({ error: 'Failed to process EPUB file' });
  }
});

// PATCH /api/v1/book/:id/
// Multipart: data (JSON string), file (optional image for cover)
router.patch('/book/:id/', requireAuth, upload.single('file'), async (req, res) => {
  const bookData = req.body.data ? JSON.parse(req.body.data) : {};
  const fields = {};

  if (bookData.title !== undefined) fields.title = bookData.title;
  if (bookData.author !== undefined) fields.author = JSON.stringify(bookData.author);
  if (bookData.description !== undefined) fields.description = bookData.description;
  if (bookData.isbn !== undefined) fields.isbn = bookData.isbn;

  // A new cover image was uploaded
  if (req.file) {
    const name = randomName();
    const coverFilename = `${name}${path.extname(req.file.originalname)}`;
    const coverPath = path.join(EPUB_DIR, coverFilename);
    fs.renameSync(req.file.path, coverPath);
    fields.cover = `/epub/${coverFilename}`;
  }

  if (Object.keys(fields).length === 0) {
    cleanupTmp(req.file);
    return res.status(400).json({ error: 'No fields to update' });
  }

  try {
    const setClauses = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    await db.query(
      `UPDATE books SET ${setClauses} WHERE id = ?`,
      [...Object.values(fields), req.params.id]
    );

    const [rows] = await db.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    cleanupTmp(req.file);
    console.error('Update book error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/v1/book/:id/
router.delete('/book/:id/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Book not found' });

    const book = rows[0];
    removeStoredFile(book.file);
    removeStoredFile(book.cover);

    await db.query('DELETE FROM books WHERE id = ?', [req.params.id]);
    res.json({ id: Number(req.params.id) });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
