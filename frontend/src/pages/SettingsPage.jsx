import { useEffect, useState } from 'react';
import { saveSettings } from '../services/api';

const defaultSettings = {
  telegramBotToken: '',
  telegramChatId: '',
  telegramAdminIds: '',
  serverAddress: 'your-server.com',
  jwtExpiresIn: '1d',
  rateLimitWindow: 900000,
  rateLimitMax: 100,
  redisUrl: 'redis://localhost:6379',
  xrayBinPath: '/usr/local/bin/xray',
  xrayConfigPath: '/etc/x-ui/config.json',
  cloudflareApiToken: '',
  cfZoneId: ''
};

const texts = {
  tr: {
    title: 'Ayarlar',
    save: 'Kaydet',
    info:
      'Kaydet dediğinizde backend .env dosyası otomatik güncellenir (Admin token gerekir). Çoğu ayar anında uygulanır; sorun olursa yeniden başlatmayı deneyin.',
    telegramInfo: 'Bot token ve chat ID .env’de TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID olarak tanımlı olmalı.',
    telegramAdmins: "Admin ID'ler (virgülle)",
    rateInfo: '429 çoksa pencereyi büyütüp limiti artırın; dev ortamında test için değeri yükseltebilirsiniz.',
    redisInfo: 'Session/publish için Redis kullanacaksanız URL’yi girin.',
    cfInfo: 'DNS-01 doğrulama için CLOUDFLARE_API_TOKEN ve CF_ZONE_ID .env’de tanımlanmalı.',
    serverInfo: 'Paylaşımlı linkler/QR için dışarıya duyurulan alan adı veya IP.',
    envPreview: '.env Önizleme',
    envNote: 'Kaydet sonrası değerler .env dosyasına yazılır. Gerekirse backend’i yeniden başlatın.'
  },
  en: {
    title: 'Settings',
    save: 'Save',
    info: 'Saving updates backend .env automatically (Admin token required). Most settings apply immediately; if you see issues, try restarting.',
    telegramInfo: 'Bot token and chat ID must be set in .env as TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID.',
    telegramAdmins: 'Admin IDs (comma separated)',
    rateInfo: 'If you hit 429, increase window/max; raise limits in dev if needed.',
    redisInfo: 'Provide Redis URL if you will use it for session/publish.',
    cfInfo: 'For DNS-01, set CLOUDFLARE_API_TOKEN and CF_ZONE_ID in .env.',
    serverInfo: 'Public hostname/IP for shared links/QR.',
    envPreview: '.env Preview',
    envNote: 'After save, values are written to .env. Restart backend if needed.'
  }
};

