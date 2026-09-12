const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const { hasPermission } = require('../utils/permissions');
const db = require('../database/db');
const { confirmAction } = require('../utils/confirm');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bane um membro do servidor')
    .addUserOption((opt) => opt.setName('usuario').setDescription('Usuário a banir').setRequired(true))
    .addStringOption((opt) => opt.setName('motivo').setDescription('Motivo do banimento'))
    .addIntegerOption((opt) =>
      opt
        .setName('apagar_mensagens')
        .setDescription('Apagar mensagens dos últimos X dias (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
    ),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.BanMembers)) {
      return interaction.reply({ embeds: [embeds.error('Sem permissão', 'Você precisa da permissão correspondente para usar este comando.')], ephemeral: true });
    }

    const target = interaction.options.getUser('usuario');
    const reason = interaction.options.getString('motivo') || 'Não informado';
    const deleteDays = interaction.options.getInteger('apagar_mensagens') || 0;

    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (member && !member.bannable) {
      return interaction.reply({
        embeds: [embeds.error('Não foi possível banir', 'Esse membro tem cargo igual ou superior ao meu, ou não pode ser banido.')],
        ephemeral: true,
      });
    }

    await confirmAction(
      interaction,
      {
        title: 'Confirmar banimento',
        description: `Tem certeza que quer banir **${target.tag}**?\n**Motivo:** ${reason}${deleteDays > 0 ? `\n**Mensagens apagadas:** últimos ${deleteDays} dia(s)` : ''}`,
      },
      async () => {
        try {
          await interaction.guild.members.ban(target.id, {
            deleteMessageSeconds: deleteDays * 86400,
            reason: `${reason} | Moderador: ${interaction.user.tag}`,
          });
          db.addModLog(interaction.guild.id, 'ban', target.id, interaction.user.id, reason);

          await interaction.followUp({
            embeds: [embeds.success('Membro banido', `**${target.tag}** foi banido.\n**Motivo:** ${reason}`)],
          });
        } catch (err) {
          console.error(err);
          await interaction.followUp({
            embeds: [embeds.error('Erro ao banir', 'Ocorreu um erro ao tentar banir esse usuário.')],
            ephemeral: true,
          });
        }
      }
    );
  },
};
