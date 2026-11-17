/**
 * All mini-games in one module
 */

const Games = {
  current: null,
  running: false,
  raf: null,
  timers: [],

  open(id) {
    this.close();
    this.current = id;
    const layer = document.getElementById('game-layer');
    layer.classList.remove('hidden');
    document.getElementById('game-title').textContent = {
      upgrade: 'Апгрейд', storm: 'Шторм', racket: 'Ракетка',
      transition: 'Переход', flight: 'Полёт'
    }[id] || 'Игра';
    document.getElementById('game-score').textContent = '0';
    document.getElementById('game-action').disabled = false;

    TelegramApp?.showBack(() => this.close());

    if (id === 'upgrade') Upgrade.init();
    else if (id === 'storm') Storm.init();
    else if (id === 'racket') Racket.init();
    else if (id === 'transition') Transition.init();
    else if (id === 'flight') Flight.init();
  },

  close() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.raf = null;
    document.getElementById('game-layer').classList.add('hidden');
    document.getElementById('game-canvas-wrap').innerHTML = '';
    TelegramApp?.hideBack();
  },

  setAction(text, fn) {
    const btn = document.getElementById('game-action');
    btn.textContent = text;
    btn.disabled = false;
    btn.onclick = fn;
  }
};

document.getElementById('game-close')?.addEventListener('click', () => Games.close());

/* ========== UPGRADE ========== */
const Upgrade = {
  level: 1,
  chance: 75,
  cost: 50,

  init() {
    this.level = 1;
    this.chance = 75;
    this.cost = 50;
    this.draw();
    Games.setAction(`Улучшить (${this.cost} ⬤)`, () => this.try());
  },

  draw() {
    const wrap = document.getElementById('game-canvas-wrap');
    wrap.innerHTML = `
      <div style="text-align:center;max-width:280px">
        <div id="up-item" class="anim-float" style="width:110px;height:110px;margin:0 auto 18px;border-radius:26px;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:grid;place-items:center;font-size:2.2rem;font-weight:800;box-shadow:0 0 36px rgba(124,58,237,.45)">Lv.${this.level}</div>
        <div style="font-weight:650;margin-bottom:6px">Предмет · уровень ${this.level}</div>
        <div style="color:var(--text-2);font-size:.9rem;margin-bottom:12px">Шанс успеха: <strong style="color:var(--cyan)">${this.chance}%</strong></div>
        <div class="progress" style="height:9px"><i style="width:${this.chance}%"></i></div>
        <p style="color:var(--text-3);font-size:.82rem;margin-top:14px">При успехе уровень растёт. При провале — откат.</p>
      </div>`;
    document.getElementById('game-score').textContent = App.S.balance;
    Games.setAction(`Улучшить (${this.cost} ⬤)`, () => this.try());
  },

  try() {
    if (!App.spend(this.cost)) {
      App.toast('Недостаточно очков', 'err');
      return;
    }
    Bonuses.trackPlay();
    const ok = Math.random() * 100 < this.chance;
    const item = document.getElementById('up-item');

    if (ok) {
      this.level++;
      this.chance = Math.max(22, this.chance - 5);
      this.cost = Math.min(600, Math.floor(this.cost * 1.28));
      if (item) {
        item.classList.add('anim-pop');
        item.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
      }
      App.addPts(Math.floor(this.cost * 0.28), 'Апгрейд');
      Bonuses.trackUpgrade();
      App.toast(`Успех! Уровень ${this.level}`, 'ok');
      TelegramApp?.haptic('success');
    } else {
      this.level = Math.max(1, this.level - 1);
      this.chance = Math.min(88, this.chance + 7);
      this.cost = Math.max(50, Math.floor(this.cost * 0.82));
      if (item) {
        item.classList.add('anim-shake');
        item.style.background = 'linear-gradient(135deg,#ef4444,#b91c1c)';
      }
      App.toast('Провал…', 'err');
      TelegramApp?.haptic('error');
    }
    setTimeout(() => this.draw(), 550);
  }
};

