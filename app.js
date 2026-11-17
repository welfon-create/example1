/**
 * NEONPLAY Core
 * All points are virtual. No real money.
 */

const STORAGE = 'neonplay_flat_v2';

const DEFAULT = {
  balance: 1000,
  name: 'Игрок',
  avatar: null,
  tgId: null,
  lastDaily: null,
  stats: {
    played: 0,
    upgrades: 0,
    cases: 0,
    bestStorm: 0,
    bestRacket: 0,
    bestTransition: 0,
    bestFlight: 0
  },
  tasks: {
    play3: { p: 0, t: 3, done: false },
    case1: { p: 0, t: 1, done: false },
    up1: { p: 0, t: 1, done: false }
  },
  history: [],
  caseLog: [],
  rewardLog: []
};

let S = load();

function load() {
  try {
    const r = localStorage.getItem(STORAGE);
    if (!r) return structuredClone(DEFAULT);
    const p = JSON.parse(r);
    return {
      ...structuredClone(DEFAULT),
      ...p,
      stats: { ...DEFAULT.stats, ...(p.stats || {}) },
      tasks: { ...DEFAULT.tasks, ...(p.tasks || {}) }
    };
  } catch {
    return structuredClone(DEFAULT);
  }
}

function save() {
  try { localStorage.setItem(STORAGE, JSON.stringify(S)); } catch {}
}

function addPts(n, reason) {
  S.balance = Math.max(0, Math.floor(S.balance + n));
  if (reason) {
    pushHist(`${n > 0 ? '+' : ''}${n} ⬤ · ${reason}`);
    if (n > 0) {
      S.rewardLog.unshift({ n, reason, ts: Date.now() });
      if (S.rewardLog.length > 25) S.rewardLog.pop();
    }
  }
  save();
  ui();
}

function spend(n) {
  if (S.balance < n) return false;
  S.balance -= n;
  save();
  ui();
  return true;
}

function pushHist(text) {
  S.history.unshift({ text, ts: Date.now() });
  if (S.history.length > 35) S.history.pop();
}

function ui() {
  // balance
  document.querySelectorAll('#balance-value, #profile-balance, #game-score-balance').forEach(el => {
    if (el) el.textContent = S.balance;
  });

  // name & avatar
  const nameEl = document.getElementById('profile-name');
  if (nameEl) nameEl.textContent = S.name;

  document.querySelectorAll('#header-avatar, #profile-avatar').forEach(el => {
    if (!el) return;
    if (S.avatar) {
      el.innerHTML = `<img src="${S.avatar}" alt="">`;
    } else {
      el.textContent = (S.name || 'NP').slice(0, 2).toUpperCase();
    }
  });

  // stats
  const stats = document.getElementById('profile-stats');
  if (stats) {
    stats.innerHTML = `
      <div class="stat-box"><div class="num">${S.stats.played}</div><div class="lbl">Игр</div></div>
      <div class="stat-box"><div class="num">${S.stats.cases}</div><div class="lbl">Кейсов</div></div>
      <div class="stat-box"><div class="num">${S.stats.upgrades}</div><div class="lbl">Апгрейдов</div></div>
      <div class="stat-box"><div class="num">${Math.max(S.stats.bestStorm, S.stats.bestRacket, S.stats.bestTransition, S.stats.bestFlight)}</div><div class="lbl">Рекорд</div></div>
    `;
  }

  // activity
  const act = document.getElementById('activity-list');
  if (act) {
    if (!S.history.length) {
      act.className = 'history-list empty';
      act.textContent = 'Пока пусто';
    } else {
      act.className = 'history-list';
      act.innerHTML = S.history.slice(0, 12).map(h => {
        const t = new Date(h.ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
        return `<div class="history-item"><span>${t} · ${h.text}</span></div>`;
      }).join('');
    }
  }

  // rewards
  const rew = document.getElementById('rewards-history');
  if (rew) {
    if (!S.rewardLog.length) {
      rew.className = 'history-list empty';
      rew.textContent = 'Пока пусто';
    } else {
      rew.className = 'history-list';
      rew.innerHTML = S.rewardLog.slice(0, 10).map(r =>
        `<div class="history-item"><span>${r.reason}</span><span class="amount">+${r.n}</span></div>`
      ).join('');
    }
  }

  // bonus dot
  const can = window.Bonuses && Bonuses.canDaily();
  const dot = document.getElementById('bonus-dot');
  if (dot) dot.classList.toggle('hidden', !can);
}

function toast(msg, type = '') {
  const stack = document.getElementById('toast-stack');
  if (!stack) return;
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  stack.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity .25s';
    setTimeout(() => t.remove(), 280);
  }, 2400);
}

