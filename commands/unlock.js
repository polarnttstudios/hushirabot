const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const { hasPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Destranca o canal atual'),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ embeds: [embeds.error('Sem permissão', 'Você precisa da permissão correspondente para usar este comando.')], ephemeral: true });
    }

    await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: null,
    });
    return interaction.reply({ embeds: [embeds.success('Canal destrancado', '🔓 Este canal foi destrancado.')] });
  },
};
