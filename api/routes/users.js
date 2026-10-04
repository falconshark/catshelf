const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const { validateNewCredentials, hashPassword } = require('../lib/credentials');

const router = express.Router();

router.param('id', (req, res, next, id) => {
  if (!/^\d{1,10}$/.test(id)) return res.status(400).json({ error: 'Invalid id' });
  next();
});

// POST /api/v1/user/
router.post('/user/', requireAuth, async (req, res) => {
  const invalid = validateNewCredentials(req.body);
  if (invalid) return res.status(400).json({ error: invalid });

  try {
    const { username, password } = req.body;
    const [result] = await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [
      username,
      await hashPassword(password),
    ]);
    res.status(201).json({ id: result.insertId, username });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'That username is already taken. Please choose another one.' });
    }
    console.error('Create user error:', error);
    res.status(500).json({ error: "Sorry, we couldn't create the user right now. Please try again later." });
  }
});

// GET /api/v1/user/
router.get('/user/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username FROM users');
    res.json(rows);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: "Sorry, we couldn't load the user list right now. Please try again later." });
  }
});

// GET /api/v1/user/:id/
router.get('/user/:id/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: "We couldn't find a user with that ID." });
    res.json(rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: "Sorry, we couldn't load that user right now. Please try again later." });
  }
});

module.exports = router;
