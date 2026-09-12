const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const { hasPermission } = require('../utils/permissions');
const { confirmAction } = require('../utils/confirm');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Apaga mensagens em massa no canal')
    .addIntegerOption((opt) =>
      opt.setName('quantidade').setDescription('Quantidade de mensagens (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)
    )
    .addUserOption((opt) => opt.setName('usuario').setDescription('Apagar apenas mensagens desse usuário')),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({ embeds: [embeds.error('Sem permissão', 'Você precisa da permissão correspondente para usar este comando.')], ephemeral: true });
    }

    const amount = interaction.options.getInteger('quantidade');
    const targetUser = interaction.options.getUser('usuario');

    await confirmAction(
      interaction,
      {
        title: 'Confirmar exclusão de mensagens',
        description: `Tem certeza que quer apagar até **${amount}** mensagem(ns) em ${interaction.channel}${targetUser ? ` de **${targetUser.tag}**` : ''}?\nEssa ação não pode ser desfeita.`,
      },
      async () => {
        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        let filtered = messages;
        if (targetUser) {
          filtered = messages.filter((m) => m.author.id === targetUser.id);
        }
        filtered = filtered.first(amount);

        const deleted = await interaction.channel.bulkDelete(filtered, true).catch(() => null);

        if (!deleted) {
          return interaction.followUp({
            embeds: [embeds.error('Erro', 'Não consegui apagar as mensagens (elas podem ter mais de 14 dias).')],
            ephemeral: true,
          });
        }

        return interaction.followUp({
          embeds: [embeds.success('Mensagens apagadas', `${deleted.size} mensagem(ns) removida(s).`)],
          ephemeral: true,
        });
      }
    );
  },
};
