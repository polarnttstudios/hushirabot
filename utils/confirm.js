const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const embeds = require('./embeds');

/**
 * Mostra um embed com botões "Confirmar" / "Cancelar" e só executa a ação
 * se a mesma pessoa que chamou o comando clicar em "Confirmar" a tempo.
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @param {{ title: string, description: string }} warningContent - texto do aviso
 * @param {() => Promise<void>} onConfirm - executado se a pessoa confirmar
 * @param {number} timeoutMs - tempo limite pra confirmar (padrão 15s)
 */
async function confirmAction(interaction, warningContent, onConfirm, timeoutMs = 15000) {
  const confirmId = `confirm_${interaction.id}`;
  const cancelId = `cancel_${interaction.id}`;

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(confirmId).setLabel('Confirmar').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(cancelId).setLabel('Cancelar').setStyle(ButtonStyle.Secondary)
  );

  const warnEmbed = embeds.warning(warningContent.title, warningContent.description).setFooter({
    text: `Você tem ${Math.round(timeoutMs / 1000)}s para confirmar`,
  });

  const reply = await interaction.reply({ embeds: [warnEmbed], components: [row], fetchReply: true });

  let collected;
  try {
    collected = await reply.awaitMessageComponent({
      filter: (i) => i.user.id === interaction.user.id && (i.customId === confirmId || i.customId === cancelId),
      time: timeoutMs,
    });
  } catch {
    return interaction.editReply({
      embeds: [embeds.error('Tempo esgotado', 'Ação cancelada automaticamente por falta de confirmação.')],
      components: [],
    });
  }

  if (collected.customId === cancelId) {
    return collected.update({ embeds: [embeds.info('Cancelado', 'Ação cancelada.')], components: [] });
  }

  // Confirmado: desativa os botões antes de rodar a ação de verdade
  await collected.update({ embeds: [warnEmbed], components: [] });
  await onConfirm();
}

module.exports = { confirmAction };
