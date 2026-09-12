const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fetch = require('node-fetch');
const config = require('../config');
const db = require('../database/db');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: config.dashboard.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 }, // 8h
  })
);

function requireAuth(req, res, next) {
  if (req.session?.authed) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Não autenticado' });
  return res.redirect('/login.html');
}

// ---------- Autenticação ----------
app.post('/api/login', (req, res) => {
  const { user, password } = req.body;

  if (!config.dashboard.passwordHash) {
    return res.status(500).json({ error: 'DASHBOARD_PASSWORD_HASH não configurado no .env. Rode: node dashboard/gerar-senha.js suaSenha' });
  }

  const userOk = user === config.dashboard.user;
  const passOk = bcrypt.compareSync(password || '', config.dashboard.passwordHash);

  if (!userOk || !passOk) {
    return res.status(401).json({ error: 'Usuário ou senha incorretos' });
  }

  req.session.authed = true;
  req.session.user = user;
  return res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  res.json({ authed: !!req.session?.authed, user: req.session?.user || null });
});

// Protege tudo daqui pra baixo
app.use(requireAuth);

app.get('/', (req, res) => res.redirect('/dashboard.html'));

// ---------- Stats ----------
app.get('/api/stats', (req, res) => {
  res.json({
    totalWebhooks: db.listWebhooks().length,
    totalWarns: db.raw.prepare('SELECT COUNT(*) as c FROM warns').get().c,
    totalModActions: db.raw.prepare('SELECT COUNT(*) as c FROM mod_log').get().c,
  });
});

// ---------- Webhooks ----------
app.get('/api/webhooks', (req, res) => res.json(db.listWebhooks()));

app.post('/api/webhooks', (req, res) => {
  const { name, url } = req.body;
  if (!name || !url || !url.startsWith('https://discord.com/api/webhooks/')) {
    return res.status(400).json({ error: 'Nome e uma URL de webhook do Discord válida são obrigatórios.' });
  }
  db.addWebhook(name, url);
  res.json({ ok: true });
});

app.delete('/api/webhooks/:id', (req, res) => {
  db.deleteWebhook(req.params.id);
  res.json({ ok: true });
});

// Botão "Enviar" do dashboard: dispara uma mensagem pelo webhook selecionado
app.post('/api/webhooks/:id/send', async (req, res) => {
  const webhook = db.listWebhooks().find((w) => String(w.id) === req.params.id);
  if (!webhook) return res.status(404).json({ error: 'Webhook não encontrado' });

  const { content, username, avatar_url } = req.body;
  if (!content) return res.status(400).json({ error: 'Mensagem vazia' });

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, username: username || undefined, avatar_url: avatar_url || undefined }),
    });
    if (!response.ok) throw new Error(`Discord retornou ${response.status}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: `Falha ao enviar: ${err.message}` });
  }
});

// ---------- Logs ----------
app.get('/api/modlog', (req, res) => res.json(db.recentModLog(100)));
app.get('/api/warns', (req, res) => res.json(db.recentWarns(100)));

app.listen(config.dashboard.port, () => {
  console.log(`🌐 Dashboard rodando em http://localhost:${config.dashboard.port}`);
});
