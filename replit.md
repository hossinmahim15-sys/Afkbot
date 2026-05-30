# Minecraft Bot

mineflayer দিয়ে তৈরি Minecraft Bot। অটো-রিকানেক্ট, অ্যান্টি-AFK, চ্যাট কমান্ড সহ।

## Features
- ✅ অটো-রিকানেক্ট (disconnect/kick হলে)
- ✅ অ্যান্টি-AFK (প্রতি ৩০ সেকেন্ডে নড়াচড়া)
- ✅ চ্যাট কমান্ড (!ping, !health, !pos, !time, !players, !help)
- ✅ অটো-রেসপন মরে গেলে
- ✅ Web server (Replit alive রাখার জন্য)

## Environment Variables (.env ফাইলে রাখো)

| Variable | বিবরণ | Default |
|---|---|---|
| `MC_HOST` | Minecraft সার্ভার IP | hypixel.net |
| `MC_PORT` | সার্ভার পোর্ট | 25565 |
| `MC_USERNAME` | বটের username | MyBot |
| `MC_PASSWORD` | বটের password (offline-এ দরকার নেই) | - |
| `MC_AUTH` | `microsoft` বা `offline` | microsoft |
| `MC_VERSION` | সার্ভার ভার্সন (যেমন: 1.20.1) | auto |
| `RECONNECT_DELAY` | রিকানেক্ট বিলম্ব (ms) | 5000 |

## চ্যাট কমান্ড

| Command | কাজ |
|---|---|
| `!ping` | বট জীবিত কিনা চেক |
| `!health` | HP ও Food দেখায় |
| `!pos` | বটের অবস্থান দেখায় |
| `!time` | সার্ভারে সময় দেখায় |
| `!players` | সার্ভারে কে কে আছে |
| `!help` | সব কমান্ড দেখায় |

## GitHub Actions Keepalive

`.github/workflows/keepalive.yml` ফাইলটি প্রতি ৪ মিনিটে Replit-কে পিং করে।

**GitHub Secret সেট করার পদ্ধতি:**
1. GitHub রিপোতে যাও → Settings → Secrets and variables → Actions
2. "New repository secret" ক্লিক করো
3. Name: `REPLIT_URL`
4. Value: তোমার Replit URL (যেমন: `https://minecraft-bot.yourusername.repl.co`)

## User preferences
- ভাষা: বাংলা
