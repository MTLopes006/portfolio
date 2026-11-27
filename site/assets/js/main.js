/* Matheus Lopes — shared behaviour + page renderers.
   Content lives in /content/*.json (edited by hand, by chat, or via /admin). */
(async () => {
  const UI = window.UI;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };
  const load = (f) => fetch(`content/${f}.json`, { cache: "no-cache" }).then((r) => r.json());
  const [P, PJ, PH, AB] = await Promise.all(["profile", "projects", "photography", "about"].map(load));
  const projects = PJ.projects || [];
  const series = (PH.series || []).filter((x) => (x.photos || []).some((f) => f.src));

  /* ---------- language ---------- */
  let lang = store.get("ml-lang") || ((navigator.language || "pt").toLowerCase().startsWith("pt") ? "pt" : "en");
  const t = (v) => (v && typeof v === "object" && !Array.isArray(v)) ? (v[lang] || v.pt || "") : (v ?? "");
  const ui = (k) => UI[lang][k] ?? k;
  const pad = (n) => String(n).padStart(2, "0");
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const paras = (s) => String(s || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const lines = (s) => String(s || "").split("\n").map((p) => p.trim()).filter(Boolean);
  const tags = (s) => String(t(s) || "").split("·").map((x) => x.trim()).filter(Boolean);

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const sysDark = matchMedia("(prefers-color-scheme: dark)");
  const applyTheme = (th) => root.setAttribute("data-theme", th);
  applyTheme(store.get("ml-theme") || "dark"); // dark by default; light is an option

  const page = document.body.dataset.page;
  // two portfolios on one domain: design pages and photo pages; shared pages keep the last one visited
  const MODE_OF = { home: "design", work: "design", project: "design", photo: "photo", series: "photo" };
  const qMode = new URLSearchParams(location.search).get("m");
  const mode = MODE_OF[page] || (qMode === "photo" || qMode === "design" ? qMode : null) || store.get("ml-mode") || "design";
  if (page !== "select") { store.set("ml-mode", mode); document.body.classList.add("mode-" + mode); }
  const landing = (m = mode) => (m === "photo" ? "fotografia.html" : "design.html");

  /* ---------- snippets ---------- */
  const arr = '<span class="arr" aria-hidden="true">→</span>';
  const arrUp = '<span class="arr" aria-hidden="true">↗</span>';

  // An image (or a placeholder) at its own aspect ratio; optional rounded corners and parallax.
  const media = (src, ratio, label, o = {}) => {
    const r = ratio || "4/3";
    const inner = src
      ? `<img src="${esc(src)}" alt="${esc(o.alt || label || "")}" loading="${o.eager ? "eager" : "lazy"}">`
      : `<div class="ph"${o.tone ? ` style="--tone:${esc(o.tone)}"` : ""}><span>${esc(label || ui("placeholder"))}</span></div>`;
    const bare = src && /\.(webp|png|svg)(\?|$)/i.test(src);
    return `<div class="media${o.round ? " round" : ""}${o.frame ? " frame" : ""}${bare ? " bare" : ""}"${o.parallax ? ' data-parallax="0.08"' : ""} style="aspect-ratio:${r}">${inner}</div>`;
  };
  const stagger = (i, step = 0.06) => `style="--d:${(i * step).toFixed(2)}s"`;
  const CATS = ["destaque", "campanhas", "produto", "interna", "clientes", "academico", "outros"];
  const catOf = (p) => p.category || "outros";
  const usedCats = () => CATS.filter((c) => projects.some((p) => catOf(p) === c));
  const coverOf = (s) => s.cover || (s.photos.find((x) => x.src) || {}).src || "";
  const seriesMeta = (s) => [t(s.kind), s.venue, s.date || s.year].filter(Boolean).map(esc).join(" · ");
  const photoCount = series.reduce((n, s) => n + s.photos.filter((f) => f.src).length, 0);
  const pills = (list, cls = "") => `<ul class="pills ${cls}">${list.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  function contrast(hex) {
    const h = String(hex || "").replace("#", ""); const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16) || 0;
    return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255 > 0.6 ? "#111111" : "#F3F1EC";
  }



  /* ---------- header / footer ---------- */
  const nav = [["projetos.html", "nav.work", "work"], ["fotografia.html", "nav.photo", "photo"], ["sobre.html", "nav.about", "about"]];
  const isOn = (p) => p === page || (p === "photo" && page === "series") || (p === "work" && page === "project");
  function renderChrome() {
    const navs = {
      design: [["design.html", "nav.home", "home"], ["projetos.html", "nav.projects", "work"], ["sobre.html", "nav.about", "about"]],
      photo: [["fotografia.html", "nav.home", "photo"], ["fotografia.html#series", "nav.series", "series"], ["sobre.html", "nav.about", "about"]],
    };
    const nav = navs[mode];
    const navLinks = nav.map(([h, k, p]) => `<a href="${h}"${p === page || (p === "work" && page === "project") ? ' aria-current="page"' : ""}>${ui(k)}</a>`).join("");
    const switcher = `<div class="mode-switch" role="tablist" aria-label="Portfólio">${["design", "photo"].map((m) => `<a role="tab" href="${landing(m)}" aria-selected="${page !== "select" && mode === m}" class="${page !== "select" && mode === m ? "on" : ""}">${ui("mode." + m)}</a>`).join("")}</div>`;
    const dark = root.getAttribute("data-theme") === "dark";
    const header = document.querySelector(".site-header");
    header.innerHTML = `
      <div class="wrap header-inner">
        <a class="brand" href="index.html" title="${ui("sel.hint")}"><span class="brand-mark" aria-hidden="true">ML</span><span class="brand-name">${esc(P.name)}</span></a>
        ${page === "select" ? "<span></span>" : `<div class="header-mid">${switcher}<nav class="nav" aria-label="${ui("menu")}">${navLinks}</nav></div>`}
        <div class="controls">
          <button class="ctrl lang-btn" type="button" aria-label="Idioma / Language"><span class="${lang === "pt" ? "on" : ""}">PT</span><span class="${lang === "en" ? "on" : ""}">EN</span></button>
          ${mode === "photo" && page !== "select" ? "" : `<button class="ctrl theme-btn" type="button" aria-label="${ui(dark ? "theme.light" : "theme.dark")}" title="${ui(dark ? "theme.light" : "theme.dark")}"><span class="dot" aria-hidden="true"></span></button>`}
          ${page === "select" ? "" : `<a class="btn btn-sm" href="contato.html?m=${mode}"${page === "contact" ? ' aria-current="page"' : ""}>${ui("nav.contact")}</a><button class="ctrl menu-btn" type="button" aria-expanded="false">${ui("menu")}</button>`}
        </div>
      </div>`;
    let mnav = document.querySelector(".mobile-nav");
    if (!mnav) { mnav = document.createElement("nav"); mnav.className = "mobile-nav"; document.body.appendChild(mnav); }
    mnav.innerHTML = `${switcher}<div class="mn-links">${navLinks}<a href="contato.html?m=${mode}">${ui("nav.contact")}</a></div><a class="mn-home" href="index.html">← ${ui("sel.hint")}</a>`;
    header.querySelector(".lang-btn").onclick = () => { lang = lang === "pt" ? "en" : "pt"; store.set("ml-lang", lang); renderAll(); };
    const tb = header.querySelector(".theme-btn");
    if (tb) tb.onclick = () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      store.set("ml-theme", next);
      const swap = () => { root.classList.add("theme-swap"); applyTheme(next); renderChrome(); void root.offsetWidth; requestAnimationFrame(() => root.classList.remove("theme-swap")); };
      if (document.startViewTransition && !document.hidden && !matchMedia("(prefers-reduced-motion: reduce)").matches) { const vt = document.startViewTransition(swap); vt.ready.catch(() => {}); vt.finished.catch(() => {}); } else swap();
    };
    const mb = header.querySelector(".menu-btn");
    const closeNav = () => { mnav.classList.remove("open"); document.body.classList.remove("nav-open"); if (mb) { mb.setAttribute("aria-expanded", "false"); mb.textContent = ui("menu"); } };
    if (mb) mb.onclick = () => {
      const open = !mnav.classList.contains("open");
      mnav.classList.toggle("open", open); mb.setAttribute("aria-expanded", open); mb.textContent = ui(open ? "close" : "menu");
      document.body.classList.toggle("nav-open", open);
    };
    mnav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));
    document.onkeydown = (e) => { if (e.key === "Escape" && mnav.classList.contains("open")) closeNav(); };

    const contacts = [["Email", `mailto:${P.email}`], ["LinkedIn", P.linkedin], ["WhatsApp", P.whatsapp], P.instagram ? ["Instagram", P.instagram] : null].filter(Boolean);
    const footer = document.querySelector(".site-footer");
    footer.hidden = page === "select";
    footer.innerHTML = `
      <div class="wrap">
        <div class="foot-top">
          <p class="eyebrow">${esc(t(P.available))}</p>
          <a class="foot-cta" href="contato.html?m=${mode}">${ui("footer.cta")} ${arrUp}</a>
          <a class="foot-mail" href="mailto:${esc(P.email)}">${esc(P.email)}</a>
        </div>
        <div class="foot-cols">
          <div><p class="eyebrow">${ui("mode.design")}</p><ul><li><a href="design.html">${ui("nav.home")}</a></li><li><a href="projetos.html">${ui("nav.projects")}</a></li></ul></div>
          ${mode === "photo" ? `<div><p class="eyebrow">${ui("mode.photo")}</p><ul><li><a href="fotografia.html">${ui("nav.home")}</a></li><li><a href="fotografia.html#series">${ui("nav.series")}</a></li></ul></div>` : ""}
          <div><p class="eyebrow">${ui("footer.contact")}</p><ul>${contacts.map(([k, h]) => `<li><a href="${esc(h)}"${h.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${k}</a></li>`).join("")}<li><a href="sobre.html">${ui("nav.about")}</a></li></ul></div>
        </div>

        <div class="foot-base"><span>© ${new Date().getFullYear()} ${esc(P.name)} · ${esc(t(P.location))}</span><a href="index.html">${ui("sel.hint")}</a><a href="#top">${ui("footer.top")} ↑</a></div>
      </div>`;
    root.lang = lang === "pt" ? "pt-BR" : "en";
    const pageTitle = { work: ui("nav.projects"), photo: ui("photo.title"), about: ui("about.title"), contact: ui("contact.title"), none: ui("notfound.title"), home: ui("mode.design") }[page];
    if (page === "select") document.title = `${P.name} — ${ui("sel.design")} · ${ui("sel.photo")}`;
    else if (pageTitle) document.title = `${pageTitle} — ${P.name}`;
  }

  /* breadcrumb trail for deep pages: always a one-click way back */
  const crumbs = (items) => `<nav class="crumbs" aria-label="breadcrumb"><a class="back" href="${items[items.length - 2][1]}" aria-label="${ui("project.prev")}">←</a><ol>${items.map(([l, h], k) => `<li>${k < items.length - 1 ? `<a href="${h}">${esc(l)}</a>` : `<span aria-current="page">${esc(l)}</span>`}</li>`).join("")}</ol></nav>`;

  /* in-page tabs: sticky bar that follows the sections of long pages */
  function pageTabs(items) {
    if (items.length < 2) return "";
    return `<nav class="page-tabs" aria-label="${ui("tabs.label")}"><div class="wrap"><ul>${items.map(([id, l]) => `<li><a href="#${id}" data-tab="${id}">${esc(l)}</a></li>`).join("")}</ul></div></nav>`;
  }
  function initTabs() {
    const bar = document.querySelector(".page-tabs");
    if (!bar) return;
    const links = [...bar.querySelectorAll("a")];
    const targets = links.map((a) => document.getElementById(a.dataset.tab)).filter(Boolean);
    const spy = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle("on", a.dataset.tab === e.target.id));
      const on = bar.querySelector("a.on"); if (on) on.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }), { rootMargin: "-30% 0px -60% 0px" });
    targets.forEach((tg) => spy.observe(tg));
  }

  /* ---------- SELECTOR: the first screen — choose design or photography ---------- */
  // animated gradient + grain background; one patch of light follows the pointer
  const glowBg = (cls) => `<div class="${cls}" aria-hidden="true"><div class="hx-glow"><span class="hx-g g1"></span><span class="hx-g g2"></span><span class="hx-g g3"></span></div><span class="hx-g gm"></span><span class="hx-noise"></span></div>`;
  function initGlow() {
    const box = document.querySelector(".hx, .sel-bg");
    if (!box) return;
    const host = box.classList.contains("hx") ? box : document.documentElement;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = innerWidth * 0.62, y = innerHeight * 0.38, cx = x, cy = y, raf = 0;
    const set = () => { const b = box.getBoundingClientRect(); host.style.setProperty("--mx", `${cx - (host === box ? b.left : 0)}px`); host.style.setProperty("--my", `${cy - (host === box ? b.top : 0)}px`); host.style.setProperty("--px", ((cx / innerWidth) * 2 - 1).toFixed(3)); host.style.setProperty("--py", ((cy / innerHeight) * 2 - 1).toFixed(3)); };
    const loop = () => { cx += (x - cx) * 0.08; cy += (y - cy) * 0.08; set(); raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.5 ? requestAnimationFrame(loop) : 0; };
    set();
    if (still || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window._glowMove) removeEventListener("pointermove", window._glowMove);
    window._glowMove = (e) => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(loop); };
    addEventListener("pointermove", window._glowMove, { passive: true });
  }

  function renderSelect() {
    const last = store.get("ml-mode");
    const feat = projects[0];
    const shot = series[0];
    const clients = lines(P.clients);
    const door = (m, href, img, title, desc, count) => `
      <a class="door door-${m}${last === m ? " last" : ""}" href="${href}" data-m="${m}">
        <div class="door-img">${img ? `<img src="${esc(img)}" alt="" loading="eager">` : ""}</div>
        <div class="door-copy">
          ${last === m ? `<span class="pill-last">${ui("sel.last")}</span>` : ""}
          <span class="eyebrow">${count}</span>
          <h2>${title}</h2>
          <p>${desc}</p>
          <span class="door-go">${ui("sel.enter")} <span class="arr" aria-hidden="true">↗</span></span>
        </div>
      </a>`;
    document.querySelector("main").innerHTML = `
      ${glowBg("sel-bg")}
      <section class="select-hero wrap" id="top">
        <p class="eyebrow">${esc(t(P.available))}</p>
        <h1 class="sel-name">${esc(P.name)}</h1>
        <div class="sel-intro">
          <p class="sel-hi">${ui("sel.hi")}</p>
          <p>${ui("sel.intro")}</p>
        </div>
      </section>
      <section class="select" aria-label="${ui("sel.hint")}">
        ${door("design", "design.html", feat && (feat.cover || feat.thumb), ui("sel.design"), ui("sel.design.d"), `${pad(projects.length)} ${ui("stat.projects")}`)}
        ${door("photo", "fotografia.html", shot && coverOf(shot), ui("sel.photo"), ui("sel.photo.d"), `${pad(series.length)} ${ui("stat.series")}`)}
      </section>
      ${clients.length ? `<section class="clients wrap" aria-label="${ui("home.clients")}"><p class="eyebrow">${ui("home.clients")}</p><ul>${clients.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></section>` : ""}`;
    document.querySelectorAll(".door").forEach((d) => d.addEventListener("click", () => store.set("ml-mode", d.dataset.m)));
    initGlow();
  }

  /* ---------- project card (home + index) ---------- */
  const projectCard = (p, i, o = {}) => `
    <li class="pcard${o.big ? " big" : ""}" data-cat="${esc(catOf(p))}" data-reveal ${stagger(o.k || 0, 0.08)} style="--tone:${esc(p.tone || "#111")}">
      <a href="projeto.html?p=${esc(p.slug)}">
        <div class="pcard-img">${media(o.big ? (p.cover || p.thumb) : (p.thumb || p.cover), o.big ? (p.coverRatio || "16/9") : "16/10", t(p.title), { tone: p.tone })}<span class="pcard-go" aria-hidden="true">↗</span></div>
        <div class="pcard-info">
          <span class="pcard-n">${pad(i + 1)}</span>
          <h3>${esc(t(p.title))}</h3>
          <span class="pcard-year">${esc(p.year || "")}</span>
          ${t(p.summary) ? `<p>${esc(t(p.summary))}</p>` : ""}
          ${pills(tags(p.tags))}
        </div>
      </a>
    </li>`;


  // numbered project index: one row per project; on desktop a preview of the cover follows the cursor
  const indexRows = (list, offset = 0) => `<ol class="pindex">${list.map((p, k) => `
    <li data-reveal ${stagger(k % 6, 0.05)}><a href="projeto.html?p=${esc(p.slug)}" data-cover="${esc(p.thumb || p.cover || "")}">
      <span class="pi-n">${pad(k + 1 + offset)}</span>
      <span class="pi-t">${esc(t(p.title))}</span>
      <span class="pi-c">${esc(t(p.client))}</span>
      <span class="pi-y">${esc(p.year || "")}</span>
      <span class="pi-thumb">${media(p.thumb || p.cover, "16/10", t(p.title))}</span>
    </a></li>`).join("")}</ol>`;
  function initIndexPreview() {
    if (!matchMedia("(hover: hover) and (min-width: 861px)").matches) return;
    let box = document.querySelector(".cursor-preview");
    if (!box) { box = document.createElement("div"); box.className = "cursor-preview"; document.body.appendChild(box); }
    let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => { cx += (x - cx) * 0.18; cy += (y - cy) * 0.18; box.style.transform = `translate(${cx}px, ${cy}px)`; raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(loop) : 0; };
    document.querySelectorAll(".pindex a").forEach((a) => {
      a.addEventListener("mouseenter", (e) => { box.innerHTML = a.dataset.cover ? `<img src="${esc(a.dataset.cover)}" alt="">` : ""; x = cx = e.clientX + 24; y = cy = e.clientY - 120; loop(); box.classList.add("on"); });
      a.addEventListener("mousemove", (e) => { x = e.clientX + 24; y = e.clientY - 120; if (!raf) raf = requestAnimationFrame(loop); });
      a.addEventListener("mouseleave", () => box.classList.remove("on"));
    });
  }

  /* ---------- HOME ---------- */
  // a client in the marquee: its logo (tinted to one colour with a CSS mask) or, without a logo, its name
  const clientLogo = (name) => (P.clientLogos || []).find((c) => c && c.logo && String(c.name).trim().toLowerCase() === String(name).trim().toLowerCase());
  const clientMark = (name, dup) => {
    const c = clientLogo(name);
    const hide = dup ? ' aria-hidden="true"' : "";
    return c ? `<span class="mq-logo" role="img" aria-label="${esc(name)}"${hide} style="--logo:url('${esc(c.logo)}');--ar:${esc(c.ratio || 3)}"></span>` : `<span class="mq-name"${hide}>${esc(name)}</span>`;
  };
  // every image a project's blocks use, in page order, with its ratio
  const projectImages = (p) => {
    const out = [];
    const walk = (o, ratio) => {
      if (Array.isArray(o)) return o.forEach((x) => walk(x, ratio));
      if (!o || typeof o !== "object") return;
      if (typeof o.img === "string" && o.img) out.push({ src: o.img, ratio: o.ratio || ratio || "4/3" });
      Object.values(o).forEach((v) => typeof v === "object" && walk(v, o.ratio || ratio));
    };
    walk(p.blocks || []);
    return out.filter((x, i, a) => a.findIndex((y) => y.src === x.src) === i);
  };

  // "Projetos em destaque" as a moving band: wide letters, a serif phrase and an outlined echo
  const featBand = () => {
    const group = `<span class="fb-a">${esc(ui("fb.a"))}</span><em class="fb-b">${esc(ui("fb.b"))}</em><span class="fb-c">${esc(ui("fb.a"))}</span><em class="fb-b">${esc(ui("fb.b"))}</em>`;
    return `<div class="sc-intro fb" data-band>
      <h2 class="sr-only">${ui("home.featuredMany")}</h2>
      <div class="fb-track" aria-hidden="true"><div class="fb-set">${group}</div><div class="fb-set">${group}</div></div>
    </div>`;
  };

  function renderHome() {
    const el = document.querySelector("main");
    const clients = lines(P.clients);
    const svc = [1, 2, 3, 4];
    const shows = projects.filter((p) => p.showcase).slice(0, 4);
    const card = (p) => `
      <article class="r-item pc">
        <a href="projeto.html?p=${esc(p.slug)}">
          ${media(p.thumb || p.cover, "4/3", t(p.title))}
          <span class="pc-info"><b>${esc(t(p.title))}</b><span>${esc(t(p.client))}${p.year ? `, ${esc(p.year)}` : ""}</span></span>
        </a>
      </article>`;
    const showcase = (p) => {
      const imgs = projectImages(p).slice(0, 7);
      return `
      <section class="sc" data-showcase>
        <div class="sc-sticky">
          <div class="wrap sc-head">
            <h2 class="sc-title"><a href="projeto.html?p=${esc(p.slug)}">${esc(t(p.title))}</a></h2>
            <p class="sc-sum">${esc(t(p.summary))}</p>
            <a class="link-arrow" href="projeto.html?p=${esc(p.slug)}">${ui("sc.open")} ${arr}</a>
          </div>
          <div class="sc-track">${[0, 1].map((k) => imgs.map((x) => `<figure class="sc-item"${k ? ' aria-hidden="true"' : ""}><img src="${esc(x.src)}" alt="" loading="lazy" decoding="async"></figure>`).join("")).join("")}</div>
        </div>
      </section>`;
    };
    el.innerHTML = `
      <section class="hx" id="top">
        ${glowBg("hx-bg")}
        <div class="wrap hx-inner">
          <div class="hx-top">
            <p class="eyebrow">${esc(t(P.available))}</p>
            <p class="eyebrow">${esc(t(P.role))}</p>
          </div>
          <h1 class="hx-name">
            <span class="l1">${esc(P.firstName)}</span>
            <span class="hx-role"><em>${ui("hx.role")}</em></span>
            <span class="l2">${esc(P.lastName)}<sup>(BH)</sup></span>
          </h1>
          <div class="hx-foot">
            <div class="hf-lead">
              <p>${esc(t(P.heroLead))}</p>
            </div>
          </div>
        </div>
        <a class="hx-down" href="#trabalho" aria-label="${ui("hero.cta")}"><span aria-hidden="true">↓</span></a>
      </section>

      <div class="sc-list" id="trabalho">
        ${shows.length ? featBand() : ""}
        ${shows.map(showcase).join("")}
      </div>

      <section class="section">
        <div class="wrap">
          <div class="sec-head"><h2 class="sec-title" data-scale>${ui("home.selected")}</h2><a class="link-arrow" href="projetos.html">${ui("home.all")} ${arr}</a></div>
          ${rail(projects.map(card).join(""))}
        </div>
      </section>

      ${clients.length ? `<section class="marquee" id="clientes" aria-label="${ui("home.clients")}"><div class="marquee-track">${[...clients, ...clients].map((c, k) => clientMark(c, k >= clients.length)).join("")}</div></section>` : ""}

      <section class="section services">
        <div class="wrap svc-plain">
          <h2 class="sec-title" data-scale>${ui("home.services")}</h2>
          <ul>${svc.map((n) => `<li data-scale><b>${ui("svc." + n)}</b><span>${ui("svc." + n + ".d")}</span></li>`).join("")}</ul>
        </div>
      </section>

      <section class="section about-teaser">
        <div class="wrap at-grid">
          <div class="at-photo" data-scale>${media(P.photo, "4/5", P.name)}</div>
          <div class="at-copy">
            <p class="at-big">${ui("about.teaser.d")}</p>
            <a class="link-arrow" href="sobre.html?m=design">${ui("about.more")} ${arr}</a>
          </div>
        </div>
      </section>`;
    initCarousels();
    initGlow();
    initDrag();
  }

  // drag the looping showcases sideways with mouse or finger; a drag never counts as a click
  function initDrag() {
    document.querySelectorAll("[data-showcase]").forEach((sc) => {
      const tr = sc.querySelector(".sc-track");
      tr.querySelectorAll("img").forEach((im) => (im.draggable = false));
      let down = false, sx = 0, sy = 0, lx = 0, moved = false, lockY = false;
      tr.addEventListener("pointerdown", (e) => { down = true; moved = false; lockY = false; sx = lx = e.clientX; sy = e.clientY; sc._v = 0; });
      addEventListener("pointermove", (e) => {
        if (!down) return;
        if (!moved && !lockY) { if (Math.abs(e.clientY - sy) > Math.abs(e.clientX - sx) + 4) { lockY = true; down = false; return; } if (Math.abs(e.clientX - sx) > 5) { moved = true; sc._drag = true; sc.classList.add("is-drag"); } }
        if (!moved) return;
        const dx = e.clientX - lx; lx = e.clientX;
        sc._x = (sc._x || 0) + dx; sc._v = dx;
      }, { passive: true });
      const up = () => { if (!down && !moved) return; down = false; sc._drag = false; sc.classList.remove("is-drag"); setTimeout(() => (moved = false), 0); };
      addEventListener("pointerup", up); addEventListener("pointercancel", up);
      tr.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    });
  }

  /* ---------- WORK INDEX ---------- */
  function renderWork() {
    const cats = usedCats();
    document.querySelector("main").innerHTML = `
      <div class="wrap" id="top">
        <header class="page-head">
          ${crumbs([[ui("mode.design"), "design.html"], [ui("nav.projects"), "#"]])}
          <h1 class="page-title">${ui("work.title")}</h1>
          <p class="page-lead">${ui("work.lead")}</p>
        </header>
        <div class="filters" role="toolbar">
          <button type="button" class="on" data-f="*">${ui("work.all")}</button>
          ${cats.map((c) => `<button type="button" data-f="${c}">${ui("cat." + c)}</button>`).join("")}
        </div>
        <ol class="ptiles">${projects.map(tile).join("")}</ol>
      </div>`;
    const bs = [...document.querySelectorAll(".filters button")];
    bs.forEach((b) => (b.onclick = () => {
      bs.forEach((x) => x.classList.toggle("on", x === b));
      document.querySelectorAll(".ptiles .ptile").forEach((c) => (c.hidden = b.dataset.f !== "*" && c.dataset.cat !== b.dataset.f));
    }));
  }

  /* ---------- PROJECT ---------- */
  // image blocks snap to the 12-col grid: full · wide (2–11) · center (3–10) · content (6–12)
  const spanOf = (b) => b.span || (!b.width ? "full" : b.width >= 85 ? "wide" : b.width >= 60 ? "center" : "content");
  const onGrid = (b, html) => `<div class="b-grid span-${spanOf(b)}">${html}</div>`;
  const cap = (b) => t(b.caption) ? `<figcaption>${esc(t(b.caption))}</figcaption>` : "";
  let chapterSeq = 0;
  function renderBlock(b) {
    const imgs = (b.imgs || []);
    switch (b.type) {
      case "lead": return `<section class="b-lead" data-reveal><p>${esc(t(b.text))}</p></section>`;
      case "chapter": return `<header class="b-chapter" id="ch-${++chapterSeq}" data-reveal><div class="ch-title">${t(b.kicker) ? `<span class="eyebrow">${esc(t(b.kicker))}</span>` : ""}<h2>${esc(t(b.title))}</h2></div>${t(b.text) ? `<p>${esc(t(b.text))}</p>` : ""}</header>`;
      case "text": return `<section class="b-text" data-reveal><h3>${esc(t(b.title))}</h3><p>${esc(t(b.text))}</p></section>`;
      case "full": return `<figure class="b-full">${media(b.img, b.ratio || "16/9", null, { parallax: b.parallax })}${cap(b)}</figure>`;
      case "split": return `<section class="b-split ${b.side === "right" ? "right" : ""}"><div class="media-wrap">${media(b.img, b.ratio)}</div><div class="copy" data-reveal><h3>${esc(t(b.title))}</h3><p>${esc(t(b.text))}</p></div></section>`;
      case "pair": return `<figure class="b-pair"><div class="grid">${imgs.map((m, i) => `<div ${stagger(i, 0.12)}>${media(m.img, m.ratio)}</div>`).join("")}</div>${cap(b)}</figure>`;
      case "rows": {
        const num = (r) => { const [w, h] = String(r || "1/1").split("/").map(Number); return (w / (h || 1)) || 1; };
        const fig = `<figure class="b-rows${b.join ? " join" : ""}">${(b.rows || []).map((row) => `${t(row.label) ? `<div class="row-label eyebrow">${esc(t(row.label))}</div>` : ""}<div class="row${(row.imgs || []).length > 2 ? " many" : ""}${(row.imgs || []).length > 1 && (row.imgs || []).every((m) => num(m.ratio) > 1.3) ? " landscape" : ""}">${(row.imgs || []).map((m, i) => `<div style="flex:${num(m.ratio).toFixed(4)} 1 0" data-reveal ${stagger(i, 0.1)}>${media(m.img, m.ratio, null, { round: m.round, frame: m.frame })}</div>`).join("")}</div>`).join("")}${cap(b)}</figure>`;
        if (t(b.sideTitle) || t(b.sideText)) return `<section class="b-side"><div class="copy" data-reveal>${t(b.sideTitle) ? `<h3>${esc(t(b.sideTitle))}</h3>` : ""}${t(b.sideText) ? `<p>${esc(t(b.sideText))}</p>` : ""}</div>${fig}</section>`;
        return onGrid(b, fig);
      }
      case "columns":
        return onGrid(b, `<figure class="b-cols"><div class="cols">${(b.cols || []).map((c, k) => `<div class="col" style="flex:${Number(c.width) || 1} 1 0">${(c.imgs || []).map((m, i) => `<div ${stagger(k + i, 0.08)}>${media(m.img, m.ratio, null, { round: m.round, frame: m.frame })}</div>`).join("")}</div>`).join("")}</div>${cap(b)}</figure>`);
      case "ads": {
        const items = b.items || [];
        const W = (a) => Number(a.w) || 300, H = (a) => Number(a.h) || 250;
        const big = items.filter((a) => W(a) >= 600 && H(a) >= 150), lead = items.filter((a) => W(a) >= 600 && H(a) < 150);
        const rect = items.filter((a) => W(a) < 600 && H(a) >= 150), mob = items.filter((a) => W(a) < 600 && H(a) < 150);
        const ad = (a) => {
          const fr = (a.frames && a.frames.length ? a.frames : [a.img]).filter(Boolean);
          return `<div class="ad" style="flex:${(W(a) / H(a)).toFixed(4)} 1 0;aspect-ratio:${W(a)}/${H(a)}">${fr.map((src, k) => `<img class="f${k + 1}" src="${esc(src)}" alt="${k ? "" : esc(`${W(a)}×${H(a)}`)}" loading="lazy">`).join("")}</div>`;
        };
        const row = (a) => a.length ? `<div class="ads-row">${a.map(ad).join("")}</div>` : "";
        return `<figure class="b-ads" data-reveal><div class="board">${row([...big, ...rect])}${row([...lead, ...mob])}</div>${cap(b)}</figure>`;
      }
      case "deck": {
        // slides stacked like a pile; they fan out into a row as the block scrolls in, then scroll sideways
        const n = imgs.length;
        return `<figure class="b-deck" data-p="deck"><div class="deck-track">${imgs.map((m, i) => `<div class="deck-card" style="--i:${i};--rot:${((i % 2 ? 1 : -1) * (3 + (i % 4))).toFixed(1)}deg;z-index:${n - i}">${media(m.img, b.ratio || "4/5")}</div>`).join("")}</div>${cap(b)}</figure>`;
      }
      case "pan": // a long strip (app store screens, panoramas) that slides sideways while the page scrolls
        return `<figure class="b-pan" data-p="pan"><div class="pan-view"><img src="${esc(b.img)}" alt="${esc(t(b.caption) || "")}" loading="lazy" style="aspect-ratio:${esc(b.ratio || "3/1")}"></div>${cap(b)}</figure>`;
      case "scatter": { // cards that land from different directions and settle slightly turned
        const f = Number.isInteger(b.feature) ? b.feature : -1;
        return `<figure class="b-scatter" data-p="scatter"><div class="scatter-board">${imgs.map((m, i) => `<div class="sc-card${i === f ? " feat" : ""}" style="--rot:${(((i * 37) % 9) - 4) * 1.2}deg;--dx:${(((i * 53) % 7) - 3) * 9}vw;--dy:${(((i * 29) % 5) - 2) * 6}vh">${media(m.img, m.ratio || "1/1")}</div>`).join("")}</div>${cap(b)}</figure>`;
      }
      case "trio": return `<section class="b-trio">${imgs.map((m, i) => `<div ${stagger(i, 0.12)}>${media(m.img, m.ratio)}</div>`).join("")}</section>`;
      case "palette": return `<section class="b-palette" data-reveal><p class="eyebrow">${ui("project.palette")}</p><div class="sw-row">${(b.colors || []).map((c) => `<div class="sw" style="background:${esc(c.hex)};color:${contrast(c.hex)}"><span>${esc(c.name)}</span><span>${esc(c.hex)}</span></div>`).join("")}</div></section>`;
      case "type": return `<section class="b-type" data-reveal><p class="eyebrow">${ui("project.type")}</p><div class="spec"><div><div style="font-family:'${esc(b.family)}';font-size:28px;font-weight:600">${esc(b.family)}</div><div class="muted" style="margin-top:6px">${esc(b.weights || "")}</div></div><div class="big" style="font-family:'${esc(b.family)}'">${esc(b.sample || "Aa")}</div></div></section>`;
      case "typeset": {
        (b.css || []).forEach((href) => { if (!document.querySelector(`link[href="${href}"]`)) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); } });
        return `<section class="b-typeset"><p class="eyebrow">${ui("project.type")}</p>${(b.fonts || []).map((f) => `
          <div class="ts-row" data-reveal>
            <div class="ts-name" style="font-family:${esc(f.family)};font-weight:${esc(f.weight || 400)}">${esc(f.name)}</div>
            <div class="ts-meta">${esc(t(f.role))}</div>
            <p class="ts-sample" style="font-family:${esc(f.family)};font-weight:${esc(f.weight || 400)}">${esc(f.sample)}</p>
          </div>`).join("")}</section>`;
      }
      case "quote": return `<section class="b-quote" data-reveal><blockquote>${esc(t(b.text))}</blockquote></section>`;
      case "specs": return `<section class="b-specs" data-reveal><h3>${esc(t(b.title))}</h3><dl>${(b.items || []).map((it) => `<div><dt>${esc(t(it.label))}</dt><dd>${esc(t(it.value))}</dd></div>`).join("")}</dl></section>`;
      default: return "";
    }
  }
  // big image tile with the title on top (project index + "more projects")
  const tile = (p, i) => `
    <li class="ptile" data-cat="${esc(catOf(p))}" data-reveal ${stagger(i % 2, 0.08)}>
      <a href="projeto.html?p=${esc(p.slug)}">
        ${media(p.thumb || p.cover, "4/3", t(p.title))}
        <span class="pt-shade" aria-hidden="true"></span>
        <span class="pt-info"><b>${esc(t(p.title))}</b><span>${esc(tags(p.tags).join(", "))}</span></span>
        <span class="pt-go" aria-hidden="true">↗</span>
      </a>
    </li>`;
  function renderProject() {
    const el = document.querySelector("main");
    const slug = new URLSearchParams(location.search).get("p");
    const i = projects.findIndex((p) => p.slug === slug);
    const p = projects[i < 0 ? 0 : i], idx = i < 0 ? 0 : i;
    if (!p) { el.innerHTML = `<div class="wrap page-head"><p>${ui("notfound")}</p></div>`; return; }
    const more = [1, 2].map((k) => projects[(idx + k) % projects.length]).filter((x) => x !== p);
    const chapters = (p.blocks || []).filter((b) => b.type === "chapter");
    document.title = `${t(p.title)} — ${P.name}`;
    chapterSeq = 0;
    el.innerHTML = `
      <article class="project" id="top">
        <div class="progress" aria-hidden="true"><span></span></div>
        <header class="case-cover" style="--cover-r:${esc(p.coverRatio || "16/9")}">
          ${media(p.cover, p.coverRatio || "16/9", t(p.title), { tone: p.tone, parallax: true, eager: true })}
          <span class="cc-shade" aria-hidden="true"></span>
          <div class="wrap cc-top">${crumbs([[ui("mode.design"), "design.html"], [ui("nav.projects"), "projetos.html"], [t(p.title), "#"]])}<span class="eyebrow">${pad(idx + 1)} / ${pad(projects.length)}</span></div>
          <div class="wrap cc-title"><p class="eyebrow">${esc(t(p.client))}</p><h1 class="proj-title">${esc(t(p.title))}</h1></div>
        </header>
        <section class="wrap case-info">
          <p class="eyebrow ci-label">${ui("project.overview")}</p>
          <div class="ci-body">
            ${t(p.summary) ? `<p class="ci-lead">${esc(t(p.summary))}</p>` : ""}
            <dl class="ci-facts">
              <div><dt>${ui("project.year")}</dt><dd>${esc(p.year || "—")}</dd></div>
              <div><dt>${ui("project.client")}</dt><dd>${esc(t(p.client))}</dd></div>
              <div><dt>${ui("project.tags")}</dt><dd>${esc(tags(p.tags).join(", "))}</dd></div>
              <div><dt>${ui("project.role")}</dt><dd>${esc(t(p.role))}</dd></div>
            </dl>
          </div>
        </section>
        ${pageTabs(chapters.map((c, k) => ["ch-" + (k + 1), t(c.title)]))}
        <div class="wrap proj-body">${(p.blocks || []).map(renderBlock).join("")}</div>
        <section class="wrap more">
          <div class="more-head"><p class="eyebrow">${ui("project.more")}</p><a class="link-arrow" href="projetos.html">${ui("project.all")} (${pad(projects.length)}) ${arr}</a></div>
          <ol class="ptiles">${more.map(tile).join("")}</ol>
          <a class="back-all" href="projetos.html">← ${ui("project.back")}</a>
        </section>
      </article>`;
    initLightbox(el, ".case-cover .media img, .proj-body .media img");
  }

  /* ---------- PHOTOGRAPHY ---------- */
  function renderPhoto() {
    const el = document.querySelector("main");
    const kinds = [...new Set(series.map((x) => t(x.kind)).filter(Boolean))];
    const heroes = series.map(coverOf).filter(Boolean).slice(0, 6);
    el.innerHTML = `
      <section class="ph-hero" id="top">
        <div class="ph-slides" aria-hidden="true">${heroes.map((src, k) => `<img src="${esc(src)}" alt="" class="${k ? "" : "on"}" loading="${k ? "lazy" : "eager"}">`).join("")}</div>
        <div class="wrap ph-hero-copy">
          <p class="eyebrow">${esc(t(P.available))}</p>
          <h1 class="page-title">${ui("photo.title")}</h1>
          <p class="page-lead">${esc(t(PH.intro))}</p>
          <div class="ph-actions"><a class="btn" href="#series">${ui("photo.seeSeries")} <span class="arr" aria-hidden="true">↓</span></a><a class="btn btn-ghost" href="contato.html?m=photo">${ui("photo.hire")}</a></div>
        </div>
      </section>
      <section class="section stats wrap" data-reveal>
        <div><b>${pad(series.length)}</b><span>${ui("stat.series")}</span></div>
        <div><b>${photoCount}</b><span>${ui("stat.photos")}</span></div>
        <div><b>${pad(new Set(series.map((x) => x.venue).filter(Boolean)).size)}</b><span>${ui("stat.venues")}</span></div>
      </section>
      <section class="section" id="series">
        <div class="wrap">
          <div class="sec-head" data-reveal><h2 class="sec-title">${ui("nav.series")}</h2></div>
          ${kinds.length > 1 ? `<div class="filters" role="toolbar"><button type="button" class="on" data-f="*">${ui("photo.all")}</button>${kinds.map((k) => `<button type="button" data-f="${esc(k)}">${esc(k)}</button>`).join("")}</div>` : ""}
          <ol class="sgrid">
            ${series.map((x, i) => `
              <li class="scard${i === 0 ? " big" : ""}" data-kind="${esc(t(x.kind))}" data-reveal ${stagger(i % 2, 0.08)} style="--tone:${esc(x.accent || "#111")}">
                <a href="foto.html?s=${esc(x.slug)}">
                  <div class="scard-img">${media(i === 0 ? coverOf(x) : (x.thumb || coverOf(x)), i === 0 ? "16/9" : "4/3", x.band)}<span class="pcard-go" aria-hidden="true">↗</span></div>
                  <div class="scard-info"><h3>${esc(x.band)}</h3><span class="scard-n">${pad(x.photos.length)} ${ui("photo.photos")}</span><p>${seriesMeta(x)}</p></div>
                </a>
              </li>`).join("")}
          </ol>
        </div>
      </section>
      ${t(PH.process) || PH.gear ? `<section class="section"><div class="wrap"><dl class="photo-specs" data-reveal>${t(PH.process) ? `<div><dt>${ui("photo.process")}</dt><dd>${esc(t(PH.process))}</dd></div>` : ""}${PH.gear ? `<div><dt>${ui("photo.gear")}</dt><dd>${esc(PH.gear)}</dd></div>` : ""}</dl></div></section>` : ""}
      <section class="section">
        <div class="wrap">
          <a class="cross" href="design.html" data-reveal>
            <div class="cross-imgs">${projects.slice(0, 3).map((x) => media(x.thumb || x.cover, "3/4", t(x.title))).join("")}</div>
            <div class="cross-copy"><p class="eyebrow">${ui("mode.design")}</p><p class="cross-t">${ui("cross.design")}</p><span class="link-arrow">${ui("cross.go.design")} ${arr}</span></div>
          </a>
        </div>
      </section>`;
    // filters by kind (shows / shoots)
    const bs = [...el.querySelectorAll(".filters button")];
    bs.forEach((b) => (b.onclick = () => {
      bs.forEach((x) => x.classList.toggle("on", x === b));
      el.querySelectorAll(".scard").forEach((c) => (c.hidden = b.dataset.f !== "*" && c.dataset.kind !== b.dataset.f));
    }));
    // slow crossfade between series covers
    const imgs = [...el.querySelectorAll(".ph-slides img")];
    if (imgs.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      let k = 0; clearInterval(window.__slides);
      window.__slides = setInterval(() => { imgs[k].classList.remove("on"); k = (k + 1) % imgs.length; imgs[k].classList.add("on"); }, 4500);
    }
  }

  // Lightbox shared by series and project pages: arrows, keyboard, counter.
  let lbKeys;
  function initLightbox(rootEl, selector) {
    const figs = selector
      ? [...rootEl.querySelectorAll(selector)].filter((img) => img.getAttribute("src")).map((img) => { const f = img.closest(".media"); f.dataset.src = img.getAttribute("src"); f.classList.add("zoomable"); return f; })
      : [...rootEl.querySelectorAll("figure[data-src]")].filter((f) => f.dataset.src);
    if (!figs.length) return;
    document.querySelectorAll(".lightbox").forEach((n) => n.remove());
    const lb = document.createElement("div");
    lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true");
    lb.innerHTML = `<img alt=""><button class="lb-btn lb-prev" aria-label="←">←</button><button class="lb-btn lb-next" aria-label="→">→</button><button class="lb-btn lb-close" aria-label="${ui("close")}">✕</button><div class="lb-count"></div>`;
    document.body.appendChild(lb);
    let i = 0;
    const show = (k) => { i = (k + figs.length) % figs.length; lb.querySelector("img").src = figs[i].dataset.src; lb.querySelector(".lb-count").textContent = `${pad(i + 1)} / ${pad(figs.length)}`; lb.classList.add("open"); };
    figs.forEach((f, k) => f.addEventListener("click", () => show(k)));
    lb.addEventListener("click", (e) => { if (e.target.closest(".lb-prev")) show(i - 1); else if (e.target.closest(".lb-next")) show(i + 1); else lb.classList.remove("open"); });
    if (lbKeys) document.removeEventListener("keydown", lbKeys);
    lbKeys = (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") lb.classList.remove("open");
      if (e.key === "ArrowLeft") show(i - 1);
      if (e.key === "ArrowRight") show(i + 1);
    };
    document.addEventListener("keydown", lbKeys);
  }

  // Each series gets its own page: a big cover, the facts, then every photo whole in justified rows.
  function renderSeries() {
    const el = document.querySelector("main");
    const slug = new URLSearchParams(location.search).get("s");
    const idx = Math.max(0, series.findIndex((x) => x.slug === slug));
    const s = series[idx];
    if (!s) { el.innerHTML = `<div class="wrap page-head"><p>${ui("notfound")}</p></div>`; return; }
    document.title = `${s.band} — ${ui("photo.title")} — ${P.name}`;
    const prev = series[(idx - 1 + series.length) % series.length], next = series[(idx + 1) % series.length];
    const photos = s.photos.filter((f) => f.src);
    const r = (q) => { const [w, h] = String(q || "3/2").split("/").map(Number); return (w / (h || 1)) || 1.5; };
    el.innerHTML = `
      <article class="series-page" id="top" style="--tone:${esc(s.accent || "#111")}">
        <header class="wrap sp-head">
          <div class="proj-top">${crumbs([[ui("mode.photo"), "fotografia.html"], [ui("nav.series"), "fotografia.html#series"], [s.band, "#"]])}<span class="eyebrow">${pad(idx + 1)} / ${pad(series.length)}</span></div>
          <p class="eyebrow"><span class="tone-dot" aria-hidden="true"></span>${esc(t(s.kind))}</p>
          <h1 class="proj-title">${esc(s.band)}</h1>
          <div class="proj-intro">
            ${t(s.desc) ? `<p class="proj-summary">${esc(t(s.desc))}</p>` : "<span></span>"}
            <dl class="proj-meta">
              ${s.venue ? `<div><dt>${ui("photo.venue")}</dt><dd>${esc(s.venue)}</dd></div>` : ""}
              ${s.date || s.year ? `<div><dt>${ui(s.date ? "photo.date" : "project.year")}</dt><dd>${esc(s.date || s.year)}</dd></div>` : ""}
              <div><dt>${ui("photo.photos")}</dt><dd>${pad(photos.length)}</dd></div>
            </dl>
          </div>
        </header>
        <div class="wrap"><div class="mosaic">${photos.map((ph, k) => `<figure data-src="${esc(ph.src)}" style="--r:${r(ph.ratio).toFixed(4)}" data-reveal>${media(ph.src, ph.ratio, `${s.band} ${pad(k + 1)}`)}${ph.caption ? `<figcaption>${esc(ph.caption)}</figcaption>` : ""}</figure>`).join("")}<i class="mosaic-end" aria-hidden="true"></i></div></div>
        <nav class="wrap sp-nav">
          <a href="foto.html?s=${esc(prev.slug)}"><span class="eyebrow">← ${ui("photo.prev")}</span><span class="t">${esc(prev.band)}</span></a>
          <a href="foto.html?s=${esc(next.slug)}"><span class="eyebrow">${ui("photo.next")} →</span><span class="t">${esc(next.band)}</span></a>
        </nav>
      </article>`;
    initLightbox(el);
  }

  /* ---------- ABOUT: off the clock (games & music) ---------- */
  const asItem = (x) => (typeof x === "string" ? { title: x } : x || {});
  const boxArt = (item, cls = "") => {
    const it = asItem(item);
    return it.cover ? `<div class="boxart ${cls}"><img src="${esc(it.cover)}" alt="${esc(it.title)}" loading="lazy"></div>` : `<div class="boxart ph ${cls}"><span>${esc(it.title)}</span></div>`;
  };
  const gamesOf = (O) => (Array.isArray(O.games) ? O.games : lines(O.games)).map(asItem);

  // mini player: one audio element for the page, never autoplays, starts at 10% volume
  const playerHTML = (PL) => {
    const tr = (PL && PL.tracks) || [];
    if (!tr.length) return "";
    return `<div class="player" data-player>
      <div class="pl-now">
        <img class="pl-art" src="${esc(tr[0].cover || "")}" alt="">
        <div class="pl-meta"><b class="pl-title">${esc(tr[0].title)}</b><span class="pl-artist">${esc(tr[0].artist)}</span><a class="pl-link" href="${esc(tr[0].link || "#")}" target="_blank" rel="noopener">${ui("pl.full")} ↗</a></div>
      </div>
      <div class="pl-bar" role="progressbar" aria-valuemin="0" aria-valuemax="30"><span></span></div>
      <div class="pl-ctrl">
        <button type="button" class="pl-prev" aria-label="${ui("pl.prev")}">⏮</button>
        <button type="button" class="pl-play" aria-label="${ui("pl.play")}"><span class="i-play">▶</span><span class="i-pause">❚❚</span></button>
        <button type="button" class="pl-next" aria-label="${ui("pl.next")}">⏭</button>
        <label class="pl-vol"><span class="sr">${ui("pl.vol")}</span><input type="range" min="0" max="100" step="1" value="10" aria-label="${ui("pl.vol")}"><output>10%</output></label>
      </div>
      <ol class="pl-list">${tr.map((x, i) => `<li><button type="button" data-i="${i}"><img src="${esc(x.cover || "")}" alt="" loading="lazy"><span class="t">${esc(x.title)}<small>${esc(x.artist)}</small></span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span></button></li>`).join("")}</ol>
    </div>`;
  };
  let audio;
  function initPlayers(PL) {
    const tr = (PL && PL.tracks) || [];
    if (!tr.length) return;
    audio = audio || new Audio(); audio.preload = "none"; audio.autoplay = false; audio.volume = 0.1;
    let i = 0;
    const els = [...document.querySelectorAll("[data-player]")];
    const paint = () => els.forEach((el) => {
      const x = tr[i]; el.classList.toggle("is-playing", !audio.paused);
      el.querySelector(".pl-title").textContent = x.title; el.querySelector(".pl-artist").textContent = x.artist;
      el.querySelector(".pl-art").src = x.cover || ""; el.querySelector(".pl-link").href = x.link || "#";
      el.querySelectorAll(".pl-list button").forEach((b) => b.classList.toggle("on", +b.dataset.i === i));
      const list = el.querySelector(".pl-list"), on = list.querySelector("button.on");
      if (on) { const li = on.parentElement, top = li.offsetTop - list.offsetTop; if (top < list.scrollTop || top + li.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTo({ top: top - list.clientHeight / 2 + li.offsetHeight / 2, behavior: "smooth" }); }
    });
    const loadT = (k, play) => { i = (k + tr.length) % tr.length; audio.src = tr[i].preview; if (play) audio.play().catch(() => {}); paint(); };
    els.forEach((el) => {
      el.querySelector(".pl-play").onclick = () => { if (!audio.src) loadT(i, true); else if (audio.paused) audio.play().catch(() => {}); else audio.pause(); };
      el.querySelector(".pl-prev").onclick = () => loadT(i - 1, true);
      el.querySelector(".pl-next").onclick = () => loadT(i + 1, true);
      el.querySelectorAll(".pl-list button").forEach((b) => (b.onclick = () => (+b.dataset.i === i && audio.src ? (audio.paused ? audio.play().catch(() => {}) : audio.pause()) : loadT(+b.dataset.i, true))));
      const vol = el.querySelector(".pl-vol input");
      const setVol = (v) => els.forEach((x) => { const rr = x.querySelector(".pl-vol input"); rr.value = v; rr.style.setProperty("--v", `${v}%`); x.querySelector(".pl-vol output").textContent = `${v}%`; });
      vol.oninput = () => { audio.volume = vol.value / 100; setVol(vol.value); };
      setVol(Math.round(audio.volume * 100));
    });
    audio.onplay = audio.onpause = paint;
    audio.onended = () => loadT(i + 1, true);
    audio.ontimeupdate = () => els.forEach((el) => { const d = audio.duration || 30; el.querySelector(".pl-bar span").style.width = `${(100 * audio.currentTime) / d}%`; });
    paint();
  }
  const rail = (items) => `<div class="rail" data-carousel><div class="rail-track">${items}</div><div class="rail-nav"><button type="button" class="r-prev" aria-label="${ui("pl.prev")}">←</button><button type="button" class="r-next" aria-label="${ui("pl.next")}">→</button></div></div>`;
  function initCarousels() {
    document.querySelectorAll("[data-carousel]").forEach((c) => {
      const track = c.querySelector(".rail-track"), step = () => track.clientWidth * 0.8;
      const sync = () => { c.querySelector(".r-prev").disabled = track.scrollLeft < 4; c.querySelector(".r-next").disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4; };
      c.querySelector(".r-prev").onclick = () => track.scrollBy({ left: -step(), behavior: "smooth" });
      c.querySelector(".r-next").onclick = () => track.scrollBy({ left: step(), behavior: "smooth" });
      track.addEventListener("scroll", sync, { passive: true }); addEventListener("resize", sync); sync();
    });
  }

  function offClock(O) {
    if (!O) return "";
    const games = gamesOf(O), hobbies = lines(t(O.hobbies)), playing = asItem(O.playing);
    const artists = Array.isArray(O.artists) ? O.artists : lines(O.artists).map((n) => ({ name: n }));
    return `
      <section class="section offclock" id="fora">
        <div class="sec-head" data-reveal><div><h2 class="sec-title">${ui("off.title")}</h2><p class="sec-lead">${ui("off.lead")}</p></div></div>
        <div class="off-grid">
          ${O.playlist && (O.playlist.tracks || []).length ? `<article class="tile tile-song" data-reveal><p class="eyebrow">${ui("off.song")}</p>${playerHTML(O.playlist)}</article>` : ""}
          ${O.favoriteGame && O.favoriteGame.title ? `<article class="tile tile-fav" data-reveal><p class="eyebrow">${ui("off.fav")}</p>${boxArt(O.favoriteGame, "big")}<h3>${esc(O.favoriteGame.title)}</h3>${playing.title ? `<div class="now-game">${boxArt(playing, "mini")}<div><p class="eyebrow">${ui("off.playing")}</p><b>${esc(playing.title)}</b></div></div>` : ""}</article>` : ""}
        </div>
        ${games.length ? `<div class="off-block" data-reveal><p class="eyebrow">${ui("off.games")}</p>${rail(games.map((g) => `<figure class="r-item game">${boxArt(g)}<figcaption>${esc(g.title)}</figcaption></figure>`).join(""))}</div>` : ""}
        ${(O.albums || []).length ? `<div class="off-block" data-reveal><p class="eyebrow">${ui("off.albums")}</p>${rail(O.albums.map((a) => `<figure class="r-item album">${a.link ? `<a href="${esc(a.link)}" target="_blank" rel="noopener">` : ""}${a.cover ? `<img src="${esc(a.cover)}" alt="${esc(a.title)}" loading="lazy">` : `<div class="ph"><span>${esc(a.title)}</span></div>`}<figcaption><b>${esc(a.title)}</b><span>${esc(a.artist)}${a.year ? ` · ${esc(a.year)}` : ""}</span></figcaption>${a.link ? "</a>" : ""}</figure>`).join(""))}</div>` : ""}
        ${artists.length ? `<div class="off-block" data-reveal><p class="eyebrow">${ui("off.artists")}</p>${rail(artists.map((a) => `<figure class="r-item artist">${a.photo ? `<img src="${esc(a.photo)}" alt="${esc(a.name)}" loading="lazy">` : `<div class="ph"></div>`}<figcaption>${esc(a.name)}</figcaption></figure>`).join(""))}</div>` : ""}
        ${hobbies.length ? `<div class="off-block" data-reveal><p class="eyebrow">${ui("off.hobbies")}</p>${pills(hobbies, "big")}</div>` : ""}
      </section>`;
  }

  /* ---------- ABOUT ---------- */
  function renderAbout() {
    const cvRows = (rows) => rows.map((x, i) => `<div class="cv-row" data-reveal ${stagger(i)}><span class="muted">${esc(t(x.period))}</span><span class="cv-role">${esc(t(x.role))}</span><span class="muted">${esc(x.place)}</span></div>`).join("");
    const bio = paras(t(AB.bio));
    document.querySelector("main").innerHTML = `
      <div class="wrap" id="top">
        <header class="page-head">
          ${crumbs([[ui("mode." + mode), landing()], [ui("about.title"), "#"]])}
          <h1 class="page-title">${ui("about.title")}</h1>
        </header>
        ${pageTabs([["perfil", ui("about.bio")], AB.offclock ? ["fora", ui("off.title")] : null, ["experiencia", ui("about.exp")], (AB.education || []).length ? ["formacao", ui("about.edu")] : null, (AB.research || []).length ? ["pesquisa", ui("about.research")] : null, (AB.timeline || []).length ? ["trajetoria", ui("about.timeline")] : null].filter(Boolean))}
        <div class="about-grid" id="perfil">
          <div class="about-photo" data-reveal>${media(P.photo, "4/5", P.name, { eager: true })}</div>
          <div class="about-bio">${bio.map((p, i) => `<p${i ? "" : ' class="first"'} data-reveal>${esc(p)}</p>`).join("")}</div>
        </div>
        ${offClock(AB.offclock)}
        <div class="about-lists" data-reveal>
          ${(AB.lists || []).map((l) => `<div><p class="eyebrow">${esc(t(l.title))}</p><ul>${lines(t(l.items)).map((it) => `<li>${esc(it)}</li>`).join("")}</ul></div>`).join("")}
        </div>
        <div class="cv" id="experiencia"><h2 class="cv-h" data-reveal>${ui("about.exp")}</h2>${cvRows(AB.experience || [])}</div>
        ${(AB.education || []).length ? `<div class="cv" id="formacao"><h2 class="cv-h" data-reveal>${ui("about.edu")}</h2>${cvRows(AB.education)}</div>` : ""}
        ${(AB.research || []).length ? `<div class="cv" id="pesquisa"><h2 class="cv-h" data-reveal>${ui("about.research")}</h2>${AB.research.map((r, i) => `
          <article class="research" data-reveal ${stagger(i)}><span class="eyebrow">${esc(t(r.kind))}</span><div><h3>${r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener">${esc(t(r.title))} ↗</a>` : esc(t(r.title))}</h3><p>${esc(t(r.text))}</p></div></article>`).join("")}</div>` : ""}
        ${(AB.timeline || []).length ? `<div class="cv" id="trajetoria"><h2 class="cv-h" data-reveal>${ui("about.timeline")}</h2><ol class="timeline">${AB.timeline.map((x, i) => `<li data-reveal ${stagger(i, 0.04)}><span class="tl-y">${esc(x.period)}</span><span>${esc(t(x.text))}</span></li>`).join("")}</ol></div>` : ""}
      </div>`;
    initPlayers(AB.offclock && AB.offclock.playlist);
    initCarousels();
  }

  /* ---------- CONTACT ---------- */
  function renderContact() {
    const rows = [["Email", P.email, `mailto:${P.email}`], ["LinkedIn", P.linkedinLabel, P.linkedin], ["WhatsApp", P.whatsappLabel, P.whatsapp], P.instagram ? ["Instagram", P.instagram.replace(/^https?:\/\/(www\.)?/, ""), P.instagram] : null].filter(Boolean);
    document.querySelector("main").innerHTML = `
      <div class="wrap" id="top">
        <header class="page-head">
          ${crumbs([[ui("mode." + mode), landing()], [ui("contact.title"), "#"]])}
          <h1 class="page-title">${ui("footer.cta")}</h1>
          <p class="page-lead">${ui("contact.lead")}</p>
        </header>
        <div class="contact-grid">
          <form class="contact-form" data-reveal novalidate>
            <div class="cf-row">
              <label><span>${ui("cf.name")}</span><input name="name" type="text" autocomplete="name" required></label>
              <label><span>${ui("cf.email")}</span><input name="email" type="email" autocomplete="email" required></label>
            </div>
            <fieldset class="cf-topics"><legend>${ui("cf.topic")}</legend>
              ${(mode === "photo" ? ["cf.t.photo", "cf.t.project", "cf.t.other"] : ["cf.t.project", "cf.t.other"]).map((k, i) => `<label class="chip"><input type="radio" name="topic" value="${esc(ui(k))}"${i === 0 ? " checked" : ""}><span>${ui(k)}</span></label>`).join("")}
            </fieldset>
            <label class="cf-msg"><span>${ui("cf.msg")}</span><textarea name="message" rows="6" required></textarea></label>
            <input type="text" name="_honey" class="cf-honey" tabindex="-1" autocomplete="off" aria-hidden="true">
            <div class="cf-foot"><button type="submit" class="btn">${ui("cf.send")} <span class="arr">→</span></button><p class="cf-status" role="status" aria-live="polite"></p></div>
          </form>
          <ul class="contact-list">
            ${rows.map(([k, v, h], i) => `<li data-reveal ${stagger(i)}><a href="${esc(h)}"${h.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}><span class="k">${k}</span><span class="v">${esc(v)}</span><span class="arr">↗</span></a></li>`).join("")}
          </ul>
        </div>
      </div>`;
    const form = document.querySelector(".contact-form"), status = form.querySelector(".cf-status");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { status.textContent = ui("cf.invalid"); form.reportValidity(); return; }
      const data = Object.fromEntries(new FormData(form));
      if (data._honey) return;
      const btn = form.querySelector("button"); btn.disabled = true; status.textContent = ui("cf.sending");
      try {
        const r = await fetch(`https://formsubmit.co/ajax/${P.email}`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ name: data.name, email: data.email, _replyto: data.email, assunto: data.topic, mensagem: data.message, _subject: `Portfólio — ${data.topic} — ${data.name}`, _template: "table", _captcha: "false" }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || String(j.success) === "false") throw new Error(j.message || r.status);
        form.reset(); status.textContent = ui("cf.ok");
      } catch (err) { status.innerHTML = `${ui("cf.err")} <a href="mailto:${esc(P.email)}">${esc(P.email)}</a>`; }
      btn.disabled = false;
    });
  }

  /* ---------- effects: scroll entrances, parallax, reading progress ---------- */
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let parallaxEls = [], io;
  function initEffects() {
    parallaxEls = [...document.querySelectorAll("[data-parallax]")];
    io?.disconnect();
    io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.08, rootMargin: "0px 0px -5% 0px" });
    document.querySelectorAll("[data-reveal]").forEach((n) => (reduce ? n.classList.add("in") : io.observe(n)));
    scaleEls = reduce ? [] : [...document.querySelectorAll("[data-scale], .proj-body .media")];
    seen?.disconnect();
    seen = new IntersectionObserver((es) => { es.forEach((e) => { e.target._on = e.isIntersecting; }); requestAnimationFrame(tick); }, { rootMargin: "20% 0px" });
    scaleEls.forEach((el) => seen.observe(el));
    showcases = [...document.querySelectorAll("[data-showcase]")];
    showcases.forEach((sc, i) => { sc._track = sc.querySelector(".sc-track"); sc._dir = i % 2 ? 1 : -1; sc._x = sc._dir > 0 ? -1 : 0; sc._k = 1; sc.classList.toggle("sc-static", reduce);
      sc.onpointerenter = () => (sc._slow = true); sc.onpointerleave = () => (sc._slow = false); });
    showcases.forEach((sc) => seen.observe(sc));
    progEls = reduce ? [] : [...document.querySelectorAll("[data-p]")];
    document.querySelectorAll("[data-p]").forEach((el) => el.classList.toggle("p-static", reduce));
    progEls.forEach((el) => seen.observe(el));
    bands = [...document.querySelectorAll("[data-band]")];
    bands.forEach((b) => { b._track = b.querySelector(".fb-track"); b._x = 0; b._dir = -1; b.classList.toggle("fb-static", reduce); seen.observe(b); });
    sizeShowcases();
    if (!reduce && (showcases.length || bands.length) && !loopRaf) loopRaf = requestAnimationFrame(loop);
    tick();
  }
  let scaleEls = [], showcases = [], bands = [], progEls = [], seen;
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  // looping showcases: the image row is rendered twice and slides forever; scrolling speeds it up
  function sizeShowcases() {
    showcases.forEach((sc) => { sc._w = sc._track.scrollWidth / 2; });
    bands.forEach((b) => { b._w = b._track.firstElementChild.offsetWidth; });
  }
  let loopRaf = 0, lastT = 0, lastY = scrollY, boost = 0;
  function loop(t) {
    const dt = Math.min(0.05, (t - (lastT || t)) / 1000); lastT = t;
    const dy = scrollY - lastY; lastY = scrollY;
    boost += (Math.min(1600, Math.abs(dy) / Math.max(dt, 0.001)) - boost) * 0.08;
    showcases.forEach((sc) => {
      if (!sc._on || !sc._w) return;
      if (!sc._drag) {
        const speed = (38 + boost * 0.35) * (sc._slow ? 0.2 : 1);
        sc._v = (sc._v || 0) * 0.92;
        sc._x += sc._dir * speed * dt + (Math.abs(sc._v) > 0.1 ? sc._v : 0);
      }
      if (sc._x <= -sc._w) sc._x += sc._w; else if (sc._x > 0) sc._x -= sc._w;
      sc._track.style.transform = `translate3d(${sc._x.toFixed(1)}px, 0, 0) scale(${sc._k.toFixed(3)})`;
    });
    // the band runs with the scroll direction and leans into fast scrolling
    bands.forEach((b) => {
      if (!b._on) return;
      if (!b._w) b._w = b._track.firstElementChild.offsetWidth;
      if (Math.abs(dy) > 0.5) b._dir = dy > 0 ? -1 : 1;
      b._x += b._dir * (70 + boost * 0.6) * dt;
      if (b._x <= -b._w) b._x += b._w; else if (b._x > 0) b._x -= b._w;
      const skew = Math.min(12, boost * 0.012) * -b._dir;
      b._track.style.transform = `translate3d(${b._x.toFixed(1)}px, 0, 0) skewX(${skew.toFixed(2)}deg)`;
    });
    loopRaf = showcases.length || bands.length ? requestAnimationFrame(loop) : 0;
  }
  let ticking = false;
  function tick() {
    ticking = false;
    const vh = innerHeight;
    if (!reduce) parallaxEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const prog = (r.top + r.height / 2 - vh / 2) / vh;
      el.firstElementChild.style.transform = `translate3d(0, ${(-prog * (parseFloat(el.dataset.parallax) || 0.08) * r.height).toFixed(1)}px, 0) scale(1.08)`;
    });
    // scale on scroll, only for elements on screen: read every rect first, then write (no layout thrash)
    const vis = scaleEls.filter((el) => el._on);
    const rects = vis.map((el) => el.getBoundingClientRect());
    vis.forEach((el, i) => {
      const r = rects[i];
      const k = Math.min(easeOut(clamp01((vh - r.top) / (vh * 0.7))), easeOut(clamp01(r.bottom / (vh * 0.5))));
      el.style.transform = `scale(${(0.88 + 0.12 * k).toFixed(3)})`;
    });
    // scroll progress for deck / pan / scatter blocks
    const pv = progEls.filter((el) => el._on);
    const pr = pv.map((el) => [el.getBoundingClientRect(), el.dataset.p === "pan" ? el.querySelector("img") : null, el.dataset.p === "pan" ? el.querySelector(".pan-view").clientWidth : 0]);
    pv.forEach((el, i) => {
      const [r, img, vw] = pr[i];
      if (el.dataset.p === "pan") {
        const p = clamp01((vh - r.top) / (vh + r.height));
        img.style.transform = `translate3d(${(-p * Math.max(0, img.offsetWidth - vw)).toFixed(1)}px, 0, 0)`;
      } else el.style.setProperty("--p", easeOut(clamp01((vh - r.top) / (vh * 0.85))).toFixed(3));
    });
    if (!reduce) {
      const sr = showcases.map((sc) => (sc._on ? sc.getBoundingClientRect() : null));
      showcases.forEach((sc, i) => { const r = sr[i]; if (r) sc._k = 0.86 + 0.14 * Math.min(easeOut(clamp01((vh - r.top) / (vh * 0.8))), easeOut(clamp01(r.bottom / (vh * 0.6)))); });
    }
    document.querySelector(".site-header")?.classList.toggle("is-scrolled", scrollY > 24);
    const bar = document.querySelector(".progress span");
    if (bar) { const h = document.documentElement.scrollHeight - vh; bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`; }
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }, { passive: true });
  addEventListener("resize", () => requestAnimationFrame(sizeShowcases));

  /* ---------- page transitions ---------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    const norm = (x) => x.replace(/\/index\.html$/, "/");
    if (norm(url.pathname) === norm(location.pathname) && url.search === location.search) {
      if (url.hash) { e.preventDefault(); document.querySelector(url.hash)?.scrollIntoView({ behavior: "smooth" }); history.replaceState(null, "", url.hash); }
      return;
    }
    e.preventDefault();
    document.body.classList.add("is-leaving");
    setTimeout(() => { location.href = url.href; }, 260);
  });
  addEventListener("pageshow", () => document.body.classList.remove("is-leaving"));

  /* ---------- house ads: one clock, every ad swaps frames together (2 s each) ---------- */
  let adClock = 0;
  function startAdClock() {
    if (adClock || !document.querySelector(".b-ads .ad img.f2") || reduce) return;
    adClock = setInterval(() => root.classList.toggle("ad-f2"), 2000);
  }

  /* ---------- typography: keep short words with the next one, last word with the previous ---------- */
  const SHORT = /(^|\s)(a|à|ao|as|às|e|é|o|os|um|uma|de|da|das|do|dos|em|na|nas|no|nos|com|por|para|que|se|of|the|an|and|to|in|on|at|by|for|with|is)\s/gi;
  function noWidows(scope) {
    if (!scope) return;
    scope.querySelectorAll("p, h2, h3, dd, figcaption, blockquote").forEach((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((n) => { n.nodeValue = n.nodeValue.replace(SHORT, (m, pre, w) => `${pre}${w} `); });
      const last = nodes.reverse().find((n) => /\S\s+\S+\s*$/.test(n.nodeValue));
      if (last && el.textContent.length > 28) last.nodeValue = last.nodeValue.replace(/\s+(\S{1,14})\s*$/, " $1");
    });
  }

  /* ---------- boot ---------- */
  function renderNotFound() {
    document.querySelector("main").innerHTML = `<div class="wrap page-head"><p class="eyebrow">404</p><h1 class="page-title">${ui("notfound.title")}</h1><p class="page-lead"><a class="link-arrow" href="index.html">${ui("notfound.back")} ${arr}</a></p></div>`;
  }
  function renderAll() {
    renderChrome();
    ({ select: renderSelect, home: renderHome, project: renderProject, work: renderWork, photo: renderPhoto, series: renderSeries, about: renderAbout, contact: renderContact, none: renderNotFound })[page]?.();
    initTabs();
    initEffects();
    noWidows(document.querySelector("main")); noWidows(document.querySelector(".site-footer"));
    startAdClock();
  }
  renderAll();
  requestAnimationFrame(() => document.body.classList.remove("is-entering"));
  if (location.hash) setTimeout(() => document.querySelector(location.hash)?.scrollIntoView(), 80);
})();
