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
  const folio = { home: 1, project: 2, photo: 3, about: 4, contact: 5 }[page] || 1;

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
  const nav = [["index.html#projetos", "nav.work", "home"], ["fotografia.html", "nav.photo", "photo"], ["sobre.html", "nav.about", "about"], ["contato.html", "nav.contact", "contact"]];
  function renderChrome() {
    const navLinks = nav.map(([h, k, p]) => `<a href="${h}"${p === page && p !== "home" ? ' aria-current="page"' : ""}>${ui(k)}</a>`).join("");
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
    document.querySelector(".site-footer").innerHTML = `
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

      <section class="section" id="fotografia" style="padding-top:0">
        <div class="wrap">
          <div class="sec-head" data-reveal>
            <div><div class="sec-label label"><span class="pink">${ui("sideB")}</span>${regmark}</div><h2 class="sec-title">${ui("photo.title")}</h2></div>
            <a class="link-arrow" href="fotografia.html">${ui("photo.see")} ${arr}</a>
          </div>
          <div class="sideb-grid">
            <p class="sideb-lead" data-reveal>${esc(t(PH.intro))}</p>
            <ul class="setlist">
              ${series.map((s, i) => `<li data-reveal ${stagger(i)}><a href="fotografia.html#${esc(s.slug)}"><span class="n label">${pad(i + 1)}</span><span class="t">${esc(s.band)}</span><span class="c label">${pad(s.photos.length)} ${ui("photo.photos")}</span></a></li>`).join("")}
            </ul>
          </div>
          <div class="sideb-strip">
            ${stripSeries.map((s, k) => { const ph = s.photos.find((x) => x.src) || s.photos[0] || {}; return `<div ${stagger(k, 0.12)}>${media(ph.src, k === 1 ? "3/4" : k === 0 ? "4/3" : "4/5", s.band, { parallax: k !== 1, crop: k === 0 })}</div>`; }).join("")}
          </div>
        </div>
      </section>

      <section class="section" style="padding-top:0">
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
  function renderPhoto() {
    const el = document.querySelector("main");
    el.innerHTML = `
      <div class="wrap" id="top">
        <header class="page-head">
          <div class="sec-label label"><span class="pink">${ui("sideB")}</span>${regmark}</div>
          <h1 class="page-title riso" data-text="${esc(ui("photo.title"))}">${ui("photo.title")}</h1>
          <p class="page-lead">${esc(t(PH.intro))}</p>
          ${t(PH.process) || PH.gear ? `<dl class="photo-specs" data-reveal>${t(PH.process) ? `<div><dt class="label">${ui("photo.process")}</dt><dd>${esc(t(PH.process))}</dd></div>` : ""}${PH.gear ? `<div><dt class="label">${ui("photo.gear")}</dt><dd>${esc(PH.gear)}</dd></div>` : ""}</dl>` : ""}
          <ol class="band-index">
            ${series.map((s, i) => `<li data-reveal ${stagger(i)}><a href="#${esc(s.slug)}"><span class="n label muted">${pad(i + 1)}</span><span class="t">${esc(s.band)}</span><span class="kind label muted">${esc(t(s.kind))}</span><span class="label muted">${pad(s.photos.length)} ${ui("photo.photos")}</span></a></li>`).join("")}
          </ol>
        </header>
        ${series.map((s, i) => `
          <section class="series" id="${esc(s.slug)}">
            <div class="series-head" data-reveal>
              <span class="label muted">${pad(i + 1)}</span>
              <h2>${esc(s.band)}</h2>
              <div class="series-meta label">${[t(s.kind), s.venue, s.year].filter(Boolean).map(esc).join(" · ")}</div>
            </div>
            ${t(s.desc) ? `<p class="series-desc" data-reveal>${esc(t(s.desc))}</p>` : ""}
            <div class="photo-flow">
              ${s.photos.map((ph, k) => `<figure data-src="${esc(ph.src || "")}">${media(ph.src, ph.ratio, s.band, { parallax: k % 4 === 0, crop: k === 0 })}${ph.caption ? `<figcaption>${esc(ph.caption)}</figcaption>` : ""}</figure>`).join("")}
            </div>
          </section>`).join("")}
      </div>
      <div class="lightbox" role="dialog" aria-modal="true"><img alt=""></div>`;
    const lb = el.querySelector(".lightbox");
    el.querySelectorAll(".photo-flow figure").forEach((f) => f.addEventListener("click", () => {
      if (!f.dataset.src) return;
      lb.querySelector("img").src = f.dataset.src; lb.classList.add("open");
    }));
    lb.addEventListener("click", () => lb.classList.remove("open"));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") lb.classList.remove("open"); });
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
    if (url.pathname === location.pathname && url.search === location.search) return;
    e.preventDefault();
    document.body.classList.add("is-leaving");
    setTimeout(() => { location.href = url.href; }, 280);
  });
  addEventListener("pageshow", () => document.body.classList.remove("is-leaving"));

  /* ---------- boot ---------- */
  function renderAll() {
    renderChrome();
    ({ home: renderHome, project: renderProject, photo: renderPhoto, about: renderAbout, contact: renderContact })[page]?.();
    initEffects();
  }
  renderAll();
  requestAnimationFrame(() => document.body.classList.remove("is-entering"));
  if (location.hash) setTimeout(() => document.querySelector(location.hash)?.scrollIntoView(), 80);
})();
