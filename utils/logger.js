const { EmbedBuilder } = require('discord.js');
const config = require('../config');

let clientRef = null;

/** Chamado uma vez, quando o bot fica pronto, pra o logger saber usar o client. */
function initLogger(client) {
  clientRef = client;
}

/**
 * Loga um erro no terminal E manda um embed pro canal configurado em
 * LOG_CHANNEL_ID (se estiver definido no .env). Nunca deixa um erro
 * de log derrubar o bot — qualquer falha aqui só cai no console.
 */
async function logError(title, error, extra = {}) {
  console.error(`[${title}]`, error);

  if (!clientRef || !config.logChannelId) return;

  try {
    const channel = await clientRef.channels.fetch(config.logChannelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const stack = error?.stack || error?.message || String(error);

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle(`🚨 ${title}`)
      .setDescription('```' + stack.slice(0, 3900) + '```')
      .setTimestamp();

    if (extra.command) embed.addFields({ name: 'Comando', value: `/${extra.command}`, inline: true });
    if (extra.user) embed.addFields({ name: 'Usuário', value: `${extra.user}`, inline: true });
    if (extra.guild) embed.addFields({ name: 'Servidor', value: `${extra.guild}`, inline: true });

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[logger] Não consegui enviar o log pro canal:', err);
  }
}

module.exports = { initLogger, logError };
