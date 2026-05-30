const mineflayer = require('mineflayer');
const express = require('express');

// ─── Express Web Server ───────────────────────────────────────────────────────
const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Minecraft Bot</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:50px;background:#1a1a2e;color:#eee">
        <h1>Minecraft Bot চলছে!</h1>
        <p>Status: <span style="color:#00ff88">Online</span></p>
        <p>Server: ${process.env.MC_HOST || 'impm.aternos.me'}</p>
        <p>Bot: ${process.env.MC_USERNAME || 'Mahim8807'}</p>
      </body>
    </html>
  `);
});
app.get('/status', (req, res) => res.json({ status: 'running', uptime: process.uptime() }));
app.listen(PORT, '0.0.0.0', () => console.log(`Web server চালু: port ${PORT}`));

// ─── Config ───────────────────────────────────────────────────────────────────
const CFG = {
  host:    process.env.MC_HOST          || 'impm.aternos.me',
  port:    parseInt(process.env.MC_PORT) || 40248,
  user:    process.env.MC_USERNAME       || 'Mahim8807',
  version: process.env.MC_VERSION        || '1.21.1',
  auth:    process.env.MC_AUTH           || 'offline',
  delay:   parseInt(process.env.RECONNECT_DELAY) || 20000,
};

let bot = null, reconnectTimer = null, afkTimer = null;

// ─── createBot ────────────────────────────────────────────────────────────────
function createBot() {
  console.log(`কানেক্ট হচ্ছে ${CFG.host}:${CFG.port} | user: ${CFG.user} | v${CFG.version}`);

  bot = mineflayer.createBot({
    host:                 CFG.host,
    port:                 CFG.port,
    username:             CFG.user,
    version:              CFG.version,
    auth:                 CFG.auth,
    checkTimeoutInterval: 60 * 1000,
    hideErrors:           false,
  });

  // Login-এর সাথে সাথেই physics বন্ধ করো (Grim Anticheat fix)
  bot._client.once('login', () => {
    bot.physicsEnabled = false;
    console.log('Physics disabled (chunks not loaded yet)');
  });

  // ─── Spawn ───────────────────────────────────────────────────────────────
  bot.once('spawn', async () => {
    console.log(`স্পন হয়েছে! User: ${bot.username}`);

    try {
      // chunk load হওয়া পর্যন্ত অপেক্ষা করো
      await bot.waitForChunksToLoad();
      console.log('Chunks লোড হয়েছে — physics চালু করছি');
    } catch(_) {}

    // এখন ground সেট করে physics চালু করো
    if (bot.entity) {
      bot.entity.onGround = true;
      bot.entity.velocity.set(0, 0, 0);
    }
    bot.physicsEnabled = true;

    // সব control state বন্ধ
    ['forward','back','left','right','jump','sprint','sneak'].forEach(s => {
      try { bot.setControlState(s, false); } catch(_) {}
    });

    console.log('Bot সার্ভারে সক্রিয়!');
    // 20 সেকেন্ড পর Anti-AFK শুরু
    afkTimer = setTimeout(startAFK, 20000);
  });

  // ─── Chat ────────────────────────────────────────────────────────────────
  bot.on('chat', (user, msg) => {
    if (user === bot.username) return;
    const m = msg.toLowerCase();
    if (m === '!ping')    bot.chat('Pong!');
    if (m === '!health')  bot.chat(`HP: ${Math.round(bot.health)}/20`);
    if (m === '!pos')     { const p = bot.entity.position; bot.chat(`${Math.round(p.x)} ${Math.round(p.y)} ${Math.round(p.z)}`); }
    if (m === '!players') bot.chat(Object.keys(bot.players).join(', '));
  });

  // ─── Death ───────────────────────────────────────────────────────────────
  bot.on('death', () => { console.log('মারা গেছে, respawn...'); bot.respawn(); });

  // ─── Kick / Error / End ──────────────────────────────────────────────────
  const cleanup = (label, reason) => {
    let msg = typeof reason === 'string' ? reason : JSON.stringify(reason);
    console.log(`[${label}] ${msg}`);
    stopAFK();
    reconnect();
  };
  bot.on('kicked', (r) => cleanup('KICK', r));
  bot.on('error',  (e) => cleanup('ERR',  e.message));
  bot.on('end',    (r) => cleanup('END',  r));
}

// ─── Anti-AFK (শুধু মাথা ঘোরানো) ─────────────────────────────────────────────
let afkInterval = null, afkTick = 0;
function startAFK() {
  if (afkInterval) return;
  console.log('Anti-AFK চালু');
  afkInterval = setInterval(() => {
    if (!bot || !bot.entity) return;
    afkTick++;
    try { bot.look(bot.entity.yaw + (afkTick % 2 === 0 ? 0.4 : -0.4), 0, true); } catch(_) {}
  }, 30000);
}
function stopAFK() {
  if (afkTimer)    { clearTimeout(afkTimer);    afkTimer = null; }
  if (afkInterval) { clearInterval(afkInterval); afkInterval = null; }
}

// ─── Reconnect ────────────────────────────────────────────────────────────────
function reconnect() {
  if (reconnectTimer) return;
  console.log(`${CFG.delay / 1000}s পরে রিকানেক্ট...`);
  reconnectTimer = setTimeout(() => { reconnectTimer = null; createBot(); }, CFG.delay);
}

// ─── Start ────────────────────────────────────────────────────────────────────
console.log(`Bot শুরু: ${CFG.host}:${CFG.port}`);
createBot();
