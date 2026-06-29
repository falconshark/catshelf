const express = require('express');
const router = express.Router();
const db = require('../db');
const requireAuth = require('../middleware/auth');

// GET /api/v1/user/
router.get('/user/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username FROM users');
    res.json(rows);
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/v1/user/:id/
router.get('/user/:id/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
