const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Mostra informações sobre um membro')
    .addUserOption((opt) => opt.setName('usuario').setDescription('Usuário (padrão: você)')),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const member = await interaction.guild.members.fetch(target.id).catch(() => null);

    const embed = embeds
      .info(`Informações de ${target.tag}`)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'ID', value: target.id, inline: true },
        { name: 'Conta criada em', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:D>`, inline: true }
      );

    if (member) {
      embed.addFields(
        { name: 'Entrou no servidor em', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`, inline: true },
        { name: 'Apelido', value: member.nickname || 'Nenhum', inline: true },
        {
          name: `Cargos (${member.roles.cache.size - 1})`,
          value: member.roles.cache.filter((r) => r.id !== interaction.guild.id).map((r) => `<@&${r.id}>`).join(', ') || 'Nenhum',
        }
      );
    }

    return interaction.reply({ embeds: [embed] });
  },
};
