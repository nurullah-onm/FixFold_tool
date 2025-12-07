const texts = {
  tr: {
    title: 'API & Kullanım',
    intro: 'Varsayılan giriş admin/admin. Önce /api/auth/login, sonra Authorization: Bearer <token>.',
    flow: 'Proje Kullanım Akışı',
    flowItems: [
      'Giriş yap (admin/admin) → Token al.',
      'Inbound (giriş) oluştur: protokol + port, TLS/Reality gerekiyorsa ayarla.',
      'Clients sekmesinde aynı inbound’a client ekle (trafik limiti / bitiş tarihi verebilirsin).',
      'Sunucular sekmesinde slave ekleyip health check ve auto-balance çalıştır.',
      'AI sekmesinde anomalileri izle, gerekirse resolve ile kapat.',
      'Ayarlar sekmesinde .env önizlemesini kopyala, backend .env’yi güncelle, backend’i yeniden başlat.'
    ],
    telegramTitle: 'Telegram Komutları',
    telegramDesc:
      'BotFather ile bot oluştur, TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID .env’ye yaz. Komutlar: /start, /help, /status, /inbounds, /clients, /ai, /servers, /resolve <id>. Menüde kısayol butonları var.',
    authTitle: 'Kimlik / Authentication',
    inboundsTitle: 'Girişler / Inbounds',
    clientsTitle: 'Clients',
    serversTitle: 'Sunucular / Servers',
    aiTitle: 'AI / Anomali',
    quickTitle: 'Hızlı Kullanım',
    quickItems: [
      'Backend: npm run dev (port 4000). Frontend: npm run dev -- --host (5173).',
      'Giriş: admin/admin veya yeni admin oluştur.',
      'Inbound ekle; sonra o inbound’a client ekle.',
      'Sunucu ekle → health-check → auto-balance.',
      'AI anomalilerini izle, resolve ile kapat.',
      'Settings’ten .env yaz, gerekirse backend’i yeniden başlat.'
    ],
    authList: [
      'POST /api/auth/register – Kullanıcı oluştur',
      'POST /api/auth/login – JWT al',
      'POST /api/auth/refresh – Access token yenile',
      'PUT /api/auth/change-password – Şifre değiştir',
      'POST /api/auth/logout – Refresh token iptal'
    ],
    inboundsList: [
      'GET /api/inbounds – Listele',
      'POST /api/inbounds – Oluştur',
      'PUT /api/inbounds/:id – Güncelle',
      'POST /api/inbounds/:id/toggle – Aktif/Pasif',
      'POST /api/inbounds/:id/restart – Xray reload',
      'DELETE /api/inbounds/:id – Sil'
    ],
    clientsList: [
      'GET /api/clients – Liste',
      'POST /api/clients – Ekle',
      'POST /api/clients/bulk – Çoklu ekle',
      'POST /api/clients/:id/toggle – Aktif/Pasif',
      'POST /api/clients/:id/reset-traffic – Trafik sıfırla',
      'GET /api/clients/:id/qrcode – QR',
      'GET /api/clients/:id/subscription – Link',
      'GET /api/subscription/:subId – Public link'
    ],
    serversList: [
      'GET /api/servers – Liste',
      'POST /api/servers – Register',
      'POST /api/servers/:id/health-check – Health',
      'GET /api/servers/:id/stats – Yük',
      'POST /api/servers/:id/sync-config – Sync',
      'POST /api/servers/auto-balance – Dengele',
      'POST /api/servers/client/:clientId/assign – Ata',
      'POST /api/servers/client/:clientId/migrate – Taşı'
    ],
    aiList: [
      'GET /api/ai/anomalies – Liste',
      'GET /api/ai/anomalies/:id – Detay',
      'POST /api/ai/anomalies/:id/resolve – Çöz',
      'GET /api/ai/stats – Özet',
      'POST /api/ai/train-model – Retrain',
      'GET /api/ai/model-info – Aktif model'
    ]
  },
  en: {
    title: 'API & Usage',
    intro: 'Default login admin/admin. Call /api/auth/login first, then Authorization: Bearer <token>.',
    flow: 'Project Usage Flow',
    flowItems: [
      'Login (admin/admin) → get token.',
      'Create inbound: protocol + port, set TLS/Reality if needed.',
      'Add clients under that inbound (traffic cap/expiry optional).',
      'Add slaves in Servers, run health check and auto-balance.',
      'Monitor AI anomalies, resolve when needed.',
      'In Settings copy .env preview, update backend .env, restart backend.'
    ],
    telegramTitle: 'Telegram Commands',
    telegramDesc:
      'Create bot via BotFather, set TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID in .env. Commands: /start, /help, /status, /inbounds, /clients, /ai, /servers, /resolve <id>. Quick buttons are available.',
    authTitle: 'Authentication',
    inboundsTitle: 'Inbounds',
    clientsTitle: 'Clients',
    serversTitle: 'Servers',
    aiTitle: 'AI',
    quickTitle: 'Quick How-To',
    quickItems: [
      'Backend: npm run dev (4000). Frontend: npm run dev -- --host (5173).',
      'Login: admin/admin or create new admin.',
      'Add inbound, then add clients under it.',
      'Add server → health-check → auto-balance.',
      'Watch AI anomalies; resolve to close.',
      'From Settings write .env; restart backend if needed.'
    ],
    authList: [
      'POST /api/auth/register – Create user',
      'POST /api/auth/login – Get JWT',
      'POST /api/auth/refresh – Refresh token',
      'PUT /api/auth/change-password – Change password',
      'POST /api/auth/logout – Revoke refresh'
    ],
    inboundsList: [
      'GET /api/inbounds – List',
      'POST /api/inbounds – Create',
      'PUT /api/inbounds/:id – Update',
      'POST /api/inbounds/:id/toggle – Enable/Disable',
      'POST /api/inbounds/:id/restart – Xray reload',
      'DELETE /api/inbounds/:id – Delete'
    ],
    clientsList: [
      'GET /api/clients – List',
      'POST /api/clients – Create',
      'POST /api/clients/bulk – Bulk create',
      'POST /api/clients/:id/toggle – Enable/Disable',
      'POST /api/clients/:id/reset-traffic – Reset traffic',
      'GET /api/clients/:id/qrcode – QR',
      'GET /api/clients/:id/subscription – Share link',
      'GET /api/subscription/:subId – Public link'
    ],
    serversList: [
      'GET /api/servers – List',
      'POST /api/servers – Register',
      'POST /api/servers/:id/health-check – Health',
      'GET /api/servers/:id/stats – Load',
      'POST /api/servers/:id/sync-config – Sync',
      'POST /api/servers/auto-balance – Balance',
      'POST /api/servers/client/:clientId/assign – Assign',
      'POST /api/servers/client/:clientId/migrate – Migrate'
    ],
    aiList: [
      'GET /api/ai/anomalies – List',
      'GET /api/ai/anomalies/:id – Detail',
      'POST /api/ai/anomalies/:id/resolve – Resolve',
      'GET /api/ai/stats – Summary',
      'POST /api/ai/train-model – Retrain',
      'GET /api/ai/model-info – Active model'
    ]
  }
};

