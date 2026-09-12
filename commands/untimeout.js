const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const { hasPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove o timeout de um membro')
    .addUserOption((opt) => opt.setName('usuario').setDescription('Usuário').setRequired(true)),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ embeds: [embeds.error('Sem permissão', 'Você precisa da permissão correspondente para usar este comando.')], ephemeral: true });
    }

    const target = interaction.options.getUser('usuario');
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    if (!member) {
      return interaction.reply({ embeds: [embeds.error('Erro', 'Membro não encontrado.')], ephemeral: true });
    }

    await member.timeout(null, `Removido por ${interaction.user.tag}`);
    return interaction.reply({ embeds: [embeds.success('Timeout removido', `**${target.tag}** não está mais em timeout.`)] });
  },
};
