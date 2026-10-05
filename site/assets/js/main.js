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

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const sysDark = matchMedia("(prefers-color-scheme: dark)");
  const applyTheme = (th) => root.setAttribute("data-theme", th);
  applyTheme(store.get("ml-theme") || (sysDark.matches ? "dark" : "light"));
  sysDark.addEventListener?.("change", (e) => { if (!store.get("ml-theme")) applyTheme(e.matches ? "dark" : "light"); });

  const page = document.body.dataset.page;
  const folio = { home: 1, work: 2, project: 2, photo: 3, series: 3, about: 4, contact: 5 }[page] || 1;

  /* ---------- snippets ---------- */
  const arr = '<span class="arr" aria-hidden="true">→</span>';
  const regmark = '<svg class="regmark" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="5.5" fill="none" stroke="currentColor"/><path d="M10 0v20M0 10h20" stroke="currentColor"/></svg>';

  // An image (or placeholder) with optional crop marks, parallax and print-wipe entrance.
  const media = (src, ratio, label, o = {}) => {
    const r = ratio || "4/3";
    const inner = src
      ? `<img src="${esc(src)}" alt="${esc(o.alt || label || "")}" loading="lazy">`
      : `<div class="ph${o.tone ? " tone" : ""}"${o.tone ? ` style="--tone:${esc(o.tone)}"` : ""}><span>${esc(label || ui("placeholder"))} · ${esc(r.replace("/", ":"))}</span></div>`;
    const bare = src && /\.(webp|png|svg)(\?|$)/i.test(src);
    const m = `<div class="media${o.round ? " round" : ""}${o.frame ? " frame" : ""}${bare ? " bare" : ""}"${o.parallax ? ' data-parallax="0.1"' : ""}${o.reveal === false ? "" : ' data-reveal="print"'} style="aspect-ratio:${r}">${inner}</div>`;
    return o.crop ? `<div class="crop">${m}</div>` : m;
  };
  const stagger = (i, step = 0.06) => `style="--d:${(i * step).toFixed(2)}s"`;
  const CATS = ["campanhas", "produto", "interna", "clientes", "academico", "outros"];
  const grouped = () => CATS.map((c) => ({ c, items: projects.map((p, i) => ({ p, i })).filter(({ p }) => (p.category || "outros") === c) })).filter((g) => g.items.length);

  /* ---------- header / footer ---------- */
  const nav = [["projetos.html", "nav.work", "work"], ["fotografia.html", "nav.photo", "photo"], ["sobre.html", "nav.about", "about"], ["contato.html", "nav.contact", "contact"]];
  function renderChrome() {
    const navLinks = nav.map(([h, k, p]) => `<a href="${h}"${(p === page || (p === "photo" && page === "series") || (p === "work" && page === "project")) ? ' aria-current="page"' : ""}>${ui(k)}</a>`).join("");
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
            <a class="link-arrow" href="projetos.html">${ui("work.see")} ${arr}</a>
          </div>
          <div class="track-head label"><span>Nº</span><span>${ui("work.col.title")}</span><span>${ui("work.col.tags")}</span><span style="text-align:right">${ui("work.col.year")}</span><span></span></div>
          <ol class="tracklist">
            ${grouped().map((g) => `<li class="track-group label" data-reveal>${ui("cat." + g.c)}</li>` + g.items.map(({ p, i }) => `
              <li class="track" data-reveal ${stagger(i % 6)}><a href="projeto.html?p=${esc(p.slug)}" data-cover="${esc(p.thumb || p.cover || "")}" data-tone="${esc(p.tone || "")}" data-title="${esc(p.title)}">
                <span class="track-no">${pad(i + 1)}</span>
                <span class="track-title">${esc(p.title)}</span>
                <span class="track-tags">${esc(t(p.tags))}</span>
                <span class="track-year">${esc(p.year || "—")}</span>
                <span class="track-arr" aria-hidden="true">→</span>
                <span class="track-thumb">${media(p.thumb || p.cover, "16/10", p.title, { tone: p.tone, reveal: false })}</span>
              </a></li>`).join("")).join("")}
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
            <div class="sideb-left">
              <p class="sideb-lead" data-reveal>${esc(t(PH.intro))}</p>
              ${series.length ? `<a class="sideb-preview" href="foto.html?s=${esc(series[0].slug)}" data-reveal>
                <div class="crop"><span class="tape" aria-hidden="true"></span>${media(series[0].thumb || coverOf(series[0]), THUMB, series[0].band, { tone: series[0].accent, reveal: false })}</div>
                <div class="cap label"><span class="n">01</span><span class="t">${esc(series[0].band)}</span><span class="m">${seriesMeta(series[0])}</span></div>
              </a>` : ""}
            </div>
            <ul class="setlist">
              ${series.map((s, i) => `<li data-reveal ${stagger(i)}><a href="foto.html?s=${esc(s.slug)}" data-i="${i}"><span class="n label">${pad(i + 1)}</span><span class="t">${esc(s.band)}</span><span class="c label">${pad(s.photos.length)} ${ui("photo.photos")}</span></a></li>`).join("")}
            </ul>
          </div>
          <div class="sideb-strip">
            ${stripSeries.map((s, k) => `<a href="foto.html?s=${esc(s.slug)}" ${stagger(k, 0.12)} aria-label="${esc(s.band)}">${media(coverOf(s), k === 1 ? "3/4" : k === 0 ? "4/3" : "4/5", s.band, { parallax: k !== 1, crop: k === 0, tone: s.accent })}</a>`).join("")}
          </div>
        </div>
      </section>

      ${offClockTeaser(AB.offclock)}

      <section class="section">
        <div class="wrap about-teaser" data-reveal>
          <p>${ui("about.teaser").replace("{company}", esc(P.company))}</p>
          <a class="link-arrow" href="sobre.html">${ui("about.more")} ${arr}</a>
        </div>
      </section>`;
    homeRendered = true;
    initSeriesPreview();
    initPlayers(AB.offclock && AB.offclock.playlist);
    if (window.Badge) window.Badge.mount(document.getElementById("badge-stage"), { P, t, ui });
    initCursorPreview();
  }

  // Lado B: hovering a band in the setlist swaps the preview on the left
  function initSeriesPreview() {
    const box = document.querySelector(".sideb-preview");
    if (!box) return;
    const img = () => box.querySelector(".media img, .media .ph");
    const show = (i) => {
      const s = series[i]; if (!s) return;
      box.href = `foto.html?s=${s.slug}`;
      box.querySelector(".n").textContent = pad(i + 1);
      box.querySelector(".t").textContent = s.band;
      box.querySelector(".m").innerHTML = seriesMeta(s);
      const src = s.thumb || coverOf(s), cur = img();
      if (src && cur && cur.tagName === "IMG" && !cur.src.endsWith(src)) {
        cur.style.opacity = 0;
        const pre = new Image(); pre.onload = () => { cur.src = src; cur.alt = s.band; cur.style.opacity = 1; }; pre.src = src;
      }
      document.querySelectorAll(".setlist a").forEach((a) => a.classList.toggle("on", +a.dataset.i === i));
    };
    document.querySelectorAll(".setlist a").forEach((a) => {
      a.addEventListener("mouseenter", () => show(+a.dataset.i));
      a.addEventListener("focus", () => show(+a.dataset.i));
    });
    show(0);
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

  /* ---------- WORK INDEX ---------- */
  function renderWork() {
    document.querySelector("main").innerHTML = `
      <div class="wrap" id="top">
        <header class="page-head">
          <div class="sec-label label"><span class="pink">${ui("sideA")}</span>${regmark}</div>
          <h1 class="page-title riso" data-text="${esc(ui("work.title"))}">${ui("work.title")}</h1>
          <p class="page-lead">${ui("work.lead")}</p>
        </header>
        ${grouped().map((g) => `
        <div class="cat-head" data-reveal><div><span class="label">${pad(CATS.indexOf(g.c) + 1)}</span><h2>${ui("cat." + g.c)}</h2></div><p>${ui("cat." + g.c + ".d")}</p></div>
        <ol class="series-index">
          ${g.items.map(({ p, i }) => `
            <li class="series-row" style="--acc:${esc(p.tone || "var(--magenta)")}">
              <a href="projeto.html?p=${esc(p.slug)}">
                <div class="cover crop"><span class="tape" aria-hidden="true"></span>${media(p.thumb || p.cover, THUMB, p.title, { tone: p.tone })}</div>
                <div class="info" data-reveal>
                  <span class="n label">${pad(i + 1)} / ${pad(projects.length)}</span>
                  <h2>${esc(p.title)}</h2>
                  <div class="meta label">${esc(t(p.client))} · ${esc(p.year || "—")}</div>
                  ${t(p.summary) ? `<p class="sub">${esc(t(p.summary))}</p>` : ""}
                  <span class="go">${ui("work.open")} ${arr}</span>
                </div>
              </a>
            </li>`).join("")}
        </ol>`).join("")}
      </div>`;
  }

  /* ---------- PROJECT ---------- */
  function contrast(hex) {
    const h = String(hex).replace("#", ""); const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16) || 0;
    return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255 > 0.55 ? "#18171A" : "#F5F3EE";
  }
  // image blocks snap to the 12-col grid: full · wide (2–11) · center (3–10) · content (6–12)
  const spanOf = (b) => b.span || (!b.width ? "full" : b.width >= 85 ? "wide" : b.width >= 60 ? "center" : "content");
  const onGrid = (b, html) => `<div class="b-grid span-${spanOf(b)}">${html}</div>`;
  function renderBlock(b) {
    const imgs = (b.imgs || []);
    switch (b.type) {
      case "lead": return `<section class="b-lead" data-reveal><p>${esc(t(b.text))}</p></section>`;
      case "text": return `<section class="b-text" data-reveal><h3>${esc(t(b.title))}</h3><p>${esc(t(b.text))}</p></section>`;
      case "full": return `<figure class="b-full">${media(b.img, b.ratio || "16/9", null, { parallax: b.parallax })}${t(b.caption) ? `<figcaption class="label">${esc(t(b.caption))}</figcaption>` : ""}</figure>`;
      case "split": return `<section class="b-split ${b.side === "right" ? "right" : ""}"><div class="media-wrap">${media(b.img, b.ratio, null, { crop: true })}</div><div class="copy" data-reveal><h3>${esc(t(b.title))}</h3><p>${esc(t(b.text))}</p></div></section>`;
      case "pair": return `<figure class="b-pair" style="margin:0"><div class="grid">${imgs.map((m, i) => `<div ${stagger(i, 0.12)}>${media(m.img, m.ratio)}</div>`).join("")}</div>${t(b.caption) ? `<figcaption class="label">${esc(t(b.caption))}</figcaption>` : ""}</figure>`;
      case "rows": {
        const num = (r) => { const [w, h] = String(r || "1/1").split("/").map(Number); return (w / (h || 1)) || 1; };
        const fig = `<figure class="b-rows" style="margin:0">${(b.rows || []).map((row) => `${t(row.label) ? `<div class="row-label label">${esc(t(row.label))}</div>` : ""}<div class="row${(row.imgs || []).length > 2 ? " many" : ""}">${(row.imgs || []).map((m, i) => `<div style="flex:${num(m.ratio).toFixed(4)} 1 0" ${stagger(i, 0.1)}>${media(m.img, m.ratio, null, { round: m.round, frame: m.frame })}</div>`).join("")}</div>`).join("")}${t(b.caption) ? `<figcaption class="label">${esc(t(b.caption))}</figcaption>` : ""}</figure>`;
        if (t(b.sideTitle) || t(b.sideText)) return `<section class="b-side"><div class="copy" data-reveal>${t(b.sideTitle) ? `<h3>${esc(t(b.sideTitle))}</h3>` : ""}${t(b.sideText) ? `<p>${esc(t(b.sideText))}</p>` : ""}</div>${fig}</section>`;
        return onGrid(b, fig);
      }
      case "columns":
        return onGrid(b, `<figure class="b-cols" style="margin:0"><div class="cols">${(b.cols || []).map((c, k) => `<div class="col" style="flex:${Number(c.width) || 1} 1 0">${(c.imgs || []).map((m, i) => `<div ${stagger(k + i, 0.08)}>${media(m.img, m.ratio, null, { round: m.round, frame: m.frame })}</div>`).join("")}</div>`).join("")}</div>${t(b.caption) ? `<figcaption class="label">${esc(t(b.caption))}</figcaption>` : ""}</figure>`);
      case "ads": {
        const items = b.items || [];
        const W = (a) => Number(a.w) || 300, H = (a) => Number(a.h) || 250;
        const big = items.filter((a) => W(a) >= 600 && H(a) >= 150), lead = items.filter((a) => W(a) >= 600 && H(a) < 150);
        const rect = items.filter((a) => W(a) < 600 && H(a) >= 150), mob = items.filter((a) => W(a) < 600 && H(a) < 150);
        const ad = (a) => {
          const fr = (a.frames && a.frames.length ? a.frames : [a.img]).filter(Boolean);
          return `<div class="ad" style="flex:${(W(a) / H(a)).toFixed(4)} 1 0;aspect-ratio:${W(a)}/${H(a)}">${fr.map((src, k) => `<img class="f${k + 1}" src="${esc(src)}" alt="${k ? "" : esc(`${W(a)}×${H(a)}`)}" loading="lazy">`).join("")}</div>`;
        };
        const row = (arr) => arr.length ? `<div class="ads-row">${arr.map(ad).join("")}</div>` : "";
        return `<figure class="b-ads" data-reveal><div class="board crop">${row([...big, ...rect])}${row([...lead, ...mob])}</div>${t(b.caption) ? `<figcaption class="label">${esc(t(b.caption))}</figcaption>` : ""}</figure>`;
      }
      case "trio": return `<section class="b-trio">${imgs.map((m, i) => `<div ${stagger(i, 0.12)}>${media(m.img, m.ratio)}</div>`).join("")}</section>`;
      case "palette": return `<section class="b-palette" data-reveal><div class="blk-label label">${ui("project.palette")}</div><div class="row">${(b.colors || []).map((c) => `<div class="sw label" style="background:${esc(c.hex)};color:${contrast(c.hex)}"><span>${esc(c.name)}</span><span>${esc(c.hex)}</span></div>`).join("")}</div></section>`;
      case "type": return `<section class="b-type" data-reveal><div class="blk-label label">${ui("project.type")}</div><div class="spec"><div><div style="font-family:'${esc(b.family)}';font-size:28px;font-weight:600">${esc(b.family)}</div><div class="label muted" style="margin-top:6px">${esc(b.weights || "")}</div></div><div class="big" style="font-family:'${esc(b.family)}'">${esc(b.sample || "Aa")}</div></div></section>`;
      case "typeset": {
        (b.css || []).forEach((href) => { if (!document.querySelector(`link[href="${href}"]`)) { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); } });
        return `<section class="b-typeset"><div class="blk-label label">${ui("project.type")}</div>${(b.fonts || []).map((f) => `
          <div class="ts-row" data-reveal>
            <div class="ts-name" style="font-family:${esc(f.family)};font-weight:${esc(f.weight || 400)}">${esc(f.name)}</div>
            <div class="ts-meta label">${esc(t(f.role))}</div>
            <p class="ts-sample" style="font-family:${esc(f.family)};font-weight:${esc(f.weight || 400)}">${esc(f.sample)}</p>
          </div>`).join("")}</section>`;
      }
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
        <div class="proj-top label"><a href="projetos.html">← ${ui("project.back")}</a><span>${ui("project.track")} ${pad(idx + 1)}/${pad(projects.length)}</span></div>
        <h1 class="proj-title riso" data-text="${esc(p.title)}">${esc(p.title)}</h1>
        <dl class="proj-meta" data-reveal>
          <div><dt class="label">${ui("project.client")}</dt><dd>${esc(t(p.client))}</dd></div>
          <div><dt class="label">${ui("project.year")}</dt><dd>${esc(p.year || "—")}</dd></div>
          <div><dt class="label">${ui("project.role")}</dt><dd>${esc(t(p.role))}</dd></div>
          <div><dt class="label">${ui("project.tags")}</dt><dd>${esc(t(p.tags))}</dd></div>
        </dl>
        <div class="proj-cover">${media(p.cover, p.coverRatio || "16/9", "Capa / Cover", { tone: p.tone, crop: true })}</div>
        <div class="proj-body">${(p.blocks || []).map(renderBlock).join("")}</div>
        <nav class="next-proj" data-reveal><a href="projeto.html?p=${esc(next.slug)}"><div><div class="label muted" style="margin-bottom:14px">${ui("project.next")} — ${pad(((idx + 1) % projects.length) + 1)}</div><div class="t">${esc(next.title)}</div></div><span class="arr">→</span></a></nav>
      </article>`;
    initLightbox(el, ".proj-cover .media img, .proj-body .media img");
  }

  /* ---------- PHOTOGRAPHY ---------- */
  const coverOf = (s) => s.cover || (s.photos.find((x) => x.src) || {}).src || "";
  const THUMB = "16/10";
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
                <div class="cover crop"><span class="tape" aria-hidden="true"></span>${media(s.thumb || coverOf(s), THUMB, s.band, { tone: s.accent })}</div>
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

  // Lightbox shared by series and project pages: arrows, keyboard, counter.
  function initLightbox(root, selector) {
    const figs = selector
      ? [...root.querySelectorAll(selector)].filter((img) => img.getAttribute("src")).map((img) => { const f = img.closest(".media"); f.dataset.src = img.getAttribute("src"); f.classList.add("zoomable"); return f; })
      : [...root.querySelectorAll("figure[data-src]")].filter((f) => f.dataset.src);
    if (!figs.length) return;
    document.querySelectorAll(".lightbox").forEach((n) => n.remove());
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
    const layout = s.layout === "sequence" ? "mosaic" : (s.layout || "editorial");
    let body = "";
    if (layout === "poster") {
      const [first, ...rest] = photos;
      body = `
        <div class="poster-hero">${first ? fig(first, 0, { ratio: "16/9", parallax: true, tone: s.accent, noCap: true }) : ""}</div>
        <div class="poster-flow">${rest.map((ph, k) => `<div ${stagger(k % 3, 0.1)}>${fig(ph, k + 1)}</div>`).join("")}</div>`;
    } else if (layout === "contact") {
      const picks = photos.map((ph, k) => ph.pick || (!photos.some((x) => x.pick) && k < 2));
      const hero = photos[picks.indexOf(true)] || photos[0];
      body = `
        ${hero ? `<div class="pick">${fig(hero, 0, { before: '<span class="tape" aria-hidden="true"></span><span class="tape" aria-hidden="true"></span>', crop: true })}</div>` : ""}
        <div class="film"><div class="frames">${photos.map((ph, k) => `<div class="frame${picks[k] ? " picked" : ""}" data-reveal ${stagger(k, 0.04)}>${fig(ph, k, { ratio: "3/2", noCap: true })}<div class="no"><b>${k + 1}A</b><span>▸ ${pad(k + 1)}</span></div></div>`).join("")}</div></div>`;
    } else if (layout === "zine") {
      body = `<div class="collage sheet-free"><span class="stamp" aria-hidden="true">${esc(t(s.kind) || s.band)}</span>${photos.map((ph, k) => fig(ph, k, { before: k % 2 === 0 ? '<span class="tape" aria-hidden="true"></span>' : "" })).join("")}</div>`;
    } else if (layout === "mosaic") {
      const shape = (r) => { const [w, h] = String(r || "3/2").split("/").map(Number); const q = w / (h || 1); return q > 1.2 ? "land" : q < 0.85 ? "port" : "sq"; };
      const r = (q) => { const [w, h] = String(q || "3/2").split("/").map(Number); return (w / (h || 1)) || 1.5; };
      body = `<div class="mosaic justified">${photos.map((ph, k) => fig(ph, k, { attrs: `style="--r:${r(ph.ratio).toFixed(4)}" data-reveal`, before: `<span class="n" aria-hidden="true">${pad(k + 1)}</span>` })).join("")}<i class="mosaic-end" aria-hidden="true"></i></div>`;
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
  }

  /* ---------- ABOUT: off the clock (games & music) ---------- */
  const INKS = [["#FF48B0", "#18171A"], ["#0078BF", "#F5F3EE"], ["#FFE800", "#18171A"], ["#00A95C", "#F5F3EE"], ["#FF665E", "#18171A"], ["#765BA7", "#F5F3EE"], ["#FF6C2F", "#18171A"], ["#18171A", "#FF48B0"]];
  const inkOf = (str) => { let h = 0; for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return INKS[h % INKS.length]; };
  const asItem = (x) => (typeof x === "string" ? { title: x } : x || {});
  // official cover art when available; a printed typographic cover as fallback
  const boxArt = (item, cls = "") => {
    const it = asItem(item);
    if (it.cover) return `<div class="boxart has-cover ${cls}"><img src="${esc(it.cover)}" alt="${esc(it.title)}" loading="lazy"></div>`;
    const [bg, fg] = inkOf(it.title);
    return `<div class="boxart ${cls}" style="--bg:${bg};--fg:${fg}"><span class="ba-title">${esc(it.title)}</span><span class="ba-mark">M/L</span></div>`;
  };
  const sleeve = (a) => { const [bg, fg] = inkOf(a.title); return `<div class="sleeve${a.cover ? " has-cover" : ""}" style="--bg:${bg};--fg:${fg}"><span class="vinyl" aria-hidden="true"></span>${a.cover ? `<img src="${esc(a.cover)}" alt="${esc(a.title)}" loading="lazy">` : `<span class="sl-title">${esc(a.title)}</span>`}</div>`; };
  const gamesOf = (O) => (Array.isArray(O.games) ? O.games : lines(O.games)).map(asItem);

  // mini player: one audio element for the page; the cassette reels loop and speed up while playing
  const cassetteSVG = (title) => `
    <svg class="k7" viewBox="0 0 320 200" role="img" aria-label="Fita cassete">
      <rect x="4" y="4" width="312" height="192" rx="14" class="k7-shell"/>
      <rect x="12" y="12" width="296" height="176" rx="9" class="k7-face"/>
      ${[[22, 22], [298, 22], [22, 178], [298, 178], [160, 178]].map(([x, y]) => `<g class="k7-screw" transform="translate(${x} ${y})"><circle r="5"/><path d="M-3 0h6M0-3v6"/></g>`).join("")}
      <rect x="30" y="24" width="260" height="104" rx="6" class="k7-label"/>
      <rect x="30" y="24" width="260" height="20" rx="6" class="k7-label-band"/>
      <text x="44" y="39" class="k7-side">A</text>
      <text x="160" y="62" text-anchor="middle" class="k7-title">${esc(title)}</text>
      ${[74, 86].map((y) => `<line x1="46" x2="274" y1="${y}" y2="${y}" class="k7-rule"/>`).join("")}
      <rect x="86" y="92" width="148" height="32" rx="16" class="k7-window"/>
      <path class="k7-tape" d="M108 124 Q160 130 212 124"/>
      <g class="k7-reel k7-reel-l" transform="translate(110 108)"><circle r="13" class="k7-spool"/><circle r="7" class="k7-hub"/>${[0, 60, 120, 180, 240, 300].map((a) => `<rect x="-1.5" y="-7" width="3" height="4" transform="rotate(${a})" class="k7-tooth"/>`).join("")}</g>
      <g class="k7-reel k7-reel-r" transform="translate(210 108)"><circle r="9" class="k7-spool"/><circle r="7" class="k7-hub"/>${[0, 60, 120, 180, 240, 300].map((a) => `<rect x="-1.5" y="-7" width="3" height="4" transform="rotate(${a})" class="k7-tooth"/>`).join("")}</g>
      <path d="M70 196 L88 150 H232 L250 196 Z" class="k7-bevel"/>
      ${[104, 132, 188, 216].map((x) => `<circle cx="${x}" cy="176" r="5" class="k7-hole"/>`).join("")}
      <rect x="146" y="168" width="28" height="14" rx="2" class="k7-hole"/>
    </svg>`;
  const playerHTML = (PL) => {
    const tr = (PL && PL.tracks) || [];
    if (!tr.length) return "";
    return `<div class="player" data-player>
      <div class="pl-top">
        <div class="pl-deck">${cassetteSVG(tr[0].title)}</div>
        <ol class="pl-list">${tr.map((x, i) => `<li><button type="button" data-i="${i}"><img src="${esc(x.cover || "")}" alt=""><span class="t">${esc(x.title)}<small class="muted">${esc(x.artist)}</small></span><span class="eq" aria-hidden="true"><i></i><i></i><i></i></span></button></li>`).join("")}</ol>
      </div>
      <div class="pl-now"><div><b class="pl-title">${esc(tr[0].title)}</b><span class="pl-artist muted">${esc(tr[0].artist)}</span></div><a class="pl-link label" href="${esc(tr[0].link || "#")}" target="_blank" rel="noopener">${ui("pl.full")} ↗</a></div>
      <div class="pl-bar" role="progressbar" aria-valuemin="0" aria-valuemax="30"><span></span></div>
      <div class="pl-ctrl">
        <button type="button" class="pl-prev" aria-label="${ui("pl.prev")}">⏮</button>
        <button type="button" class="pl-play" aria-label="${ui("pl.play")}"><span class="i-play">▶</span><span class="i-pause">❚❚</span></button>
        <button type="button" class="pl-next" aria-label="${ui("pl.next")}">⏭</button>
        <label class="pl-vol"><span class="label">${ui("pl.vol")}</span><input type="range" min="0" max="100" step="1" value="10" aria-label="${ui("pl.vol")}"><output class="label">10%</output></label>
      </div>
      <p class="pl-note label muted">${ui("pl.note")}</p>
      ${PL.spotify ? `<iframe class="pl-spotify" src="${esc(PL.spotify.replace("open.spotify.com/", "open.spotify.com/embed/"))}" loading="lazy" allow="encrypted-media" title="Spotify"></iframe>` : ""}
    </div>`;
  };
  let audio;
  function initPlayers(PL) {
    const tr = (PL && PL.tracks) || [];
    if (!tr.length) return;
    // never autoplays: sound only starts on the visitor's click, always at 10% volume
    audio = audio || new Audio(); audio.preload = "none"; audio.autoplay = false; audio.volume = 0.1;
    let i = 0;
    const els = [...document.querySelectorAll("[data-player]")];
    const paint = () => els.forEach((el) => {
      const x = tr[i]; el.classList.toggle("is-playing", !audio.paused);
      el.querySelector(".pl-title").textContent = x.title; el.querySelector(".pl-artist").textContent = x.artist;
      el.querySelector(".k7-title").textContent = x.title; el.querySelector(".pl-link").href = x.link || "#";
      el.querySelectorAll(".pl-list button").forEach((b) => b.classList.toggle("on", +b.dataset.i === i));
      // keep the current track visible inside the scrolling list (without moving the page)
      const list = el.querySelector(".pl-list"), on = list.querySelector("button.on");
      if (on) { const li = on.parentElement, top = li.offsetTop - list.offsetTop; if (top < list.scrollTop || top + li.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTo({ top: top - list.clientHeight / 2 + li.offsetHeight / 2, behavior: "smooth" }); }
    });
    const load = (k, play) => { i = (k + tr.length) % tr.length; audio.src = tr[i].preview; if (play) audio.play().catch(() => {}); paint(); };
    els.forEach((el) => {
      el.querySelector(".pl-play").onclick = () => { if (!audio.src) load(i, true); else if (audio.paused) audio.play().catch(() => {}); else audio.pause(); };
      el.querySelector(".pl-prev").onclick = () => load(i - 1, true);
      el.querySelector(".pl-next").onclick = () => load(i + 1, true);
      el.querySelectorAll(".pl-list button").forEach((b) => (b.onclick = () => (+b.dataset.i === i && audio.src ? (audio.paused ? audio.play().catch(() => {}) : audio.pause()) : load(+b.dataset.i, true))));
      const vol = el.querySelector(".pl-vol input");
      const setVol = (v) => els.forEach((x) => { const r = x.querySelector(".pl-vol input"); r.value = v; r.style.setProperty("--v", `${v}%`); x.querySelector(".pl-vol output").textContent = `${v}%`; });
      vol.oninput = () => { audio.volume = vol.value / 100; setVol(vol.value); };
      setVol(Math.round(audio.volume * 100));
    });
    audio.onplay = audio.onpause = paint;
    audio.onended = () => load(i + 1, true);
    audio.ontimeupdate = () => els.forEach((el) => { const d = audio.duration || 30; el.querySelector(".pl-bar span").style.width = `${(100 * audio.currentTime) / d}%`; });
    paint();
  }
  // albums as a horizontal carousel: cover on top, title / artist / year below
  const albumsHTML = (albums) => `<div class="al-carousel" data-carousel>
      <div class="al-track">${albums.map((a) => `<figure class="al-item">${a.link ? `<a href="${esc(a.link)}" target="_blank" rel="noopener">` : ""}${sleeve(a)}<figcaption><b>${esc(a.title)}</b><span class="muted">${esc(a.artist)}${a.year ? ` · ${esc(a.year)}` : ""}</span></figcaption>${a.link ? "</a>" : ""}</figure>`).join("")}</div>
      <div class="al-nav"><button type="button" class="al-prev" aria-label="${ui("pl.prev")}">←</button><button type="button" class="al-next" aria-label="${ui("pl.next")}">→</button></div>
    </div>`;
  function initCarousels() {
    document.querySelectorAll("[data-carousel]").forEach((c) => {
      const track = c.querySelector(".al-track"), step = () => (track.querySelector(".al-item")?.getBoundingClientRect().width || 240) + 20;
      const sync = () => { c.querySelector(".al-prev").disabled = track.scrollLeft < 4; c.querySelector(".al-next").disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4; };
      c.querySelector(".al-prev").onclick = () => track.scrollBy({ left: -step(), behavior: "smooth" });
      c.querySelector(".al-next").onclick = () => track.scrollBy({ left: step(), behavior: "smooth" });
      track.addEventListener("scroll", sync, { passive: true }); addEventListener("resize", sync); sync();
    });
  }
  const pinsHTML = (artists) => {
    const list = (Array.isArray(artists) ? artists : lines(artists).map((n) => ({ name: n })));
    return `<ul class="pins">${list.map((a) => { const [bg, fg] = inkOf(a.name); return `<li class="pin${a.photo ? " has-photo" : ""}" style="--bg:${bg};--fg:${fg}">${a.photo ? `<img src="${esc(a.photo)}" alt="${esc(a.name)}" loading="lazy">` : ""}<span>${esc(a.name)}</span></li>`; }).join("")}</ul>`;
  };

  function offClock(O) {
    if (!O) return "";
    const games = gamesOf(O), hobbies = lines(O.hobbies), playing = asItem(O.playing);
    const hasArtists = Array.isArray(O.artists) ? O.artists.length : lines(O.artists).length;
    return `
      <section class="offclock">
        <div class="sec-head" data-reveal><div><div class="sec-label label">${regmark}</div><h2 class="sec-title">${ui("off.title")}</h2></div></div>
        <p class="off-lead" data-reveal>${ui("off.lead")}</p>
        <div class="off-grid">
          ${O.favoriteGame && O.favoriteGame.title ? `<article class="card card-fav" data-reveal><span class="tape" aria-hidden="true"></span><div class="card-label label">${ui("off.fav")}</div>${boxArt(O.favoriteGame, "big")}<h3>${esc(O.favoriteGame.title)}</h3>${t(O.favoriteGame.note) ? `<p class="muted">${esc(t(O.favoriteGame.note))}</p>` : ""}${playing.title ? `<div class="fav-playing"><div class="card-label label"><span class="live" aria-hidden="true"></span>${ui("off.playing")}</div><div class="now-game">${boxArt(playing, "mini")}<h3>${esc(playing.title)}</h3></div></div>` : ""}</article>` : ""}
          ${games.length ? `<article class="card card-games" data-reveal><div class="card-label label">${ui("off.games")} · ${pad(games.length)}</div><ul class="game-grid">${games.map((g) => `<li>${boxArt(g)}<span class="g-name">${esc(g.title)}</span></li>`).join("")}</ul></article>` : ""}
          ${O.playlist && (O.playlist.tracks || []).length ? `<article class="card card-song" data-reveal><div class="card-label label">${ui("off.song")}</div>${playerHTML(O.playlist)}</article>` : ""}
          ${hasArtists ? `<article class="card card-artists" data-reveal><div class="card-label label">${ui("off.artists")}</div>${pinsHTML(O.artists)}</article>` : ""}
          ${(O.albums || []).length ? `<article class="card card-albums" data-reveal><div class="card-label label">${ui("off.albums")}</div>${albumsHTML(O.albums)}</article>` : ""}
        </div>
        ${hobbies.length ? `<ul class="stickers" data-reveal>${hobbies.map((h, i) => `<li style="--r:${[-3, 2, -1.5, 3, -2, 1.5][i % 6]}deg">${esc(h)}</li>`).join("")}</ul>` : ""}
      </section>`;
  }
  // compact version for the home page
  function offClockTeaser(O) {
    if (!O) return "";
    const fav = O.favoriteGame && O.favoriteGame.title ? [{ ...O.favoriteGame, fav: true }] : [];
    const games = [...fav, ...gamesOf(O).filter((g) => !fav.length || g.title !== fav[0].title)].slice(0, 4), playing = asItem(O.playing), hobbies = lines(O.hobbies);
    return `
      <section class="section home-off">
        <div class="wrap">
          <div class="sec-head" data-reveal><div><div class="sec-label label">${regmark}</div><h2 class="sec-title">${ui("off.title")}</h2></div><a class="link-arrow" href="sobre.html">${ui("about.more")} ${arr}</a></div>
          <div class="home-off-grid">
            <article class="card ho-games" data-reveal><span class="tape" aria-hidden="true"></span><div class="card-label label">${ui("off.games")}</div><ul class="game-grid">${games.map((g) => `<li${g.fav ? ' class="is-fav"' : ""}>${boxArt(g)}${g.fav ? `<span class="fav-tag label">${ui("off.fav")}</span>` : ""}<span class="g-name">${esc(g.title)}</span></li>`).join("")}</ul>${playing.title ? `<div class="fav-playing"><div class="card-label label"><span class="live" aria-hidden="true"></span>${ui("off.playing")}</div><div class="now-game">${boxArt(playing, "mini")}<h3>${esc(playing.title)}</h3></div></div>` : ""}</article>
            ${O.playlist && (O.playlist.tracks || []).length ? `<article class="card ho-song" data-reveal><div class="card-label label">${ui("off.song")}</div>${playerHTML(O.playlist)}</article>` : ""}
          </div>
          ${hobbies.length ? `<ul class="stickers" data-reveal>${hobbies.map((h, i) => `<li style="--r:${[-3, 2, -1.5, 3, -2, 1.5][i % 6]}deg">${esc(h)}</li>`).join("")}</ul>` : ""}
        </div>
      </section>`;
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
        ${offClock(AB.offclock)}
        <div class="about-lists" data-reveal>
          ${(AB.lists || []).map((l) => `<div><h3 class="label">${esc(t(l.title))}</h3><ul>${lines(l.items).map((it) => `<li>${esc(it)}</li>`).join("")}</ul></div>`).join("")}
        </div>
        <div class="cv"><h2 data-reveal>${ui("about.exp")}</h2>${cvRows(AB.experience || [])}</div>
        ${(AB.education || []).length ? `<div class="cv"><h2 data-reveal>${ui("about.edu")}</h2>${cvRows(AB.education)}</div>` : ""}
        ${(AB.research || []).length ? `<div class="cv"><h2 data-reveal>${ui("about.research")}</h2>${AB.research.map((r, i) => `
          <article class="research" data-reveal ${stagger(i)}><span class="label pink">${esc(t(r.kind))}</span><div><h3>${r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener">${esc(t(r.title))} ↗</a>` : esc(t(r.title))}</h3><p>${esc(t(r.text))}</p></div></article>`).join("")}</div>` : ""}
        ${(AB.timeline || []).length ? `<div class="cv"><h2 data-reveal>${ui("about.timeline")}</h2><ol class="timeline">${AB.timeline.map((x, i) => `<li data-reveal ${stagger(i, 0.04)}><span class="label">${esc(x.period)}</span><span>${esc(t(x.text))}</span></li>`).join("")}</ol></div>` : ""}
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
          <div class="sec-label label">${regmark}<span>${esc(t(P.location))}</span></div>
          <h1 class="page-title riso" data-text="${esc(ui("contact.title"))}">${ui("contact.title")}</h1>
          <p class="page-lead">${ui("contact.lead")}</p>
          <div class="contact-status label">${esc(t(P.available))}</div>
        </header>
        <form class="contact-form" data-reveal novalidate>
          <div class="cf-row">
            <label><span class="label">${ui("cf.name")}</span><input name="name" type="text" autocomplete="name" required></label>
            <label><span class="label">${ui("cf.email")}</span><input name="email" type="email" autocomplete="email" required></label>
          </div>
          <fieldset class="cf-topics"><legend class="label">${ui("cf.topic")}</legend>
            ${["cf.t.project", "cf.t.freela", "cf.t.photo", "cf.t.other"].map((k, i) => `<label class="chip"><input type="radio" name="topic" value="${esc(ui(k))}"${i ? "" : " checked"}><span>${ui(k)}</span></label>`).join("")}
          </fieldset>
          <label class="cf-msg"><span class="label">${ui("cf.msg")}</span><textarea name="message" rows="6" required></textarea></label>
          <input type="text" name="_honey" class="cf-honey" tabindex="-1" autocomplete="off" aria-hidden="true">
          <div class="cf-foot"><button type="submit" class="btn">${ui("cf.send")} <span class="arr">→</span></button><p class="cf-status label" role="status" aria-live="polite"></p></div>
        </form>
        <ul class="contact-list">
          ${rows.map(([k, v, h], i) => `<li data-reveal ${stagger(i)}><a href="${esc(h)}"${h.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}><span class="k label muted">${k}</span><span class="v">${esc(v)}</span><span class="arr">↗</span></a></li>`).join("")}
        </ul>
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

  /* ---------- house ads: one clock, every ad swaps frames together (2 s each) ---------- */
  let adClock = 0;
  function startAdClock() {
    if (adClock || !document.querySelector(".b-ads .ad img.f2") || reduce) return;
    adClock = setInterval(() => root.classList.toggle("ad-f2"), 2000);
  }

  /* ---------- typography: keep short words with the next one, last word with the previous ---------- */
  const SHORT = /(^|\s)(a|à|ao|as|às|e|é|o|os|um|uma|de|da|das|do|dos|em|na|nas|no|nos|com|por|para|que|se|of|the|an|and|to|in|on|at|by|for|with|is)\s/gi;
  function noWidows(scope) {
    scope.querySelectorAll("p, h1, h2, h3, dd, li, figcaption, blockquote, .sub").forEach((el) => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((n) => { n.nodeValue = n.nodeValue.replace(SHORT, (m, pre, w) => `${pre}${w}\u00a0`); });
      const last = nodes.reverse().find((n) => /\S\s+\S+\s*$/.test(n.nodeValue));
      if (last && el.textContent.length > 28) last.nodeValue = last.nodeValue.replace(/\s+(\S{1,14})\s*$/, "\u00a0$1");
    });
  }

  /* ---------- boot ---------- */
  function renderAll() {
    renderChrome();
    ({ home: renderHome, project: renderProject, work: renderWork, photo: renderPhoto, series: renderSeries, about: renderAbout, contact: renderContact })[page]?.();
    initEffects();
    noWidows(document.querySelector("main")); noWidows(document.querySelector(".site-footer"));
    startAdClock();
  }
  renderAll();
  requestAnimationFrame(() => document.body.classList.remove("is-entering"));
  if (location.hash) setTimeout(() => document.querySelector(location.hash)?.scrollIntoView(), 80);
})();
