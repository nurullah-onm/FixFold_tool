import { useEffect, useState } from 'react';
import { getInbounds, createInbound } from '../services/api';

const texts = {
  tr: {
    title: 'Girişler (Inbound)',
    desc: 'Giriş (Inbound), Xray’in hangi port/protokolden trafik kabul edeceğini tanımlar. TLS/Reality gerekiyorsa ilgili alanları doldurun.',
    createTitle: 'Giriş (Inbound) Oluştur',
    listTitle: 'Mevcut Girişler',
    none: 'Giriş bulunamadı.',
    created: 'Giriş (Inbound) oluşturuldu.',
    createFail: 'Giriş oluşturulamadı',
    listFail: 'Giriş listesi alınamadı',
    refresh: 'Yenile',
    name: 'Ad / Remark',
    protocol: 'Protokol',
    port: 'Port',
    listen: 'Dinleme IP',
    tag: 'Tag',
    network: 'İletim (Network)',
    security: 'Güvenlik',
    firstEmail: 'İlk client email (opsiyonel)',
    totalFlows: 'Toplam Akış',
    resetDay: 'Trafik Sıfırlama (gün)',
    duration: 'Süre (gün)',
    auth: 'Authentication',
    decryption: 'decryption',
    encryption: 'encryption',
    fallbacks: 'Fallbacks',
    proxyProtocol: 'Proxy Protocol',
    httpObf: 'HTTP Kandırma (Host/Path)',
    wsHost: 'WS Host',
    wsPath: 'WS Path',
    grpcService: 'gRPC Service',
    sockopt: 'Sockopt',
    externalProxy: 'External Proxy',
    sniffing: 'Sniffing Etkin',
    active: 'Etkin',
    tlsServerName: 'TLS SNI',
    tlsCert: 'TLS Cert (path)',
    tlsKey: 'TLS Key (path)',
    realityDest: 'Reality Dest (host:port)',
    realityServer: 'Reality Server Name',
    realityPublic: 'Reality Public Key',
    realityShort: 'Reality Short ID',
    createBtn: 'Oluştur'
  },
 {
    title: 'Inbounds',
    desc: 'Inbound defines which port/protocol Xray accepts traffic on. Fill TLS/Reality fields when required.',
    createTitle: 'Create Inbound',
    listTitle: 'Existing Inbounds',
    none: 'No inbound found.',
    created: 'Inbound created.',
    createFail: 'Failed to create inbound',
    listFail: 'Failed to load inbounds',
    refresh: 'Refresh',
    name: 'Name / Remark',
    protocol: 'Protocol',
    port: 'Port',
    listen: 'Listen IP',
    tag: 'Tag',
    network: 'Transport (Network)',
    security: 'Security',
    firstEmail: 'First client email (optional)',
    totalFlows: 'Total Flows',
    resetDay: 'Traffic Reset (day)',
    duration: 'Duration (day)',
    auth: 'Authentication',
    decryption: 'decryption',
    encryption: 'encryption',
    fallbacks: 'Fallbacks',
    proxyProtocol: 'Proxy Protocol',
    httpObf: 'HTTP Obfuscation (Host/Path)',
    wsHost: 'WS Host',
    wsPath: 'WS Path',
    grpcService: 'gRPC Service',
    sockopt: 'Sockopt',
    externalProxy: 'External Proxy',
    sniffing: 'Sniffing Enabled',
    active: 'Active',
    tlsServerName: 'TLS SNI',
    tlsCert: 'TLS Cert (path)',
    tlsKey: 'TLS Key (path)',
    realityDest: 'Reality Dest (host:port)',
    realityServer: 'Reality Server Name',
    realityPublic: 'Reality Public Key',
    realityShort: 'Reality Short ID',
    createBtn: 'Create'
  }
};

const emptyForm = {
  isActive: true,
  remark: '',
  tag: '',
  protocol: 'VLESS',
  listen: '0.0.0.0',
  port: '',
  totalFlows: 0,
  resetDay: 0,
  duration: '',
  network: 'TCP',
  security: 'NONE',
  clientEmail: '',
  auth: 'none',
  decryption: 'none',
  encryption: 'none',
  fallbacks: [],
  fallbackInput: '',
  proxyProtocol: false,
  httpHost: '',
  httpPath: '/',
  wsHost: '',
  wsPath: '/',
  grpcServiceName: '',
  sockoptTproxy: false,
  sockoptMark: '',
  externalProxy: '',
  sniffing: true,
  tlsServerName: '',
  tlsCertFile: '',
  tlsKeyFile: '',
  realityDest: '',
  realityServerName: '',
  realityPublicKey: '',
  realityShortId: ''
};

export default function InboundsPage({ lang = 'tr' }) {
  const t = (k) => texts[lang]?.[k] || texts.tr[k] || k;
  const [inbounds, setInbounds] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadInbounds();
  }, []);

  const loadInbounds = async () => {
    setMsg('');
    try {
      const { data } = await getInbounds();
      setInbounds(data.data.inbounds || []);
    } catch (err) {
      setMsg(err.response?.data?.error || t('listFail'));
    }
  };

