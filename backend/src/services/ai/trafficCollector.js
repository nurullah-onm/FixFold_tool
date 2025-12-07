import prisma from '../../config/prisma.js';
import * as xrayStatsService from '../xray/xrayStatsService.js';
import logger from '../../utils/logger.js';

class TrafficCollector {
  constructor() {
    this.lastStats = new Map();
  }

  async collectSnapshots() {
    try {
      const clients = await prisma.client.findMany({
        where: { enable: true },
        include: { inbound: true }
      });

      const snapshots = [];

      for (const client of clients) {
        const stats = await xrayStatsService.getUserStats(client.email).catch(() => null);
        if (!stats || !stats.stat) continue;

        const totalUp = BigInt(stats.stat.find((s) => s.name?.includes('uplink'))?.value || 0);
        const totalDown = BigInt(stats.stat.find((s) => s.name?.includes('downlink'))?.value || 0);

        const lastStat = this.lastStats.get(client.id) || { up: totalUp, down: totalDown, timestamp: Date.now() };
        const now = Date.now();
        const timeDiff = (now - lastStat.timestamp) / 1000;
        if (timeDiff <= 0) continue;

        const upDiff = Number(totalUp - lastStat.up);
        const downDiff = Number(totalDown - lastStat.down);
        const upRate = upDiff / timeDiff;
        const downRate = downDiff / timeDiff;
        const totalRate = upRate + downRate;

        const connectionCount = this._estimateConnections(totalRate);

        snapshots.push({
          clientId: client.id,
          upRate,
          downRate,
          totalRate,
          connectionCount,
          timestamp: new Date()
        });

        this.lastStats.set(client.id, { up: totalUp, down: totalDown, timestamp: now });
      }

      if (snapshots.length > 0) {
        await prisma.trafficSnapshot.createMany({ data: snapshots });
        logger.info(`Collected ${snapshots.length} traffic snapshots`);
      }

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await prisma.trafficSnapshot.deleteMany({ where: { timestamp: { lt: sevenDaysAgo } } });
    } catch (error) {
      logger.error(`Traffic collection error: ${error.message}`);
    }
  }

  _estimateConnections(totalRate) {
    return Math.max(1, Math.ceil(totalRate / 50000));
  }
}

const trafficCollector = new TrafficCollector();
export default trafficCollector;
