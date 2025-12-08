import { useEffect, useState } from 'react';
import { saveSettings } from '../services/api';

const defaultSettings = {
  serverAddress: '',
  jwtExpiresIn: '1d',
  rateLimitWindow: 900000,
  rateLimitMax: 200,
  redisUrl: 'redis://localhost:6379',
  telegramBotToken: '',
  telegramChatId: '',
  telegramAdminIds: '',
  cloudflareApiToken: '',
  cfZoneId: '',
  xrayBinPath: '/usr/local/bin/xray',
  xrayConfigPath: '/etc/x-ui/config.json'
};

const texts = {
  tr: {
    title: 'Ayarlar',
    save: 'Kaydet',
    saved: 'Kaydedildi ve .env güncellendi.',
    saveFail: 'Kaydedilemedi',
    info: 'Kaydet dediğinizde backend .env otomatik güncellenir (admin token gerekir). Çoğu ayar anında uygulanır; sorun olursa yeniden başlatmayı deneyin.',
    telegramInfo: 'Bot token ve chat ID .env içinde TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID olarak set edilmeli.',
    telegramAdmins: 'Admin ID (virgüllerle)',
    rateInfo: '429 alırsanız pencereyi büyütüp limiti artırın; geliştirmede limiti yükseltebilirsiniz.',
    redisInfo: 'Session/cache için Redis URL girin.',
    cfInfo: 'DNS-01 için CLOUDFLARE_API_TOKEN ve CF_ZONE_ID gerekir.',
    serverInfo: 'Paylaşım linkleri/QR için duyurulan IP/alan adı.',
    envPreview: '.env Önizleme',
    envNote: 'Kaydet sonrası .env güncellenir; gerekirse backend’i yeniden başlatın.'
  },
  en: {
    title: 'Settings',
    save: 'Save',
    saved: 'Saved and .env updated.',
    saveFail: 'Save failed',
    info: 'Saving updates backend .env automatically (admin token required). Most settings apply immediately; restart if needed.',
    telegramInfo: 'Bot token and chat ID must be set in .env as TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID.',
    telegramAdmins: 'Admin IDs (comma separated)',
    rateInfo: 'If you see 429, increase window/max; for dev you can raise limits.',
    redisInfo: 'Provide Redis URL if used for session/cache.',
    cfInfo: 'For DNS-01, set CLOUDFLARE_API_TOKEN and CF_ZONE_ID.',
    serverInfo: 'Public hostname/IP used in shared links/QR.',
    envPreview: '.env Preview',
    envNote: 'After save, values are written to .env; restart backend if needed.'
  }
};

export default function SettingsPage({ lang = 'tr' }) {
  const t = (k) => texts[lang]?.[k] || texts.tr[k] || k;
  const [settings, setSettings] = useState(defaultSettings);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');

  useEffect(() => {
    const saved = localStorage.getItem('panelSettings');
    if (saved) {
      setSettings({ ...defaultSettings, ...JSON.parse(saved) });
    }
  }, []);

  const handleChange = (key, val) => setSettings((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setMsg('');
    setMsgType('info');
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
      setMsg(t('saved'));
      setMsgType('success');
    } catch (err) {
      setMsg(err.response?.data?.error || t('saveFail'));
      setMsgType('error');
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

  const Card = ({ title, info, children }) => (
    <div className="card">
      <div className="flex-between">
        <h3>{title}</h3>
        <button className="btn-secondary small" onClick={handleSave}>{t('save')}</button>
      </div>
      {info && <p className="muted small">{info}</p>}
      {children}
    </div>
  );

  return (
    <div className="page-block">
      <div className="flex-between">
        <h1>{t('title')}</h1>
        <button className="btn-secondary" onClick={handleSave}>{t('save')}</button>
      </div>
      <p className="muted">{t('info')}</p>
      {msg && <p className={`muted ${msgType === 'error' ? 'text-error' : 'text-success'}`}>{msg}</p>}

      <div className="grid-2">
        <Card title="Telegram" info={t('telegramInfo')}>
          <label>Bot Token
            <input
              value={settings.telegramBotToken}
              onChange={(e) => handleChange('telegramBotToken', e.target.value)}
              placeholder="123456:ABC-DEF"
            />
          </label>
          <label>Chat ID
            <input
              value={settings.telegramChatId}
              onChange={(e) => handleChange('telegramChatId', e.target.value)}
              placeholder="@channel_or_userid"
            />
          </label>
          <label>{t('telegramAdmins')}
            <input
              value={settings.telegramAdminIds}
              onChange={(e) => handleChange('telegramAdminIds', e.target.value)}
              placeholder="12345,67890"
            />
          </label>
        </Card>

        <Card title="JWT & Rate Limit" info={t('rateInfo')}>
          <label>JWT Expires (örn: 1d)
            <input
              value={settings.jwtExpiresIn}
              onChange={(e) => handleChange('jwtExpiresIn', e.target.value)}
            />
          </label>
          <label>RATE_LIMIT_WINDOW_MS
            <input
              type="number"
              value={settings.rateLimitWindow}
              onChange={(e) => handleChange('rateLimitWindow', Number(e.target.value))}
            />
          </label>
          <label>RATE_LIMIT_MAX
            <input
              type="number"
              value={settings.rateLimitMax}
              onChange={(e) => handleChange('rateLimitMax', Number(e.target.value))}
            />
          </label>
        </Card>

        <Card title="Xray" info="Xray binary ve config yolları">
          <label>XRAY_BIN_PATH
            <input
              value={settings.xrayBinPath}
              onChange={(e) => handleChange('xrayBinPath', e.target.value)}
              placeholder="/usr/local/bin/xray"
            />
          </label>
          <label>XRAY_CONFIG_PATH
            <input
              value={settings.xrayConfigPath}
              onChange={(e) => handleChange('xrayConfigPath', e.target.value)}
              placeholder="/etc/x-ui/config.json"
            />
          </label>
        </Card>

        <Card title="Redis / Cache" info={t('redisInfo')}>
          <label>REDIS_URL
            <input
              value={settings.redisUrl}
              onChange={(e) => handleChange('redisUrl', e.target.value)}
              placeholder="redis://localhost:6379"
            />
          </label>
        </Card>

        <Card title="Cloudflare / SSL" info={t('cfInfo')}>
          <label>CLOUDFLARE_API_TOKEN
            <input
              value={settings.cloudflareApiToken}
              onChange={(e) => handleChange('cloudflareApiToken', e.target.value)}
            />
          </label>
          <label>CF_ZONE_ID
            <input
              value={settings.cfZoneId}
              onChange={(e) => handleChange('cfZoneId', e.target.value)}
            />
          </label>
        </Card>

        <Card title="Sunucu Adresi" info={t('serverInfo')}>
          <label>SERVER_ADDRESS
            <input
              value={settings.serverAddress}
              onChange={(e) => handleChange('serverAddress', e.target.value)}
              placeholder="185.7.243.177"
            />
          </label>
        </Card>
      </div>

      <div className="card">
        <h3>{t('envPreview')}</h3>
        <pre className="muted small">{renderEnvPreview()}</pre>
        <p className="muted small">{t('envNote')}</p>
      </div>
    </div>
  );
}
