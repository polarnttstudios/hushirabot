const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const embeds = require('../utils/embeds');
const { hasPermission } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Adiciona ou remove um cargo de um membro')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Adiciona um cargo')
        .addUserOption((opt) => opt.setName('usuario').setDescription('Usuário').setRequired(true))
        .addRoleOption((opt) => opt.setName('cargo').setDescription('Cargo').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove um cargo')
        .addUserOption((opt) => opt.setName('usuario').setDescription('Usuário').setRequired(true))
        .addRoleOption((opt) => opt.setName('cargo').setDescription('Cargo').setRequired(true))
    ),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({
        embeds: [embeds.error('Sem permissão', 'Você precisa da permissão de Gerenciar Cargos para usar este comando.')],
        ephemeral: true,
      });
    }

    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('usuario');
    const role = interaction.options.getRole('cargo');
    const member = await interaction.guild.members.fetch(target.id);
    const executor = interaction.member;
    const botMember = interaction.guild.members.me;

    // 1) Cargo com permissão Administrator não pode ser dado/removido por aqui
    if (role.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        embeds: [embeds.error('Não permitido', 'Este comando não pode ser usado para dar ou remover um cargo com permissão de Administrador.')],
        ephemeral: true,
      });
    }

    // 2) Hierarquia: quem executa não pode mexer em cargo igual/acima do próprio cargo mais alto
    if (role.position >= executor.roles.highest.position) {
      return interaction.reply({
        embeds: [embeds.error('Não permitido', 'Você não pode dar ou remover um cargo igual ou acima do seu cargo mais alto.')],
        ephemeral: true,
      });
    }

    // 3) Hierarquia: o cargo também precisa estar abaixo do cargo mais alto do bot
    if (role.position >= botMember.roles.highest.position) {
      return interaction.reply({
        embeds: [embeds.error('Não permitido', 'Esse cargo está acima do meu cargo mais alto — não consigo gerenciá-lo. Mova meu cargo pra cima na lista de cargos do servidor.')],
        ephemeral: true,
      });
    }

    if (sub === 'add') {
      await member.roles.add(role);
      return interaction.reply({ embeds: [embeds.success('Cargo adicionado', `**${role.name}** adicionado a **${target.tag}**.`)] });
    } else {
      await member.roles.remove(role);
      return interaction.reply({ embeds: [embeds.success('Cargo removido', `**${role.name}** removido de **${target.tag}**.`)] });
    }
  },
};
