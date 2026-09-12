// Limpa slash commands registrados no Discord — útil quando ficam
// comandos duplicados (um registrado globalmente e outro só num servidor).
//
// USO:
//   node clear-commands.js global              -> apaga todos os comandos GLOBAIS
//   node clear-commands.js guild <ID_DO_SERVIDOR> -> apaga os comandos daquele servidor
//   node clear-commands.js all <ID_DO_SERVIDOR>   -> apaga os dois (globais + desse servidor)
//
// Depois de limpar, rode "node deploy-commands.js" de novo pra registrar
// tudo do jeito certo (sem duplicar).

const { REST, Routes } = require('discord.js');
const config = require('./config');

const [, , mode, guildId] = process.argv;
const rest = new REST({ version: '10' }).setToken(config.token);

async function clearGlobal() {
  await rest.put(Routes.applicationCommands(config.clientId), { body: [] });
  console.log('🧹 Comandos GLOBAIS limpos.');
}

async function clearGuild(id) {
  if (!id) {
    console.log('❌ Faltou o ID do servidor. Ex: node clear-commands.js guild 123456789012345678');
    process.exit(1);
  }
  await rest.put(Routes.applicationGuildCommands(config.clientId, id), { body: [] });
  console.log(`🧹 Comandos do servidor ${id} limpos.`);
}

(async () => {
  try {
    if (mode === 'global') {
      await clearGlobal();
    } else if (mode === 'guild') {
      await clearGuild(guildId);
    } else if (mode === 'all') {
      await clearGlobal();
      await clearGuild(guildId);
    } else {
      console.log('Uso:');
      console.log('  node clear-commands.js global');
      console.log('  node clear-commands.js guild <ID_DO_SERVIDOR>');
      console.log('  node clear-commands.js all <ID_DO_SERVIDOR>');
      process.exit(1);
    }
    console.log('\n✅ Pronto. Agora rode: node deploy-commands.js');
  } catch (err) {
    console.error('Erro ao limpar comandos:', err);
  }
})();
