const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const { hasPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Define o modo lento do canal')
    .addIntegerOption((opt) =>
      opt.setName('segundos').setDescription('Segundos entre mensagens (0 desativa, máx 21600)').setRequired(true).setMinValue(0).setMaxValue(21600)
    ),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ embeds: [embeds.error('Sem permissão', 'Você precisa da permissão correspondente para usar este comando.')], ephemeral: true });
    }

    const seconds = interaction.options.getInteger('segundos');
    await interaction.channel.setRateLimitPerUser(seconds);
    return interaction.reply({
      embeds: [
        embeds.success(
          'Modo lento atualizado',
          seconds === 0 ? 'Modo lento desativado.' : `Modo lento definido para **${seconds}s**.`
        ),
      ],
    });
  },
};
