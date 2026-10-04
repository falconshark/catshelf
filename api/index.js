const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set to a random string of at least 32 characters.');
  process.exit(1);
}

const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const userRoutes = require('./routes/users');
const { EPUB_DIR } = require('./routes/books');

const app = express();
const PORT = process.env.PORT || 8000;

// Set TRUST_PROXY=1 when running behind a reverse proxy, so rate limiting sees real client IPs.
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));

app.use(helmet({
  // Covers and epubs are loaded from the web app, which lives on another origin.
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://127.0.0.1:3000',
}));
app.use(express.json({ limit: '10kb' }));

// Cover images and epub files. File names are random and unguessable; dotfiles
// (the upload temp dir) are never served.
app.use('/api/v1/epub', express.static(EPUB_DIR, { dotfiles: 'deny', index: false }));

app.use('/', authRoutes);
app.use('/api/v1', bookRoutes.router);
app.use('/api/v1', userRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : 'Invalid upload' });
  }
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: 'Bad request' });
  }
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Catshelf API running on http://localhost:${PORT}`);
});
