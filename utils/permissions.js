/**
 * Verifica se quem usou o comando tem a permissão do Discord necessária.
 */
function hasPermission(interaction, permission) {
  return interaction.member.permissions.has(permission);
}

module.exports = { hasPermission };