function modal(title, bodyHtml, footHtml) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-foot').innerHTML = footHtml || '';
  document.getElementById('modal-backdrop').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.add('hidden');
}

function result(title, html) {
  modal(title, html, `<button class="btn btn-glow" onclick="closeModal()">OK</button>`);
}

/* Game cards data + SVG art */
const GAMES = [
  {
    id: 'upgrade',
    title: 'Апгрейд',
    desc: 'Улучшай предметы',
    svg: `<svg viewBox="0 0 120 120" fill="none"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c084fc"/><stop offset="1" stop-color="#818cf8"/></linearGradient></defs><rect x="28" y="48" width="64" height="42" rx="8" fill="url(#g1)" opacity=".95"/><path d="M42 48V36c0-10 8-16 18-16s18 6 18 16v12" stroke="#e9d5ff" stroke-width="4" fill="none"/><path d="M60 18v-8M52 12h16" stroke="#e9d5ff" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="69" r="9" fill="#1e1b4b"/><path d="M60 64v10M55 69h10" stroke="#c084fc" stroke-width="2.2"/></svg>`
  },
  {
    id: 'storm',
    title: 'Шторм',
    desc: 'Головоломка 5×5',
    svg: `<svg viewBox="0 0 120 120" fill="none"><defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#38bdf8"/><stop offset="1" stop-color="#6366f1"/></linearGradient></defs><g fill="url(#g2)"><rect x="22" y="22" width="16" height="16" rx="3" opacity=".95"/><rect x="44" y="22" width="16" height="16" rx="3" opacity=".45"/><rect x="66" y="22" width="16" height="16" rx="3" opacity=".95"/><rect x="22" y="44" width="16" height="16" rx="3" opacity=".45"/><rect x="44" y="44" width="16" height="16" rx="3"/><rect x="66" y="44" width="16" height="16" rx="3" opacity=".45"/><rect x="22" y="66" width="16" height="16" rx="3" opacity=".95"/><rect x="44" y="66" width="16" height="16" rx="3" opacity=".45"/><rect x="66" y="66" width="16" height="16" rx="3" opacity=".95"/></g><path d="M36 96q24 12 48 0" stroke="#67e8f9" stroke-width="2" fill="none" opacity=".5"/></svg>`
  },
  {
    id: 'racket',
    title: 'Ракетка',
    desc: 'Игра на реакцию',
    svg: `<svg viewBox="0 0 120 120" fill="none"><defs><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f472b6"/><stop offset="1" stop-color="#c084fc"/></linearGradient></defs><ellipse cx="60" cy="42" rx="30" ry="34" stroke="url(#g3)" stroke-width="5.5" fill="none"/><line x1="60" y1="76" x2="60" y2="108" stroke="url(#g3)" stroke-width="7" stroke-linecap="round"/><circle cx="48" cy="36" r="5" fill="#f9a8d4"/><circle cx="72" cy="48" r="4" fill="#e9d5ff" opacity=".85"/></svg>`
  },
  {
    id: 'cases',
    title: 'Кейсы',
    desc: 'Открывай награды',
    svg: `<svg viewBox="0 0 120 120" fill="none"><defs><linearGradient id="g4" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#60a5fa"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs><rect x="26" y="42" width="68" height="50" rx="10" fill="url(#g4)"/><rect x="38" y="32" width="44" height="18" rx="5" fill="#818cf8"/><circle cx="60" cy="67" r="11" fill="#1e1b4b"/><path d="M54 67l4 4 9-9" stroke="#67e8f9" stroke-width="2.8" fill="none" stroke-linecap="round"/></svg>`
  },
  {
    id: 'transition',
    title: 'Переход',
    desc: 'Избегай препятствий',
    svg: `<svg viewBox="0 0 120 120" fill="none"><defs><linearGradient id="g5" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f472b6"/><stop offset="1" stop-color="#fb7185"/></linearGradient></defs><path d="M18 82q24-42 42-12 18 30 42-28" stroke="url(#g5)" stroke-width="4.5" fill="none" stroke-linecap="round"/><circle cx="30" cy="70" r="6.5" fill="#fda4af"/><circle cx="60" cy="66" r="6.5" fill="#fda4af"/><circle cx="92" cy="54" r="6.5" fill="#fda4af"/><rect x="72" y="28" width="13" height="22" rx="3" fill="#9f1239" opacity=".85"/><rect x="38" y="88" width="11" height="18" rx="2.5" fill="#9f1239" opacity=".6"/></svg>`
  },
  {
    id: 'flight',
    title: 'Полёт',
    desc: 'Аркадный полёт',
    svg: `<svg viewBox="0 0 120 120" fill="none"><defs><linearGradient id="g6" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#38bdf8"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs><path d="M28 72l32-38 32 38h-16v22H44V72z" fill="url(#g6)"/><circle cx="60" cy="56" r="6.5" fill="#0c4a6e"/><path d="M18 38q18-12 34 0" stroke="#67e8f9" stroke-width="2" fill="none" opacity=".45"/><path d="M68 28q18-12 34 0" stroke="#67e8f9" stroke-width="2" fill="none" opacity=".45"/></svg>`
  }
];