/* ========== STORM ========== */
const Storm = {
  size: 5,
  grid: [],
  moves: 0,

  init() {
    this.moves = 0;
    this.grid = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => Math.random() > 0.52 ? 1 : 0)
    );
    this.draw();
    Games.setAction('Новая игра', () => this.init());
  },

  toggle(r, c) {
    [[0,0],[0,1],[0,-1],[1,0],[-1,0]].forEach(([dr, dc]) => {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size)
        this.grid[nr][nc] ^= 1;
    });
  },

  won() {
    return this.grid.every(row => row.every(c => c === 0));
  },

  draw() {
    const wrap = document.getElementById('game-canvas-wrap');
    const cs = Math.min(52, Math.floor((Math.min(window.innerWidth, 400) - 56) / this.size));
    document.getElementById('game-score').textContent = this.moves;

    wrap.innerHTML = `
      <div style="margin-bottom:10px;font-weight:600;color:var(--text-2)">Ходы: ${this.moves}</div>
      <div style="display:grid;grid-template-columns:repeat(${this.size},${cs}px);gap:5px">
        ${this.grid.map((row, r) => row.map((cell, c) => `
          <div class="storm-cell" data-r="${r}" data-c="${c}" style="width:${cs}px;height:${cs}px;border-radius:10px;cursor:pointer;
            background:${cell ? 'linear-gradient(135deg,#38bdf8,#6366f1)' : 'rgba(255,255,255,.05)'};
            box-shadow:${cell ? '0 0 14px rgba(56,189,248,.4)' : 'none'};
            border:1px solid ${cell ? 'rgba(56,189,248,.5)' : 'rgba(255,255,255,.07)'}"></div>
        `).join('')).join('')}
      </div>
      <p style="color:var(--text-3);font-size:.82rem;margin-top:14px;text-align:center;max-width:260px">Нажимай клетки. Цель — погасить все. Каждое нажатие переключает клетку и соседей.</p>
    `;

    wrap.querySelectorAll('.storm-cell').forEach(el => {
      el.addEventListener('click', () => {
        this.toggle(+el.dataset.r, +el.dataset.c);
        this.moves++;
        this.draw();
        if (this.won()) {
          const reward = Math.max(40, 160 - this.moves * 4);
          App.addPts(reward, 'Шторм');
          App.S.stats.bestStorm = Math.max(App.S.stats.bestStorm, reward);
          App.save();
          Bonuses.trackPlay();
          App.result('Победа!', `<div style="font-size:2rem;font-weight:800;color:var(--green)">+${reward} ⬤</div><p style="margin-top:6px">Ходов: ${this.moves}</p>`);
          TelegramApp?.haptic('success');
        }
      });
    });
  }
};

