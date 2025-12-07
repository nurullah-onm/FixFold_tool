import { useEffect, useState } from 'react';
import { getServers, createServer, healthCheckServer, autoBalanceServers } from '../services/api';

const emptyForm = {
  name: '',
  hostname: '',
  port: 443,
  type: 'SLAVE',
  maxClients: 1000
};

const texts = {
  tr: {
    title: 'Sunucular',
    desc: 'Master panelden kontrol edilen slave sunucuları ekleyin. Health Check ile durum alın, Auto Balance ile yük dengelemeyi tetikleyin.',
    autoBalance: 'Auto Balance',
    createTitle: 'Sunucu Kaydet',
    name: 'Ad',
    hostname: 'Hostname',
    port: 'Port',
    type: 'Tip',
    maxClients: 'Max Client',
    save: 'Kaydet',
    listTitle: 'Kayıtlı Sunucular',
    none: 'Sunucu yok.',
    created: 'Sunucu kaydedildi.',
    createFail: 'Sunucu oluşturulamadı',
    listFail: 'Sunucular alınamadı',
    health: 'Health Check'
  },
  en: {
    title: 'Servers',
    desc: 'Register slave servers from the master panel. Use Health Check and Auto Balance to manage load.',
    autoBalance: 'Auto Balance',
    createTitle: 'Register Server',
    name: 'Name',
    hostname: 'Hostname',
    port: 'Port',
    type: 'Type',
    maxClients: 'Max Clients',
    save: 'Save',
    listTitle: 'Registered Servers',
    none: 'No servers.',
    created: 'Server created.',
    createFail: 'Failed to create server',
    listFail: 'Failed to load servers',
    health: 'Health Check'
  }
};

export default function ServersPage({ lang = 'tr' }) {
  const t = (k) => texts[lang]?.[k] || texts.tr[k] || k;
  const [servers, setServers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    setMsg('');
    try {
      const { data } = await getServers();
      setServers(data.data || []);
    } catch (err) {
      setMsg(err.response?.data?.error || t('listFail'));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await createServer(form);
      setForm(emptyForm);
      setMsg(t('created'));
      loadServers();
    } catch (err) {
      setMsg(err.response?.data?.error || t('createFail'));
    }
  };

  const handleHealth = async (id) => {
    setMsg('');
    try {
      await healthCheckServer(id);
      setMsg(t('health') + ' triggered.');
      loadServers();
    } catch (err) {
      setMsg(err.response?.data?.error || t('health') + ' failed');
    }
  };

  const handleBalance = async () => {
    setMsg('');
    try {
      await autoBalanceServers();
      setMsg(t('autoBalance') + ' triggered.');
      loadServers();
    } catch (err) {
      setMsg(err.response?.data?.error || t('autoBalance') + ' failed');
    }
  };

  return (
    <div className="page-block">
      <div className="flex-between">
        <h1>{t('title')}</h1>
        <button onClick={handleBalance} className="btn-secondary">{t('autoBalance')}</button>
      </div>
      <p className="muted">{t('desc')}</p>
      {msg && <p className="muted">{msg}</p>}
      <div className="grid-2">
        <div className="card">
          <h3>{t('createTitle')}</h3>
          <form onSubmit={handleCreate} className="grid">
            <label>
              {t('name')}
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              {t('hostname')}
              <input value={form.hostname} onChange={(e) => setForm({ ...form, hostname: e.target.value })} required />
            </label>
            <label>
              {t('port')}
              <input
                type="number"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
                required
              />
            </label>
            <label>
              {t('type')}
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option>MASTER</option>
                <option>SLAVE</option>
              </select>
            </label>
            <label>
              {t('maxClients')}
              <input
                type="number"
                value={form.maxClients}
                onChange={(e) => setForm({ ...form, maxClients: Number(e.target.value) })}
              />
            </label>
            <button type="submit" className="btn">{t('save')}</button>
          </form>
        </div>
        <div className="card">
          <h3>{t('listTitle')}</h3>
          <div className="list">
            {servers.length === 0 && <p className="muted">{t('none')}</p>}
            {servers.map((s) => (
              <div key={s.id} className="list-item">
                <div>
                  <strong>{s.name}</strong> <span className="tag">{s.type}</span>
                </div>
                <div className="muted">
                  {s.hostname}:{s.port} • status: {s.status} • clients: {s.currentClients}/{s.maxClients}
                </div>
                <button onClick={() => handleHealth(s.id)} className="btn-secondary">{t('health')}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
