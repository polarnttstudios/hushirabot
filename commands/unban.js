const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const { hasPermission } = require('../utils/permissions');
const db = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Remove o banimento de um usuário')
    .addStringOption((opt) => opt.setName('id').setDescription('ID do usuário a desbanir').setRequired(true))
    .addStringOption((opt) => opt.setName('motivo').setDescription('Motivo do desbanimento')),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ embeds: [embeds.error('Sem permissão', 'Você precisa da permissão correspondente para usar este comando.')], ephemeral: true });
    }

    const userId = interaction.options.getString('id');
    const reason = interaction.options.getString('motivo') || 'Não informado';

    try {
      await interaction.guild.members.unban(userId, reason);
      db.addModLog(interaction.guild.id, 'unban', userId, interaction.user.id, reason);
      return interaction.reply({
        embeds: [embeds.success('Usuário desbanido', `O ID \`${userId}\` foi desbanido.`)],
      });
    } catch (err) {
      return interaction.reply({
        embeds: [embeds.error('Erro', 'Não encontrei um banimento com esse ID, ou o ID é inválido.')],
        ephemeral: true,
      });
    }
  },
};
