# FixFold

Xray-core yönetimi için Node.js tabanlı kontrol paneli. 3X-UI özelliklerini temel alır; ek olarak AI trafik anomali tespiti, çoklu sunucu yönetimi, akıllı client rotasyonu, blokzincir lisansları ve PWA mobil istemci barındırır.

## Hızlı Başlangıç

```bash
# Tek komut (Ubuntu/Debian, root): backend + frontend + pm2 (Node 20 LTS)
bash <(curl -Ls https://raw.githubusercontent.com/nurullah-onm/FixFold_tool/main/scripts/install.sh)

# Manuel kurulum
# Backend
cd backend
npm install
npx prisma generate
npm run prisma:migrate
npm run dev

# Varsayılan admin (opsiyonel; var olan kullanıcıyı ADMIN yapar)
# Parola en az 8 karakter olmalıdır; varsayılan admin1234’tür
SEED_ADMIN_USER=admin SEED_ADMIN_PASS=admin1234 npm run seed:admin

# Frontend (Vite + React)
cd ../frontend
npm install
npm run dev -- --host
```

- API varsayılanı: `http://<sunucu-ip>:4000`
- Frontend varsayılanı: `http://<sunucu-ip>:5173` (dev) / `http://<sunucu-ip>:4173` (serve -s dist)
- VLESS/VMess linkleri için `.env` içinde `SERVER_ADDRESS=<ip/alanadı>` doldurun.

## Önemli Ortam Değişkenleri (.env)
- `SERVER_ADDRESS` : Paylaşım linki için IP/alan adı
- `XRAY_BIN_PATH`, `XRAY_CONFIG_PATH` : Xray binary ve config yolları
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_ADMIN_IDS`
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`
- `REDIS_URL`, `CLOUDFLARE_API_TOKEN`, `CF_ZONE_ID`

## Notlar
- Inbound/Servers/AI gibi yönetim uçları ADMIN rolü ister. `admin/admin` ile giriş yapın; 403 alırsanız token’ı yenileyin.
- TLS/Reality seçiyorsanız sertifika/anahtar ve gerekli alanları doldurun, aksi halde 400 veya bağlantı hatası alırsınız.
- Xray binary/config yoksa `scripts/download-xray.sh` ile indirip `.env` yollarını eşleştirin.

## Kurulum Scripti (scripts/install.sh)
- Node 18 + pm2 kurulumu, backend npm install/prisma migrate, admin seed, frontend build, pm2 servisleri (`fixfold-backend`, `fixfold-frontend`) başlatılır.

## Hızlı Test
1) `npm run dev` (backend) + `npm run dev -- --host` (frontend)
2) `admin/admin` ile giriş
3) Inbound oluştururken Güvenlik=NONE seçip boş bir port deneyin; listeye düşüyorsa temel akış çalışıyor demektir. TLS/Reality için ilgili alanları doldurun. 
