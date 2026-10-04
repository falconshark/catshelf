const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const crypto = require('crypto');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const { parseEpub } = require('../lib/epub');
const { sniffImageExt, looksLikeZip, readHead, removeQuietly } = require('../lib/files');

const router = express.Router();

const EPUB_DIR = path.join(__dirname, '..', 'epub');
// Inside EPUB_DIR so rename() stays on one filesystem (EPUB_DIR is a Docker
// volume), but hidden from express.static via dotfiles: 'deny'.
const TMP_DIR = path.join(EPUB_DIR, '.tmp');
fsSync.mkdirSync(TMP_DIR, { recursive: true });

const MAX_EPUB_BYTES = 100 * 1024 * 1024;
const MAX_COVER_BYTES = 5 * 1024 * 1024;

const uploadEpub = multer({ dest: TMP_DIR, limits: { fileSize: MAX_EPUB_BYTES, files: 1 } });
const uploadCover = multer({ dest: TMP_DIR, limits: { fileSize: MAX_COVER_BYTES, files: 1, fields: 5 } });

router.param('id', (req, res, next, id) => {
  if (!/^\d{1,10}$/.test(id)) return res.status(400).json({ error: 'Invalid id' });
  next();
});

function randomName() {
  return crypto.randomBytes(16).toString('hex');
}

// Remove a stored epub or cover by its URL path (e.g. /epub/abc123.epub).
// basename() keeps a tampered DB value from escaping EPUB_DIR.
function removeStoredFile(urlPath) {
  return urlPath ? removeQuietly(path.join(EPUB_DIR, path.basename(urlPath))) : Promise.resolve();
}

const isString = (v, max) => typeof v === 'string' && v.length <= max;

// Validate the `data` JSON of a PATCH. Returns { fields } or { error }.
function parseBookPatch(raw) {
  let data = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      return { error: 'data must be valid JSON' };
    }
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return { error: 'data must be an object' };
    }
  }

  const fields = {};

  if (data.title !== undefined) {
    if (!isString(data.title, 256) || !data.title.trim()) return { error: 'Invalid title' };
    fields.title = data.title.trim();
  }
  if (data.author !== undefined) {
    if (!Array.isArray(data.author) || data.author.length > 50 || !data.author.every((a) => isString(a, 200))) {
      return { error: 'Invalid author' };
    }
    fields.author = JSON.stringify(data.author.map((a) => a.trim()).filter(Boolean));
  }
  if (data.description !== undefined) {
    if (!isString(data.description, 20000)) return { error: 'Invalid description' };
    fields.description = data.description;
  }
  if (data.isbn !== undefined) {
    if (!isString(data.isbn, 32)) return { error: 'Invalid ISBN' };
    const isbn = data.isbn.replace(/[-\s]/g, '');
    if (isbn && !/^(\d{9}[\dXx]|\d{13})$/.test(isbn)) return { error: 'Invalid ISBN' };
    fields.isbn = isbn ? isbn.toUpperCase() : null;
  }

  return { fields };
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
router.post('/book/', requireAuth, uploadEpub.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No EPUB file uploaded' });

  const name = randomName();
  const epubPath = path.join(EPUB_DIR, `${name}.epub`);
  let coverPath = null;

  try {
    if (!looksLikeZip(await readHead(req.file.path))) {
      return res.status(400).json({ error: 'File is not a valid EPUB' });
    }

    let meta;
    try {
      meta = await parseEpub(req.file.path);
    } catch (error) {
      console.warn('Rejected EPUB:', error.message);
      return res.status(400).json({ error: 'File is not a valid EPUB' });
    }

    await fs.rename(req.file.path, epubPath);
    const fileUrl = `/epub/${name}.epub`;
    let coverUrl = '';

    const coverExt = meta.coverData && sniffImageExt(meta.coverData);
    if (coverExt) {
      coverPath = path.join(EPUB_DIR, `${name}${coverExt}`);
      await fs.writeFile(coverPath, meta.coverData);
      coverUrl = `/epub/${name}${coverExt}`;
    }

    const title = meta.title.slice(0, 256);
    const authors = meta.authors.slice(0, 50).map((a) => a.slice(0, 200));

    const [result] = await db.query(
      'INSERT INTO books (title, author, file, cover) VALUES (?, ?, ?, ?)',
      [title, JSON.stringify(authors), fileUrl, coverUrl]
    );

    res.json({ id: result.insertId, title, author: authors, file: fileUrl, cover: coverUrl });
  } catch (error) {
    await Promise.all([removeQuietly(epubPath), removeQuietly(coverPath)]);
    console.error('Create book error:', error);
    res.status(500).json({ error: 'Failed to process EPUB file' });
  } finally {
    await removeQuietly(req.file.path);
  }
});

// PATCH /api/v1/book/:id/
// Multipart: data (JSON string), file (optional image for cover)
router.patch('/book/:id/', requireAuth, uploadCover.single('file'), async (req, res) => {
  let newCoverPath = null;

  try {
    const { fields, error } = parseBookPatch(req.body.data);
    if (error) return res.status(400).json({ error });

    const [existing] = await db.query('SELECT cover FROM books WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Book not found' });
    const oldCover = existing[0].cover;

    // A new cover image was uploaded
    if (req.file) {
      const ext = sniffImageExt(await readHead(req.file.path));
      if (!ext) return res.status(400).json({ error: 'Cover must be a PNG, JPEG, GIF or WebP image' });

      const coverFilename = `${randomName()}${ext}`;
      newCoverPath = path.join(EPUB_DIR, coverFilename);
      await fs.rename(req.file.path, newCoverPath);
      fields.cover = `/epub/${coverFilename}`;
    }

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Column names come from parseBookPatch's fixed set above, never from the request.
    const setClauses = Object.keys(fields).map((k) => `${k} = ?`).join(', ');
    await db.query(`UPDATE books SET ${setClauses} WHERE id = ?`, [...Object.values(fields), req.params.id]);

    if (newCoverPath) await removeStoredFile(oldCover);

    const [rows] = await db.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) {
    await removeQuietly(newCoverPath);
    console.error('Update book error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    await removeQuietly(req.file?.path);
  }
});

// DELETE /api/v1/book/:id/
router.delete('/book/:id/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT file, cover FROM books WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Book not found' });

    // Row first: a failed file removal leaves an orphan file, not a book that points at nothing.
    await db.query('DELETE FROM books WHERE id = ?', [req.params.id]);
    await Promise.all([removeStoredFile(rows[0].file), removeStoredFile(rows[0].cover)]);

    res.json({ id: Number(req.params.id) });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = { router, EPUB_DIR };
