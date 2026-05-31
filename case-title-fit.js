/* =============================================================
   Zhao Yuanxuan — Portfolio · case-title-fit  (v1.0)
   Goal: keep big serif titles on one line. The CSS uses
   `white-space: nowrap`; this script shrinks font-size when the
   intrinsic width exceeds the available container width.

   Targets: .think__title, .engine__title, .talent__title
   Behavior:
     - Measure scrollWidth vs clientWidth of the parent
     - If overflow, multiply font-size by parentWidth/scrollWidth
       (with a small safety margin); never go below the floor.
   Triggers:
     - DOMContentLoaded, window resize (rAF-throttled), and the
       custom `langchanged` event dispatched by i18n.js.
   ============================================================= */

(function () {
  "use strict";

  var SELECTORS = [".think__title", ".engine__title", ".talent__title"];
  // Per-selector min font size in px (don't shrink below this; allow
  // the very narrow viewport CSS fallback to wrap instead).
  var FLOOR = {
    ".think__title": 22,
    ".engine__title": 18,
    ".talent__title": 22,
  };

  function fitOne(el) {
    if (!el || !el.parentElement) return;
    // Reset before measuring (so repeat fits don't compound shrinks)
    el.style.fontSize = "";
    el.style.letterSpacing = "";

    var parent = el.parentElement;
    // Use a small safety margin so we don't sit pixel-flush on the edge
    var avail = parent.clientWidth - 2;
    if (avail <= 0) return;

    var natural = el.scrollWidth;
    if (natural <= avail) return; // already fits

    var sel = SELECTORS.find(function (s) { return el.matches(s); });
    var floor = FLOOR[sel] || 16;

    // Read current computed font-size
    var cs = window.getComputedStyle(el);
    var fs = parseFloat(cs.fontSize);
    if (!fs) return;

    // Iterate down to fit (max 12 iterations is way more than enough)
    var k = 0;
    while (el.scrollWidth > avail && fs > floor && k < 14) {
      // Multiply by ratio with a small extra trim each pass (0.985)
      var ratio = avail / el.scrollWidth;
      fs = Math.max(floor, fs * ratio * 0.985);
      el.style.fontSize = fs + "px";
      k++;
    }
    // If we hit the floor and still overflow, tighten letter-spacing a touch
    if (el.scrollWidth > avail) {
      el.style.letterSpacing = "-0.03em";
    }
  }

  function fitAll() {
    SELECTORS.forEach(function (sel) {
      var nodes = document.querySelectorAll(sel);
      for (var i = 0; i < nodes.length; i++) fitOne(nodes[i]);
    });
  }

  // rAF-throttled resize handler
  var raf = 0;
  function onResize() {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      fitAll();
    });
  }

  // Initial run + on every relevant event
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fitAll, { once: true });
  } else {
    fitAll();
  }
  window.addEventListener("load", fitAll, { once: true });
  window.addEventListener("resize", onResize, { passive: true });
  // i18n.js dispatches this after switching language — content changes,
  // need to re-measure.
  document.addEventListener("langchanged", function () {
    // give the DOM a tick to apply new innerHTML, then fit
    requestAnimationFrame(function () {
      requestAnimationFrame(fitAll);
    });
  });
  // The case page injects think/engine/talent content via JS after init.
  // Use MutationObserver so we re-fit when titles get text or change.
  if ("MutationObserver" in window) {
    var mo = new MutationObserver(function () { onResize(); });
    SELECTORS.forEach(function (sel) {
      var nodes = document.querySelectorAll(sel);
      for (var i = 0; i < nodes.length; i++) {
        mo.observe(nodes[i], { childList: true, characterData: true, subtree: true });
      }
    });
  }
})();
