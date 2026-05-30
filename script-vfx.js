/* =============================================================
   Zhao Yuanxuan — Portfolio · VFX layer  (v1.0)
   Three upgrades + ambient breathing:
   1) Hero title char-by-char reveal + breathing brand dot
   2) Scroll-in stagger for ALL sections (auto)
   3) Custom magnetic cursor on Work cards
   4) Cursor-following spotlight in the ambient layer
   ============================================================= */

(function () {
  "use strict";

  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COARSE = window.matchMedia("(pointer: coarse)").matches; // touch device
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from((root || document).querySelectorAll(sel));

  if (RM) return; // honor user preference — skip all VFX

  /* -------------------------------------------------------------
     1) Hero title — char-by-char reveal
     ------------------------------------------------------------- */
  const splitTitle = (el) => {
    if (!el || el.dataset.split === "done") return;
    // Preserve <em> wrappers: walk nodes
    const walk = (node, output) => {
      node.childNodes.forEach((n) => {
        if (n.nodeType === Node.TEXT_NODE) {
          n.textContent.split("").forEach((ch) => {
            const span = document.createElement("span");
            span.className = "vfx-char";
            // keep spaces from collapsing
            span.textContent = ch === " " ? "\u00A0" : ch;
            output.appendChild(span);
          });
        } else if (n.nodeType === Node.ELEMENT_NODE) {
          // wrap <em> etc. with same class chain
          const clone = n.cloneNode(false);
          clone.classList.add("vfx-em");
          walk(n, clone);
          output.appendChild(clone);
        }
      });
    };
    const frag = document.createDocumentFragment();
    walk(el, frag);
    el.textContent = "";
    el.appendChild(frag);

    // assign stagger delay (only to .vfx-char, not nested wrappers)
    let i = 0;
    el.querySelectorAll(".vfx-char").forEach((c) => {
      c.style.setProperty("--d", `${i * 28}ms`);
      i++;
    });
    el.dataset.split = "done";
    el.classList.add("vfx-title");

    // trigger after a tick (allow paint)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add("is-revealed"));
    });
  };

  // run on initial load, and re-run if i18n toggle replaces the innerHTML
  const heroTitle = $(".hero__title");
  if (heroTitle) splitTitle(heroTitle);
  // re-split on language change (i18n.js dispatches 'langchanged')
  document.addEventListener("langchanged", () => {
    if (heroTitle) {
      heroTitle.dataset.split = "";
      heroTitle.classList.remove("is-revealed");
      splitTitle(heroTitle);
    }
  });

  /* -------------------------------------------------------------
     2) Scroll-in stagger — auto-tag major sections + children
     ------------------------------------------------------------- */
  // pick parents whose children should cascade
  const cascadeGroups = [
    ".hero__cards",        // 3 cards
    ".career__list",       // career rows
    ".beliefs__list",      // 4 belief items
    ".work__list",         // work items (already animated, just add stagger)
    ".about__facts",       // facts grid
    ".tags",               // tag chips
  ];

  cascadeGroups.forEach((sel) => {
    const group = $(sel);
    if (!group) return;
    Array.from(group.children).forEach((child, idx) => {
      child.classList.add("vfx-cascade-item");
      child.style.setProperty("--cascade-i", idx);
    });
    group.classList.add("vfx-cascade");
  });

  // add gentle reveal to sections that DON'T already have data-reveal
  $$("section").forEach((sec) => {
    if (sec.hasAttribute("data-reveal")) return;
    sec.classList.add("vfx-section");
  });

  // observer
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -8% 0px" });

    $$(".vfx-section, .vfx-cascade").forEach((el) => io.observe(el));
  } else {
    $$(".vfx-section, .vfx-cascade").forEach((el) => el.classList.add("is-in"));
  }

  /* -------------------------------------------------------------
     3) Custom magnetic cursor (work cards) + global accent dot
     ------------------------------------------------------------- */
  if (!COARSE) {
    // Create cursor element
    const cursor = document.createElement("div");
    cursor.className = "vfx-cursor";
    cursor.innerHTML = `
      <div class="vfx-cursor__ring"></div>
      <div class="vfx-cursor__dot"></div>
      <div class="vfx-cursor__label" aria-hidden="true">VIEW</div>
    `;
    document.body.appendChild(cursor);

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let cx = mx, cy = my;     // ring (lerped)
    let dx = mx, dy = my;     // dot (faster lerp)
    let isHover = false;
    let isDown = false;

    const lerp = (a, b, t) => a + (b - a) * t;
    // Higher t = snappier (closer to 1 = instant). 0.45 ring, 0.95 dot ≈ near-zero perceived lag.
    const tick = () => {
      cx = lerp(cx, mx, 0.45);
      cy = lerp(cy, my, 0.45);
      dx = lerp(dx, mx, 0.95);
      dy = lerp(dy, my, 0.95);
      cursor.style.setProperty("--cx", cx + "px");
      cursor.style.setProperty("--cy", cy + "px");
      cursor.style.setProperty("--dx", dx + "px");
      cursor.style.setProperty("--dy", dy + "px");
      requestAnimationFrame(tick);
    };
    tick();

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      cursor.classList.add("is-active");
    }, { passive: true });

    window.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
    window.addEventListener("mousedown", () => { isDown = true; cursor.classList.add("is-down"); });
    window.addEventListener("mouseup",   () => { isDown = false; cursor.classList.remove("is-down"); });

    // Magnetic targets — work cards + nav links
    const magnetics = [
      { sel: ".work__item a, .work__item", mode: "view" },
      { sel: "a.nav__lang, #lang-toggle",  mode: "link" },
      { sel: ".work__cta",                 mode: "link" },
      { sel: ".hero__card",                mode: "soft" },
    ];

    magnetics.forEach(({ sel, mode }) => {
      $$(sel).forEach((el) => {
        el.addEventListener("mouseenter", () => {
          cursor.classList.add("is-hover");
          cursor.dataset.mode = mode;
        });
        el.addEventListener("mouseleave", () => {
          cursor.classList.remove("is-hover");
          delete cursor.dataset.mode;
          // reset magnetic translate
          if (mode === "view" || mode === "soft") {
            el.style.transform = "";
          }
        });
        if (mode === "view" || mode === "soft") {
          el.addEventListener("mousemove", (e) => {
            const r = el.getBoundingClientRect();
            const px = (e.clientX - r.left - r.width / 2) / r.width;
            const py = (e.clientY - r.top  - r.height / 2) / r.height;
            const k = mode === "soft" ? 6 : 10;
            el.style.transform = `translate3d(${px * k}px, ${py * k}px, 0)`;
          });
        }
      });
    });
  }

  /* -------------------------------------------------------------
     4) (removed) cursor-following spotlight — was too subtle / noisy.
        Ambient halos a/b still breathe via styles-vfx.css for living bg.
     ------------------------------------------------------------- */
})();
