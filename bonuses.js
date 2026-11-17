/** Daily & Tasks */
const Bonuses = {
  AMOUNT: 150,
  DAY: 24 * 60 * 60 * 1000,

  canDaily() {
    const S = App.S;
    return !S.lastDaily || (Date.now() - S.lastDaily >= this.DAY);
  },

  left() {
    const S = App.S;
    if (!S.lastDaily) return 0;
    return Math.max(0, this.DAY - (Date.now() - S.lastDaily));
  },

  claim() {
    if (!this.canDaily()) {
      App.toast('Бонус уже получен', 'warn');
      return;
    }
    App.S.lastDaily = Date.now();
    App.save();
    App.addPts(this.AMOUNT, 'Ежедневный бонус');
    App.toast(`+${this.AMOUNT} ⬤ ежедневный бонус!`, 'ok');
    TelegramApp?.haptic('success');
    this.render();
  },

  renderTasks(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const S = App.S;
    const list = [
      { key: 'play3', title: 'Сыграть 3 игры', reward: 100, ...S.tasks.play3 },
      { key: 'case1', title: 'Открыть 1 кейс', reward: 75, ...S.tasks.case1 },
      { key: 'up1', title: 'Успешный апгрейд', reward: 120, ...S.tasks.up1 }
    ];

    el.innerHTML = list.map(t => {
      const done = t.p >= t.t;
      const claimable = done && !t.done;
      return `
        <div class="task-card">
          <div class="task-top">
            <span class="task-title">${t.title}</span>
            <span class="task-reward">+${t.reward}</span>
          </div>
          <div class="progress"><i style="width:${Math.min(100, (t.p / t.t) * 100)}%"></i></div>
          <div class="task-foot">
            <span>${t.p}/${t.t}</span>
            ${t.done ? '<span style="color:var(--green)">Получено</span>' :
              claimable ? `<button class="btn btn-glow" style="padding:5px 12px;font-size:0.78rem" data-task="${t.key}">Забрать</button>` :
              '<span>В процессе</span>'}
          </div>
        </div>`;
    }).join('');

    el.querySelectorAll('[data-task]').forEach(btn => {
      btn.addEventListener('click', () => this.claimTask(btn.dataset.task));
    });
  },

  claimTask(key) {
    const S = App.S;
    const t = S.tasks[key];
    if (!t || t.done || t.p < t.t) return;
    const rewards = { play3: 100, case1: 75, up1: 120 };
    const n = rewards[key] || 50;
    t.done = true;
    App.save();
    App.addPts(n, 'Задание');
    App.toast(`+${n} ⬤ за задание!`, 'ok');
    TelegramApp?.haptic('success');
    this.render();
  },

  trackPlay() {
    const S = App.S;
    S.stats.played++;
    S.tasks.play3.p = Math.min(S.tasks.play3.t, S.tasks.play3.p + 1);
    App.save();
  },

  trackUpgrade() {
    const S = App.S;
    S.stats.upgrades++;
    S.tasks.up1.p = Math.min(S.tasks.up1.t, S.tasks.up1.p + 1);
    App.save();
  },

  updateTimers() {
    const can = this.canDaily();
    const left = this.left();
    const h = Math.floor(left / 3600000);
    const m = Math.floor((left % 3600000) / 60000);
    const s = Math.floor((left % 60000) / 1000);
    const timerText = can ? '+150 виртуальных очков' : `Через ${h}ч ${m}м ${s}с`;

    ['daily-status', 'daily-status-2'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = timerText;
    });
    ['btn-daily', 'btn-daily-2'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = !can;
        btn.textContent = can ? 'Забрать' : 'Уже получен';
      }
    });
  },

  render() {
    this.renderTasks('tasks-list');
    this.renderTasks('tasks-list-2');
    this.updateTimers();
  },

  init() {
    document.getElementById('btn-daily')?.addEventListener('click', () => this.claim());
    document.getElementById('btn-daily-2')?.addEventListener('click', () => this.claim());
    this.render();
    setInterval(() => this.updateTimers(), 1000);
  }
};

document.addEventListener('DOMContentLoaded', () => Bonuses.init());
window.Bonuses = Bonuses;
