const mineflayer = require('mineflayer');
const express = require('express');

// ─── Express Web Server (Replit alive রাখার জন্য) ───────────────────────────
const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Minecraft Bot</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:50px;background:#1a1a2e;color:#eee">
        <h1>🤖 Minecraft Bot চলছে!</h1>
        <p>Status: <span style="color:#00ff88">Online</span></p>
        <p>Server: ${process.env.MC_HOST || 'Not configured'}</p>
        <p>Bot: ${process.env.MC_USERNAME || 'Not configured'}</p>
      </body>
    </html>
  `);
});

app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    bot: process.env.MC_USERNAME || 'unknown',
    server: process.env.MC_HOST || 'unknown',
    uptime: process.uptime()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Web server চালু হয়েছে port ${PORT}-এ`);
});

// ─── Bot Configuration ────────────────────────────────────────────────────────
const BOT_CONFIG = {
  host: process.env.MC_HOST || 'hypixel.net',
  port: parseInt(process.env.MC_PORT) || 25565,
  username: process.env.MC_USERNAME || 'MyBot',
  password: process.env.MC_PASSWORD || undefined,
  version: process.env.MC_VERSION || false,
  auth: process.env.MC_AUTH || 'microsoft',
  reconnectDelay: parseInt(process.env.RECONNECT_DELAY) || 5000,
};

let bot = null;
let reconnectTimer = null;

// ─── Bot তৈরি করার ফাংশন ─────────────────────────────────────────────────────
function createBot() {
  console.log(`🔌 ${BOT_CONFIG.host}:${BOT_CONFIG.port}-এ কানেক্ট হচ্ছে...`);

  bot = mineflayer.createBot({
    host: BOT_CONFIG.host,
    port: BOT_CONFIG.port,
    username: BOT_CONFIG.username,
    password: BOT_CONFIG.password,
    version: BOT_CONFIG.version,
    auth: BOT_CONFIG.auth,
  });

  // ─── Spawn ─────────────────────────────────────────────────────────────────
  bot.once('spawn', () => {
    console.log(`✅ বট স্পন হয়েছে! Username: ${bot.username}`);
    startAntiAFK();
  });

  // ─── Chat ─────────────────────────────────────────────────────────────────
  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    console.log(`💬 <${username}> ${message}`);
    handleChatCommands(username, message);
  });

  // ─── Kick হলে ─────────────────────────────────────────────────────────────
  bot.on('kicked', (reason) => {
    console.log(`⚠️ বট kick হয়েছে: ${reason}`);
    stopAntiAFK();
    scheduleReconnect();
  });

  // ─── Error হলে ─────────────────────────────────────────────────────────────
  bot.on('error', (err) => {
    console.log(`❌ Error: ${err.message}`);
    stopAntiAFK();
    scheduleReconnect();
  });

  // ─── Disconnect হলে ────────────────────────────────────────────────────────
  bot.on('end', (reason) => {
    console.log(`🔴 সংযোগ বিচ্ছিন্ন: ${reason}`);
    stopAntiAFK();
    scheduleReconnect();
  });

  // ─── Death হলে ─────────────────────────────────────────────────────────────
  bot.on('death', () => {
    console.log('💀 বট মারা গেছে, respawn করছে...');
    bot.respawn();
  });

  // ─── Health পরিবর্তন ──────────────────────────────────────────────────────
  bot.on('health', () => {
    if (bot.health <= 5) {
      console.log(`⚠️ বটের HP কম: ${bot.health}/20`);
    }
  });
}

// ─── Chat Commands Handler ────────────────────────────────────────────────────
function handleChatCommands(username, message) {
  const lowerMsg = message.toLowerCase().trim();

  if (lowerMsg === '!ping') {
    bot.chat('Pong! 🏓 আমি ঠিকঠাক চলছি!');
  } else if (lowerMsg === '!health') {
    bot.chat(`❤️ HP: ${Math.round(bot.health)}/20 | 🍗 Food: ${Math.round(bot.food)}/20`);
  } else if (lowerMsg === '!pos') {
    const pos = bot.entity.position;
    bot.chat(`📍 Position: X:${Math.round(pos.x)} Y:${Math.round(pos.y)} Z:${Math.round(pos.z)}`);
  } else if (lowerMsg === '!time') {
    const time = bot.time.timeOfDay;
    const timeStr = time < 6000 ? 'ভোর' : time < 12000 ? 'দুপুর' : time < 18000 ? 'বিকেল' : 'রাত';
    bot.chat(`⏰ এখন: ${timeStr} (${time} ticks)`);
  } else if (lowerMsg === '!players') {
    const players = Object.keys(bot.players).join(', ');
    bot.chat(`👥 সার্ভারে আছেন: ${players || 'কেউ নেই'}`);
  } else if (lowerMsg === '!help') {
    bot.chat('📋 Commands: !ping, !health, !pos, !time, !players, !help');
  }
}

// ─── Anti-AFK System ─────────────────────────────────────────────────────────
let antiAFKInterval = null;
let antiAFKRotation = 0;

function startAntiAFK() {
  if (antiAFKInterval) return;
  console.log('🔄 Anti-AFK চালু হয়েছে');

  antiAFKInterval = setInterval(() => {
    if (!bot || !bot.entity) return;

    antiAFKRotation += 1;
    const action = antiAFKRotation % 4;

    try {
      if (action === 0) {
        bot.setControlState('jump', true);
        setTimeout(() => bot && bot.setControlState('jump', false), 500);
      } else if (action === 1) {
        bot.look(bot.entity.yaw + 0.5, bot.entity.pitch, false);
      } else if (action === 2) {
        bot.look(bot.entity.yaw - 0.5, bot.entity.pitch, false);
      } else {
        bot.swingArm('right');
      }
    } catch (e) {
      // ignore
    }
  }, 30000);
}

function stopAntiAFK() {
  if (antiAFKInterval) {
    clearInterval(antiAFKInterval);
    antiAFKInterval = null;
    console.log('⏹️ Anti-AFK বন্ধ হয়েছে');
  }
}

// ─── Auto-Reconnect ───────────────────────────────────────────────────────────
function scheduleReconnect() {
  if (reconnectTimer) return;
  console.log(`🔁 ${BOT_CONFIG.reconnectDelay / 1000} সেকেন্ড পরে পুনরায় কানেক্ট হবে...`);

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    createBot();
  }, BOT_CONFIG.reconnectDelay);
}

// ─── Start ───────────────────────────────────────────────────────────────────
console.log('🚀 Minecraft Bot শুরু হচ্ছে...');
console.log(`📡 Server: ${BOT_CONFIG.host}:${BOT_CONFIG.port}`);
console.log(`👤 Username: ${BOT_CONFIG.username}`);
createBot();