/* ========== RACKET ========== */
const Racket = {
  score: 0,
  time: 20,
  timer: null,
  spawnT: null,

  init() {
    this.stop();
    this.score = 0;
    this.time = 20;
    document.getElementById('game-score').textContent = '0';
    document.getElementById('game-canvas-wrap').innerHTML = `
      <div style="text-align:center;color:var(--text-2)">
        <p style="margin-bottom:10px">Нажимай на появляющиеся цели</p>
        <div style="font-size:2.2rem;font-weight:800;color:var(--pink)">20</div>
      </div>`;
    Games.setAction('Старт', () => this.start());
  },

  start() {
    this.score = 0;
    this.time = 20;
    Games.running = true;
    document.getElementById('game-score').textContent = '0';
    const wrap = document.getElementById('game-canvas-wrap');
    wrap.innerHTML = '';
    wrap.style.minHeight = '300px';
    wrap.style.position = 'relative';

    const timerEl = document.createElement('div');
    timerEl.id = 'racket-t';
    timerEl.style.cssText = 'position:absolute;top:4px;right:8px;font-weight:750;font-size:1.15rem;color:var(--pink)';
    timerEl.textContent = '20';
    wrap.appendChild(timerEl);

    this.timer = setInterval(() => {
      this.time--;
      if (document.getElementById('racket-t')) document.getElementById('racket-t').textContent = this.time;
      if (this.time <= 0) this.end();
    }, 1000);

    Games.setAction('Идёт…', null);
    document.getElementById('game-action').disabled = true;
    this.spawn();
  },

  spawn() {
    if (!Games.running) return;
    const wrap = document.getElementById('game-canvas-wrap');
    if (!wrap) return;
    const size = 44 + Math.random() * 28;
    const x = 8 + Math.random() * (wrap.clientWidth - size - 16);
    const y = 36 + Math.random() * (wrap.clientHeight - size - 48);

    const dot = document.createElement('div');
    dot.className = 'racket-dot anim-pop';
    dot.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size}px;border-radius:50%;
      background:linear-gradient(135deg,#f472b6,#c084fc);box-shadow:0 0 18px rgba(244,114,182,.5);cursor:pointer`;
    dot.onclick = e => {
      e.stopPropagation();
      this.score += 10;
      document.getElementById('game-score').textContent = this.score;
      dot.remove();
      TelegramApp?.haptic('light');
    };
    wrap.appendChild(dot);
    setTimeout(() => dot.remove(), 1100 + Math.random() * 700);
    this.spawnT = setTimeout(() => this.spawn(), 550 + Math.random() * 450);
  },

  end() {
    this.stop();
    const reward = Math.floor(this.score * 0.85);
    App.addPts(reward, 'Ракетка');
    App.S.stats.bestRacket = Math.max(App.S.stats.bestRacket, this.score);
    App.save();
    Bonuses.trackPlay();
    App.result('Время!', `<div style="font-size:1.7rem;font-weight:800">Счёт: ${this.score}</div><div style="color:var(--green);margin-top:6px">+${reward} ⬤</div>`);
    Games.setAction('Ещё раз', () => this.init());
  },

  stop() {
    Games.running = false;
    clearInterval(this.timer);
    clearTimeout(this.spawnT);
  }
};

