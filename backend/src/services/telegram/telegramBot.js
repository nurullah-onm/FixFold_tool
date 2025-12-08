import TelegramBot from 'node-telegram-bot-api';
import prisma from '../../config/prisma.js';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';

let botInstance = null;

const menuKeyboard = {
  keyboard: [
    ['📊 Durum', '📥 Girişler'],
    ['👤 Clients', '🤖 AI'],
    ['🖥️ Sunucular']
  ],
  resize_keyboard: true
};

const isAllowed = (chatId) => {
  const { chatId: single, adminIds } = env.telegram;
  if (!single && (!adminIds || adminIds.length === 0)) return true;
  if (String(chatId) === String(single)) return true;
  if (adminIds && adminIds.includes(String(chatId))) return true;
  return false;
};

const sendAccessDenied = (chatId) => {
  if (!botInstance) return;
  botInstance.sendMessage(chatId, 'Bu botu kullanma yetkiniz yok.');
};

const formatInbounds = (list) => list.map((i) => `• ${i.remark} (${i.protocol}) port ${i.port}${i.isActive ? '' : ' [pasif]'}`).join('\n');
const formatClients = (list) => list.map((c) => `• ${c.email} (up ${c.up} / down ${c.down})`).join('\n');
const formatServers = (list) => list.map((s) => `• ${s.name} [${s.status}] ${s.currentClients}/${s.maxClients}`).join('\n');

async function handleStatus(chatId) {
  const [inbounds, clients, servers, anomalies] = await Promise.all([
    prisma.inbound.count(),
    prisma.client.count(),
    prisma.server.count(),
    prisma.anomaly.count({ where: { resolved: false } })
  ]);
  const msg = `Durum\nInbounds: ${inbounds}\nClients: ${clients}\nServers: ${servers}\nAçık anomali: ${anomalies}`;
  botInstance.sendMessage(chatId, msg, { reply_markup: menuKeyboard });
}

async function handleInbounds(chatId) {
  const list = await prisma.inbound.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
  if (list.length === 0) return botInstance.sendMessage(chatId, 'Kayıtlı giriş yok.', { reply_markup: menuKeyboard });
  botInstance.sendMessage(chatId, `Girişler (son 5)\n${formatInbounds(list)}`, { reply_markup: menuKeyboard });
}

async function handleClients(chatId) {
  const list = await prisma.client.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
  if (list.length === 0) return botInstance.sendMessage(chatId, 'Kayıtlı client yok.', { reply_markup: menuKeyboard });
  botInstance.sendMessage(chatId, `Clients (son 5)\n${formatClients(list)}`, { reply_markup: menuKeyboard });
}

async function handleAI(chatId) {
  const unresolved = await prisma.anomaly.findMany({ where: { resolved: false }, take: 5, orderBy: { detectedAt: 'desc' } });
  if (unresolved.length === 0) return botInstance.sendMessage(chatId, 'Açık anomali yok.', { reply_markup: menuKeyboard });
  const text = unresolved
    .map((a) => `• ${a.id.slice(0, 6)} ${a.type} [${a.severity}] skor ${a.score}`)
    .join('\n') + '\n/resolve <id> ile kapat.';
  botInstance.sendMessage(chatId, `AI Anomalileri\n${text}`, { reply_markup: menuKeyboard });
}

async function handleServers(chatId) {
  const list = await prisma.server.findMany({ take: 5, orderBy: { createdAt: 'desc' } });
  if (list.length === 0) return botInstance.sendMessage(chatId, 'Sunucu yok.', { reply_markup: menuKeyboard });
  botInstance.sendMessage(chatId, `Sunucular\n${formatServers(list)}`, { reply_markup: menuKeyboard });
}

async function handleResolve(chatId, id) {
  if (!id) return botInstance.sendMessage(chatId, 'Kullanım: /resolve <anomalyId>');
  const exists = await prisma.anomaly.findUnique({ where: { id } });
  if (!exists) return botInstance.sendMessage(chatId, 'Anomali bulunamadı');
  await prisma.anomaly.update({ where: { id }, data: { resolved: true, resolvedAt: new Date() } });
  botInstance.sendMessage(chatId, `Anomali kapatıldı: ${id}`);
}

export function startTelegramBot() {
  const token = env.telegram.botToken;
  if (!token) {
    logger.info('Telegram bot kapalı (TELEGRAM_BOT_TOKEN boş)');
    return;
  }

  botInstance = new TelegramBot(token, { polling: true });
  logger.info('Telegram bot başlatıldı (polling)');

  botInstance.onText(/\/start/, (msg) => {
    if (!isAllowed(msg.chat.id)) return sendAccessDenied(msg.chat.id);
    botInstance.sendMessage(msg.chat.id, 'FixFold Telegram kontrolüne hoş geldin. Menúden seçim yap.', { reply_markup: menuKeyboard });
  });

  botInstance.onText(/\/help/, (msg) => {
    if (!isAllowed(msg.chat.id)) return sendAccessDenied(msg.chat.id);
    botInstance.sendMessage(
      msg.chat.id,
      'Komutlar:\n/start menü\n/status genel durum\n/inbounds liste\n/clients liste\n/ai anomaliler\n/servers sunucular\n/resolve <id> anomali kapat',
      { reply_markup: menuKeyboard }
    );
  });

  botInstance.onText(/\/status/, async (msg) => {
    if (!isAllowed(msg.chat.id)) return sendAccessDenied(msg.chat.id);
    handleStatus(msg.chat.id).catch((err) => logger.error('TG status err', err));
  });

  botInstance.onText(/\/inbounds/, async (msg) => {
    if (!isAllowed(msg.chat.id)) return sendAccessDenied(msg.chat.id);
    handleInbounds(msg.chat.id).catch((err) => logger.error('TG inbounds err', err));
  });

  botInstance.onText(/\/clients/, async (msg) => {
    if (!isAllowed(msg.chat.id)) return sendAccessDenied(msg.chat.id);
    handleClients(msg.chat.id).catch((err) => logger.error('TG clients err', err));
  });

  botInstance.onText(/\/ai/, async (msg) => {
    if (!isAllowed(msg.chat.id)) return sendAccessDenied(msg.chat.id);
    handleAI(msg.chat.id).catch((err) => logger.error('TG ai err', err));
  });

  botInstance.onText(/\/servers/, async (msg) => {
    if (!isAllowed(msg.chat.id)) return sendAccessDenied(msg.chat.id);
    handleServers(msg.chat.id).catch((err) => logger.error('TG servers err', err));
  });

  botInstance.onText(/\/resolve (.+)/, async (msg, match) => {
    if (!isAllowed(msg.chat.id)) return sendAccessDenied(msg.chat.id);
    const id = match?.[1];
    handleResolve(msg.chat.id, id).catch((err) => logger.error('TG resolve err', err));
  });

  botInstance.on('message', (msg) => {
    if (!isAllowed(msg.chat.id)) return sendAccessDenied(msg.chat.id);
    const text = msg.text || '';
    if (text === '📊 Durum') return handleStatus(msg.chat.id);
    if (text === '📥 Girişler') return handleInbounds(msg.chat.id);
    if (text === '👤 Clients') return handleClients(msg.chat.id);
    if (text === '🤖 AI') return handleAI(msg.chat.id);
    if (text === '🖥️ Sunucular') return handleServers(msg.chat.id);
  });
}
