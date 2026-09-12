const { ChannelType, GuildVerificationLevel } = require('discord.js');
const db = require('../database/db');

/** Tranca todos os canais de texto pra @everyone e eleva a verificação do servidor. */
async function enableRaidMode(guild, reason = 'Modo anti-raid ativado') {
  const textChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText);
  let locked = 0;
  for (const channel of textChannels.values()) {
    try {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }, { reason });
      locked++;
    } catch {
      // ignora canais que o bot não consegue mexer
    }
  }

  const previousLevel = guild.verificationLevel;
  try {
    await guild.setVerificationLevel(GuildVerificationLevel.VeryHigh, reason);
  } catch {
    // ignora se o bot não tiver permissão de mudar isso
  }

  db.upsertGuildSettings(guild.id, {});
  db.raw
    .prepare('UPDATE guild_settings SET raid_mode = 1, previous_verification_level = ? WHERE guild_id = ?')
    .run(previousLevel, guild.id);

  return locked;
}

/** Destranca os canais e restaura o nível de verificação anterior. */
async function disableRaidMode(guild, reason = 'Modo anti-raid desativado') {
  const textChannels = guild.channels.cache.filter((c) => c.type === ChannelType.GuildText);
  let unlocked = 0;
  for (const channel of textChannels.values()) {
    try {
      await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null }, { reason });
      unlocked++;
    } catch {
      // ignora canais que o bot não consegue mexer
    }
  }

  const settings = db.getGuildSettings(guild.id);
  if (settings?.previous_verification_level !== null && settings?.previous_verification_level !== undefined) {
    try {
      await guild.setVerificationLevel(settings.previous_verification_level, reason);
    } catch {
      // ignora se o bot não tiver permissão
    }
  }

  db.raw.prepare('UPDATE guild_settings SET raid_mode = 0 WHERE guild_id = ?').run(guild.id);

  return unlocked;
}

function isRaidModeActive(guildId) {
  const settings = db.getGuildSettings(guildId);
  return !!settings?.raid_mode;
}

module.exports = { enableRaidMode, disableRaidMode, isRaidModeActive };
