import { useEffect, useState } from 'react';
import { getClients, getInbounds, createClient } from '../services/api';

const texts = {
  tr: {
    title: 'Kullanıcılar (Clients)',
    desc: 'Client, inbound altında tanımlı kullanıcıdır. Email ID olarak kullanılır, trafik limiti (GB) ve inbound seçimiyle oluşturulur.',
    refresh: 'Yenile',
    createTitle: 'Client Oluştur',
    inbound: 'Giriş (Inbound)',
    selectInbound: 'Giriş seç',
    email: 'Email / ID',
    limit: 'Trafik limiti (GB, 0 = limitsiz)',
    createBtn: 'Oluştur',
    listTitle: 'Mevcut Client\'lar',
    none: 'Client bulunamadı.',
    created: 'Client oluşturuldu.',
    createFail: 'Client oluşturulamadı',
    listFail: 'Listeler alınamadı'
  },
  en: {
    title: 'Clients',
    desc: 'Client is tied to an inbound. Email is the ID; set traffic cap (GB) and choose inbound.',
    refresh: 'Refresh',
    createTitle: 'Create Client',
    inbound: 'Inbound',
    selectInbound: 'Select inbound',
    email: 'Email / ID',
    limit: 'Traffic limit (GB, 0 = unlimited)',
    createBtn: 'Create',
    listTitle: 'Existing Clients',
    none: 'No clients found.',
    created: 'Client created.',
    createFail: 'Failed to create client',
    listFail: 'Failed to load lists'
  }
};

const emptyForm = {
  inboundId: '',
  email: '',
  totalGB: 0
};

export default function ClientsPage({ lang = 'tr' }) {
  const t = (k) => texts[lang]?.[k] || texts.tr[k] || k;
  const [clients, setClients] = useState([]);
  const [inbounds, setInbounds] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    setMsg('');
    try {
      const [c, i] = await Promise.all([getClients(), getInbounds()]);
      setClients(c.data?.data?.clients || []);
      setInbounds(i.data?.data?.inbounds || []);
      if (!form.inboundId && i.data?.data?.inbounds?.[0]?.id) {
        setForm((p) => ({ ...p, inboundId: i.data.data.inbounds[0].id }));
      }
    } catch (err) {
      setMsg(err.response?.data?.error || t('listFail'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await createClient({
        inboundId: form.inboundId,
        email: form.email,
        totalGB: Number(form.totalGB) || 0
      });
      setForm(emptyForm);
      setMsg(t('created'));
      loadLists();
    } catch (err) {
      setMsg(err.response?.data?.error || t('createFail'));
    }
  };

  return (
    <div className="page-block">
      <div className="flex-between">
        <h1>{t('title')}</h1>
        <button onClick={loadLists} className="btn-secondary">{t('refresh')}</button>
      </div>
      <p className="muted">{t('desc')}</p>
      {msg && <p className="muted">{msg}</p>}

      <div className="grid-2">
        <div className="card">
          <h3>{t('createTitle')}</h3>
          <form onSubmit={handleSubmit} className="grid">
            <label>
              {t('inbound')}
              <select value={form.inboundId} onChange={(e) => setForm({ ...form, inboundId: e.target.value })} required>
                <option value="">{t('selectInbound')}</option>
                {inbounds.map((inb) => (
                  <option key={inb.id} value={inb.id}>
                    {inb.remark} (port {inb.port})
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('email')}
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <label>
              {t('limit')}
              <input
                type="number"
                value={form.totalGB}
                onChange={(e) => setForm({ ...form, totalGB: e.target.value })}
                min="0"
              />
            </label>
            <button type="submit" className="btn">{t('createBtn')}</button>
          </form>
        </div>

        <div className="card">
          <h3>{t('listTitle')}</h3>
          <div className="list">
            {clients.length === 0 && <p className="muted">{t('none')}</p>}
            {clients.map((c) => (
              <div key={c.id} className="list-item">
                <div>
                  <strong>{c.email}</strong>
                </div>
                <div className="muted">
                  Inbound: {c.inboundId} • Up: {c.up} • Down: {c.down}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
