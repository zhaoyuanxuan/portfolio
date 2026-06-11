/* =============================================================
   i18n.js — Global EN/ZH switch
   - Reads bundle from window.__I18N_BUNDLE__
   - t("a.b.c") / t("a.b[0].c") — dotted-path lookup with array index
   - data-i18n / data-i18n-html attributes — DOM auto-wiring
   - data-lang-active="zh|en" — show/hide language variants
   - Persists choice in localStorage ("lang")
   - Fires CustomEvent("langchanged", { detail:{lang} })
     so dynamic pages (case.html) can re-render
   ============================================================= */
(function () {
  "use strict";

  const STORAGE_KEY = "lang";
  const VALID = ["zh", "en"];
  const PATH_RE = /([^.\[\]]+)|\[(\d+)\]/g;
  const HTML_RE = /<\/?[a-z][\s\S]*?>/i;

  const $$ = (sel, root) => (root || document).querySelectorAll(sel);

  const bundle = window.__I18N_BUNDLE__ || { zh: {}, en: {} };

  function getByPath(obj, path) {
    if (obj == null || !path) return undefined;
    let cur = obj;
    PATH_RE.lastIndex = 0;
    let m;
    while ((m = PATH_RE.exec(path))) {
      if (cur == null) return undefined;
      const key = m[1] !== undefined ? m[1] : Number(m[2]);
      cur = cur[key];
    }
    return cur;
  }

  let currentLang =
    (function () {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && VALID.indexOf(stored) >= 0) return stored;
      } catch (_) {}
      // Fallback to html[data-lang] attribute, default zh
      const attr = document.documentElement.getAttribute("data-lang");
      return VALID.indexOf(attr) >= 0 ? attr : "zh";
    })();

  function t(path, fallback) {
    const v = getByPath(bundle[currentLang], path);
    if (v != null) return v;
    const z = getByPath(bundle.zh, path);
    if (z != null) return z;
    return fallback != null ? fallback : "";
  }

  function applyLang(lang) {
    if (VALID.indexOf(lang) < 0) lang = "zh";
    currentLang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}

    const root = document.documentElement;
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang === "zh" ? "zh-CN" : "en");

    // Plain text replacement
    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = getByPath(bundle[lang], key);
      if (val == null || typeof val !== "string") return;
      if (HTML_RE.test(val)) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });

    // Force-HTML replacement
    $$("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      const val = getByPath(bundle[lang], key);
      if (val == null || typeof val !== "string") return;
      el.innerHTML = val;
    });

    // Show/hide language-specific elements
    $("[data-lang-active]").forEach((el) => {
      el.hidden = el.getAttribute("data-lang-active") !== lang;
    });

    // Sync <meta name="description"> with current locale (SEO + share previews)
    try {
      const desc = getByPath(bundle[lang], "meta.description");
      if (desc && typeof desc === "string") {
        let m = document.querySelector('meta[name="description"]');
        if (!m) {
          m = document.createElement("meta");
          m.setAttribute("name", "description");
          document.head.appendChild(m);
        }
        m.setAttribute("content", desc);

        // Also keep og:description in sync if present
        const og = document.querySelector('meta[property="og:description"]');
        if (og) og.setAttribute("content", desc);
      }
    } catch (_) {}

    // Stamp year placeholders (innerHTML may have wiped them)
    const yearEl = document.getElementById("hero-year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    // Let dynamic pages re-render
    document.dispatchEvent(
      new CustomEvent("langchanged", { detail: { lang: lang } })
    );
  }

  function toggle() {
    applyLang(currentLang === "zh" ? "en" : "zh");
  }

  // Public API
  window.i18n = {
    t,
    apply: applyLang,
    toggle,
    get lang() { return currentLang; },
    bundle,
  };

  // Initial application + wire up [#lang-toggle]
  document.addEventListener("DOMContentLoaded", function () {
    applyLang(currentLang);
    const btn = document.getElementById("lang-toggle");
    if (btn) btn.addEventListener("click", toggle);
  });

  // If DOM already ready (deferred load case)
  if (document.readyState === "interactive" || document.readyState === "complete") {
    applyLang(currentLang);
    const btn = document.getElementById("lang-toggle");
    if (btn && !btn.__i18nBound) {
      btn.__i18nBound = true;
      btn.addEventListener("click", toggle);
    }
  }
})();
