import { useEffect, useRef, useState } from 'react';

const texts = {
  tr: {
    title: 'Hız Testi',
    desc: 'LibreSpeed tabanlı hız testi paneli. Start ile ölç, Stop ile iptal et.',
    start: 'Başlat',
    stop: 'Durdur',
    ping: 'Gecikme',
    down: 'İndirme',
    up: 'Yükleme',
    status: 'Durum',
    ready: 'Hazır',
    running: 'Çalışıyor...',
    failed: 'Script yüklenemedi. İnternet veya CDN erişimini kontrol edin.',
    note: 'Gerçek ölçüm için VITE_SPEEDTEST_SCRIPT_URL ve VITE_SPEEDTEST_WORKER_URL değerlerini kendi LibreSpeed kurulumunuza göre ayarlayın. Aksi halde simüle test çalışır.'
  },
  en: {
    title: 'Speed Test',
    desc: 'LibreSpeed-based speed test. Press Start to run, Stop to cancel.',
    start: 'Start',
    stop: 'Stop',
    ping: 'Ping',
    down: 'Download',
    up: 'Upload',
    status: 'Status',
    ready: 'Ready',
    running: 'Running...',
    failed: 'Failed to load speedtest script. Check CDN/network access.',
    note: 'For real measurements set VITE_SPEEDTEST_SCRIPT_URL and VITE_SPEEDTEST_WORKER_URL to your self-hosted LibreSpeed. Otherwise a simulated test runs.'
  }
};

const scriptURL = import.meta.env.VITE_SPEEDTEST_SCRIPT_URL || '';
const workerURL = import.meta.env.VITE_SPEEDTEST_WORKER_URL || '';

export default function SpeedTestPage({ lang = 'tr' }) {
  const t = (k) => texts[lang]?.[k] || texts.tr[k] || k;
  const stRef = useRef(null);
  const intervalRef = useRef(null);
  const [loaded, setLoaded] = useState(!scriptURL); // if no script URL, fallback is ready
  const [useFallback, setUseFallback] = useState(!scriptURL);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState({ ping: 0, down: 0, up: 0, status: 'idle' });

  useEffect(() => {
    if (!scriptURL) return;
    const existing = document.getElementById('librespeed-script');
    if (existing) {
      setLoaded(true);
      stRef.current = new window.Speedtest();
      if (workerURL) {
        try { stRef.current.setParameter('worker', workerURL); } catch (e) {}
      }
      return;
    }
    const onErr = (e) => {
      if (String(e.filename).includes('speedtest_worker')) {
        setUseFallback(true);
        setError(t('failed'));
        e.preventDefault();
      }
    };
    window.addEventListener('error', onErr);
    const script = document.createElement('script');
    script.id = 'librespeed-script';
    script.src = scriptURL;
    script.onload = () => {
      stRef.current = new window.Speedtest();
      if (workerURL) {
        try { stRef.current.setParameter('worker', workerURL); } catch (e) {}
      }
      setLoaded(true);
    };
    script.onerror = () => {
      setError(t('failed'));
      setUseFallback(true);
    };
    document.body.appendChild(script);
    return () => {
      window.removeEventListener('error', onErr);
    };
  }, [lang]);

  const startTest = () => {
    setError('');
    setRunning(true);
    const runFallback = () => {
      // Simulated test with animated values
      let step = 0;
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        step += 1;
        setResult({
          ping: Math.max(5, 30 - step * 2),
          down: Math.min(200, result.down + Math.random() * 30),
          up: Math.min(80, result.up + Math.random() * 10),
          status: 'running'
        });
        if (step >= 8) {
          clearInterval(intervalRef.current);
          setRunning(false);
          setResult((r) => ({ ...r, status: 'done' }));
        }
      }, 500);
      return;
    };
    if (useFallback || !stRef.current) {
      runFallback();
      return;
    }
    stRef.current.onupdate = (data) => {
      setResult({
        ping: data.pingStatus === 0 ? data.ping : 0,
        down: data.dlStatus || 0,
        up: data.ulStatus || 0,
        status: 'running'
      });
    };
    stRef.current.onend = (data) => {
      setRunning(false);
      setResult({
        ping: data.ping || 0,
        down: data.dlStatus || 0,
        up: data.ulStatus || 0,
        status: 'done'
      });
    };
    try {
      stRef.current.start();
    } catch (err) {
      setError(t('failed'));
      setUseFallback(true);
      runFallback();
    }
  };

  const stopTest = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (stRef.current && !useFallback) stRef.current.abort();
    setRunning(false);
  };

  return (
    <div className="page-block">
      <div className="flex-between">
        <h1>{t('title')}</h1>
        <div className="flex-between" style={{ gap: '8px' }}>
          <button className="btn" onClick={startTest} disabled={running}>{t('start')}</button>
          <button className="btn-secondary" onClick={stopTest} disabled={!running}>{t('stop')}</button>
        </div>
      </div>
      <p className="muted">{t('desc')}</p>
      {error && <p className="error">{error}</p>}
      <div className="grid-3">
        <div className="card stat animated-card">
          <p className="muted small">{t('ping')}</p>
          <h2>{result.ping.toFixed(0)} ms</h2>
        </div>
        <div className="card stat animated-card">
          <p className="muted small">{t('down')}</p>
          <h2>{result.down.toFixed(2)} Mbps</h2>
        </div>
        <div className="card stat animated-card">
          <p className="muted small">{t('up')}</p>
          <h2>{result.up.toFixed(2)} Mbps</h2>
        </div>
      </div>
      <div className="card">
        <p className="muted small">{t('status')}: {running ? t('running') : t('ready')}</p>
        <div className="bar-anim">
          <div className={`bar ${running ? 'on' : ''}`} />
        </div>
      </div>
      <p className="muted small">{t('note')}</p>
    </div>
  );
}