function renderGames() {
  const grid = document.getElementById('games-grid');
  if (!grid) return;
  grid.innerHTML = GAMES.map(g => `
    <article class="game-card" data-id="${g.id}">
      <div class="game-card-visual">${g.svg}</div>
      <div class="game-card-info">
        <h3>${g.title}</h3>
        <p>${g.desc}</p>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      if (id === 'cases') {
        Navigation.go('cases');
      } else {
        Games.open(id);
      }
    });
  });
}

/* Init */
document.addEventListener('DOMContentLoaded', () => {
  ui();
  renderGames();

  document.getElementById('header-avatar')?.addEventListener('click', () => Navigation.go('profile'));
  document.getElementById('btn-header-bonus')?.addEventListener('click', () => Navigation.go('bonuses'));

  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('modal-backdrop')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Edit name
  document.getElementById('btn-edit-name')?.addEventListener('click', () => {
    modal('Изменить имя',
      `<input class="input" id="name-input" maxlength="20" value="${S.name.replace(/"/g, '&quot;')}" placeholder="Ваше имя">`,
      `<button class="btn btn-ghost" onclick="closeModal()">Отмена</button>
       <button class="btn btn-glow" id="save-name">Сохранить</button>`
    );
    document.getElementById('save-name').onclick = () => {
      const v = document.getElementById('name-input').value.trim().slice(0, 20);
      if (v) {
        S.name = v;
        save();
        ui();
        toast('Имя сохранено', 'ok');
      }
      closeModal();
    };
  });

  // prevent double-tap zoom
  let lastTouch = 0;
  document.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTouch < 280) e.preventDefault();
    lastTouch = now;
  }, { passive: false });
});

window.App = {
  get S() { return S; },
  save, addPts, spend, pushHist, ui, toast, modal, closeModal, result
};
