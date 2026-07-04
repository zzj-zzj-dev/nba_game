const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB } = require('./db');

const JWT_SECRET = 'nba_game_secret_key_2024';
const SALT_ROUNDS = 10;

async function register(username, password) {
  const db = getDB();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return { success: false, message: '用户名已存在' };
  }
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
  const token = jwt.sign({ userId: result.lastInsertRowid, username }, JWT_SECRET, { expiresIn: '7d' });
  return { success: true, token, user: { id: result.lastInsertRowid, username } };
}

async function login(username, password) {
  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return { success: false, message: '用户名或密码错误' };
  }
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return { success: false, message: '用户名或密码错误' };
  }
  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  return { success: true, token, user: { id: user.id, username: user.username } };
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: '登录已过期' });
  }
  req.user = decoded;
  next();
}

module.exports = { register, login, verifyToken, authMiddleware };
