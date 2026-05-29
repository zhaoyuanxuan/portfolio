/* =============================================================
   Zhao Yuanxuan — Portfolio · script  (v2.0.1 · production)
   - i18n toggle (zh / en) — uses textContent unless key contains HTML
   - nav scroll state (passive, throttled via rAF)
   - clock (Beijing) — pauses while tab is hidden
   - reveal on view (IntersectionObserver, single-shot)
   - ambient parallax halos (mouse) — opt-in, RM-aware
   - hero year auto-update
   ============================================================= */

(function () {
  "use strict";

  /* ----- 0. Helpers ----- */
  const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => root.querySelectorAll(sel);

  /* ----- 1. Nav scroll state (rAF-throttled) ----- */
  const nav = $("#nav");
  if (nav) {
    let ticking = false;
    const update = () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 24);
      ticking = false;
    };
    document.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  /* ----- 2. Clock (Beijing) — pauses on hidden tab ----- */
  const timeEl = $("#nav-time");
  let clockTimer = null;
  const renderTime = () => {
    if (!timeEl) return;
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    timeEl.textContent = `BJS · ${hh}:${mm}`;
  };
  const startClock = () => {
    if (clockTimer || !timeEl) return;
    renderTime();
    clockTimer = setInterval(renderTime, 30 * 1000);
  };
  const stopClock = () => {
    if (clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
  if (timeEl) {
    startClock();
    document.addEventListener("visibilitychange", () => {
      document.hidden ? stopClock() : startClock();
    });
  }

  /* ----- 3. Hero year ----- */
  const yearEl = $("#hero-year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ----- 4. Reveal on view (single-shot) ----- */
  const revealTargets = $$("[data-reveal], .work__item");
  if (revealTargets.length) {
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
      );
      revealTargets.forEach((el) => io.observe(el));
    } else {
      // No IO support — render everything visible (graceful fallback)
      revealTargets.forEach((el) => el.classList.add("is-visible"));
    }
  }

  /* ----- 5. Parallax halos (mouse, RM-aware) ----- */
  if (!RM) {
    const haloA = $(".ambient__halo--a");
    const haloB = $(".ambient__halo--b");
    if (haloA || haloB) {
      let rafId = null;
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;

      const tick = () => {
        currentX += (targetX - currentX) * 0.06;
        currentY += (targetY - currentY) * 0.06;
        if (haloA) haloA.style.transform = `translate3d(${currentX * 40}px, ${currentY * 40}px, 0)`;
        if (haloB) haloB.style.transform = `translate3d(${currentX * -50}px, ${currentY * -50}px, 0)`;
        if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
          rafId = requestAnimationFrame(tick);
        } else {
          rafId = null;
        }
      };

      const onMove = (e) => {
        if (document.hidden) return;
        targetX = (e.clientX / window.innerWidth - 0.5) * 2;
        targetY = (e.clientY / window.innerHeight - 0.5) * 2;
        if (!rafId) rafId = requestAnimationFrame(tick);
      };

      window.addEventListener("mousemove", onMove, { passive: true });
    }
  }

  /* ----- 6. i18n toggle ----- */
  // NOTE: The full i18n bundle and toggle logic now lives in i18n.js,
  // which reads window.__I18N_BUNDLE__ (generated from i18n/{zh-CN,en}.json).
  // Kept here as a no-op fallback only when i18n.js fails to load.
  if (window.i18n) return; // already handled by i18n.js
  const dict = {
    zh: {
      "hero.kicker": "Designer · 设计师 · 2026 作品集",
      "hero.title": "从<em>混沌</em> 到<em>清晰</em>。",
      "hero.sub": "我在帮助人们理解复杂性，让信息转换为价值",
      "hero.card.name": "Zhao Yuanxuan · 赵元轩",
      "hero.card.name.body":
        "高级产品设计师，长期工作于数据、决策系统与 AI Native 界面 — 10+ 年把模糊变成结构。",
      "hero.card.status": "正在寻找一个好产品",
      "hero.card.status.body":
        "对那些把设计判断与工程严谨等量齐观的团队保持开放。",
      "hero.card.based": "Beijing · 39.9° N",
      "hero.card.based.body":
        "常驻北京，与全球团队合作长周期项目 — 平静的节奏、锋利的问题、可持续的系统。",
      "about.heading": "关于",
      "about.sub":
        "10+ 年，横跨大型平台与高速创业公司 — 为复杂系统设计结构与秩序，并探索 AI 时代下的交互方式。",
      "about.name": "姓名",
      "about.title": "Title",
      "about.location": "城市",
      "about.years": "经验",
      "about.status2": "状态",
      "about.contact": "联系方式",
      "about.bio":
        "10+ 年数字产品体验设计经验，横跨大型平台与高速成长型创业公司，致力于设计帮助人们理解复杂性的系统，并探索 AI 时代下的交互设计与体验系统。",
      "beliefs.heading": "设计信念",
      "career.heading": "经历",
      "focus.heading": "长期关注",
      "work.heading": "精选作品",
      "work.sub":
        "下面是一组定义了我思考方式的项目 — 跨越 AI、数据、出行与平台体系。",
      "work.hint": "更多案例可应需提供。",
      "contact.heading": "联系",
      "contact.sub": "合作、招聘、或安静的交流。",
      "contact.statement":
        "当前正在<em>寻找一个好产品</em> — 接受设计 Leader、Founding Design、AI Native 方向的产品角色。",
      "foot.quote": "我设计的，是帮助人们理解复杂性的东西。",
    },
    en: {
      "hero.kicker": "Designer · Portfolio 2026",
      "hero.title": "From <em>clutter</em> to <em>clarity</em>.",
      "hero.sub":
        "I help people make sense of complexity — through structure, rhythm and quiet decisions.",
      "hero.card.name": "Zhao Yuanxuan · 赵元轩",
      "hero.card.name.body":
        "Senior product designer working across data, decision systems and AI-native interfaces — 10+ years turning ambiguity into structure.",
      "hero.card.status": "Looking for a Good Product",
      "hero.card.status.body":
        "Open to teams building meaningful tools where design judgement and engineering rigor meet on equal terms.",
      "hero.card.based": "Beijing · 39.9° N",
      "hero.card.based.body":
        "Based in Beijing, working with global teams on long-horizon design — calm pace, sharp questions, lasting systems.",
      "about.heading": "About",
      "about.sub":
        "10+ years across platforms and startups — designing systems for complexity, and exploring interaction in the AI era.",
      "about.name": "Name",
      "about.title": "Title",
      "about.location": "Location",
      "about.years": "Years",
      "about.status2": "Status",
      "about.contact": "Contact",
      "about.bio":
        "10+ years of digital product experience design — across large platforms and high-growth startups. I design systems that help people understand complexity, and explore interaction patterns for the AI era.",
      "beliefs.heading": "Design Beliefs",
      "career.heading": "Career",
      "focus.heading": "Long-term Focus",
      "work.heading": "Selected Work",
      "work.sub":
        "A short list of projects that defined how I think — across AI, data, mobility, and platform systems.",
      "work.hint": "More case studies on request.",
      "contact.heading": "Contact",
      "contact.sub": "For collaborations, work inquiries, or quiet conversations.",
      "contact.statement":
        "Currently <em>looking for a good product</em> — open to design leadership, founding design, and AI-native product roles.",
      "foot.quote": "I design things that help people understand complexity.",
    },
  };

  // Cheap heuristic: only treat the value as HTML when it contains tags we care about.
  const HTML_RE = /<\/?[a-z][\s\S]*?>/i;

  const applyLang = (lang) => {
    document.documentElement.setAttribute("data-lang", lang);
    document.documentElement.setAttribute("lang", lang === "zh" ? "zh-CN" : "en");
    const map = dict[lang] || dict.zh;
    $$("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = map[key];
      if (val == null) return;
      // Avoid innerHTML when not needed — faster + safer.
      if (HTML_RE.test(val)) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });
    $$("[data-lang-active]").forEach((el) => {
      el.hidden = el.getAttribute("data-lang-active") !== lang;
    });

    // Re-stamp dynamic pieces that may have been wiped by innerHTML
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  };

  const langBtn = $("#lang-toggle");
  let currentLang = document.documentElement.getAttribute("data-lang") === "en" ? "en" : "zh";
  applyLang(currentLang);
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      currentLang = currentLang === "zh" ? "en" : "zh";
      applyLang(currentLang);
    });
  }
})();
