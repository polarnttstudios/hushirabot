const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Mostra o avatar de um usuário')
    .addUserOption((opt) => opt.setName('usuario').setDescription('Usuário (padrão: você)')),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario') || interaction.user;
    const embed = embeds.info(`Avatar de ${target.tag}`).setImage(target.displayAvatarURL({ size: 512 }));
    return interaction.reply({ embeds: [embed] });
  },
};
