const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const { hasPermission } = require('../utils/permissions');
const db = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarnings')
    .setDescription('Remove todas as advertências de um membro')
    .addUserOption((opt) => opt.setName('usuario').setDescription('Usuário').setRequired(true)),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ embeds: [embeds.error('Sem permissão', 'Você precisa da permissão correspondente para usar este comando.')], ephemeral: true });
    }

    const target = interaction.options.getUser('usuario');
    db.clearWarns(interaction.guild.id, target.id);
    return interaction.reply({ embeds: [embeds.success('Advertências limpas', `Todas as advertências de **${target.tag}** foram removidas.`)] });
  },
};
