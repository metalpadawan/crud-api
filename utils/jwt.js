// utils/jwt.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'replace-me-strong-secret';
const JWT_EXP = '7d';

function signUser(user) {
  // minimal payload; avoid sending password, etc.
  const payload = { id: user._id, email: user.email, role: user.role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXP });
}

module.exports = { signUser, JWT_SECRET };