const buildStreamSettings = () => {
  const network = form.network.toLowerCase();
  const security = form.security.toLowerCase();
  const stream = { network, security };
  if (network === 'ws') {
    stream.wsSettings = {
      path: form.wsPath || '/',
      headers: form.wsHost ? { Host: form.wsHost } : undefined
    };
  }
  if (network === 'grpc') {
    stream.grpcSettings = { serviceName: form.grpcServiceName || '' };
  }
    if (network === 'http2') {
      stream.httpSettings = { host: form.httpHost ? [form.httpHost] : [], path: form.httpPath || '/' };
    }
    return stream;
  };

  const buildTlsSettings = () => {
    if (form.security !== 'TLS') return null;
    return {
      serverName: form.tlsServerName || undefined,
      certificates: form.tlsCertFile && form.tlsKeyFile
        ? [{ certificateFile: form.tlsCertFile, keyFile: form.tlsKeyFile }]
        : undefined,
      alpn: ['h2', 'http/1.1']
    };
  };

  const buildRealitySettings = () => {
    if (form.security !== 'REALITY') return null;
    return {
      dest: form.realityDest || 'www.google.com:443',
      serverNames: form.realityServerName ? [form.realityServerName] : ['www.google.com'],
      publicKey: form.realityPublicKey || '',
      shortIds: form.realityShortId ? [form.realityShortId] : [''],
      show: false
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const streamSettings = buildStreamSettings();
      const tlsSettings = buildTlsSettings();
      const realitySettings = buildRealitySettings();
      const payload = {
        isActive: form.isActive,
        remark: form.remark,
        protocol: form.protocol,
        port: Number(form.port),
        listen: form.listen,
        tag: form.tag || undefined,
        network: form.network,
        security: form.security,
        sniffing: { enabled: form.sniffing, destOverride: ['http', 'tls'] },
        settings: {
          totalFlows: Number(form.totalFlows) || 0,
          resetDay: Number(form.resetDay) || 0,
          duration: form.duration || null,
          auth: form.auth,
          decryption: form.decryption,
          encryption: form.encryption,
          clients: form.clientEmail
            ? [{ id: crypto.randomUUID(), email: form.clientEmail }]
            : [],
          fallbacks: form.fallbacks,
          proxyProtocol: form.proxyProtocol,
          httpObfuscation: form.httpHost || form.httpPath ? { host: form.httpHost, path: form.httpPath || '/' } : undefined,
          sockopt: { tproxy: form.sockoptTproxy, mark: form.sockoptMark },
          externalProxy: form.externalProxy || undefined
        },
        streamSettings,
        tlsSettings: tlsSettings || undefined,
        realitySettings: realitySettings || undefined
      };
      await createInbound(payload);
      setForm(emptyForm);
      setMsg(t('created'));
      loadInbounds();
    } catch (err) {
      setMsg(err.response?.data?.error || t('createFail'));
    }
  };

  const addFallback = () => {
    if (form.fallbackInput) {
      setForm({ ...form, fallbacks: [...form.fallbacks, form.fallbackInput], fallbackInput: '' });
    }
  };

  return (
    <div className="page-block">
      <div className="flex-between">
        <h1>{t('title')}</h1>
        <button onClick={loadInbounds} className="btn-secondary">{t('refresh')}</button>
      </div>
      <p className="muted">{t('desc')}</p>
      {msg && <p className="muted">{msg}</p>}

      <div className="grid-2">
        <div className="card">
          <h3>{t('createTitle')}</h3>
          <form onSubmit={handleSubmit} className="grid">
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {t('active')}
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            </label>
            <label>
              {t('name')}
              <input value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} required />
            </label>
            <label>
              {t('tag')}
              <input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="opsiyonel" />
            </label>
            <label>
              {t('protocol')}
              <select value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value })}>
                {['VMESS', 'VLESS', 'TROJAN', 'SHADOWSOCKS'].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label>
              {t('listen')}
              <input value={form.listen} onChange={(e) => setForm({ ...form, listen: e.target.value })} />
            </label>
            <label>
              {t('port')}
              <input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} required />
            </label>
            <label>
              {t('totalFlows')}
              <input type="number" value={form.totalFlows} onChange={(e) => setForm({ ...form, totalFlows: e.target.value })} />
            </label>
            <label>
              {t('resetDay')}
              <input type="number" value={form.resetDay} onChange={(e) => setForm({ ...form, resetDay: e.target.value })} />
            </label>
            <label>
              {t('duration')}
              <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            </label>
            <label>
              {t('network')}
              <select value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })}>
                {['TCP', 'WS', 'GRPC', 'HTTP2', 'QUIC'].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label>
              {t('security')}
              <select value={form.security} onChange={(e) => setForm({ ...form, security: e.target.value })}>
                {['NONE', 'TLS', 'REALITY'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              {t('auth')}
              <select value={form.auth} onChange={(e) => setForm({ ...form, auth: e.target.value })}>
                {['none', 'password', 'token'].map((a) => <option key={a}>{a}</option>)}
              </select>
            </label>
            <label>
              {t('decryption')}
              <input value={form.decryption} onChange={(e) => setForm({ ...form, decryption: e.target.value })} />
            </label>
            <label>
              {t('encryption')}
              <input value={form.encryption} onChange={(e) => setForm({ ...form, encryption: e.target.value })} />
            </label>
            <label>
              {t('firstEmail')}
              <input
                value={form.clientEmail}
                onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                placeholder="user@example.com"
              />
            </label>

            <div className="flex-between" style={{ gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label>
                  {t('fallbacks')}
                  <input
                    value={form.fallbackInput}
                    onChange={(e) => setForm({ ...form, fallbackInput: e.target.value })}
                    placeholder="tag:dest:port"
                  />
                </label>
              </div>
              <button type="button" className="btn-secondary" onClick={addFallback}>+</button>
            </div>
            {form.fallbacks.length > 0 && (
              <div className="muted small">
                {form.fallbacks.map((f, i) => (
                  <span key={i} style={{ marginRight: 6 }}>{f}</span>
                ))}
              </div>
            )}

            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {t('proxyProtocol')}
              <input type="checkbox" checked={form.proxyProtocol} onChange={(e) => setForm({ ...form, proxyProtocol: e.target.checked })} />
            </label>

            <label>
              {t('httpObf')}
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input placeholder="Host" value={form.httpHost} onChange={(e) => setForm({ ...form, httpHost: e.target.value })} />
                <input placeholder="Path" value={form.httpPath} onChange={(e) => setForm({ ...form, httpPath: e.target.value })} />
              </div>
            </label>

            <label>
              {t('wsHost')} / {t('wsPath')}
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input placeholder="ws host" value={form.wsHost} onChange={(e) => setForm({ ...form, wsHost: e.target.value })} />
                <input placeholder="ws path" value={form.wsPath} onChange={(e) => setForm({ ...form, wsPath: e.target.value })} />
              </div>
            </label>

            <label>
              {t('grpcService')}
              <input value={form.grpcServiceName} onChange={(e) => setForm({ ...form, grpcServiceName: e.target.value })} placeholder="serviceName" />
            </label>

            <label>
              {t('sockopt')}
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  TPROXY
                  <input type="checkbox" checked={form.sockoptTproxy} onChange={(e) => setForm({ ...form, sockoptTproxy: e.target.checked })} />
                </label>
                <input placeholder="mark" value={form.sockoptMark} onChange={(e) => setForm({ ...form, sockoptMark: e.target.value })} />
              </div>
            </label>

            <label>
              {t('externalProxy')}
              <input value={form.externalProxy} onChange={(e) => setForm({ ...form, externalProxy: e.target.value })} placeholder="host:port" />
            </label>

            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {t('sniffing')}
              <input type="checkbox" checked={form.sniffing} onChange={(e) => setForm({ ...form, sniffing: e.target.checked })} />
            </label>

            {form.security === 'TLS' && (
              <>
                <label>{t('tlsServerName')}<input value={form.tlsServerName} onChange={(e) => setForm({ ...form, tlsServerName: e.target.value })} /></label>
                <label>{t('tlsCert')}<input value={form.tlsCertFile} onChange={(e) => setForm({ ...form, tlsCertFile: e.target.value })} /></label>
                <label>{t('tlsKey')}<input value={form.tlsKeyFile} onChange={(e) => setForm({ ...form, tlsKeyFile: e.target.value })} /></label>
              </>
            )}
            {form.security === 'REALITY' && (
              <>
                <label>{t('realityDest')}<input value={form.realityDest} onChange={(e) => setForm({ ...form, realityDest: e.target.value })} /></label>
                <label>{t('realityServer')}<input value={form.realityServerName} onChange={(e) => setForm({ ...form, realityServerName: e.target.value })} /></label>
                <label>{t('realityPublic')}<input value={form.realityPublicKey} onChange={(e) => setForm({ ...form, realityPublicKey: e.target.value })} /></label>
                <label>{t('realityShort')}<input value={form.realityShortId} onChange={(e) => setForm({ ...form, realityShortId: e.target.value })} /></label>
              </>
            )}

            <button type="submit" className="btn">{t('createBtn')}</button>
          </form>
        </div>

        <div className="card">
          <h3>{t('listTitle')}</h3>
          <div className="list">
            {inbounds.length === 0 && <p className="muted">{t('none')}</p>}
            {inbounds.map((inb) => (
              <div key={inb.id} className="list-item">
                <div className="flex-between">
                  <div>
                    <strong>{inb.remark}</strong> <span className="tag">{inb.protocol}</span>
                  </div>
                  <div className="muted">{inb.isActive ? t('active') : 'Pasif'}</div>
                </div>
                <div className="muted">Port {inb.port} • {inb.listen}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
