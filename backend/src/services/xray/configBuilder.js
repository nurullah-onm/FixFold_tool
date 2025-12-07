import env from '../../config/env.js';

export const buildBaseConfig = () => ({
  log: {
    loglevel: env.xray.logLevel || 'warning'
  },
  api: {
    services: ['HandlerService', 'LoggerService', 'StatsService', 'RoutingService']
  },
  stats: {},
  policy: {
    system: {
      statsOutboundUplink: true,
      statsOutboundDownlink: true
    }
  },
  dns: {
    servers: ['1.1.1.1', '8.8.8.8']
  }
});

export const buildStreamSettings = (network = 'tcp', security = 'none', cert, key, sni, realitySettings) => {
  const settings = { network };
  if (security === 'tls') {
    settings.security = 'tls';
    settings.tlsSettings = {
      allowInsecure: false,
      serverName: sni,
      certificates: cert && key ? [{ certificateFile: cert, keyFile: key }] : undefined
    };
  } else if (security === 'reality') {
    settings.security = 'reality';
    settings.realitySettings = realitySettings || { serverNames: [sni], show: false };
  } else {
    settings.security = 'none';
  }
  return settings;
};

export const buildSniffing = (enabled = true, destOverride = ['http', 'tls', 'quic']) => ({
  enabled,
  destOverride
});

export const buildVMessInbound = (port, settings = {}) => {
  const { tag = 'vmess-in', listen = '0.0.0.0', clients = [], streamSettings = {}, sniffing, ...rest } = settings;
  return {
    tag,
    listen,
    port,
    protocol: 'vmess',
    settings: {
      clients: clients.map((c) => ({ id: c.id, alterId: c.alterId || 0, email: c.email })),
      ...rest
    },
    streamSettings,
    sniffing
  };
};

export const buildVLESSInbound = (port, settings = {}) => {
  const { tag = 'vless-in', listen = '0.0.0.0', clients = [], streamSettings = {}, sniffing, decryption = 'none', ...rest } = settings;
  return {
    tag,
    listen,
    port,
    protocol: 'vless',
    settings: {
      decryption,
      clients: clients.map((c) => ({ id: c.id, flow: c.flow, email: c.email })),
      ...rest
    },
    streamSettings,
    sniffing
  };
};

export const buildTrojanInbound = (port, settings = {}) => {
  const { tag = 'trojan-in', listen = '0.0.0.0', clients = [], streamSettings = {}, sniffing, ...rest } = settings;
  return {
    tag,
    listen,
    port,
    protocol: 'trojan',
    settings: {
      clients: clients.map((c) => ({ password: c.password, email: c.email })),
      ...rest
    },
    streamSettings,
    sniffing
  };
};

export const buildShadowsocksInbound = (port, settings = {}) => {
  const { tag = 'ss-in', listen = '0.0.0.0', method = 'aes-128-gcm', password = '', network = 'tcp,udp' } = settings;
  return {
    tag,
    listen,
    port,
    protocol: 'shadowsocks',
    settings: {
      method,
      password,
      network
    }
  };
};

export const buildRouting = (rules = [], domainStrategy = 'IPIfNonMatch') => ({
  domainStrategy,
  rules
});

export const buildOutbounds = () => [
  { protocol: 'freedom', tag: 'direct' },
  { protocol: 'blackhole', tag: 'block' }
];

export const generateFullConfig = (inbounds = [], routing = {}, extras = {}) => {
  const base = buildBaseConfig();
  return {
    ...base,
    inbounds,
    outbounds: buildOutbounds(),
    routing,
    ...extras
  };
};

export default {
  buildBaseConfig,
  buildStreamSettings,
  buildSniffing,
  buildVMessInbound,
  buildVLESSInbound,
  buildTrojanInbound,
  buildShadowsocksInbound,
  buildRouting,
  buildOutbounds,
  generateFullConfig
};
