/** Telegram Mini App */
const TelegramApp = {
  tg: null,
  user: null,

  init() {
    if (!window.Telegram?.WebApp) return;
    this.tg = window.Telegram.WebApp;
    this.tg.ready();
    this.tg.expand();
    try {
      this.tg.setHeaderColor('#07070f');
      this.tg.setBackgroundColor('#07070f');
    } catch {}

    const u = this.tg.initDataUnsafe?.user;
    if (u) {
      this.user = u;
      const S = App.S;
      if (!S.tgId) {
        S.tgId = u.id;
        if (u.first_name) S.name = [u.first_name, u.last_name].filter(Boolean).join(' ').slice(0, 20);
        if (u.photo_url) S.avatar = u.photo_url;
        App.save();
        App.ui();
      }
      const idEl = document.getElementById('profile-id');
      if (idEl) idEl.textContent = 'Telegram · ' + u.id;
    }

    this.tg.BackButton.onClick(() => {
      if (typeof this._onBack === 'function') this._onBack();
    });
  },

  showBack(fn) {
    this._onBack = fn;
    this.tg?.BackButton.show();
  },
  hideBack() {
    this._onBack = null;
    this.tg?.BackButton.hide();
  },
  haptic(type = 'light') {
    try {
      const h = this.tg?.HapticFeedback;
      if (!h) return;
      if (type === 'success') h.notificationOccurred('success');
      else if (type === 'error') h.notificationOccurred('error');
      else h.impactOccurred(type);
    } catch {}
  },
  close() { this.tg?.close(); }
};

document.addEventListener('DOMContentLoaded', () => TelegramApp.init());
window.TelegramApp = TelegramApp;
