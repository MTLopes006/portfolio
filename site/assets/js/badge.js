/* Hanging badge — verlet rope + weighted card. Subtle but noticeable. */
(() => {
  const TUNE = {
    gravity: 0.45,     // px / frame²
    damping: 0.972,    // per-frame velocity retention (lower = calmer)
    iterations: 14,
    segments: 9,
    slack: 1.06,       // how far the strap may stretch while dragging
    wind: 0.006,       // how much cursor motion nudges the card
    windMax: 0.5,      // cap per frame so fast mouse moves stay gentle
    sway: 0.005,       // idle breathing force
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) TUNE.damping = 0.9;

  let S = null;        // persistent simulation state across re-renders
  let raf = 0, flipped = false;

  const pt = (x, y, inv) => ({ x, y, px: x, py: y, inv });

  function cardHTML({ P, t, ui }) {
    return `
      <div class="badge-clip" aria-hidden="true"></div>
      <div class="badge-inner">
        <div class="badge-face front">
          <div class="badge-hole"></div>
          <div class="badge-head"><span class="badge-access">${ui("badge.access")}</span><span class="badge-mark">M<i>/</i>L</span></div>
          <div class="badge-meta"><span>${ui("badge.edition")}</span><span>${P.badgeId}</span></div>
          <div class="badge-photo"><img src="${P.photo}" alt="${P.name}" draggable="false"><svg class="badge-reg" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="5.5" fill="none" stroke="currentColor"/><path d="M10 0v20M0 10h20" stroke="currentColor"/></svg></div>
          <div class="badge-name">${P.name}</div>
          <div class="badge-fields">
            <div class="badge-field"><small>${ui("badge.role")}</small><b>${t(P.role)}</b></div>
            <div class="badge-field"><small>${ui("badge.company")}</small><b>${P.company}</b></div>
          </div>
          <div class="badge-foot"><span>${ui("sideA")}</span><span class="badge-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>${ui("badge.flip")} ↻</span></div>
        </div>
        <div class="badge-face back">
          <div class="badge-hole"></div>
          <div class="badge-back-body">
            <span class="badge-access">${ui("sideB")}</span>
            <div class="badge-qr"><img src="assets/img/qr-linkedin.svg" alt="QR code — LinkedIn" draggable="false"></div>
            <p>${ui("badge.scan")}</p>
            <a href="${P.linkedin}" target="_blank" rel="noopener">${P.linkedinLabel}</a>
          </div>
          <div class="badge-foot"><span>${ui("sideB")}</span><span class="badge-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>${ui("badge.flip")} ↻</span></div>
        </div>
      </div>`;
  }

  function mount(stage, ctx) {
    if (!stage) return;
    cancelAnimationFrame(raf);
    const svgNS = "http://www.w3.org/2000/svg";
    const strapText = `${ctx.P.name} ✕ ${ctx.ui("badge.access")} ✕ ${ctx.t(ctx.P.role)} ✕ `.repeat(8);
    stage.innerHTML = `
      <svg class="strap" aria-hidden="true">
        <defs><path id="strap-path"/></defs>
        <use href="#strap-path" class="strap-band"/>
        <text class="strap-text" dy="4"><textPath href="#strap-path" startOffset="0">${strapText}</textPath></text>
      </svg>
      <div class="badge${flipped ? " flipped" : ""}" role="button" tabindex="0" aria-label="${ctx.ui("badge.flip")}">${cardHTML(ctx)}</div>`;
    const path = stage.querySelector("#strap-path");
    const card = stage.querySelector(".badge");

    const geo = () => {
      const W = stage.clientWidth, H = stage.clientHeight;
      const mobile = matchMedia("(max-width: 860px)").matches;
      const ax = W * (mobile ? 0.5 : 0.52), ay = mobile ? -10 : -40;
      const ropeLen = mobile ? 120 : Math.max(140, Math.min(320, H * 0.27));
      return { W, H, ax, ay, ropeLen, cw: card.offsetWidth, ch: card.offsetHeight - 30 };
    };
    let G = geo();
    const seg = () => G.ropeLen / TUNE.segments;

    // Build or re-anchor the simulation
    if (!S) {
      const pts = [];
      const startHook = reduce ? { x: G.ax, y: G.ay + G.ropeLen } : { x: G.ax + 36, y: G.ay + G.ropeLen * 0.55 };
      for (let i = 0; i <= TUNE.segments; i++) {
        const k = i / TUNE.segments;
        pts.push(pt(G.ax + (startHook.x - G.ax) * k, G.ay + (startHook.y - G.ay) * k, i === 0 ? 0 : 1));
      }
      pts[pts.length - 1].inv = 0.6; // clip is heavier than strap
      const a = reduce ? 0 : 0.16;
      const bottom = pt(startHook.x + Math.sin(a) * G.ch, startHook.y + Math.cos(a) * G.ch, 0.35);
      S = { pts, bottom, ax: G.ax, ay: G.ay };
    } else {
      const dx = G.ax - S.ax, dy = G.ay - S.ay;
      [...S.pts, S.bottom].forEach((p) => { p.x += dx; p.y += dy; p.px += dx; p.py += dy; });
      S.ax = G.ax; S.ay = G.ay;
    }
    const pts = S.pts, bottom = S.bottom, hook = () => pts[pts.length - 1];

    /* ---------- interaction ---------- */
    let drag = null, wind = 0, lastPX = null;
    card.addEventListener("pointerdown", (e) => {
      if (e.target.closest("a")) return;
      card.setPointerCapture(e.pointerId);
      const r = stage.getBoundingClientRect();
      const h = hook();
      drag = { id: e.pointerId, ox: e.clientX - r.left - h.x, oy: e.clientY - r.top - h.y, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: false, x: h.x, y: h.y };
      card.classList.add("dragging");
    });
    card.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const r = stage.getBoundingClientRect();
      drag.x = e.clientX - r.left - drag.ox; drag.y = e.clientY - r.top - drag.oy;
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) drag.moved = true;
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const click = !drag.moved && performance.now() - drag.t < 350;
      drag = null; card.classList.remove("dragging");
      const h = hook(); // cap release speed so a flick stays elegant
      const vx = h.x - h.px, vy = h.y - h.py, sp = Math.hypot(vx, vy), max = 16;
      if (sp > max) { h.px = h.x - vx / sp * max; h.py = h.y - vy / sp * max; }
      if (click) flip();
    };
    card.addEventListener("pointerup", end);
    card.addEventListener("pointercancel", end);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); }
      if (e.key === "ArrowLeft") bottom.px += 14;
      if (e.key === "ArrowRight") bottom.px -= 14;
    });
    function flip() {
      flipped = !flipped; card.classList.toggle("flipped", flipped);
      bottom.px -= (flipped ? 1 : -1) * 3; // a little kick when it turns
    }
    const onMove = (e) => {
      if (lastPX !== null && !drag) {
        const r = card.getBoundingClientRect();
        if (e.clientX > r.left - 80 && e.clientX < r.right + 80 && e.clientY > r.top - 80 && e.clientY < r.bottom + 80) wind += (e.clientX - lastPX) * TUNE.wind;
      }
      lastPX = e.clientX;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    /* ---------- simulation ---------- */
    function constrain(a, b, len) {
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.0001;
      const w = a.inv + b.inv; if (!w) return;
      const diff = (d - len) / d / w;
      a.x += dx * diff * a.inv; a.y += dy * diff * a.inv;
      b.x -= dx * diff * b.inv; b.y -= dy * diff * b.inv;
    }
    let tAcc = 0, last = performance.now(), clock = 0;
    function step() {
      clock++;
      const all = [...pts, bottom];
      for (const p of all) {
        if (!p.inv) continue;
        const vx = (p.x - p.px) * TUNE.damping, vy = (p.y - p.py) * TUNE.damping;
        p.px = p.x; p.py = p.y;
        p.x += vx; p.y += vy + TUNE.gravity;
      }
      wind = Math.max(-TUNE.windMax, Math.min(TUNE.windMax, wind));
      bottom.x += wind + (reduce ? 0 : Math.sin(clock * 0.016) * TUNE.sway);
      wind *= 0.6;

      const h = hook();
      let savedInv = h.inv;
      if (drag) {
        // keep the clip under the pointer, limited by strap length
        let tx = drag.x, ty = drag.y;
        const dx = tx - G.ax, dy = ty - G.ay, d = Math.hypot(dx, dy), max = G.ropeLen * TUNE.slack;
        if (d > max) { tx = G.ax + dx / d * max; ty = G.ay + dy / d * max; }
        h.x = tx; h.y = ty; h.inv = 0;
      }
      const L = seg();
      for (let k = 0; k < TUNE.iterations; k++) {
        for (let i = 0; i < pts.length - 1; i++) constrain(pts[i], pts[i + 1], L);
        constrain(h, bottom, G.ch);
      }
      h.inv = savedInv;
    }
    function render() {
      // strap: smooth curve through rope points
      let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
        d += ` Q${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
      }
      const h = hook();
      d += ` L${h.x.toFixed(1)},${h.y.toFixed(1)}`;
      path.setAttribute("d", d);
      const ang = Math.atan2(bottom.x - h.x, bottom.y - h.y);
      card.style.transform = `translate3d(${(h.x - G.cw / 2).toFixed(2)}px, ${(h.y - 2).toFixed(2)}px, 0) rotate(${(-ang).toFixed(4)}rad)`;
    }
    let visible = true;
    function loop(now) {
      tAcc += Math.min(80, now - last); last = now;
      let n = 0;
      while (tAcc >= 16.667 && n < 5) { step(); tAcc -= 16.667; n++; }
      render();
      raf = visible ? requestAnimationFrame(loop) : 0;
    }
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    }).observe(stage);

    const onResize = () => {
      const old = G; G = geo();
      const dx = G.ax - old.ax, dy = G.ay - old.ay;
      [...pts, bottom].forEach((p) => { p.x += dx; p.y += dy; p.px += dx; p.py += dy; });
      S.ax = G.ax; S.ay = G.ay;
    };
    window.addEventListener("resize", onResize);
    // the card's height depends on the photo; re-measure once it loads
    card.querySelector(".badge-photo img").addEventListener("load", () => { G = geo(); });

    // clean up listeners if mounted again (language switch)
    stage._cleanup?.();
    stage._cleanup = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("resize", onResize); };
    window.Badge._cleanup?.();
    window.Badge._cleanup = stage._cleanup;

    render();
    raf = requestAnimationFrame(loop);
  }

  window.Badge = { mount };
})();
