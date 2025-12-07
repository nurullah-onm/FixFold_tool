import { useEffect, useState } from 'react';
import { getAnomalies, getAiStats, resolveAnomaly } from '../services/api';

const texts = {
  tr: {
    title: 'AI Anomali',
    desc: 'Trafik snapshot verileriyle spike, DDOS, olağandışı saat vb. anomaliler tespit edilir. Çöz ile kapat.',
    refresh: 'Yenile',
    unresolved: 'Çözülmemiş',
    none: 'Anomali yok.',
    resolved: 'Anomali kapatıldı.',
    resolveBtn: 'Çöz'
  },
  en: {
    title: 'AI Anomalies',
    desc: 'Detects spikes, DDOS, unusual time traffic. Use resolve to close records.',
    refresh: 'Refresh',
    unresolved: 'Unresolved',
    none: 'No anomalies.',
    resolved: 'Anomaly resolved.',
    resolveBtn: 'Resolve'
  }
};

export default function AiPage({ lang = 'tr' }) {
  const t = (k) => texts[lang]?.[k] || texts.tr[k] || k;
  const [anomalies, setAnomalies] = useState([]);
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setMsg('');
    try {
      const [a, s] = await Promise.all([getAnomalies(), getAiStats()]);
      setAnomalies(a.data?.data || []);
      setStats(s.data?.data || null);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to load AI data');
    }
  };

  const handleResolve = async (id) => {
    setMsg('');
    try {
      await resolveAnomaly(id);
      setMsg(t('resolved'));
      loadData();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Resolve failed');
    }
  };

  return (
    <div className="page-block">
      <div className="flex-between">
        <h1>{t('title')}</h1>
        <button onClick={loadData} className="btn-secondary">{t('refresh')}</button>
      </div>
      <p className="muted">{t('desc')}</p>
      {msg && <p className="muted">{msg}</p>}
      {stats && (
        <div className="card stat">
          <p className="muted small">{t('unresolved')}</p>
          <h2>{stats.unresolvedCount}</h2>
        </div>
      )}
      <div className="list card">
        {anomalies.length === 0 && <p className="muted">{t('none')}</p>}
        {anomalies.map((a) => (
          <div key={a.id} className="list-item">
            <div>
              <strong>{a.type}</strong> <span className="tag">{a.severity}</span>
            </div>
            <div className="muted">{a.description}</div>
            {!a.resolved && <button onClick={() => handleResolve(a.id)} className="btn">{t('resolveBtn')}</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
