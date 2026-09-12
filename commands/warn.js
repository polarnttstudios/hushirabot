const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const { hasPermission } = require('../utils/permissions');
const db = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Aplica uma advertência a um membro')
    .addUserOption((opt) => opt.setName('usuario').setDescription('Usuário').setRequired(true))
    .addStringOption((opt) => opt.setName('motivo').setDescription('Motivo da advertência').setRequired(true)),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ embeds: [embeds.error('Sem permissão', 'Você precisa da permissão correspondente para usar este comando.')], ephemeral: true });
    }

    const target = interaction.options.getUser('usuario');
    const reason = interaction.options.getString('motivo');

    db.addWarn(interaction.guild.id, target.id, interaction.user.id, reason);
    const total = db.getWarns(interaction.guild.id, target.id).length;

    await target.send({
      embeds: [embeds.warning(`Você recebeu uma advertência em ${interaction.guild.name}`, `**Motivo:** ${reason}`)],
    }).catch(() => {});

    return interaction.reply({
      embeds: [embeds.success('Advertência aplicada', `**${target.tag}** agora tem **${total}** advertência(s).\n**Motivo:** ${reason}`)],
    });
  },
};
