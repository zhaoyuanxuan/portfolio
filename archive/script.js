/* =============================================================
   Zhao Yuanxuan — Portfolio · script
   - i18n toggle (zh / en)
   - nav scroll state + clock
   - parallax ambient halos (mouse + scroll)
   - reveal on view (IntersectionObserver)
   ============================================================= */

(function () {
  "use strict";

  /* ----- 1. Nav scroll state ----- */
  const nav = document.getElementById("nav");
  const onScroll = () => {
    if (!nav) return;
    nav.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ----- 2. Clock (Beijing) ----- */
  const timeEl = document.getElementById("nav-time");
  const renderTime = () => {
    if (!timeEl) return;
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    timeEl.textContent = `BJS · ${hh}:${mm}`;
  };
  renderTime();
  setInterval(renderTime, 30 * 1000);

  /* ----- 3. Hero year ----- */
  const yearEl = document.getElementById("hero-year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ----- 4. Reveal on view ----- */
  const revealTargets = document.querySelectorAll("[data-reveal], .work__item");
  if ("IntersectionObserver" in window && revealTargets.length) {
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
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* ----- 5. Parallax halos (mouse) ----- */
  const haloA = document.querySelector(".ambient__halo--a");
  const haloB = document.querySelector(".ambient__halo--b");
  let rafId = null;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;

  const onMove = (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2; // -1..1
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    targetX = x;
    targetY = y;
    if (!rafId) rafId = requestAnimationFrame(tick);
  };
  const tick = () => {
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;
    if (haloA) {
      haloA.style.transform = `translate(${currentX * 40}px, ${currentY * 40}px)`;
    }
    if (haloB) {
      haloB.style.transform = `translate(${currentX * -50}px, ${currentY * -50}px)`;
    }
    if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  };
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.addEventListener("mousemove", onMove, { passive: true });
  }

  /* ----- 6. Hero title staggered entrance ----- */
  const heroLines = document.querySelectorAll(".hero__line");
  heroLines.forEach((line, i) => {
    line.style.opacity = "0";
    line.style.transform = "translateY(40px)";
    line.style.transition = `opacity .9s cubic-bezier(.16,1,.3,1) ${0.1 + i * 0.12}s, transform .9s cubic-bezier(.16,1,.3,1) ${0.1 + i * 0.12}s`;
  });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      heroLines.forEach((line) => {
        line.style.opacity = "";
        line.style.transform = "";
      });
    });
  });

  /* ----- 7. i18n toggle ----- */
  const dict = {
    zh: {
      "hero.label": "Hero",
      "hero.line1": "我做的设计",
      "hero.line2": "是帮助人们",
      "hero.line3": "理解 <em>复杂性。</em>",
      "hero.role": "Designer · 设计师",
      "hero.status": "状态",
      "hero.status.text": "寻找一个好产品",
      "hero.based": "城市",
      "hero.year": "年份",
      "hero.scroll": "向下",
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
      "hero.label": "Hero",
      "hero.line1": "I design things",
      "hero.line2": "that help people",
      "hero.line3": "understand <em>complexity.</em>",
      "hero.role": "Designer",
      "hero.status": "Status",
      "hero.status.text": "Looking for Good Product",
      "hero.based": "Based",
      "hero.year": "Year",
      "hero.scroll": "Scroll",
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
      "contact.sub":
        "For collaborations, work inquiries, or quiet conversations.",
      "contact.statement":
        "Currently <em>looking for a good product</em> — open to design leadership, founding design, and AI-native product roles.",
      "foot.quote": "I design things that help people understand complexity.",
    },
  };

  const applyLang = (lang) => {
    document.documentElement.setAttribute("data-lang", lang);
    document.documentElement.setAttribute("lang", lang === "zh" ? "zh-CN" : "en");
    const map = dict[lang] || dict.zh;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (map[key]) el.innerHTML = map[key];
    });
    // Toggle button label visibility: the span with data-lang-active="<currentLang>"
    // displays the OPPOSITE language (the one you'll switch to), so show it.
    document
      .querySelectorAll("[data-lang-active]")
      .forEach((el) => {
        const target = el.getAttribute("data-lang-active");
        el.hidden = target !== lang;
      });
  };

  const langBtn = document.getElementById("lang-toggle");
  let currentLang = "zh";
  applyLang(currentLang);
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      currentLang = currentLang === "zh" ? "en" : "zh";
      applyLang(currentLang);
    });
  }
})();
