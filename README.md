# FixFold

EN | TR

---
## EN · Overview
FixFold is a Node.js (Express) + React panel to manage Xray-core. It includes 3X-UI–style inbound/client controls, multi-server, AI anomaly, Telegram alerts, and installer scripts.

### Main Features
- Auth (JWT), role-based
- Inbounds (VMess/VLESS/Trojan/SS), clients, QR/link
- Xray config/reload, stats
- Multi-server manager
- AI anomaly detection
- Telegram bot (optional)
- Installer (Node 20, pm2, Xray auto-download)

### Quick Start (One-liner)
```bash
bash <(curl -Ls https://raw.githubusercontent.com/nurullah-onm/FixFold_tool/main/scripts/install.sh)
```
Default admin: `admin / admin1234`  
Backend: `http://<server-ip>:4000/api/health`  
Frontend: `http://<server-ip>:4173`

### Manual (Dev)
```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy   # or npm run prisma:migrate
npm run dev                 # 4000

# Frontend
cd ../frontend
npm install
npm run dev -- --host       # 5173
```

### Environment (backend/.env)
```
DATABASE_URL="file:./dev.db"
SERVER_ADDRESS=<ip-or-domain>
PORT=4000
JWT_SECRET=<random>
JWT_EXPIRES_IN=1d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
XRAY_BIN_PATH=/usr/local/bin/xray
XRAY_CONFIG_PATH=/etc/x-ui/config.json
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_ADMIN_IDS=
```

### PM2
```
pm2 status
pm2 restart fixfold-backend fixfold-frontend fixfold-xray
pm2 logs fixfold-backend --lines 50
```

### Scripts
- `scripts/install.sh` : one-shot install (Node20, Xray download, pm2)
- `scripts/download-xray.sh` : fetch latest Xray
- `scripts/fixfold` or `FixFold` : terminal menu (pm2/log/health)

---
## TR · Genel Bakış
FixFold, Xray-core yönetimi için Node.js (Express) + React tabanlı bir paneldir. 3X-UI benzeri inbound/client yönetimi, çoklu sunucu, AI anomali, Telegram ve kurulum scriptleri içerir.

### Başlıca Özellikler
- JWT kimlik doğrulama, rol tabanlı
- Inbound (VMess/VLESS/Trojan/SS), client, QR/link
- Xray konfig/reload, istatistik
- Çoklu sunucu yönetimi
- AI anomali tespiti
- Telegram bot (opsiyonel)
- Kurulum scripti (Node 20, pm2, Xray otomatik)

### Tek Komut Kurulum
```bash
bash <(curl -Ls https://raw.githubusercontent.com/nurullah-onm/FixFold_tool/main/scripts/install.sh)
```
Varsayılan admin: `admin / admin1234`  
Backend: `http://<sunucu-ip>:4000/api/health`  
Frontend: `http://<sunucu-ip>:4173`

### Manuel (Geliştirme)
```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy   # veya npm run prisma:migrate
npm run dev                 # 4000

# Frontend
cd ../frontend
npm install
npm run dev -- --host       # 5173
```

### Ortam Değişkenleri (backend/.env)
```
DATABASE_URL="file:./dev.db"
SERVER_ADDRESS=<ip-veya-alan>
PORT=4000
JWT_SECRET=<random>
JWT_EXPIRES_IN=1d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
XRAY_BIN_PATH=/usr/local/bin/xray
XRAY_CONFIG_PATH=/etc/x-ui/config.json
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_ADMIN_IDS=
```

### PM2
```
pm2 status
pm2 restart fixfold-backend fixfold-frontend fixfold-xray
pm2 logs fixfold-backend --lines 50
```

### Scriptler
- `scripts/install.sh` : tek komut kurulum (Node20, Xray indir, pm2)
- `scripts/download-xray.sh` : Xray indir
- `scripts/fixfold` veya `FixFold` : terminal menüsü (pm2/log/health)

### Notlar
- Xray varsayılan API/stats portu: 127.0.0.1:62789
- Inbound ekledikten sonra config otomatik yazılır ve pm2’de xray reload edilir.
- Telegram için `TELEGRAM_BOT_TOKEN` boşsa bot devre dışı kalır.
