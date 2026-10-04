const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Token ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    // Pin the algorithm so a token can never pick its own
    req.user = jwt.verify(authHeader.slice(6), process.env.JWT_SECRET, { algorithms: ['HS256'] });
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