/* ========== TRANSITION ========== */
const Transition = {
  score: 0,
  px: 0.5,
  obstacles: [],
  speed: 3.2,
  last: 0,

  init() {
    this.stop();
    this.score = 0;
    this.px = 0.5;
    this.obstacles = [];
    this.speed = 3.2;
    document.getElementById('game-score').textContent = '0';
    document.getElementById('game-canvas-wrap').innerHTML = `
      <div style="text-align:center;color:var(--text-2);padding:20px">
        <p>Избегай препятствий</p>
        <p style="font-size:.85rem;margin-top:8px;color:var(--text-3)">Нажимай / води пальцем влево-вправо</p>
      </div>`;
    Games.setAction('Старт', () => this.start());
  },

  start() {
    Games.running = true;
    this.score = 0;
    this.px = 0.5;
    this.obstacles = [];
    this.speed = 3.2;
    this.last = performance.now();
    const wrap = document.getElementById('game-canvas-wrap');
    wrap.innerHTML = '';
    wrap.style.minHeight = '340px';
    wrap.style.position = 'relative';
    wrap.style.touchAction = 'none';

    const player = document.createElement('div');
    player.id = 'tr-p';
    player.style.cssText = `position:absolute;bottom:36px;width:34px;height:34px;border-radius:10px;
      background:linear-gradient(135deg,#f472b6,#fb7185);box-shadow:0 0 16px rgba(244,114,182,.5);
      transform:translateX(-50%);left:50%`;
    wrap.appendChild(player);

    const move = (clientX) => {
      if (!Games.running) return;
      const rect = wrap.getBoundingClientRect();
      this.px = Math.max(0.07, Math.min(0.93, (clientX - rect.left) / rect.width));
    };
    wrap.onmousedown = e => move(e.clientX);
    wrap.ontouchmove = e => { e.preventDefault(); move(e.touches[0].clientX); };
    wrap.ontouchstart = e => { e.preventDefault(); move(e.touches[0].clientX); };

    document.getElementById('game-action').disabled = true;
    document.getElementById('game-action').textContent = 'Игра…';
    this.loop(performance.now());
  },

  loop(now) {
    if (!Games.running) return;
    const dt = Math.min(30, now - this.last);
    this.last = now;
    const wrap = document.getElementById('game-canvas-wrap');
    if (!wrap) return;
    const h = wrap.clientHeight, w = wrap.clientWidth;

    const p = document.getElementById('tr-p');
    if (p) p.style.left = (this.px * 100) + '%';

    if (Math.random() < 0.025 * (this.speed / 3)) {
      this.obstacles.push({ x: 0.12 + Math.random() * 0.76, y: -30, w: 36 + Math.random() * 28 });
    }

    const py = h - 36 - 17;
    const px = this.px * w;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.y += this.speed * (dt / 16);

      let el = document.getElementById('tr-o' + i);
      if (!el) {
        el = document.createElement('div');
        el.id = 'tr-o' + i;
        el.style.cssText = 'position:absolute;border-radius:8px;background:linear-gradient(135deg,#9f1239,#e11d48);box-shadow:0 0 12px rgba(225,29,72,.4)';
        wrap.appendChild(el);
      }
      el.style.left = (o.x * w - o.w / 2) + 'px';
      el.style.top = o.y + 'px';
      el.style.width = o.w + 'px';
      el.style.height = '22px';

      if (o.y + 22 > py - 17 && o.y < py + 17) {
        if (Math.abs(o.x * w - px) < o.w / 2 + 17) {
          this.end();
          return;
        }
      }
      if (o.y > h + 20) {
        this.obstacles.splice(i, 1);
        el.remove();
        this.score += 10;
        document.getElementById('game-score').textContent = this.score;
      }
    }
    this.speed = 3.2 + this.score / 180;
    Games.raf = requestAnimationFrame(t => this.loop(t));
  },

  end() {
    this.stop();
    const reward = Math.floor(this.score * 0.75);
    App.addPts(reward, 'Переход');
    App.S.stats.bestTransition = Math.max(App.S.stats.bestTransition, this.score);
    App.save();
    Bonuses.trackPlay();
    App.result('Столкновение', `<div style="font-size:1.7rem;font-weight:800">Счёт: ${this.score}</div><div style="color:var(--green);margin-top:6px">+${reward} ⬤</div>`);
    Games.setAction('Ещё раз', () => this.init());
    TelegramApp?.haptic('error');
  },

  stop() {
    Games.running = false;
    if (Games.raf) cancelAnimationFrame(Games.raf);
  }
};

