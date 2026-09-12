const Database = require('better-sqlite3');
const path = require('path');
const config = require('../config');

const db = new Database(path.resolve(__dirname, '..', config.database.path));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS warns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  moderator_id TEXT NOT NULL,
  reason TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS guild_settings (
  guild_id TEXT PRIMARY KEY,
  log_channel_id TEXT,
  mute_role_id TEXT
);

CREATE TABLE IF NOT EXISTS webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS mod_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  moderator_id TEXT,
  reason TEXT,
  created_at INTEGER NOT NULL
);
`);

// Migrações simples pra bancos já existentes (ignora erro se a coluna já existir)
try { db.exec('ALTER TABLE guild_settings ADD COLUMN raid_mode INTEGER DEFAULT 0'); } catch {}
try { db.exec('ALTER TABLE guild_settings ADD COLUMN previous_verification_level INTEGER'); } catch {}

module.exports = {
  raw: db,

  // ---- Warns ----
  addWarn(guildId, userId, moderatorId, reason) {
    return db
      .prepare(
        `INSERT INTO warns (guild_id, user_id, moderator_id, reason, created_at) VALUES (?, ?, ?, ?, ?)`
      )
      .run(guildId, userId, moderatorId, reason, Date.now());
  },
  getWarns(guildId, userId) {
    return db
      .prepare(`SELECT * FROM warns WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC`)
      .all(guildId, userId);
  },
  clearWarns(guildId, userId) {
    return db.prepare(`DELETE FROM warns WHERE guild_id = ? AND user_id = ?`).run(guildId, userId);
  },

  // ---- Guild settings ----
  getGuildSettings(guildId) {
    return db.prepare(`SELECT * FROM guild_settings WHERE guild_id = ?`).get(guildId);
  },
  upsertGuildSettings(guildId, { logChannelId, muteRoleId }) {
    const existing = this.getGuildSettings(guildId);
    if (existing) {
      db.prepare(
        `UPDATE guild_settings SET log_channel_id = COALESCE(?, log_channel_id), mute_role_id = COALESCE(?, mute_role_id) WHERE guild_id = ?`
      ).run(logChannelId, muteRoleId, guildId);
    } else {
      db.prepare(
        `INSERT INTO guild_settings (guild_id, log_channel_id, mute_role_id) VALUES (?, ?, ?)`
      ).run(guildId, logChannelId || null, muteRoleId || null);
    }
  },

  // ---- Webhooks (dashboard) ----
  listWebhooks() {
    return db.prepare(`SELECT * FROM webhooks ORDER BY created_at DESC`).all();
  },
  addWebhook(name, url) {
    return db
      .prepare(`INSERT INTO webhooks (name, url, created_at) VALUES (?, ?, ?)`)
      .run(name, url, Date.now());
  },
  deleteWebhook(id) {
    return db.prepare(`DELETE FROM webhooks WHERE id = ?`).run(id);
  },

  recentWarns(limit = 50) {
    return db.prepare(`SELECT * FROM warns ORDER BY created_at DESC LIMIT ?`).all(limit);
  },

  // ---- Mod log ----
  addModLog(guildId, action, targetId, moderatorId, reason) {
    return db
      .prepare(
        `INSERT INTO mod_log (guild_id, action, target_id, moderator_id, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(guildId, action, targetId, moderatorId, reason || null, Date.now());
  },
  recentModLog(limit = 50) {
    return db.prepare(`SELECT * FROM mod_log ORDER BY created_at DESC LIMIT ?`).all(limit);
  },
};
