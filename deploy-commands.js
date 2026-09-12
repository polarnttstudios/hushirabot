// Registra os slash commands no Discord.
// Se DEV_GUILD_IDS estiver preenchido no .env, registra só nesses
// servidores (aparece na hora, ótimo pra testar). Se estiver vazio,
// registra GLOBALMENTE (demora até 1h pra propagar em todo lugar).
//
// Rode com: node deploy-commands.js

const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('./config');

const commands = [];

const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command?.data) commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    if (config.devGuildIds.length > 0) {
      for (const guildId of config.devGuildIds) {
        await rest.put(Routes.applicationGuildCommands(config.clientId, guildId), { body: commands });
        console.log(`✅ ${commands.length} comandos registrados no servidor de teste ${guildId}`);
      }
      return;
    }

    await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
    console.log(`✅ ${commands.length} comandos globais registrados`);
  } catch (err) {
    console.error('Erro ao registrar comandos:', err);
  }
})();
