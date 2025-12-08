import { useEffect, useState } from 'react';
import { getHealth, getInbounds, getClients } from '../services/api';

const texts = {
  tr: {
    title: 'Genel Bakış',
    refresh: 'Yenile',
    cpu: 'CPU',
    ram: 'RAM',
    swap: 'Takas',
    disk: 'Depolama',
    cores: 'İşlemci Çekirdek',
    xray: 'Xray',
    control: 'Yönet',
    stop: 'Durdur',
    restart: 'Yeniden Başlat',
    config: 'Yapılandırma',
    backup: 'Yedek',
    logs: 'Günlükler',
    load: 'Sistem Yükü',
    uptime: 'Çalışma Süresi',
    usage: 'Kullanım',
    totalData: 'Toplam veri',
    upload: 'Gönderilen',
    download: 'Alınan',
    speed: 'Genel hız',
    upSpeed: 'Yükleme',
    downSpeed: 'İndirme',
    ip: 'IP adresleri',
    conn: 'Bağlantı İstatistikleri',
    tcp: 'TCP',
    udp: 'UDP',
    version: 'Sürüm',
    ai: 'AI Anomali',
    servers: 'Sunucular',
    statusOk: 'Çalışıyor',
    statusWarn: 'Kontrol edin',
    inbounds: 'Inbound',
    clients: 'Client',
    doc: 'Dokümantasyon',
    versionTag: 'v2.8.5 (örn.)'
  },
  en: {
    title: 'Overview',
    refresh: 'Refresh',
    cpu: 'CPU',
    ram: 'RAM',
    swap: 'Swap',
    disk: 'Disk',
    cores: 'Cores',
    xray: 'Xray',
    control: 'Control',
    stop: 'Stop',
    restart: 'Restart',
    config: 'Config',
    backup: 'Backup',
    logs: 'Logs',
    load: 'System Load',
    uptime: 'Uptime',
    usage: 'Usage',
    totalData: 'Total data',
    upload: 'Upload',
    download: 'Download',
    speed: 'Speed',
    upSpeed: 'Up',
    downSpeed: 'Down',
    ip: 'IP addresses',
    conn: 'Connection Stats',
    tcp: 'TCP',
    udp: 'UDP',
    version: 'Version',
    ai: 'AI Anomaly',
    servers: 'Servers',
    statusOk: 'Running',
    statusWarn: 'Check',
    inbounds: 'Inbound',
    clients: 'Client',
    doc: 'Docs',
    versionTag: 'v2.8.5 (example)'
  }
};

const fallbackHealth = {
  cpuPercent: 0.3,
  ramPercent: 21.6,
  swapPercent: 0.2,
  diskPercent: 21.3,
  cores: 2,
  ramUsage: '428 MB / 1.93 GB',
  swapUsage: '5 MB / 2.00 GB',
  diskUsage: '6.28 GB / 29.42 GB',
  xrayVersion: 'v25.10.15',
  xrayStatus: true,
  uptimeXray: '2h',
  uptimeOs: '2h',
  ramUsed: '34.5 MB',
  procs: 12,
  upload: '6.1 MB',
  download: '791 MB',
  upSpeed: '1.35 KB/s',
  downSpeed: '9.45 KB/s',
  tcp: 22,
  udp: 3,
  ipv4: '-',
  ipv6: 'N/A'
};

