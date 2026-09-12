const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Mostra a latência do bot'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: '🏓 Calculando...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    return interaction.editReply({
      content: null,
      embeds: [embeds.info('🏓 Pong!', `**Latência:** ${latency}ms\n**API do Discord:** ${Math.round(interaction.client.ws.ping)}ms`)],
    });
  },
};
