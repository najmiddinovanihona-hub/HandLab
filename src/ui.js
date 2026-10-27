// DOM side of HandLab: left panel, bottom category bar, toolbar, stats, toasts and errors.
// All visible text goes through i18n (t / modelText / partText).

import { t, getLang, modelText, partText } from './i18n.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor() {
    this.els = {
      catTag: $('cat-tag'),
      name: $('model-name'),
      specs: $('model-specs'),
      sceneState: $('scene-state'),
      handState: $('hand-state'),
      sensitivity: $('sensitivity'),
      opennessVal: $('openness-val'),
      opennessBar: $('openness-bar'),
      explodeVal: $('explode-val'),
      explode: $('explode-slider'),
      partCard: $('part-card'),
      partName: $('part-name'),
      partInfo: $('part-info'),
      gestures: [...document.querySelectorAll('#gesture-list li')],
      tabs: $('cat-tabs'),
      chips: $('model-chips'),
      stats: $('stats'),
      toast: $('toast'),
      loading: $('loading'),
      error: $('error-banner'),
    };
    this.draggingExplode = false;
    this._toastTimer = null;
    this._gestureTimer = null;
    this.els.explode.addEventListener('pointerdown', () => (this.draggingExplode = true));
    window.addEventListener('pointerup', () => (this.draggingExplode = false));
    $('error-close').addEventListener('click', () => (this.els.error.hidden = true));
    $('part-close').addEventListener('click', () => this.onPartClose?.());
  }

  // ---------------------------------------------------------------- wiring
  /** Re-applies every static text tagged with data-i18n / data-i18n-html / data-i18n-title. */
  applyStatic() {
    document.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
    document.querySelectorAll('[data-i18n-html]').forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
    document.querySelectorAll('[data-i18n-title]').forEach((el) => (el.title = t(el.dataset.i18nTitle)));
    const langBtn = document.querySelector('#toolbar [data-act="lang"]');
    if (langBtn) langBtn.textContent = getLang().toUpperCase();
    this.els.explode.setAttribute('aria-label', t('explode'));
    if (this.catalog) this._renderTabs();
    const state = this.els.sceneState.dataset.state;
    if (state) this.els.sceneState.textContent = t(`state.${state}`);
  }

  _renderTabs() {
    this.els.tabs.innerHTML = this.catalog
      .map((c, i) => `<button data-i="${i}" class="${i === this.catIndex ? 'active' : ''}">${t(`cat.${c.key}`)} · ${c.models.length}</button>`)
      .join('');
  }

  setCatalog(catalog, onPick) {
    this.catalog = catalog;
    this.onPick = onPick;
    this._renderTabs();
    this.els.tabs.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) onPick(Number(b.dataset.i), 0);
    });
    this.els.chips.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) onPick(Number(b.dataset.c), Number(b.dataset.m));
    });
  }
  onExplode(fn) {
    this.els.explode.addEventListener('input', () => fn(Number(this.els.explode.value) / 100));
  }
  onSensitivity(fn) {
    this.els.sensitivity.addEventListener('change', () => fn(this.els.sensitivity.value));
  }
  setSensitivity(name) {
    this.els.sensitivity.value = name;
  }
  onToolbar(fn) {
    $('toolbar').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) fn(b.dataset.act, b);
    });
  }
  setToolbarState(act, on) {
    document.querySelector(`#toolbar [data-act="${act}"]`)?.classList.toggle('on', on);
  }

  // ---------------------------------------------------------------- model + state
  setModel(catIndex, modelIndex, { keepPart = false } = {}) {
    this.catIndex = catIndex;
    const cat = this.catalog[catIndex];
    const txt = modelText(cat.models[modelIndex]);
    this.els.catTag.textContent = t(`cat.${cat.key}`);
    this.els.name.textContent = txt.name;
    this.els.specs.textContent = txt.specs;
    [...this.els.tabs.children].forEach((b, i) => b.classList.toggle('active', i === catIndex));
    this.els.chips.innerHTML = cat.models
      .map((m, i) => `<button data-c="${catIndex}" data-m="${i}" class="${i === modelIndex ? 'active' : ''}"><i></i>${modelText(m).name}</button>`)
      .join('');
    if (!keepPart) this.hidePart();
  }

  setSceneState(state) {
    if (this.els.sceneState.dataset.state === state) return;
    this.els.sceneState.textContent = t(`state.${state}`);
    this.els.sceneState.dataset.state = state;
  }

  setHand(mode, openness) {
    this.els.handState.textContent = t(`hand.${mode}`);
    if (openness === null || openness === undefined) {
      this.els.opennessVal.textContent = '—';
      this.els.opennessBar.style.width = '0%';
    } else {
      const pct = Math.round(openness * 100);
      this.els.opennessVal.textContent = `${pct}%`;
      this.els.opennessBar.style.width = `${pct}%`;
    }
  }

  setExplode(v) {
    const pct = Math.round(v * 100);
    this.els.explodeVal.textContent = `${pct}%`;
    if (!this.draggingExplode) this.els.explode.value = String(pct);
  }

  /** Lights up a row of the gesture list for a moment. */
  setActiveGesture(key) {
    if (!key) return;
    for (const li of this.els.gestures) li.classList.toggle('active', li.dataset.g === key);
    clearTimeout(this._gestureTimer);
    this._gestureTimer = setTimeout(() => this.els.gestures.forEach((li) => li.classList.remove('active')), 500);
  }

  showPart(part) {
    const txt = partText(part);
    this.els.partName.textContent = txt.name;
    this.els.partName.style.color = `#${part.color.getHexString()}`;
    this.els.partInfo.textContent = txt.info || '';
    this.els.partCard.hidden = false;
  }
  hidePart() {
    this.els.partCard.hidden = true;
  }

  setStats({ fps, particles, camFps, handsMs, delegate, zoom }) {
    const cam =
      camFps === null
        ? t('stats.camOff')
        : `${t('stats.cam')} ${camFps.toFixed(0)} fps · ${t('stats.hands')} ${delegate || ''} ${handsMs.toFixed(0)} ms`;
    this.els.stats.textContent = `${fps.toFixed(0)} fps · ${(particles / 1000).toFixed(0)}k ${t('stats.particles')}\n${cam}\nzoom ${zoom.toFixed(2)}x`;
  }

  // ---------------------------------------------------------------- messages
  toast(msg, ms = 1500) {
    const t = this.els.toast;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  showError(title, detail) {
    this.els.error.querySelector('.error-title').textContent = title;
    this.els.error.querySelector('.error-detail').textContent = detail;
    this.els.error.hidden = false;
  }

  setLoading(msg) {
    this.els.loading.hidden = !msg;
    if (msg) this.els.loading.querySelector('span').textContent = msg;
  }

  /** Right edge of the side panel in px, so labels stay clear of it. */
  get panelRight() {
    const r = $('panel').getBoundingClientRect();
    return r.right;
  }
}
