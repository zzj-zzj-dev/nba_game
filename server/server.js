/**
 * server.js — 主服务器入口
 * HTTP API + WebSocket 实时对战
 * 启动：node server/server.js
 */
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const { initDB } = require('./db');
const { register, login, authMiddleware } = require('./auth');
const { createRoom, joinRoom, handlePlayerAction, handleDisconnect } = require('./game');

// 初始化数据库
initDB();

const app = express();
const server = http.createServer(app);

// WebSocket
const wss = new WebSocketServer({ server });

// 中间件
app.use(express.json());

// 静态文件 — 服务前端
app.use(express.static(path.join(__dirname, '..')));

// =================== API 路由 ===================

// 注册
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || username.length < 2 || password.length < 4) {
    return res.json({ success: false, message: '用户名至少2字符，密码至少4字符' });
  }
  const result = await register(username, password);
  res.json(result);
});

// 登录
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ success: false, message: '请输入用户名和密码' });
  }
  const result = await login(username, password);
  res.json(result);
});

// 获取用户信息
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

// 存档 - 保存
app.post('/api/save', authMiddleware, (req, res) => {
  const { getDB } = require('./db');
  const db = getDB();
  const { saveName, gameData } = req.body;
  const name = saveName || 'default';
  try {
    db.prepare(`
      INSERT INTO saves (user_id, save_name, game_data, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, save_name)
      DO UPDATE SET game_data = ?, updated_at = CURRENT_TIMESTAMP
    `).run(req.user.userId, name, JSON.stringify(gameData), JSON.stringify(gameData));
    res.json({ success: true, message: '存档成功' });
  } catch (e) {
    res.json({ success: false, message: '存档失败: ' + e.message });
  }
});

// 存档 - 读取
app.get('/api/save', authMiddleware, (req, res) => {
  const { getDB } = require('./db');
  const db = getDB();
  const saveName = req.query.name || 'default';
  const row = db.prepare('SELECT game_data, updated_at FROM saves WHERE user_id = ? AND save_name = ?').get(req.user.userId, saveName);
  if (row) {
    res.json({ success: true, data: JSON.parse(row.game_data), updatedAt: row.updated_at });
  } else {
    res.json({ success: false, message: '没有存档' });
  }
});

// 对战记录
app.get('/api/matches', authMiddleware, (req, res) => {
  const { getDB } = require('./db');
  const db = getDB();
  const matches = db.prepare(`
    SELECT m.*, u1.username as player1_name, u2.username as player2_name
    FROM matches m
    JOIN users u1 ON m.player1_id = u1.id
    JOIN users u2 ON m.player2_id = u2.id
    WHERE m.player1_id = ? OR m.player2_id = ?
    ORDER BY m.played_at DESC
    LIMIT 20
  `).all(req.user.userId, req.user.userId);
  res.json({ success: true, matches });
});

// 保存对战结果
app.post('/api/matches', authMiddleware, (req, res) => {
  const { getDB } = require('./db');
  const db = getDB();
  const { opponentId, winnerId, player1Score, player2Score } = req.body;
  try {
    db.prepare(`
      INSERT INTO matches (player1_id, player2_id, winner_id, player1_score, player2_score)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.userId, opponentId, winnerId, player1Score, player2Score);
    res.json({ success: true, message: '记录已保存' });
  } catch (e) {
    res.json({ success: false, message: '保存失败' });
  }
});

// =================== WebSocket 连接 ===================

wss.on('connection', (ws, req) => {
  console.log('🔌 新的WebSocket连接');
  let currentUser = null;

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      
      switch (data.type) {
        case 'auth':
          // 验证token并绑定用户
          const { verifyToken } = require('./auth');
          const decoded = verifyToken(data.token);
          if (decoded) {
            currentUser = decoded;
            ws.send(JSON.stringify({ type: 'auth_ok', user: decoded }));
          } else {
            ws.send(JSON.stringify({ type: 'auth_error', message: 'token无效' }));
          }
          break;

        case 'create_room':
          if (currentUser) {
            createRoom(ws, currentUser);
          }
          break;

        case 'join_room':
          if (currentUser) {
            joinRoom(ws, currentUser, data.roomId);
          }
          break;

        case 'action':
          if (currentUser) {
            handlePlayerAction(ws, data);
          }
          break;
      }
    } catch (e) {
      console.error('WebSocket消息错误:', e.message);
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket连接断开');
    handleDisconnect(ws);
  });
});

// =================== 启动 ===================

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🏀 NBA卡牌对战服务器启动！`);
  console.log(`   本地访问: http://localhost:${PORT}`);
  console.log(`   API:      http://localhost:${PORT}/api`);
});