/* ========== FLIGHT ========== */
const Flight = {
  score: 0,
  y: 0.45,
  vy: 0,
  pipes: [],
  last: 0,
  g: 0.00085,
  flap: -0.013,

  init() {
    this.stop();
    this.score = 0;
    this.y = 0.45;
    this.vy = 0;
    this.pipes = [];
    document.getElementById('game-score').textContent = '0';
    document.getElementById('game-canvas-wrap').innerHTML = `
      <div style="text-align:center;color:var(--text-2);padding:20px">
        <p>Управляй полётом</p>
        <p style="font-size:.85rem;margin-top:8px;color:var(--text-3)">Нажимай, чтобы взлететь вверх</p>
      </div>`;
    Games.setAction('Старт', () => this.start());
  },

  start() {
    Games.running = true;
    this.score = 0;
    this.y = 0.45;
    this.vy = 0;
    this.pipes = [];
    this.last = performance.now();
    const wrap = document.getElementById('game-canvas-wrap');
    wrap.innerHTML = '';
    wrap.style.minHeight = '340px';
    wrap.style.position = 'relative';
    wrap.style.overflow = 'hidden';
    wrap.style.touchAction = 'none';

    const bird = document.createElement('div');
    bird.id = 'fl-b';
    bird.style.cssText = `position:absolute;left:20%;width:30px;height:30px;border-radius:50% 50% 40% 40%;
      background:linear-gradient(135deg,#38bdf8,#22d3ee);box-shadow:0 0 14px rgba(34,211,238,.5);
      transform:translate(-50%,-50%)`;
    wrap.appendChild(bird);

    const flap = () => { if (Games.running) this.vy = this.flap; };
    wrap.onmousedown = flap;
    wrap.ontouchstart = e => { e.preventDefault(); flap(); };

    document.getElementById('game-action').disabled = true;
    document.getElementById('game-action').textContent = 'Летим…';
    this.loop(performance.now());
  },

  loop(now) {
    if (!Games.running) return;
    const dt = Math.min(30, now - this.last);
    this.last = now;
    const wrap = document.getElementById('game-canvas-wrap');
    if (!wrap) return;
    const h = wrap.clientHeight, w = wrap.clientWidth;

    this.vy += this.g * dt;
    this.y += this.vy * dt;
    if (this.y < 0.04 || this.y > 0.96) { this.end(); return; }

    const bird = document.getElementById('fl-b');
    if (bird) {
      bird.style.top = (this.y * 100) + '%';
      bird.style.transform = `translate(-50%,-50%) rotate(${this.vy * 700}deg)`;
    }

    if (!this.pipes.length || this.pipes[this.pipes.length - 1].x < 0.55) {
      const gap = 0.27;
      const top = 0.14 + Math.random() * 0.42;
      this.pipes.push({ x: 1.12, top, gap, scored: false });
    }

    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.x -= 0.0042 * (dt / 16) * (1 + this.score * 0.012);

      let topEl = document.getElementById('fp-t' + i);
      let botEl = document.getElementById('fp-b' + i);
      if (!topEl) {
        topEl = document.createElement('div');
        topEl.id = 'fp-t' + i;
        topEl.style.cssText = 'position:absolute;width:46px;background:linear-gradient(90deg,#0ea5e9,#0284c7);border-radius:0 0 8px 8px';
        wrap.appendChild(topEl);
        botEl = document.createElement('div');
        botEl.id = 'fp-b' + i;
        botEl.style.cssText = 'position:absolute;width:46px;background:linear-gradient(90deg,#0ea5e9,#0284c7);border-radius:8px 8px 0 0';
        wrap.appendChild(botEl);
      }
      const px = p.x * w - 23;
      topEl.style.left = px + 'px';
      topEl.style.top = '0';
      topEl.style.height = (p.top * h) + 'px';
      botEl.style.left = px + 'px';
      botEl.style.top = ((p.top + p.gap) * h) + 'px';
      botEl.style.height = ((1 - p.top - p.gap) * h) + 'px';

      if (p.x > 0.1 && p.x < 0.35) {
        if (this.y < p.top + 0.028 || this.y > p.top + p.gap - 0.028) {
          this.end();
          return;
        }
      }
      if (!p.scored && p.x < 0.2) {
        p.scored = true;
        this.score++;
        document.getElementById('game-score').textContent = this.score;
      }
      if (p.x < -0.15) {
        this.pipes.splice(i, 1);
        topEl.remove();
        botEl.remove();
      }
    }
    Games.raf = requestAnimationFrame(t => this.loop(t));
  },

  end() {
    this.stop();
    const reward = Math.floor(this.score * 16 + 25);
    App.addPts(reward, 'Полёт');
    App.S.stats.bestFlight = Math.max(App.S.stats.bestFlight, this.score);
    App.save();
    Bonuses.trackPlay();
    App.result('Крушение', `<div style="font-size:1.7rem;font-weight:800">Счёт: ${this.score}</div><div style="color:var(--green);margin-top:6px">+${reward} ⬤</div>`);
    Games.setAction('Ещё раз', () => this.init());
    TelegramApp?.haptic('error');
  },

  stop() {
    Games.running = false;
    if (Games.raf) cancelAnimationFrame(Games.raf);
  }
};

window.Games = Games;
