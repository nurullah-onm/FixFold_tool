# Kurulum

## Ön Gereksinimler
- Node.js 18+
- npm
- (Opsiyonel) Docker & Docker Compose

## Adımlar
1) Depoyu klonlayın ve `backend/` klasörüne geçin.
2) `cp ../.env.example ../.env` ile ortam değişkenlerini hazırlayın.
3) `npm install` ve `npx prisma generate` çalıştırın.
4) `npm run dev` ile geliştirme sunucusunu başlatın.

Docker yapıları `docker-compose.yml` tamamlandığında `docker compose up` ile ayağa kalkacaktır.