export default function DashboardPage({ lang = 'tr' }) {
  const t = (k) => texts[lang]?.[k] || texts.tr[k] || k;
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState({ inbounds: 0, clients: 0 });
  const [metrics, setMetrics] = useState(fallbackHealth);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setError('');
    try {
      const [h, i, c] = await Promise.all([getHealth().catch(() => ({ data: {} })), getInbounds(), getClients()]);
      const incoming = h.data?.data || h.data || null;
      if (incoming) {
        setMetrics(incoming);
      }
      setHealth(h.data || {});
      setStats({
        inbounds: i.data?.data?.total || 0,
        clients: c.data?.data?.total || 0
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const h = metrics || fallbackHealth;
  const statusOk = health?.success ?? true;

  const topCards = [
    { label: t('cpu'), value: h.cpuPercent, footer: `${t('cores')}: ${h.cores}` },
    { label: t('ram'), value: h.ramPercent, footer: h.ramUsage },
    { label: t('swap'), value: h.swapPercent, footer: h.swapUsage },
    { label: t('disk'), value: h.diskPercent, footer: h.diskUsage }
  ];

  return (
    <div className="page-block">
      <div className="flex-between">
        <h1>{t('title')}</h1>
        <button className="btn-secondary" onClick={fetchData}>{t('refresh')}</button>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="grid">
        {topCards.map((card, idx) => (
          <div key={idx} className="card">
            <div className="flex-between">
              <div className="muted small">{card.label}</div>
              <div className="muted small">{Math.round((card.value || 0) * 100) / 100}%</div>
            </div>
            <div className="bar-anim" style={{ height: 8 }}>
              <div className="bar" style={{ width: `${card.value}%` }} />
            </div>
            <div className="muted small" style={{ marginTop: 8 }}>{card.footer}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="flex-between">
            <div className="muted small">{t('xray')}</div>
            <div className="muted small">{statusOk ? t('statusOk') : t('statusWarn')}</div>
          </div>
          <div className="flex-between" style={{ marginTop: 12 }}>
            <button className="btn-secondary">{t('stop')}</button>
            <button className="btn-secondary">{t('restart')}</button>
            <span className="muted small">{h.xrayVersion || t('version')}</span>
          </div>
        </div>

        <div className="card">
          <div className="flex-between">
            <div className="muted small">3X-UI</div>
            <div className="flex-between" style={{ gap: 6 }}>
              <span className="tag">{t('versionTag')}</span>
              <span className="tag">@XrayUI</span>
              <span className="tag">{t('doc')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="muted small">{t('load')}</div>
          <div className="list-item" style={{ marginTop: 8 }}>
            <span className="tag">0.0</span>
            <span className="tag">0.0</span>
            <span className="tag">0.0</span>
          </div>
        </div>
        <div className="card">
          <div className="muted small">{t('uptime')}</div>
          <div className="list-item" style={{ marginTop: 8 }}>
            <span className="tag">Xray: {h.uptimeXray}</span>
            <span className="tag">OS: {h.uptimeOs}</span>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="muted small">{t('usage')}</div>
          <div className="list-item" style={{ marginTop: 8 }}>
            <span className="tag">RAM: {h.ramUsed}</span>
            <span className="tag">İş parçacıkları: {h.procs}</span>
          </div>
        </div>
        <div className="card">
          <div className="muted small">{t('totalData')}</div>
          <div className="list-item" style={{ marginTop: 8 }}>
            <span className="tag">{t('upload')}: {h.upload}</span>
            <span className="tag">{t('download')}: {h.download}</span>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="muted small">{t('speed')}</div>
          <div className="list-item" style={{ marginTop: 8 }}>
            <span className="tag">{t('upSpeed')}: {h.upSpeed}</span>
            <span className="tag">{t('downSpeed')}: {h.downSpeed}</span>
          </div>
        </div>
        <div className="card">
          <div className="muted small">{t('conn')}</div>
          <div className="list-item" style={{ marginTop: 8 }}>
            <span className="tag">{t('tcp')}: {h.tcp}</span>
            <span className="tag">{t('udp')}: {h.udp}</span>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="muted small">{t('ip')}</div>
          <div className="list-item" style={{ marginTop: 8 }}>
            <span className="tag">IPv4: {h.ipv4 || '-'}</span>
            <span className="tag">IPv6: {h.ipv6 || 'N/A'}</span>
          </div>
        </div>
        <div className="card">
          <div className="muted small">{t('inbounds')} / {t('clients')}</div>
          <div className="list-item" style={{ marginTop: 8 }}>
            <span className="tag">{t('inbounds')}: {stats.inbounds}</span>
            <span className="tag">{t('clients')}: {stats.clients}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
