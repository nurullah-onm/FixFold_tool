import { useEffect, useState } from 'react';
import {
  getClients,
  getInbounds,
  createClient,
  deleteClient,
  getClientQr,
  getClientSubscription
} from '../services/api';

const texts = {
  tr: {
    title: 'Kullanıcılar (Clients)',
    desc: 'Client, inbound altında tanımlı kullanıcıdır. Email ID olarak kullanılır; trafik limiti (GB, 0 = limitsiz) ve inbound seçimiyle oluşturulur.',
    refresh: 'Yenile',
    createTitle: 'Client Oluştur',
    inbound: 'Giriş (Inbound)',
    selectInbound: 'Giriş seç',
    email: 'Email / ID',
    limit: 'Trafik limiti (GB, 0 = limitsiz)',
    createBtn: 'Oluştur',
    listTitle: "Mevcut Client'lar",
    none: 'Client bulunamadı.',
    created: 'Client oluşturuldu.',
    deleted: 'Client silindi.',
    deleteFail: 'Client silinemedi',
    createFail: 'Client oluşturulamadı',
    listFail: 'Listeler alınamadı',
    qrTitle: 'QR / Link',
    copy: 'Kopyala',
    openLink: 'Linki Aç',
    genLinkFail: 'Link alınamadı'
  },
  en: {
    title: 'Clients',
    desc: 'Client is tied to an inbound. Email is the ID; set traffic cap (GB, 0 = unlimited) and choose inbound.',
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
    deleted: 'Client deleted.',
    deleteFail: 'Failed to delete client',
    createFail: 'Failed to create client',
    listFail: 'Failed to load lists',
    qrTitle: 'QR / Link',
    copy: 'Copy',
    openLink: 'Open Link',
    genLinkFail: 'Failed to get link'
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
  const [msgType, setMsgType] = useState('info');
  const [qr, setQr] = useState(null);
  const [subLink, setSubLink] = useState(null);

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
      setMsgType('error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setMsgType('info');
    try {
      await createClient({
        inboundId: form.inboundId,
        email: form.email,
        totalGB: Number(form.totalGB) || 0
      });
      setForm(emptyForm);
      setMsg(t('created'));
      setMsgType('success');
      loadLists();
    } catch (err) {
      setMsg(err.response?.data?.error || t('createFail'));
      setMsgType('error');
    }
  };

  const fetchQr = async (id) => {
    setMsg('');
    setMsgType('info');
    setSubLink(null);
    try {
      const res = await getClientQr(id);
      setQr(res.data?.data || res.data);
    } catch (err) {
      setMsg(err.response?.data?.error || t('genLinkFail'));
      setMsgType('error');
    }
  };

  const fetchSub = async (id) => {
    setMsg('');
    setMsgType('info');
    setQr(null);
    try {
      const res = await getClientSubscription(id);
      setSubLink(res.data?.data || res.data);
    } catch (err) {
      setMsg(err.response?.data?.error || t('genLinkFail'));
      setMsgType('error');
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setMsg(t('copy') + ' ✓');
      setMsgType('success');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Silmek istediğinize emin misiniz?')) return;
    setMsg('');
    setMsgType('info');
    try {
      await deleteClient(id);
      setMsg(t('deleted'));
      setMsgType('success');
      loadLists();
    } catch (err) {
      setMsg(err.response?.data?.error || t('deleteFail'));
      setMsgType('error');
    }
  };

  return (
    <div className="page-block">
      <div className="flex-between">
        <h1>{t('title')}</h1>
        <button onClick={loadLists} className="btn-secondary">{t('refresh')}</button>
      </div>
      <p className="muted">{t('desc')}</p>
      {msg && <p className={`muted ${msgType === 'error' ? 'text-error' : 'text-success'}`}>{msg}</p>}

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
                <div className="flex-between">
                  <div>
                    <strong>{c.email}</strong>
                  </div>
                  <div className="flex" style={{ gap: 8 }}>
                    <button type="button" className="btn-secondary small" onClick={() => fetchQr(c.id)}>QR</button>
                    <button type="button" className="btn-secondary small" onClick={() => fetchSub(c.id)}>Link</button>
                    <button type="button" className="btn-danger small" onClick={() => handleDelete(c.id)}>Sil</button>
                  </div>
                </div>
                <div className="muted">
                  Inbound: {c.inboundId} • Up: {c.up} • Down: {c.down}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(qr || subLink) && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>{t('qrTitle')}</h3>
          {qr?.qrcode && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <img src={qr.qrcode} alt="QR" style={{ width: 160, height: 160, objectFit: 'contain' }} />
              <div className="muted small" style={{ wordBreak: 'break-all' }}>{qr.link}</div>
              <div className="flex" style={{ gap: 8 }}>
                <button type="button" className="btn-secondary small" onClick={() => copyToClipboard(qr.link)}>{t('copy')}</button>
                <a className="btn small" href={qr.link} target="_blank" rel="noreferrer">{t('openLink')}</a>
              </div>
            </div>
          )}
          {subLink && (
            <div style={{ marginTop: 8 }}>
              <div className="muted small" style={{ wordBreak: 'break-all' }}>{subLink}</div>
              <div className="flex" style={{ gap: 8, marginTop: 6 }}>
                <button type="button" className="btn-secondary small" onClick={() => copyToClipboard(subLink)}>{t('copy')}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
