const express = require('express');
const { rateLimit } = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { validateNewCredentials, hashPassword, verifyPassword } = require('../lib/credentials');

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// Slow down password guessing. Successful logins don't count against the limit.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later' },
});

// POST /api-token-auth/
// Body: { username, password }
// Returns: { token }
router.post('/api-token-auth/', authLimiter, async (req, res) => {
  const { username, password } = req.body ?? {};

  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (username.length > 150 || password.length > 1024) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  try {
    const [rows] = await db.query('SELECT id, username, password FROM users WHERE username = ?', [username]);
    const user = rows[0];

    if (!(await verifyPassword(password, user?.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ token: signToken(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/register/
// Self-registration is off unless ALLOW_REGISTRATION=true.
// Body: { username, password }
// Returns: { token }
router.post('/api/register/', authLimiter, async (req, res) => {
  if (process.env.ALLOW_REGISTRATION !== 'true') {
    return res.status(403).json({ error: 'Registration is disabled' });
  }

  const invalid = validateNewCredentials(req.body);
  if (invalid) return res.status(400).json({ error: invalid });

  try {
    const { username, password } = req.body;
    const [result] = await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [
      username,
      await hashPassword(password),
    ]);
    res.status(201).json({ token: signToken({ id: result.insertId, username }) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'That username is already taken.' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
