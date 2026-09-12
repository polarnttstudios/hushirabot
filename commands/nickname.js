const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const { hasPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nickname')
    .setDescription('Altera o apelido de um membro')
    .addUserOption((opt) => opt.setName('usuario').setDescription('Usuário').setRequired(true))
    .addStringOption((opt) => opt.setName('apelido').setDescription('Novo apelido (deixe vazio para remover)')),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ManageNicknames)) {
      return interaction.reply({ embeds: [embeds.error('Sem permissão', 'Você precisa da permissão correspondente para usar este comando.')], ephemeral: true });
    }

    const target = interaction.options.getUser('usuario');
    const nickname = interaction.options.getString('apelido') || null;
    const member = await interaction.guild.members.fetch(target.id);

    await member.setNickname(nickname);
    return interaction.reply({
      embeds: [embeds.success('Apelido atualizado', `Apelido de **${target.tag}** ${nickname ? `alterado para **${nickname}**` : 'removido'}.`)],
    });
  },
};
