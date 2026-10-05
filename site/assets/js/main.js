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
  const series = PH.series || [];

  /* ---------- language ---------- */
  let lang = store.get("ml-lang") || ((navigator.language || "pt").toLowerCase().startsWith("pt") ? "pt" : "en");
  const t = (v) => (v && typeof v === "object" && !Array.isArray(v)) ? (v[lang] || v.pt || "") : (v ?? "");
  const ui = (k) => UI[lang][k] ?? k;
  const pad = (n) => String(n).padStart(2, "0");
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const paras = (s) => String(s || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const lines = (s) => String(s || "").split("\n").map((p) => p.trim()).filter(Boolean);

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const sysDark = matchMedia("(prefers-color-scheme: dark)");
  const applyTheme = (th) => root.setAttribute("data-theme", th);
  applyTheme(store.get("ml-theme") || (sysDark.matches ? "dark" : "light"));
  sysDark.addEventListener?.("change", (e) => { if (!store.get("ml-theme")) applyTheme(e.matches ? "dark" : "light"); });

  const page = document.body.dataset.page;
  const folio = { home: 1, project: 2, photo: 3, series: 3, about: 4, contact: 5 }[page] || 1;

  /* ---------- snippets ---------- */
  const arr = '<span class="arr" aria-hidden="true">→</span>';
  const regmark = '<svg class="regmark" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="5.5" fill="none" stroke="currentColor"/><path d="M10 0v20M0 10h20" stroke="currentColor"/></svg>';

  // An image (or placeholder) with optional crop marks, parallax and print-wipe entrance.
  const media = (src, ratio, label, o = {}) => {
    const r = ratio || "4/3";
    const inner = src
      ? `<img src="${esc(src)}" alt="${esc(o.alt || label || "")}" loading="lazy">`
      : `<div class="ph${o.tone ? " tone" : ""}"${o.tone ? ` style="--tone:${esc(o.tone)}"` : ""}><span>${esc(label || ui("placeholder"))} · ${esc(r.replace("/", ":"))}</span></div>`;
    const m = `<div class="media"${o.parallax ? ' data-parallax="0.1"' : ""}${o.reveal === false ? "" : ' data-reveal="print"'} style="aspect-ratio:${r}">${inner}</div>`;
    return o.crop ? `<div class="crop">${m}</div>` : m;
  };
  const stagger = (i, step = 0.06) => `style="--d:${(i * step).toFixed(2)}s"`;

  /* ---------- header / footer ---------- */
  const nav = [["index.html#projetos", "nav.work", "home"], ["index.html#fotografia", "nav.photo", "photo"], ["sobre.html", "nav.about", "about"], ["contato.html", "nav.contact", "contact"]];
  function renderChrome() {
    const navLinks = nav.map(([h, k, p]) => `<a href="${h}"${(p === page || (p === "photo" && page === "series")) && p !== "home" ? ' aria-current="page"' : ""}>${ui(k)}</a>`).join("");
    const dark = root.getAttribute("data-theme") === "dark";
    const header = document.querySelector(".site-header");
    header.innerHTML = `
      <div class="wrap header-inner">
        <a class="brand" href="index.html" aria-label="${esc(P.name)}"><span class="brand-mark">M<i>/</i>L</span><span class="brand-name">${esc(P.name)}</span></a>
        <nav class="nav">${navLinks}</nav>
        <div class="controls">
          <button class="ctrl lang-btn" type="button" aria-label="Idioma / Language"><span class="${lang === "pt" ? "on" : ""}">PT</span> / <span class="${lang === "en" ? "on" : ""}">EN</span></button>
          <button class="ctrl theme-btn" type="button"><span class="${dark ? "" : "on"}">${ui("theme.light")}</span> / <span class="${dark ? "on" : ""}">${ui("theme.dark")}</span></button>
          <button class="ctrl menu-btn" type="button" aria-expanded="false"><span class="on">${ui("menu")}</span></button>
        </div>
      </div>`;
    let mnav = document.querySelector(".mobile-nav");
    if (!mnav) { mnav = document.createElement("nav"); mnav.className = "mobile-nav"; document.body.appendChild(mnav); }
    mnav.innerHTML = navLinks;
    header.querySelector(".lang-btn").onclick = () => { lang = lang === "pt" ? "en" : "pt"; store.set("ml-lang", lang); renderAll(); };
    header.querySelector(".theme-btn").onclick = () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next); store.set("ml-theme", next); renderChrome();
    };
    const mb = header.querySelector(".menu-btn");
    mb.onclick = () => {
      const open = !mnav.classList.contains("open");
      mnav.classList.toggle("open", open); mb.setAttribute("aria-expanded", open); mb.firstElementChild.textContent = ui(open ? "close" : "menu");
    };
    mnav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => { mnav.classList.remove("open"); }));

    const contacts = [["Email", `mailto:${P.email}`], ["LinkedIn", P.linkedin], ["WhatsApp", P.whatsapp], P.instagram ? ["Instagram", P.instagram] : null].filter(Boolean);
    const footer = document.querySelector(".site-footer");
    footer.classList.add("sheet");
    footer.innerHTML = `
      <div class="tear tear-top" style="--tx:-410px" aria-hidden="true"></div>
      <div class="wrap">
        <a class="foot-cta riso" data-text="${esc(ui("footer.cta"))}" href="contato.html">${ui("footer.cta")}</a>
        <a class="foot-mail" href="mailto:${esc(P.email)}">${esc(P.email)} ${arr}</a>
        <div class="foot-cols">
          <div><h4 class="label">${esc(P.name)}</h4><p style="margin:0;max-width:22em">${esc(t(P.role))} · ${esc(t(P.location))}<br><span class="muted">${esc(t(P.available))}</span></p></div>
          <div><h4 class="label">${ui("footer.contact")}</h4><ul>${contacts.map(([k, h]) => `<li><a href="${esc(h)}"${h.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${k}</a></li>`).join("")}</ul></div>
          <div><h4 class="label">${ui("footer.nav")}</h4><ul>${nav.map(([h, k]) => `<li><a href="${h}">${ui(k)}</a></li>`).join("")}</ul></div>
        </div>
        <div class="slug label">
          <span class="bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
          ${regmark}
          <span>${esc(P.name)} — ${ui("sideA")} / ${ui("sideB")} — ${new Date().getFullYear()}</span>
          <span class="grow"></span>
          <span>${ui("page")} ${pad(folio)}</span>
          <a href="#top">${ui("footer.top")} ↑</a>
        </div>
      </div>`;
    root.lang = lang === "pt" ? "pt-BR" : "en";
  }

  /* ---------- HOME ---------- */
  let homeRendered = false;
  function renderHome() {
    const el = document.querySelector("main");
    const split = (s, d0) => [...s].map((ch, i) => `<span class="ch" style="animation-delay:${d0 + i * 0.045}s">${ch === " " ? "&nbsp;" : esc(ch)}</span>`).join("");
    const name = homeRendered
      ? `<span class="line riso" data-text="${esc(P.firstName)}">${esc(P.firstName)}</span><span class="line riso" data-text="${esc(P.lastName)}">${esc(P.lastName)}</span>`
      : `<span class="line riso" data-text="${esc(P.firstName)}">${split(P.firstName, 0.15)}</span><span class="line riso" data-text="${esc(P.lastName)}">${split(P.lastName, 0.35)}</span>`;
    const stripSeries = [0, 1, 2].map((k) => series[k % Math.max(series.length, 1)]).filter(Boolean);
    el.innerHTML = `
      <section class="hero" id="top">
        <div class="wrap hero-grid">
          <div class="hero-copy">
            <div class="hero-kicker label">${regmark}<span>${ui("hero.kicker")}</span></div>
            <h1 class="hero-name">${name}</h1>
            <p class="hero-lead">${esc(t(P.heroLead))}</p>
            <div class="hero-actions">
              <a class="btn" href="#projetos">${ui("hero.cta")} <span class="arr">↓</span></a>
              <span class="hint">${ui("hero.drag")}</span>
            </div>
          </div>
        </div>
        <div class="badge-stage" id="badge-stage"></div>
        <div class="wrap hero-foot label"><span>${esc(t(P.location))}</span><span>${esc(t(P.role))} — ${esc(P.company)}</span></div>
      </section>

      <section class="section" id="projetos">
        <div class="wrap">
          <div class="sec-head" data-reveal>
            <div><div class="sec-label label"><span class="pink">${ui("sideA")}</span>${regmark}</div><h2 class="sec-title">${ui("work.title")}</h2></div>
            <span class="label muted">${pad(projects.length)} ${ui("work.count")}</span>
          </div>
          <div class="track-head label"><span>Nº</span><span>${ui("work.col.title")}</span><span>${ui("work.col.tags")}</span><span style="text-align:right">${ui("work.col.year")}</span><span></span></div>
          <ol class="tracklist">
            ${projects.map((p, i) => `
              <li class="track" data-reveal ${stagger(i)}><a href="projeto.html?p=${esc(p.slug)}" data-cover="${esc(p.cover || "")}" data-tone="${esc(p.tone || "")}" data-title="${esc(p.title)}">
                <span class="track-no">${pad(i + 1)}</span>
                <span class="track-title">${esc(p.title)}</span>
                <span class="track-tags">${esc(t(p.tags))}</span>
                <span class="track-year">${esc(p.year || "—")}</span>
                <span class="track-arr" aria-hidden="true">→</span>
                <span class="track-thumb">${media(p.cover, "16/9", p.title, { tone: p.tone, reveal: false })}</span>
              </a></li>`).join("")}
          </ol>
        </div>
      </section>

      <section class="section sheet" id="fotografia">
        <div class="tear tear-top" style="--tx:-180px" aria-hidden="true"></div>
        <div class="tear tear-bottom" style="--tx:-760px" aria-hidden="true"></div>
        <div class="wrap">
          <div class="sec-head" data-reveal>
            <div><div class="sec-label label"><span class="pink">${ui("sideB")}</span>${regmark}</div><h2 class="sec-title">${ui("photo.title")}</h2></div>
            <a class="link-arrow" href="fotografia.html">${ui("photo.see")} ${arr}</a>
          </div>
          <div class="sideb-grid">
            <p class="sideb-lead" data-reveal>${esc(t(PH.intro))}</p>
            <ul class="setlist">
              ${series.map((s, i) => `<li data-reveal ${stagger(i)}><a href="foto.html?s=${esc(s.slug)}"><span class="n label">${pad(i + 1)}</span><span class="t">${esc(s.band)}</span><span class="c label">${pad(s.photos.length)} ${ui("photo.photos")}</span></a></li>`).join("")}
            </ul>
          </div>
          <div class="sideb-strip">
            ${stripSeries.map((s, k) => `<a href="foto.html?s=${esc(s.slug)}" ${stagger(k, 0.12)} aria-label="${esc(s.band)}">${media(coverOf(s), k === 1 ? "3/4" : k === 0 ? "4/3" : "4/5", s.band, { parallax: k !== 1, crop: k === 0, tone: s.accent })}</a>`).join("")}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="wrap about-teaser" data-reveal>
          <p>${ui("about.teaser").replace("{company}", esc(P.company))}</p>
          <a class="link-arrow" href="sobre.html">${ui("about.more")} ${arr}</a>
        </div>
      </section>`;
    homeRendered = true;
    if (window.Badge) window.Badge.mount(document.getElementById("badge-stage"), { P, t, ui });
    initCursorPreview();
  }

  function initCursorPreview() {
    if (!matchMedia("(hover: hover) and (min-width: 761px)").matches) return;
    let box = document.querySelector(".cursor-preview");
    if (!box) { box = document.createElement("div"); box.className = "cursor-preview"; document.body.appendChild(box); }
    let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (x - cx) * 0.16; cy += (y - cy) * 0.16;
      box.style.left = cx + "px"; box.style.top = cy + "px";
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    const move = (e) => { x = e.clientX + 330; y = e.clientY; if (!raf) raf = requestAnimationFrame(loop); };
    document.querySelectorAll(".track a").forEach((a) => {
      a.addEventListener("mouseenter", (e) => {
        box.innerHTML = a.dataset.cover ? `<img src="${esc(a.dataset.cover)}" alt="">` : `<div class="ph tone" style="--tone:${a.dataset.tone || "var(--paper-2)"}"><span>${esc(a.dataset.title)}</span></div>`;
        x = cx = e.clientX + 330; y = cy = e.clientY; loop(); box.classList.add("on");
      });
      a.addEventListener("mousemove", move);
      a.addEventListener("mouseleave", () => box.classList.remove("on"));
    });
  }

  /* ---------- PROJECT ---------- */
  function contrast(hex) {
    const h = String(hex).replace("#", ""); const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16) || 0;
    return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255 > 0.55 ? "#18171A" : "#F5F3EE";
  }
  function renderBlock(b) {
    const imgs = (b.imgs || []);
    switch (b.type) {
      case "lead": return `<section class="b-lead" data-reveal><p>${esc(t(b.text))}</p></section>`;
      case "text": return `<section class="b-text" data-reveal><h3>${esc(t(b.title))}</h3><p>${esc(t(b.text))}</p></section>`;
      case "full": return `<figure class="b-full" style="margin-top:0;margin-bottom:0">${media(b.img, b.ratio || "16/9", null, { parallax: b.parallax })}${t(b.caption) ? `<figcaption class="label">${esc(t(b.caption))}</figcaption>` : ""}</figure>`;
      case "split": return `<section class="b-split ${b.side === "right" ? "right" : ""}"><div class="media-wrap">${media(b.img, b.ratio, null, { crop: true })}</div><div class="copy" data-reveal><h3>${esc(t(b.title))}</h3><p>${esc(t(b.text))}</p></div></section>`;
      case "pair": return `<figure class="b-pair" style="margin:0"><div class="grid">${imgs.map((m, i) => `<div ${stagger(i, 0.12)}>${media(m.img, m.ratio)}</div>`).join("")}</div>${t(b.caption) ? `<figcaption class="label">${esc(t(b.caption))}</figcaption>` : ""}</figure>`;
      case "trio": return `<section class="b-trio">${imgs.map((m, i) => `<div ${stagger(i, 0.12)}>${media(m.img, m.ratio)}</div>`).join("")}</section>`;
      case "palette": return `<section class="b-palette" data-reveal><div class="blk-label label">${ui("project.palette")}</div><div class="row">${(b.colors || []).map((c) => `<div class="sw label" style="background:${esc(c.hex)};color:${contrast(c.hex)}"><span>${esc(c.name)}</span><span>${esc(c.hex)}</span></div>`).join("")}</div></section>`;
      case "type": return `<section class="b-type" data-reveal><div class="blk-label label">${ui("project.type")}</div><div class="spec"><div><div style="font-family:'${esc(b.family)}';font-size:28px;font-weight:600">${esc(b.family)}</div><div class="label muted" style="margin-top:6px">${esc(b.weights || "")}</div></div><div class="big" style="font-family:'${esc(b.family)}'">${esc(b.sample || "Aa")}</div></div></section>`;
      case "quote": return `<section class="b-quote" data-reveal><blockquote>${esc(t(b.text))}</blockquote></section>`;
      case "specs": return `<section class="b-specs" data-reveal><h3>${esc(t(b.title))}</h3><dl>${(b.items || []).map((it) => `<div><dt class="label">${esc(t(it.label))}</dt><dd>${esc(t(it.value))}</dd></div>`).join("")}</dl></section>`;
      default: return "";
    }
  }
  function renderProject() {
    const el = document.querySelector("main");
    const slug = new URLSearchParams(location.search).get("p");
    const i = projects.findIndex((p) => p.slug === slug);
    const p = projects[i < 0 ? 0 : i], idx = i < 0 ? 0 : i;
    if (!p) { el.innerHTML = `<div class="wrap page-head"><p>${ui("notfound")}</p></div>`; return; }
    const next = projects[(idx + 1) % projects.length];
    document.title = `${p.title} — ${P.name}`;
    el.innerHTML = `
      <article class="wrap" id="top">
        <div class="proj-top label"><a href="index.html#projetos">← ${ui("project.back")}</a><span>${ui("project.track")} ${pad(idx + 1)}/${pad(projects.length)}</span></div>
        <h1 class="proj-title riso" data-text="${esc(p.title)}">${esc(p.title)}</h1>
        <dl class="proj-meta" data-reveal>
          <div><dt class="label">${ui("project.client")}</dt><dd>${esc(t(p.client))}</dd></div>
          <div><dt class="label">${ui("project.year")}</dt><dd>${esc(p.year || "—")}</dd></div>
          <div><dt class="label">${ui("project.role")}</dt><dd>${esc(t(p.role))}</dd></div>
          <div><dt class="label">${ui("project.tags")}</dt><dd>${esc(t(p.tags))}</dd></div>
        </dl>
        <div class="proj-cover">${media(p.cover, p.coverRatio || "16/9", "Capa / Cover", { parallax: true, tone: p.tone, crop: true })}</div>
        <div class="proj-body">${(p.blocks || []).map(renderBlock).join("")}</div>
        <nav class="next-proj" data-reveal><a href="projeto.html?p=${esc(next.slug)}"><div><div class="label muted" style="margin-bottom:14px">${ui("project.next")} — ${pad(((idx + 1) % projects.length) + 1)}</div><div class="t">${esc(next.title)}</div></div><span class="arr">→</span></a></nav>
      </article>`;
  }

  /* ---------- PHOTOGRAPHY ---------- */
  const coverOf = (s) => s.cover || (s.photos.find((x) => x.src) || {}).src || "";
  const seriesMeta = (s) => [t(s.kind), s.venue, s.year].filter(Boolean).map(esc).join(" · ");

  // Index: one editorial row per series, each linking to its own page.
  function renderPhoto() {
    const el = document.querySelector("main");
    el.innerHTML = `
      <div class="wrap" id="top">
        <header class="page-head">
          <div class="sec-label label"><span class="pink">${ui("sideB")}</span>${regmark}</div>
          <h1 class="page-title riso" data-text="${esc(ui("photo.title"))}">${ui("photo.title")}</h1>
          <p class="page-lead">${esc(t(PH.intro))}</p>
          ${t(PH.process) || PH.gear ? `<dl class="photo-specs" data-reveal>${t(PH.process) ? `<div><dt class="label">${ui("photo.process")}</dt><dd>${esc(t(PH.process))}</dd></div>` : ""}${PH.gear ? `<div><dt class="label">${ui("photo.gear")}</dt><dd>${esc(PH.gear)}</dd></div>` : ""}</dl>` : ""}
        </header>
        <ol class="series-index">
          ${series.map((s, i) => `
            <li class="series-row" style="--acc:${esc(s.accent || "var(--magenta)")}">
              <a href="foto.html?s=${esc(s.slug)}">
                <div class="cover crop"><span class="tape" aria-hidden="true"></span>${media(coverOf(s), "3/2", s.band, { tone: s.accent })}</div>
                <div class="info" data-reveal>
                  <span class="n label">${pad(i + 1)} / ${pad(series.length)}</span>
                  <h2>${esc(s.band)}</h2>
                  <div class="meta label">${seriesMeta(s) || "&nbsp;"} · ${pad(s.photos.length)} ${ui("photo.photos")}</div>
                  <span class="go">${ui("photo.open")} ${arr}</span>
                </div>
              </a>
            </li>`).join("")}
        </ol>
      </div>`;
  }

  // Lightbox shared by series pages: arrows, keyboard, counter.
  function initLightbox(root) {
    const figs = [...root.querySelectorAll("figure[data-src]")].filter((f) => f.dataset.src);
    if (!figs.length) return;
    const lb = document.createElement("div");
    lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true");
    lb.innerHTML = `<img alt=""><button class="lb-btn lb-prev" aria-label="←">←</button><button class="lb-btn lb-next" aria-label="→">→</button><div class="lb-count label"></div>`;
    document.body.appendChild(lb);
    let i = 0;
    const show = (k) => { i = (k + figs.length) % figs.length; lb.querySelector("img").src = figs[i].dataset.src; lb.querySelector(".lb-count").textContent = `${pad(i + 1)} / ${pad(figs.length)}`; lb.classList.add("open"); };
    figs.forEach((f, k) => f.addEventListener("click", () => show(k)));
    lb.addEventListener("click", (e) => { if (e.target.closest(".lb-prev")) show(i - 1); else if (e.target.closest(".lb-next")) show(i + 1); else lb.classList.remove("open"); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") lb.classList.remove("open");
      if (e.key === "ArrowLeft") show(i - 1);
      if (e.key === "ArrowRight") show(i + 1);
    });
  }

  // Each series gets its own page and one of five layouts.
  function renderSeries() {
    const el = document.querySelector("main");
    const slug = new URLSearchParams(location.search).get("s");
    const idx = Math.max(0, series.findIndex((x) => x.slug === slug));
    const s = series[idx];
    if (!s) { el.innerHTML = `<div class="wrap page-head"><p>${ui("notfound")}</p></div>`; return; }
    document.title = `${s.band} — ${ui("photo.title")} — ${P.name}`;
    const prev = series[(idx - 1 + series.length) % series.length], next = series[(idx + 1) % series.length];
    const photos = s.photos || [];
    const fig = (ph, k, o = {}) => `<figure data-src="${esc(ph.src || "")}" ${o.attrs || ""}>${o.before || ""}${media(ph.src, o.ratio || ph.ratio, `${s.band} ${pad(k + 1)}`, { parallax: o.parallax, crop: o.crop, tone: o.tone })}${ph.caption && !o.noCap ? `<figcaption>${esc(ph.caption)}</figcaption>` : ""}</figure>`;
    const layout = s.layout || "editorial";
    let body = "";
    if (layout === "poster") {
      const [first, ...rest] = photos;
      body = `
        <div class="poster-hero" data-src="${esc(first?.src || "")}">${media(first?.src, "16/9", s.band, { parallax: true, reveal: false, tone: s.accent })}<div class="over">${esc(s.band).split(" ").map((w) => `<span>${w}</span>`).join("")}</div></div>
        <div class="poster-flow">${rest.map((ph, k) => `<div ${stagger(0)}>${fig(ph, k + 1)}</div>`).join("")}</div>`;
    } else if (layout === "contact") {
      const picks = photos.map((ph, k) => ph.pick || (!photos.some((x) => x.pick) && k < 2));
      const hero = photos[picks.indexOf(true)] || photos[0];
      body = `
        ${hero ? `<div class="pick">${fig(hero, 0, { before: '<span class="tape" aria-hidden="true"></span><span class="tape" aria-hidden="true"></span>', crop: true })}</div>` : ""}
        <div class="film"><div class="frames">${photos.map((ph, k) => `<div class="frame${picks[k] ? " picked" : ""}" data-reveal ${stagger(k, 0.04)}>${fig(ph, k, { ratio: "3/2", noCap: true })}<div class="no"><b>${k + 1}A</b><span>▸ ${pad(k + 1)}</span></div></div>`).join("")}</div></div>`;
    } else if (layout === "zine") {
      body = `<div class="collage sheet-free"><span class="stamp" aria-hidden="true">${esc(t(s.kind) || s.band)}</span>${photos.map((ph, k) => fig(ph, k, { before: k % 2 === 0 ? '<span class="tape" aria-hidden="true"></span>' : "" })).join("")}</div>`;
    } else if (layout === "sequence") {
      body = `<div class="seq"><div class="counter" aria-hidden="true"><span class="cur">01</span><small>/ ${pad(photos.length)}</small></div>${photos.map((ph, k) => `<section class="slide" data-k="${k}">${fig(ph, k)}</section>`).join("")}</div>`;
    } else {
      body = `<div class="ed">${photos.map((ph, k) => fig(ph, k, { before: `<span class="big-n" aria-hidden="true">${pad(k + 1)}</span>`, parallax: k % 4 === 0 })).join("")}</div>`;
    }
    el.innerHTML = `
      <article class="wrap series-page lay-${esc(layout)}" id="top" style="--acc:${esc(s.accent || "var(--magenta)")}">
        <div class="sp-top label"><a href="fotografia.html">← ${ui("photo.title")}</a><span>${ui("photo.series")} ${pad(idx + 1)}/${pad(series.length)}</span></div>
        <header class="sp-head">
          <h1 class="sp-title riso" data-text="${esc(s.band)}">${esc(s.band)}</h1>
          <dl class="sp-meta label" data-reveal>
            ${t(s.kind) ? `<div><dt>${ui("photo.kind")}</dt><dd><span class="sp-mark"></span>${esc(t(s.kind))}</dd></div>` : ""}
            ${s.venue ? `<div><dt>${ui("photo.venue")}</dt><dd>${esc(s.venue)}</dd></div>` : ""}
            ${s.year ? `<div><dt>${ui("project.year")}</dt><dd>${esc(s.year)}</dd></div>` : ""}
            <div><dt>${ui("photo.photos")}</dt><dd>${pad(photos.length)}</dd></div>
          </dl>
          ${t(s.desc) ? `<p class="sp-desc" data-reveal>${esc(t(s.desc))}</p>` : ""}
        </header>
        <div class="sp-body">${body}</div>
        <nav class="sp-nav">
          <a href="foto.html?s=${esc(prev.slug)}"><span class="label muted">← ${ui("photo.prev")}</span><span class="t">${esc(prev.band)}</span></a>
          <a href="foto.html?s=${esc(next.slug)}"><span class="label muted">${ui("photo.next")} →</span><span class="t">${esc(next.band)}</span></a>
        </nav>
      </article>`;
    initLightbox(el);
    if (layout === "sequence") {
      const cur = el.querySelector(".counter .cur");
      const io2 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) cur.textContent = pad(+e.target.dataset.k + 1); }), { threshold: 0.55 });
      el.querySelectorAll(".slide").forEach((n) => io2.observe(n));
    }
  }

  /* ---------- ABOUT ---------- */
  function renderAbout() {
    const cvRows = (rows) => rows.map((x, i) => `<div class="cv-row" data-reveal ${stagger(i)}><span class="label muted">${esc(t(x.period))}</span><span>${esc(t(x.role))}</span><span>${esc(x.place)}</span></div>`).join("");
    document.querySelector("main").innerHTML = `
      <div class="wrap" id="top">
        <header class="page-head">
          <div class="sec-label label">${regmark}<span>${esc(t(P.role))}</span></div>
          <h1 class="page-title riso" data-text="${esc(ui("about.title"))}">${ui("about.title")}</h1>
        </header>
        <div class="about-grid">
          <div class="about-photo crop"><div data-reveal="print"><img src="${esc(P.photo)}" alt="${esc(P.name)}"></div></div>
          <div class="about-bio" data-reveal>${paras(t(AB.bio)).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
        </div>
        <div class="about-lists" data-reveal>
          ${(AB.lists || []).map((l) => `<div><h3 class="label">${esc(t(l.title))}</h3><ul>${lines(l.items).map((it) => `<li>${esc(it)}</li>`).join("")}</ul></div>`).join("")}
        </div>
        <div class="cv"><h2 data-reveal>${ui("about.exp")}</h2>${cvRows(AB.experience || [])}</div>
        ${(AB.education || []).length ? `<div class="cv"><h2 data-reveal>${ui("about.edu")}</h2>${cvRows(AB.education)}</div>` : ""}
        ${(AB.research || []).length ? `<div class="cv"><h2 data-reveal>${ui("about.research")}</h2>${AB.research.map((r, i) => `
          <article class="research" data-reveal ${stagger(i)}><span class="label pink">${esc(t(r.kind))}</span><div><h3>${r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener">${esc(t(r.title))} ↗</a>` : esc(t(r.title))}</h3><p>${esc(t(r.text))}</p></div></article>`).join("")}</div>` : ""}
        ${(AB.timeline || []).length ? `<div class="cv"><h2 data-reveal>${ui("about.timeline")}</h2><ol class="timeline">${AB.timeline.map((x, i) => `<li data-reveal ${stagger(i, 0.04)}><span class="label">${esc(x.period)}</span><span>${esc(t(x.text))}</span></li>`).join("")}</ol></div>` : ""}
      </div>`;
  }

  /* ---------- CONTACT ---------- */
  function renderContact() {
    const rows = [["Email", P.email, `mailto:${P.email}`], ["LinkedIn", P.linkedinLabel, P.linkedin], ["WhatsApp", P.whatsappLabel, P.whatsapp], P.instagram ? ["Instagram", P.instagram.replace(/^https?:\/\/(www\.)?/, ""), P.instagram] : null].filter(Boolean);
    document.querySelector("main").innerHTML = `
      <div class="wrap" id="top">
        <header class="page-head">
          <div class="sec-label label">${regmark}<span>${esc(t(P.location))}</span></div>
          <h1 class="page-title riso" data-text="${esc(ui("contact.title"))}">${ui("contact.title")}</h1>
          <p class="page-lead">${ui("contact.lead")}</p>
          <a class="contact-big" href="mailto:${esc(P.email)}">${esc(P.email)}</a>
          <div class="contact-status label">${esc(t(P.available))}</div>
        </header>
        <ul class="contact-list">
          ${rows.map(([k, v, h], i) => `<li data-reveal ${stagger(i)}><a href="${esc(h)}"${h.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}><span class="k label muted">${k}</span><span class="v">${esc(v)}</span><span class="arr">↗</span></a></li>`).join("")}
        </ul>
      </div>`;
  }

  /* ---------- effects: scroll entrances + parallax ---------- */
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let parallaxEls = [], io;
  function initEffects() {
    parallaxEls = [...document.querySelectorAll("[data-parallax]")];
    io?.disconnect();
    io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll("[data-reveal]").forEach((n) => (reduce ? n.classList.add("in") : io.observe(n)));
    tick();
  }
  let ticking = false;
  function tick() {
    ticking = false;
    const vh = innerHeight;
    if (!reduce) parallaxEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const prog = (r.top + r.height / 2 - vh / 2) / vh;
      el.firstElementChild.style.transform = `translate3d(0, ${(-prog * (parseFloat(el.dataset.parallax) || 0.1) * r.height).toFixed(1)}px, 0)`;
    });
    document.querySelector(".site-header")?.classList.toggle("is-scrolled", scrollY > 24);
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }, { passive: true });
  addEventListener("resize", () => requestAnimationFrame(tick));

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
    setTimeout(() => { location.href = url.href; }, 280);
  });
  addEventListener("pageshow", () => document.body.classList.remove("is-leaving"));

  /* ---------- boot ---------- */
  function renderAll() {
    renderChrome();
    ({ home: renderHome, project: renderProject, photo: renderPhoto, series: renderSeries, about: renderAbout, contact: renderContact })[page]?.();
    initEffects();
  }
  renderAll();
  requestAnimationFrame(() => document.body.classList.remove("is-entering"));
  if (location.hash) setTimeout(() => document.querySelector(location.hash)?.scrollIntoView(), 80);
})();
