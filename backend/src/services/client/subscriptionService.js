import prisma from '../../config/prisma.js';
import qrcodeService from './qrcodeService.js';

class SubscriptionService {
  async generateSubscription(subId) {
    const client = await prisma.client.findUnique({
      where: { subId },
      include: { inbound: true }
    });
    if (!client) {
      const err = new Error('Subscription not found');
      err.status = 404;
      throw err;
    }

    const { link } = await qrcodeService.generateQRCode(client.id, client.inbound.userId, 'ADMIN');
    const base64Link = Buffer.from(link).toString('base64');
    return base64Link;
  }

  async getSubscriptionInfo(subId) {
    const client = await prisma.client.findUnique({
      where: { subId },
      include: { inbound: { select: { remark: true, protocol: true } } }
    });
    if (!client) {
      const err = new Error('Subscription not found');
      err.status = 404;
      throw err;
    }
    const total = client.up + client.down;
    const remaining = client.totalGB > 0 ? client.totalGB - total : null;
    return {
      email: client.email,
      inbound: client.inbound.remark,
      protocol: client.inbound.protocol,
      upload: client.up.toString(),
      download: client.down.toString(),
      total: total.toString(),
      totalGB: client.totalGB.toString(),
      remaining: remaining ? remaining.toString() : 'Unlimited',
      expiryTime: client.expiryTime,
      enable: client.enable
    };
  }
}

const subscriptionService = new SubscriptionService();
export default subscriptionService;
