import prisma from '../config/prisma.js';
import si from 'systeminformation';

const fmtBytes = (bytes = 0, precision = 2) => {
  if (!bytes || bytes < 0) return '0';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / Math.pow(1024, idx);
  return `${val.toFixed(precision)} ${units[idx]}`;
};

const fmtPercent = (num) => Number((num || 0).toFixed(2));

export const healthCheck = async (req, res) => {
  let database = 'unknown';
  try {
    const dbStatus = await prisma.$queryRaw`SELECT 1 as ok`;
    database = Array.isArray(dbStatus) ? 'up' : 'unknown';
  } catch (error) {
    database = 'down';
  }

  try {
    const [mem, load, fs, net, time, nets] = await Promise.all([
      si.mem(),
      si.currentLoad(),
      si.fsSize(),
      si.networkStats(),
      si.time(),
      si.networkInterfaces()
    ]);

    const ramPercent = mem.total ? (mem.active / mem.total) * 100 : 0;
    const swapPercent = mem.swaptotal ? (mem.swapused / mem.swaptotal) * 100 : 0;
    const fsMain = fs && fs.length ? fs[0] : null;
    const diskPercent = fsMain ? (fsMain.use) : 0;
    const cores = load.cpus?.length || load.cpus || 1;
    const cpuPercent = load.currentLoad || 0;

    const net0 = net && net.length ? net[0] : {};
    const upload = fmtBytes(net0.tx_bytes || 0, 2);
    const download = fmtBytes(net0.rx_bytes || 0, 2);
    const upSpeed = fmtBytes(net0.tx_sec || 0, 2) + '/s';
    const downSpeed = fmtBytes(net0.rx_sec || 0, 2) + '/s';

    const ipv4 = (nets || []).find((n) => n.ip4 && !n.internal)?.ip4 || '-';
    const ipv6 = (nets || []).find((n) => n.ip6 && !n.internal)?.ip6 || 'N/A';

    res.json({
      success: true,
      service: 'FixFold API',
      database,
      timestamp: new Date().toISOString(),
      data: {
        cpuPercent: fmtPercent(cpuPercent),
        ramPercent: fmtPercent(ramPercent),
        swapPercent: fmtPercent(swapPercent),
        diskPercent: fmtPercent(diskPercent),
        cores,
        ramUsage: `${fmtBytes(mem.active, 0)} / ${fmtBytes(mem.total, 2)}`,
        swapUsage: mem.swaptotal ? `${fmtBytes(mem.swapused, 0)} / ${fmtBytes(mem.swaptotal, 2)}` : '0 / 0',
        diskUsage: fsMain ? `${fmtBytes(fsMain.used, 2)} / ${fmtBytes(fsMain.size, 2)}` : 'n/a',
        loadAvg: load.avgload || 0,
        uptimeOs: `${Math.floor(time.uptime / 3600)}h`,
        upload,
        download,
        upSpeed,
        downSpeed,
        tcp: net0.tcp_connections || 0,
        udp: net0.udp_connections || 0,
        ipv4,
        ipv6,
        xrayStatus: true
      }
    });
  } catch (err) {
    // fallback minimal response
    res.json({
      success: true,
      service: 'FixFold API',
      database,
      timestamp: new Date().toISOString(),
      data: {}
    });
  }
};
