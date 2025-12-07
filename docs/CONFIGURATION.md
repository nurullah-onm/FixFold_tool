# Konfigürasyon

- `DATABASE_URL`: Varsayılan SQLite, prod için PostgreSQL DSN verin.
- `JWT_SECRET`, `JWT_EXPIRES_IN`: Kimlik doğrulama için JWT ayarları.
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`: API rate limit değerleri.
- `CLOUDFLARE_API_TOKEN`, `CF_ZONE_ID`: SSL otomasyonu için hazırlanmıştır.
- `REDIS_URL`: Session/queue/cache katmanı için kullanılacaktır.
- `XRAY_BIN_PATH`, `XRAY_CONFIG_PATH`: Xray-core ikilisi ve aktif config dosyası yolları.
- `XRAY_API_HOST`, `XRAY_API_PORT`: Xray stats API erişim bilgileri.
- `XRAY_LOG_LEVEL`: Xray log seviyesi (info/warning/error).
- `XRAY_AUTO_RESTART`, `XRAY_RESTART_MAX_ATTEMPTS`: Process gözetimi ve otomatik restart sınırları.
- `SERVER_ADDRESS`: Paylaşım linkleri ve QR kodları için kullanılacak host adı.
- AI modelleri ve snapshot temizliği varsayılan path/config ile otomatik yönetilir; ek .env gerekmez.

Daha ileri konfigürasyonlar (AI, multi-server, blockchain lisans) ilgili modüller eklendikçe genişletilecektir.
