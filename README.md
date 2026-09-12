# Bot de Discord hushira - COMPLETO! (Moderação + Anti-raid + Dashboard Web)

Bot em Node.js com discord.js v14, banco SQLite e um painel web protegido por login.

## 📦 O que tem

**Moderação:** `/ban`, `/unban`, `/kick`, `/timeout`, `/untimeout`, `/warn`, `/warnings`,
`/clearwarnings`, `/clear` (purge, com confirmação por botão), `/lock`, `/unlock`, `/slowmode`,
`/nickname`, `/role add|remove` (com checagem de hierarquia de cargos)

**Anti-raid:** `/raidmode on|off` — tranca todos os canais de texto e eleva a verificação
do servidor. Também tem **detecção automática**: se muita gente entrar de uma vez, o bot
tranca o servidor sozinho e avisa no canal de logs.

**Utilidade:** `/ping`, `/userinfo`, `/serverinfo`, `/avatar`, `/botinfo`

**Dashboard web** (`/dashboard/`), protegido por usuário e senha:
- Lista de webhooks cadastrados + **botão para enviar mensagem por webhook** direto do painel
- Log das últimas ações de moderação e advertências (lido do SQLite)

**Logs automáticos:** qualquer erro do bot pode ser mandado pra um canal do Discord
(`LOG_CHANNEL_ID` no `.env`), sem precisar ficar olhando o terminal.

**Banco de dados:** SQLite (`better-sqlite3`), arquivo único em `database/bot.db`,
sem precisar instalar nenhum servidor de banco separado.

Todos os comandos de moderação exigem a permissão correspondente do Discord
(Banir Membros, Expulsar Membros, Gerenciar Cargos, etc.) — quem não tiver, recebe
um aviso de "sem permissão" ao tentar usar.

## 🚀 Instalação

```bash
npm install
cp .env.example .env
```

Edite o `.env`:

1. `DISCORD_TOKEN` e `CLIENT_ID` — pegue em https://discord.com/developers/applications
2. Gere a senha do dashboard:
   ```bash
   node dashboard/gerar-senha.js SuaSenhaSuperForte123
   ```
   Copie o hash gerado para `DASHBOARD_PASSWORD_HASH` no `.env`.
3. (Opcional) `DEV_GUILD_IDS` — coloque o ID do seu servidor de testes pra os
   comandos aparecerem na hora (sem isso, comandos globais demoram até 1h pra propagar).
4. (Opcional) `LOG_CHANNEL_ID` — ID de um canal pra receber os erros automaticamente.

### Registrar os comandos no Discord

```bash
node deploy-commands.js
```
Rode este comando de novo sempre que adicionar/mudar algum comando.

### Rodar o bot (e o dashboard junto, no mesmo processo)

```bash
npm start
```
Isso já sobe o bot **e** o dashboard juntos em `http://localhost:3000` (ou a porta do `DASHBOARD_PORT`).

Se quiser rodar o bot sem o painel, coloque `DASHBOARD_ENABLED=false` no `.env`.

### Rodar só o dashboard (sem o bot)

```bash
npm run dashboard
```
Útil se quiser deixar o painel rodando em outro lugar, separado do bot.

## 🔒 Segurança

- Cada comando de moderação exige a permissão correspondente do Discord — checado
  no próprio código, não só na visibilidade do comando.
- `/role` também bloqueia dar/tirar cargo de Administrador ou cargo igual/acima do
  próprio cargo de quem usou (evita autopromoção).
- O dashboard exige login (usuário + senha com hash bcrypt) e usa cookies de sessão
  httpOnly — sem login, nenhuma rota `/api/*` responde.
- **Nunca** commite seu `.env` (token do bot, senha do dashboard) em repositórios públicos.

## 🗂 Estrutura

```
discord-bot/
├── index.js              # bot principal
├── deploy-commands.js    # registra os slash commands
├── config.js             # configurações gerais
├── commands/             # cada comando em um arquivo
├── database/db.js        # SQLite (warns, webhooks, mod log, anti-raid)
├── utils/                # embeds, permissões, confirmação, anti-raid, logger
└── dashboard/
    ├── server.js          # API + servidor do painel
    ├── gerar-senha.js     # gera hash bcrypt pra senha do painel
    └── public/            # login.html, dashboard.html, app.js, style.css
```
Alerta do dono: Toda atualização será primeira colocada aqui, depois será aplicada no bot geral.
