const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const { hasPermission } = require('../utils/permissions');
const { enableRaidMode, disableRaidMode, isRaidModeActive } = require('../utils/raidmode');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('raidmode')
    .setDescription('Ativa ou desativa o modo anti-raid (tranca o servidor contra ataque de entrada em massa)')
    .addSubcommand((sub) => sub.setName('on').setDescription('Tranca o servidor manualmente'))
    .addSubcommand((sub) => sub.setName('off').setDescription('Destranca o servidor')),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        embeds: [embeds.error('Sem permissão', 'Você precisa da permissão de Gerenciar Servidor para usar este comando.')],
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;

    await interaction.deferReply();

    if (sub === 'on') {
      if (isRaidModeActive(guild.id)) {
        return interaction.editReply({ embeds: [embeds.info('Já está ativo', 'O modo anti-raid já está ligado neste servidor.')] });
      }

      const locked = await enableRaidMode(guild, `Ativado manualmente por ${interaction.user.tag}`);
      return interaction.editReply({
        embeds: [
          embeds
            .warning('🚨 Modo anti-raid ATIVADO', `**${locked}** canal(is) de texto trancado(s) para @everyone.\nVerificação do servidor elevada ao máximo.`)
            .setFooter({ text: 'Use /raidmode off quando a situação estiver controlada' }),
        ],
      });
    } else {
      if (!isRaidModeActive(guild.id)) {
        return interaction.editReply({ embeds: [embeds.info('Já está desativado', 'O modo anti-raid não está ativo neste servidor.')] });
      }

      const unlocked = await disableRaidMode(guild, `Desativado manualmente por ${interaction.user.tag}`);
      return interaction.editReply({
        embeds: [embeds.success('✅ Modo anti-raid desativado', `**${unlocked}** canal(is) destrancado(s). Verificação do servidor restaurada.`)],
      });
    }
  },
};
