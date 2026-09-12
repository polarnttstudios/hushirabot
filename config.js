require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  // Canal do Discord onde o bot manda os erros/logs automaticamente.
  // Deixe vazio no .env pra desativar (só loga no terminal).
  logChannelId: process.env.LOG_CHANNEL_ID || null,
  devGuildIds: (process.env.DEV_GUILD_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),

  // Detecção automática de raid: se esse número de membros entrar dentro
  // da janela de tempo abaixo, o bot tranca o servidor sozinho.
  raidDetection: {
    joinThreshold: Number(process.env.RAID_JOIN_THRESHOLD) || 6,
    windowMs: Number(process.env.RAID_JOIN_WINDOW_MS) || 10000,
  },

  database: {
    path: process.env.DATABASE_PATH || './database/bot.db',
  },

  dashboard: {
    enabled: (process.env.DASHBOARD_ENABLED || 'true').toLowerCase() !== 'false',
    port: process.env.DASHBOARD_PORT || 3000,
    user: process.env.DASHBOARD_USER || 'admin',
    passwordHash: process.env.DASHBOARD_PASSWORD_HASH || '',
    sessionSecret: process.env.SESSION_SECRET || 'change-me',
  },
};
