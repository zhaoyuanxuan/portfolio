/* =============================================================
   Zhao Yuanxuan — Portfolio · scroll memory  (v1.0)
   Goal: clicking a work card → case page → back, returns to the
   exact scroll position WITHOUT any visible scroll animation.

   Strategy:
   1) Disable browser auto-restore (we manage it ourselves).
   2) On index: save window.scrollY to sessionStorage when a
      .work__link is clicked.
   3) On case: when the "Back" link is clicked, prefer
      history.back() if document.referrer is our own index (this
      triggers BFCache → instant + zero animation). Fallback to
      normal navigation to index.html.
   4) On index load: if sessionStorage has the saved Y, restore
      instantly (temporarily disable scroll-behavior: smooth to
      avoid any animation), then clean up.
   5) Also handle pageshow (BFCache) to make sure no smooth
      animation kicks in.
   ============================================================= */

(function () {
  "use strict";

  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  const KEY = "idx_scroll_y";
  const path = location.pathname;
  const isCase = /case\.html$/.test(path);
  // index = ends with /, /index.html, or just bare host (root)
  const isIndex = /\/$|index\.html$/.test(path) || path === "" || path === "/";

  const html = document.documentElement;

  /** Run fn with scroll-behavior temporarily forced to 'auto' (no animation). */
  const withInstantScroll = (fn) => {
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    fn();
    // restore on next frame so the immediate jump is committed first
    requestAnimationFrame(() => {
      html.style.scrollBehavior = prev || "";
    });
  };

  /* ---------- INDEX PAGE ---------- */
  if (isIndex) {
    // Save Y when user clicks a work card (capture phase so it runs before navigation)
    document.addEventListener(
      "click",
      (e) => {
        const a = e.target.closest && e.target.closest("a.work__link");
        if (a) {
          sessionStorage.setItem(KEY, String(window.scrollY));
        }
      },
      { capture: true }
    );

    // Restore: try as early as possible
    const restore = () => {
      const raw = sessionStorage.getItem(KEY);
      if (raw === null) return;
      const y = parseInt(raw, 10);
      if (!isFinite(y)) {
        sessionStorage.removeItem(KEY);
        return;
      }
      // Strip any hash so the browser doesn't jump to #work etc.
      if (location.hash) {
        try {
          history.replaceState(null, "", location.pathname + location.search);
        } catch (_) {
          /* noop */
        }
      }
      withInstantScroll(() => window.scrollTo(0, y));
      // Re-apply on next frames in case layout shifted (fonts/images)
      requestAnimationFrame(() => withInstantScroll(() => window.scrollTo(0, y)));
      document.addEventListener(
        "DOMContentLoaded",
        () => withInstantScroll(() => window.scrollTo(0, y)),
        { once: true }
      );
      window.addEventListener(
        "load",
        () => {
          withInstantScroll(() => window.scrollTo(0, y));
          // small extra tick after load (lazy images may add height)
          setTimeout(() => withInstantScroll(() => window.scrollTo(0, y)), 0);
          sessionStorage.removeItem(KEY);
        },
        { once: true }
      );
    };

    // Run at script execution time (early)
    restore();

    // BFCache: pageshow fires when restoring from back/forward cache
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) {
        // Browser already restored Y; just make sure smooth scroll is off
        // for that frame and clear any stale saved value.
        sessionStorage.removeItem(KEY);
      }
    });
  }

  /* ---------- CASE PAGE ---------- */
  if (isCase) {
    document.addEventListener(
      "click",
      (e) => {
        const a = e.target.closest && e.target.closest("a.case-back");
        if (!a) return;
        const ref = document.referrer;
        if (!ref) return; // opened in a new tab → let normal navigation happen

        // If we came from our own index page, prefer history.back()
        // for an instant BFCache restore (zero scroll animation).
        let refUrl;
        try {
          refUrl = new URL(ref);
        } catch (_) {
          return;
        }
        if (refUrl.host !== location.host) return;
        const refPath = refUrl.pathname;
        const refIsIndex =
          /\/$|index\.html$/.test(refPath) || refPath === "" || refPath === "/";
        if (refIsIndex) {
          e.preventDefault();
          history.back();
        }
        // else: fall through, navigation proceeds normally
      },
      { capture: true }
    );
  }
})();
