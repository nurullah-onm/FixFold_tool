import os from 'os';
import prisma from '../config/prisma.js';

export const healthCheck = async (req, res) => {
  let database = 'unknown';

  try {
    const dbStatus = await prisma.$queryRaw`SELECT 1 as ok`;
    database = Array.isArray(dbStatus) ? 'up' : 'unknown';
  } catch (error) {
    database = 'down';
  }

  // basit sistem metrikleri (yaklaşık)
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const ramPercent = totalMem ? Number((usedMem / totalMem) * 100).toFixed(2) : 0;

  const cores = os.cpus()?.length || 1;
  const load1 = os.loadavg()[0] || 0;
  const cpuPercent = Number((load1 / cores) * 100).toFixed(2);

  // Node standard library swap/disk bilgisi vermediği için 0 döndürüyoruz
  const swapPercent = 0;
  const diskPercent = 0;

  res.json({
    success: true,
    service: 'FixFold API',
    database,
    timestamp: new Date().toISOString(),
    data: {
      cpuPercent: Number(cpuPercent),
      ramPercent: Number(ramPercent),
      swapPercent: Number(swapPercent),
      diskPercent: Number(diskPercent),
      cores,
      ramUsage: `${(usedMem / 1024 / 1024).toFixed(0)} MB / ${(totalMem / 1024 / 1024 / 1024).toFixed(2)} GB`,
      swapUsage: '0 / 0',
      diskUsage: 'n/a',
      xrayStatus: true
    }
  });
};
