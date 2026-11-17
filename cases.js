/** Cases */
const CASE_TYPES = [
  {
    id: 'starter',
    name: 'Стартовый',
    price: 100,
    color: '#60a5fa',
    rewards: [
      { min: 40, max: 120, w: 50 },
      { min: 120, max: 250, w: 30 },
      { min: 250, max: 450, w: 15 },
      { min: 450, max: 900, w: 5 }
    ]
  },
  {
    id: 'neon',
    name: 'Неоновый',
    price: 250,
    color: '#c084fc',
    rewards: [
      { min: 80, max: 220, w: 40 },
      { min: 220, max: 500, w: 35 },
      { min: 500, max: 900, w: 20 },
      { min: 900, max: 1800, w: 5 }
    ]
  },
  {
    id: 'legend',
    name: 'Легендарный',
    price: 500,
    color: '#f472b6',
    rewards: [
      { min: 150, max: 400, w: 35 },
      { min: 400, max: 900, w: 35 },
      { min: 900, max: 1800, w: 25 },
      { min: 1800, max: 4500, w: 5 }
    ]
  }
];

const Cases = {
  current: null,

  render() {
    const box = document.getElementById('cases-container');
    if (!box) return;

    box.innerHTML = CASE_TYPES.map(c => `
      <div class="case-card" data-id="${c.id}">
        <div class="case-icon" style="background:linear-gradient(135deg,${c.color}55,${c.color});box-shadow:0 0 18px ${c.color}44">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M3 8l2-4h14l2 4"/><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 12v5M9.5 14.5h5"/></svg>
        </div>
        <div class="case-info">
          <h4>${c.name} кейс</h4>
          <p>${c.price} ⬤</p>
        </div>
        <button class="btn btn-glow" style="padding:8px 14px;font-size:0.82rem">Открыть</button>
      </div>
    `).join('');

    box.querySelectorAll('.case-card').forEach(el => {
      el.addEventListener('click', () => this.open(el.dataset.id));
    });

    // history
    const hist = document.getElementById('cases-history');
    const S = App.S;
    if (!hist) return;
    if (!S.caseLog.length) {
      hist.className = 'history-list empty';
      hist.textContent = 'Пока пусто';
    } else {
      hist.className = 'history-list';
      hist.innerHTML = S.caseLog.slice(0, 12).map(h => {
        const d = new Date(h.ts).toLocaleString('ru', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        return `<div class="history-item"><span>${h.name}<br><small style="color:var(--text-3)">${d}</small></span><span class="amount">+${h.n}</span></div>`;
      }).join('');
    }
  },

  open(id) {
    const c = CASE_TYPES.find(x => x.id === id);
    if (!c) return;
    this.current = c;

    App.modal(c.name + ' кейс', `
      <div class="text-center">
        <div id="case-visual" class="anim-float" style="width:96px;height:96px;margin:0 auto 16px;border-radius:22px;background:linear-gradient(135deg,${c.color}66,${c.color});display:grid;place-items:center;box-shadow:0 0 32px ${c.color}55">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M3 8l2-4h14l2 4"/><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 12v5M9.5 14.5h5"/></svg>
        </div>
        <p style="color:var(--text-2);font-size:0.9rem">Стоимость: <strong style="color:var(--purple-light)">${c.price} ⬤</strong></p>
        <p style="font-size:0.8rem;color:var(--text-3);margin-top:6px">Случайная награда очками</p>
      </div>
    `, `<button class="btn btn-glow btn-block" id="do-open">Открыть за ${c.price} ⬤</button>`);

    document.getElementById('do-open').onclick = () => this.doOpen();
  },

  doOpen() {
    const c = this.current;
    if (!c) return;
    if (!App.spend(c.price)) {
      App.toast('Недостаточно очков', 'err');
      return;
    }

    const btn = document.getElementById('do-open');
    if (btn) { btn.disabled = true; btn.textContent = 'Открываем…'; }

    const vis = document.getElementById('case-visual');
    if (vis) vis.classList.add('anim-case');

    // weighted pick
    const total = c.rewards.reduce((s, r) => s + r.w, 0);
    let rnd = Math.random() * total;
    let pick = c.rewards[0];
    for (const r of c.rewards) {
      rnd -= r.w;
      if (rnd <= 0) { pick = r; break; }
    }
    const amount = Math.floor(pick.min + Math.random() * (pick.max - pick.min + 1));

    setTimeout(() => {
      App.addPts(amount, `Кейс «${c.name}»`);
      const S = App.S;
      S.stats.cases++;
      S.tasks.case1.p = Math.min(S.tasks.case1.t, S.tasks.case1.p + 1);
      S.caseLog.unshift({ name: c.name, n: amount, ts: Date.now() });
      if (S.caseLog.length > 30) S.caseLog.pop();
      App.save();
      App.ui();

      document.getElementById('modal-body').innerHTML = `
        <div class="text-center anim-reward">
          <div style="font-size:2.6rem;font-weight:800;color:var(--green);margin:12px 0">+${amount}</div>
          <p>Поздравляем!</p>
        </div>`;
      document.getElementById('modal-foot').innerHTML = `<button class="btn btn-glow btn-block" onclick="closeModal();Cases.render()">Закрыть</button>`;
      TelegramApp?.haptic('success');
      App.toast(`+${amount} ⬤ из кейса!`, 'ok');
    }, 750);
  }
};

window.Cases = Cases;
