import QRCode from 'qrcode';
import env from '../../config/env.js';
import prisma from '../../config/prisma.js';

class QRCodeService {
  async generateQRCode(clientId, userId, userRole) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { inbound: true }
    });
    if (!client) throw this._error('Client not found', 404);
    if (userRole !== 'ADMIN' && client.inbound.userId !== userId) throw this._error('Permission denied', 403);

    const link = this._generateShareLink(client);
    const qrcode = await QRCode.toDataURL(link);
    return { qrcode, link };
  }

  _generateShareLink(client) {
    const { inbound, uuid, password, email, flow } = client;
    const address = env.serverAddress;
    const port = inbound.port;
    switch (inbound.protocol) {
      case 'VMESS':
        return this._buildVMessLink(address, port, uuid, email, inbound);
      case 'VLESS':
        return this._buildVLESSLink(address, port, uuid, email, inbound, flow);
      case 'TROJAN':
        return this._buildTrojanLink(address, port, password, email, inbound);
      case 'SHADOWSOCKS':
        return this._buildShadowsocksLink(address, port, password, inbound);
      default:
        throw this._error('Unsupported protocol for share link', 400);
    }
  }

  _buildVMessLink(address, port, uuid, email, inbound) {
    const config = {
      v: '2',
      ps: email,
      add: address,
      port: port.toString(),
      id: uuid,
      aid: '0',
      net: inbound.network.toLowerCase(),
      type: 'none',
      host: '',
      path: inbound.streamSettings?.wsSettings?.path || '/',
      tls: inbound.security === 'TLS' ? 'tls' : ''
    };
    const jsonStr = JSON.stringify(config);
    const base64 = Buffer.from(jsonStr).toString('base64');
    return `vmess://${base64}`;
  }

  _buildVLESSLink(address, port, uuid, email, inbound, flow) {
    const params = new URLSearchParams({
      type: inbound.network.toLowerCase(),
      security: inbound.security.toLowerCase()
    });
    if (flow) params.append('flow', flow);
    if (inbound.security === 'TLS') {
      params.append('sni', inbound.tlsSettings?.serverName || address);
      params.append('alpn', 'h2,http/1.1');
    }
    if (inbound.network === 'WS') {
      params.append('path', inbound.streamSettings?.wsSettings?.path || '/');
      params.append('host', address);
    }
    return `vless://${uuid}@${address}:${port}?${params.toString()}#${encodeURIComponent(email)}`;
  }

  _buildTrojanLink(address, port, password, email, inbound) {
    const params = new URLSearchParams({
      type: inbound.network.toLowerCase(),
      security: inbound.security.toLowerCase(),
      sni: inbound.tlsSettings?.serverName || address,
      alpn: 'h2,http/1.1'
    });
    return `trojan://${password}@${address}:${port}?${params.toString()}#${encodeURIComponent(email)}`;
  }

  _buildShadowsocksLink(address, port, password, inbound) {
    const method = inbound.settings?.method || 'aes-256-gcm';
    const userinfo = Buffer.from(`${method}:${password}`).toString('base64');
    return `ss://${userinfo}@${address}:${port}`;
  }

  _error(message, status = 400) {
    const err = new Error(message);
    err.status = status;
    return err;
  }
}

const qrcodeService = new QRCodeService();
export default qrcodeService;
