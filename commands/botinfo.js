const os = require('os');
const { SlashCommandBuilder, EmbedBuilder, version: djsVersion } = require('discord.js');
const pkg = require('../package.json');
const db = require('../database/db');

function formatDuration(ms) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000) % 24;
  const d = Math.floor(ms / 86400000);
  return `${d}d ${h}h ${m}m ${s}s`;
}

function gb(bytes) {
  return (bytes / 1024 ** 3).toFixed(2);
}

module.exports = {
  data: new SlashCommandBuilder().setName('botinfo').setDescription('Mostra o painel completo de status do bot'),

  async execute(interaction) {
    const client = interaction.client;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpu = os.cpus()[0];
    const processMemMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);

    const totalWarns = db.raw.prepare('SELECT COUNT(*) as c FROM warns').get().c;
    const totalModActions = db.raw.prepare('SELECT COUNT(*) as c FROM mod_log').get().c;
    const totalWebhooks = db.listWebhooks().length;

    const embed = new EmbedBuilder()
      .setColor(0x9b59ff)
      .setAuthor({ name: `${client.user.username} — Central Hushira`, iconURL: client.user.displayAvatarURL() })
      .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
      .addFields(
        {
          name: '🌐 Servidor Discord',
          value: [
            `**Servidores:** ${client.guilds.cache.size}`,
            `**Usuários (cache):** ${client.users.cache.size}`,
            `**Membros detectados:** ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`,
            `**WebSocket:** ${Math.round(client.ws.ping)}ms`,
          ].join('\n'),
          inline: true,
        },
        {
          name: `❤️ ${client.user.username}`,
          value: [
            `**Versão:** v${pkg.version}`,
            `**Uptime:** ${formatDuration(client.uptime)}`,
            `**Node.js:** ${process.version}`,
            `**discord.js:** v${djsVersion}`,
            `**Memória:** ${processMemMb} MB RSS`,
          ].join('\n'),
          inline: true,
        },
        {
          name: '🖥️ Sistema',
          value: [
            `**OS:** ${os.type()} ${os.release()}`,
            `**Arquitetura:** ${os.arch()}`,
            `**CPU:** ${cpu ? cpu.model.trim() : 'Desconhecida'}`,
            `**Núcleos:** ${os.cpus().length}`,
            `**Memória:** ${gb(usedMem)} GB / ${gb(totalMem)} GB`,
            `**Uptime do SO:** ${formatDuration(os.uptime() * 1000)}`,
          ].join('\n'),
          inline: true,
        },
        {
          name: '⚙️ Interno',
          value: [
            `**Comandos carregados:** ${client.commands.size}`,
            `**Banco de dados:** SQLite ✅ conectado`,
            `**Advertências registradas:** ${totalWarns}`,
            `**Ações de moderação:** ${totalModActions}`,
            `**Webhooks cadastrados:** ${totalWebhooks}`,
          ].join('\n'),
          inline: true,
        }
      )
      .setFooter({
        text: `${client.user.username} v${pkg.version} • Hushira`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
