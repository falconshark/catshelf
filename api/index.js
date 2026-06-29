require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://127.0.0.1:3000',
}));
app.use(express.json());

// Serve cover images and epub files at the same path the frontend expects
app.use('/api/v1/epub', express.static(path.join(__dirname, 'epub')));

app.use('/', authRoutes);
app.use('/api/v1', bookRoutes);
app.use('/api/v1', userRoutes);

app.listen(PORT, () => {
  console.log(`Catshelf API running on http://localhost:${PORT}`);
});
