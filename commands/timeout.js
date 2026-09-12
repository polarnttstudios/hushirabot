const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const { hasPermission } = require('../utils/permissions');
const db = require('../database/db');

const UNITS = {
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

function parseDuration(input) {
  const match = /^(\d+)(m|h|d)$/i.exec(input.trim());
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  return value * UNITS[unit];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Silencia (timeout) um membro temporariamente')
    .addUserOption((opt) => opt.setName('usuario').setDescription('Usuário a silenciar').setRequired(true))
    .addStringOption((opt) =>
      opt
        .setName('duracao')
        .setDescription('Ex: 10m, 2h, 1d (máx 28d)')
        .setRequired(true)
    )
    .addStringOption((opt) => opt.setName('motivo').setDescription('Motivo')),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ embeds: [embeds.error('Sem permissão', 'Você precisa da permissão correspondente para usar este comando.')], ephemeral: true });
    }

    const target = interaction.options.getUser('usuario');
    const durationStr = interaction.options.getString('duracao');
    const reason = interaction.options.getString('motivo') || 'Não informado';
    const ms = parseDuration(durationStr);

    if (!ms || ms > 28 * 24 * 60 * 60 * 1000) {
      return interaction.reply({
        embeds: [embeds.error('Duração inválida', 'Use um formato como `10m`, `2h` ou `1d` (máximo 28 dias).')],
        ephemeral: true,
      });
    }

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);
    if (!member || !member.moderatable) {
      return interaction.reply({ embeds: [embeds.error('Erro', 'Não posso silenciar esse membro.')], ephemeral: true });
    }

    await member.timeout(ms, `${reason} | Moderador: ${interaction.user.tag}`);
    db.addModLog(interaction.guild.id, 'timeout', target.id, interaction.user.id, `${durationStr} - ${reason}`);

    return interaction.reply({
      embeds: [embeds.success('Membro silenciado', `**${target.tag}** ficará em timeout por **${durationStr}**.\n**Motivo:** ${reason}`)],
    });
  },
};