function SectionList({ items }) {
  return (
    <ul>
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

export default function DocsPage({ lang = 'tr' }) {
  const t = (k) => texts[lang]?.[k] || texts.tr[k] || k;

  return (
    <div className="page-block">
      <h1>{t('title')}</h1>
      <p className="muted">{t('intro')}</p>

      <div className="card">
        <h3>{t('flow')}</h3>
        <ol className="muted">
          {t('flowItems').map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ol>
      </div>

      <div className="card">
        <h3>{t('telegramTitle')}</h3>
        <p className="muted small">{t('telegramDesc').replace('<id>', '<id>')}</p>
      </div>

      <div className="card">
        <h3>{t('authTitle')}</h3>
        <SectionList items={t('authList')} />
      </div>

      <div className="card">
        <h3>{t('inboundsTitle')}</h3>
        <SectionList items={t('inboundsList')} />
      </div>

      <div className="card">
        <h3>{t('clientsTitle')}</h3>
        <SectionList items={t('clientsList')} />
      </div>

      <div className="card">
        <h3>{t('serversTitle')}</h3>
        <SectionList items={t('serversList')} />
      </div>

      <div className="card">
        <h3>{t('aiTitle')}</h3>
        <SectionList items={t('aiList')} />
      </div>

      <div className="card">
        <h3>{t('quickTitle')}</h3>
        <ol>
          {t('quickItems').map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
