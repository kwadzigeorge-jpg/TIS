const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

function signTokens(user) {
  const payload = { id: user.id, email: user.email, is_admin: user.is_admin };
  const access = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
  const refresh = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });
  return { access, refresh };
}

async function register({ email, password, name }) {
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) throw Object.assign(new Error('Email already in use'), { status: 409 });

  const password_hash = await bcrypt.hash(password, 12);
  const { rows } = await db.query(
    'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *',
    [email, password_hash, name]
  );
  const user = rows[0];
  return { user, tokens: signTokens(user) };
}

async function login({ email, password }) {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  if (user.auth_provider !== 'email') throw Object.assign(new Error(`Please sign in with ${user.auth_provider}`), { status: 401 });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw Object.assign(new Error('Invalid credentials'), { status: 401 });

  return { user, tokens: signTokens(user) };
}

async function googleAuth({ google_id, email, name, avatar_url }) {
  let { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  let user = rows[0];

  if (!user) {
    const res = await db.query(
      'INSERT INTO users (email, name, avatar_url, auth_provider, provider_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [email, name, avatar_url, 'google', google_id]
    );
    user = res.rows[0];
  }

  return { user, tokens: signTokens(user) };
}

async function refreshTokens(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }

  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [payload.id]);
  if (!rows.length) throw Object.assign(new Error('User not found'), { status: 401 });

  return signTokens(rows[0]);
}

async function changePassword(userId, currentPassword, newPassword) {
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  const user = rows[0];
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  if (user.auth_provider !== 'email') throw Object.assign(new Error('Cannot change password for social login accounts'), { status: 400 });

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw Object.assign(new Error('Current password is incorrect'), { status: 401 });

  const password_hash = await bcrypt.hash(newPassword, 12);
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, userId]);
}

module.exports = { register, login, googleAuth, refreshTokens, changePassword };
