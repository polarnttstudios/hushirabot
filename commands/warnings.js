const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const { hasPermission } = require('../utils/permissions');
const db = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Lista as advertências de um membro')
    .addUserOption((opt) => opt.setName('usuario').setDescription('Usuário').setRequired(true)),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ embeds: [embeds.error('Sem permissão', 'Você precisa da permissão correspondente para usar este comando.')], ephemeral: true });
    }

    const target = interaction.options.getUser('usuario');
    const warns = db.getWarns(interaction.guild.id, target.id);

    if (warns.length === 0) {
      return interaction.reply({ embeds: [embeds.info('Sem advertências', `**${target.tag}** não tem nenhuma advertência.`)] });
    }

    const list = warns
      .slice(0, 15)
      .map((w, i) => `**${i + 1}.** ${w.reason} — <t:${Math.floor(w.created_at / 1000)}:R> (por <@${w.moderator_id}>)`)
      .join('\n');

    return interaction.reply({
      embeds: [embeds.info(`Advertências de ${target.tag}`, list).setFooter({ text: `Total: ${warns.length}` })],
    });
  },
};
