const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const { hasPermission } = require('../utils/permissions');
const db = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa um membro do servidor')
    .addUserOption((opt) => opt.setName('usuario').setDescription('Usuário a expulsar').setRequired(true))
    .addStringOption((opt) => opt.setName('motivo').setDescription('Motivo da expulsão')),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.KickMembers)) {
      return interaction.reply({ embeds: [embeds.error('Sem permissão', 'Você precisa da permissão correspondente para usar este comando.')], ephemeral: true });
    }

    const target = interaction.options.getUser('usuario');
    const reason = interaction.options.getString('motivo') || 'Não informado';
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({ embeds: [embeds.error('Erro', 'Esse usuário não está no servidor.')], ephemeral: true });
    }
    if (!member.kickable) {
      return interaction.reply({
        embeds: [embeds.error('Não foi possível expulsar', 'Esse membro tem cargo igual ou superior ao meu.')],
        ephemeral: true,
      });
    }

    try {
      await member.kick(`${reason} | Moderador: ${interaction.user.tag}`);
      db.addModLog(interaction.guild.id, 'kick', target.id, interaction.user.id, reason);
      return interaction.reply({
        embeds: [embeds.success('Membro expulso', `**${target.tag}** foi expulso.\n**Motivo:** ${reason}`)],
      });
    } catch (err) {
      console.error(err);
      return interaction.reply({ embeds: [embeds.error('Erro ao expulsar', 'Ocorreu um erro.')], ephemeral: true });
    }
  },
};
