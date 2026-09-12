const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const config = require('./config');
const embeds = require('./utils/embeds');
const { initLogger, logError } = require('./utils/logger');
const { enableRaidMode, isRaidModeActive } = require('./utils/raidmode');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command?.data?.name) {
    client.commands.set(command.data.name, command);
  }
}

client.once('ready', () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
  console.log(`📦 ${client.commands.size} comandos carregados`);
  console.log(`🌐 Em ${client.guilds.cache.size} servidor(es)`);

  initLogger(client);

  // Qualquer erro que escapar de um try/catch em qualquer lugar do bot
  // cai aqui — e vai pro canal de logs também, se estiver configurado.
  process.on('unhandledRejection', (err) => logError('Unhandled Rejection', err));
  process.on('uncaughtException', (err) => logError('Uncaught Exception', err));
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    logError(`Erro em /${interaction.commandName}`, err, {
      command: interaction.commandName,
      user: `${interaction.user.tag} (${interaction.user.id})`,
      guild: interaction.guild ? `${interaction.guild.name} (${interaction.guild.id})` : 'DM',
    });
    const errorReply = { embeds: [embeds.error('Erro', 'Ocorreu um erro ao executar este comando.')], ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorReply).catch(() => {});
    } else {
      await interaction.reply(errorReply).catch(() => {});
    }
  }
});

client.login(config.token);

// ---------------------------------------------------------------
// Detecção automática de raid: conta quantos membros entraram em
// cada servidor dentro da janela de tempo configurada. Se passar do
// limite, tranca o servidor sozinho (mesma ação do /raidmode on) e
// manda um alerta pro canal de logs.
// ---------------------------------------------------------------
const joinTimestamps = new Map(); // guildId -> array de timestamps recentes

client.on('guildMemberAdd', async (member) => {
  const { joinThreshold, windowMs } = config.raidDetection;
  const guildId = member.guild.id;
  const now = Date.now();

  const recent = (joinTimestamps.get(guildId) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  joinTimestamps.set(guildId, recent);

  if (recent.length >= joinThreshold && !isRaidModeActive(guildId)) {
    joinTimestamps.set(guildId, []); // zera pra não disparar de novo em seguida

    try {
      const locked = await enableRaidMode(member.guild, 'Possível raid detectado automaticamente');
      await logError(
        '🚨 Raid detectado automaticamente',
        new Error(
          `${recent.length} membros entraram em ${Math.round(windowMs / 1000)}s no servidor "${member.guild.name}". ${locked} canal(is) trancado(s) automaticamente. Use /raidmode off quando resolver.`
        )
      );
    } catch (err) {
      logError('Erro ao ativar modo anti-raid automático', err);
    }
  }
});

// ---------------------------------------------------------------
// Dashboard web: roda no MESMO processo do bot, então "node index.js"
// já sobe o bot E o painel juntos. Pra desativar isso e rodar o
// dashboard separado (com "npm run dashboard"), defina no .env:
// DASHBOARD_ENABLED=false
// ---------------------------------------------------------------
if (config.dashboard.enabled) {
  require('./dashboard/server');
}
