const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('serverinfo').setDescription('Mostra informações sobre o servidor'),

  async execute(interaction) {
    const guild = interaction.guild;
    const owner = await guild.fetchOwner();

    const embed = embeds
      .info(guild.name)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        { name: 'Dono', value: `${owner.user.tag}`, inline: true },
        { name: 'Membros', value: `${guild.memberCount}`, inline: true },
        { name: 'Criado em', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
        { name: 'Canais de texto', value: `${guild.channels.cache.filter((c) => c.type === 0).size}`, inline: true },
        { name: 'Canais de voz', value: `${guild.channels.cache.filter((c) => c.type === 2).size}`, inline: true },
        { name: 'Cargos', value: `${guild.roles.cache.size}`, inline: true }
      );

    return interaction.reply({ embeds: [embed] });
  },
};
