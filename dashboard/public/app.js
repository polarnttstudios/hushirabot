async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 401) {
    window.location.href = '/login.html';
    return null;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

function fmtDate(ts) {
  return new Date(ts).toLocaleString('pt-BR');
}

async function loadStats() {
  const stats = await api('/api/stats');
  if (!stats) return;
  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="value">${stats.totalWebhooks}</div><div class="label">Webhooks cadastrados</div></div>
    <div class="stat-card"><div class="value">${stats.totalWarns}</div><div class="label">Advertências no total</div></div>
    <div class="stat-card"><div class="value">${stats.totalModActions}</div><div class="label">Ações de moderação</div></div>
  `;
}

async function loadWebhooks() {
  const webhooks = await api('/api/webhooks');
  const tbody = document.querySelector('#whTable tbody');
  if (!webhooks || webhooks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">Nenhum webhook cadastrado ainda.</td></tr>`;
    return;
  }
  tbody.innerHTML = webhooks
    .map(
      (w) => `
    <tr>
      <td>${w.name}</td>
      <td><input placeholder="Mensagem a enviar..." data-id="${w.id}" class="msgInput" style="margin:0;width:100%" /></td>
      <td><button data-id="${w.id}" class="sendBtn">Enviar</button></td>
      <td><button data-id="${w.id}" class="danger deleteWhBtn">Excluir</button></td>
    </tr>`
    )
    .join('');

  tbody.querySelectorAll('.sendBtn').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const input = tbody.querySelector(`.msgInput[data-id="${id}"]`);
      if (!input.value.trim()) return alert('Digite uma mensagem primeiro.');
      try {
        await api(`/api/webhooks/${id}/send`, { method: 'POST', body: JSON.stringify({ content: input.value }) });
        input.value = '';
        alert('Mensagem enviada!');
      } catch (e) {
        alert(e.message);
      }
    })
  );

  tbody.querySelectorAll('.deleteWhBtn').forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Excluir este webhook?')) return;
      await api(`/api/webhooks/${btn.dataset.id}`, { method: 'DELETE' });
      loadWebhooks();
      loadStats();
    })
  );
}

async function loadModLog() {
  const logs = await api('/api/modlog');
  const tbody = document.querySelector('#modlogTable tbody');
  if (!logs || logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">Nenhuma ação registrada ainda.</td></tr>`;
    return;
  }
  tbody.innerHTML = logs
    .map(
      (l) => `<tr>
      <td><span class="badge">${l.action}</span></td>
      <td>${l.target_id || '-'}</td>
      <td>${l.moderator_id || '-'}</td>
      <td>${l.reason || '-'}</td>
      <td>${fmtDate(l.created_at)}</td>
    </tr>`
    )
    .join('');
}

async function loadWarns() {
  const warns = await api('/api/warns');
  const tbody = document.querySelector('#warnsTable tbody');
  if (!warns || warns.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">Nenhuma advertência registrada ainda.</td></tr>`;
    return;
  }
  tbody.innerHTML = warns
    .map(
      (w) => `<tr>
      <td>${w.guild_id}</td>
      <td>${w.user_id}</td>
      <td>${w.moderator_id}</td>
      <td>${w.reason || '-'}</td>
      <td>${fmtDate(w.created_at)}</td>
    </tr>`
    )
    .join('');
}

document.getElementById('addWhBtn').addEventListener('click', async () => {
  const name = document.getElementById('whName').value.trim();
  const url = document.getElementById('whUrl').value.trim();
  if (!name || !url) return alert('Preencha nome e URL.');
  try {
    await api('/api/webhooks', { method: 'POST', body: JSON.stringify({ name, url }) });
    document.getElementById('whName').value = '';
    document.getElementById('whUrl').value = '';
    loadWebhooks();
    loadStats();
  } catch (e) {
    alert(e.message);
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await api('/api/logout', { method: 'POST' });
  window.location.href = '/login.html';
});

(async function init() {
  const me = await api('/api/me');
  if (!me?.authed) return (window.location.href = '/login.html');
  loadStats();
  loadWebhooks();
  loadModLog();
  loadWarns();
})();
