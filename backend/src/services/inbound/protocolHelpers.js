export const getVMessDefaults = () => ({
  clients: [],
  disableInsecureEncryption: false
});

export const getVLESSDefaults = () => ({
  clients: [],
  decryption: 'none',
  fallbacks: []
});

export const getTrojanDefaults = () => ({
  clients: [],
  fallbacks: []
});

export const getShadowsocksDefaults = () => ({
  method: 'aes-256-gcm',
  password: '',
  network: 'tcp,udp'
});

export const getStreamPresets = (network, security) => {
  switch (network) {
    case 'TCP':
      return { network: 'tcp', tcpSettings: { header: { type: 'none' } }, security: security.toLowerCase() };
    case 'WS':
      return { network: 'ws', wsSettings: { path: '/', headers: {} }, security: security.toLowerCase() };
    case 'GRPC':
      return { network: 'grpc', grpcSettings: { serviceName: '' }, security: security.toLowerCase() };
    case 'HTTP2':
      return { network: 'http', httpSettings: { host: [], path: '/' }, security: security.toLowerCase() };
    case 'QUIC':
      return { network: 'quic', security: security.toLowerCase() };
    case 'KCP':
      return { network: 'kcp', kcpSettings: { mtu: 1350 }, security: security.toLowerCase() };
    default:
      return { network: 'tcp', security: security.toLowerCase() };
  }
};

export const getTLSTemplate = (domain) => ({
  serverName: domain,
  certificates: [
    {
      certificateFile: `/etc/x-ui/cert/${domain}.crt`,
      keyFile: `/etc/x-ui/cert/${domain}.key`
    }
  ],
  alpn: ['h2', 'http/1.1']
});

export const getRealityTemplate = () => ({
  show: false,
  dest: 'www.google.com:443',
  xver: 0,
  serverNames: ['www.google.com'],
  privateKey: '',
  publicKey: '',
  shortIds: ['']
});