export default function SettingsPage({ lang = 'tr' }) {
  const t = (k) => texts[lang]?.[k] || texts.tr[k] || k;
  const [settings, setSettings] = useState(defaultSettings);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('panelSettings');
    if (saved) {
      setSettings({ ...defaultSettings, ...JSON.parse(saved) });
    }
  }, []);

  const handleChange = (key, val) => setSettings((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    try {
      const payload = {
        SERVER_ADDRESS: settings.serverAddress,
        JWT_EXPIRES_IN: settings.jwtExpiresIn,
        RATE_LIMIT_WINDOW_MS: settings.rateLimitWindow,
        RATE_LIMIT_MAX: settings.rateLimitMax,
        REDIS_URL: settings.redisUrl,
        TELEGRAM_BOT_TOKEN: settings.telegramBotToken,
        TELEGRAM_CHAT_ID: settings.telegramChatId,
        TELEGRAM_ADMIN_IDS: settings.telegramAdminIds,
        CLOUDFLARE_API_TOKEN: settings.cloudflareApiToken,
        CF_ZONE_ID: settings.cfZoneId,
        XRAY_BIN_PATH: settings.xrayBinPath,
        XRAY_CONFIG_PATH: settings.xrayConfigPath
      };
      await saveSettings(payload);
      localStorage.setItem('panelSettings', JSON.stringify(settings));
      setMsg(lang === 'en'
        ? 'Saved and backend .env updated. Some settings may need a restart.'
        : 'Kaydedildi ve backend .env dosyası güncellendi. Bazı ayarlar için yeniden başlatma gerekebilir.');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Kaydedilemedi');
    }
  };

  const renderEnvPreview = () =>
    [
      `SERVER_ADDRESS=${settings.serverAddress}`,
      `JWT_EXPIRES_IN=${settings.jwtExpiresIn}`,
      `RATE_LIMIT_WINDOW_MS=${settings.rateLimitWindow}`,
      `RATE_LIMIT_MAX=${settings.rateLimitMax}`,
      `REDIS_URL=${settings.redisUrl}`,
      `TELEGRAM_BOT_TOKEN=${settings.telegramBotToken}`,
      `TELEGRAM_CHAT_ID=${settings.telegramChatId}`,
      `TELEGRAM_ADMIN_IDS=${settings.telegramAdminIds || ''}`,
      `CLOUDFLARE_API_TOKEN=${settings.cloudflareApiToken}`,
      `CF_ZONE_ID=${settings.cfZoneId}`,
      `XRAY_BIN_PATH=${settings.xrayBinPath}`,
      `XRAY_CONFIG_PATH=${settings.xrayConfigPath}`
    ].join('\n');

  return (
    <div className="page-block">
      <div className="flex-between">
        <h1>{t('title')}</h1>
        <button className="btn-secondary" onClick={handleSave}>{t('save')}</button>
      </div>
      <p className="muted">{t('info')}</p>
      {msg && <p className="muted">{msg}</p>}

      <div className="grid-2">
        <div className="card">
          <h3>Telegram Bildirimleri</h3>
          <details className="accordion" open>
            <summary>Bilgi</summary>
            <p className="muted small">{t('telegramInfo')}</p>
          </details>
          <label>
            Bot Token
            <input
              value={settings.telegramBotToken}
              onChange={(e) => handleChange('telegramBotToken', e.target.value)}
              placeholder="123456:ABC-DEF"
            />
          </label>
          <label>
            Chat ID
            <input
              value={settings.telegramChatId}
              onChange={(e) => handleChange('telegramChatId', e.target.value)}
              placeholder="@channel_or_userid"
            />
          </label>
          <label>
            {t('telegramAdmins')}
            <input
              value={settings.telegramAdminIds}
              onChange={(e) => handleChange('telegramAdminIds', e.target.value)}
              placeholder="12345,67890"
            />
          </label>
        </div>

        <div className="card">
          <h3>JWT & Rate Limit</h3>
          <details className="accordion" open>
            <summary>Bilgi</summary>
            <p className="muted small">{t('rateInfo')}</p>
          </details>
          <label>
            JWT Expires (örn: 1d)
            <input
              value={settings.jwtExpiresIn}
              onChange={(e) => handleChange('jwtExpiresIn', e.target.value)}
            />
          </label>
          <label>
            Rate Limit Penceresi (ms)
            <input
              type="number"
              value={settings.rateLimitWindow}
              onChange={(e) => handleChange('rateLimitWindow', Number(e.target.value))}
            />
          </label>
          <label>
            Rate Limit Max
            <input
              type="number"
              value={settings.rateLimitMax}
              onChange={(e) => handleChange('rateLimitMax', Number(e.target.value))}
            />
          </label>
        </div>

        <div className="card">
          <h3>Xray Yolları</h3>
          <details className="accordion" open>
            <summary>Bilgi</summary>
            <p className="muted small">Linux’ta <code>scripts/download-xray.sh</code> sonrasında binary genelde /usr/local/bin/xray olur.</p>
          </details>
          <label>
            XRAY_BIN_PATH
            <input
              value={settings.xrayBinPath}
              onChange={(e) => handleChange('xrayBinPath', e.target.value)}
            />
          </label>
          <label>
            XRAY_CONFIG_PATH
            <input
              value={settings.xrayConfigPath}
              onChange={(e) => handleChange('xrayConfigPath', e.target.value)}
            />
          </label>
        </div>

        <div className="card">
          <h3>Redis / Cache</h3>
          <details className="accordion" open>
            <summary>Bilgi</summary>
            <p className="muted small">{t('redisInfo')}</p>
          </details>
          <label>
            REDIS_URL
            <input
              value={settings.redisUrl}
              onChange={(e) => handleChange('redisUrl', e.target.value)}
            />
          </label>
        </div>

        <div className="card">
          <h3>Cloudflare / SSL</h3>
          <details className="accordion" open>
            <summary>Bilgi</summary>
            <p className="muted small">{t('cfInfo')}</p>
          </details>
          <label>
            CLOUDFLARE_API_TOKEN
            <input
              value={settings.cloudflareApiToken}
              onChange={(e) => handleChange('cloudflareApiToken', e.target.value)}
            />
          </label>
          <label>
            CF_ZONE_ID
            <input
              value={settings.cfZoneId}
              onChange={(e) => handleChange('cfZoneId', e.target.value)}
            />
          </label>
        </div>

        <div className="card">
          <h3>Sunucu Adresi</h3>
          <details className="accordion" open>
            <summary>Bilgi</summary>
            <p className="muted small">{t('serverInfo')}</p>
          </details>
          <label>
            SERVER_ADDRESS
            <input
              value={settings.serverAddress}
              onChange={(e) => handleChange('serverAddress', e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="card">
        <h3>{t('envPreview')}</h3>
        <pre className="muted small">{renderEnvPreview()}</pre>
        <p className="muted small">{t('envNote')}</p>
      </div>
    </div>
  );
}
