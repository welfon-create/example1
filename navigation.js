/** SPA Navigation */
const Navigation = {
  current: 'games',

  init() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => this.go(btn.dataset.page));
    });
  },

  go(page) {
    if (!page || page === this.current) return;
    this.current = page;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page)?.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.page === page);
    });

    if (page === 'cases') Cases.render();
    if (page === 'earnings' || page === 'bonuses') Bonuses.render();
    if (page === 'profile') App.ui();

    if (window.TelegramApp) {
      if (page === 'games') TelegramApp.hideBack();
      else TelegramApp.showBack(() => this.go('games'));
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

document.addEventListener('DOMContentLoaded', () => Navigation.init());
window.Navigation = Navigation;
