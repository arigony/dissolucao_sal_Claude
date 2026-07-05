/* ==========================================================================
   Dissolução do NaCl — script.js
   JavaScript puro, sem dependências. Organizado em módulos simples:
   1. Helpers de desenho (íons e moléculas de água)
   2. Animação de abertura (hero)
   3. Animação didática por etapas
   4. Simulação interativa
   5. Gráfico dinâmico (alimentado pela simulação)
   6. Quiz com pontuação
   ========================================================================== */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const COLORS = {
    na: "#B983FF",
    naGlow: "rgba(185,131,255,0.35)",
    cl: "#43D18A",
    clGlow: "rgba(67,209,138,0.35)",
    water: "#4FC3F7",
    waterFill: "rgba(79,195,247,0.55)",
    gold: "#FFC857",
    paper: "#F5F8FA"
  };

  /* ------------------------------------------------------------------ *
   * 1. Helpers de desenho
   * ------------------------------------------------------------------ */

  function drawIon(ctx, x, y, r, type, hydration) {
    hydration = hydration || 0;
    const color = type === "Na" ? COLORS.na : COLORS.cl;
    const glow = type === "Na" ? COLORS.naGlow : COLORS.clGlow;

    if (hydration > 0.02) {
      const shellR = r + 6 + hydration * 10;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = COLORS.water;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([2.5, 3.5]);
      ctx.beginPath();
      ctx.arc(x, y, shellR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const count = 5;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + hydration * 1.6;
        const wx = x + Math.cos(a) * shellR;
        const wy = y + Math.sin(a) * shellR;
        drawWater(ctx, wx, wy, 4.2, a);
      }
    }

    const grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.25, color);
    grad.addColorStop(1, color);
    ctx.save();
    ctx.shadowColor = glow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    ctx.font = `${Math.max(9, r * 0.62)}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = "#0B2036";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(type === "Na" ? "Na⁺" : "Cl⁻", x, y + 0.5);
  }

  function drawWater(ctx, x, y, r, angle) {
    angle = angle || 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.waterFill;
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(r * 0.75, -r * 0.5, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-r * 0.75, -r * 0.5, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function rand(min, max) { return min + Math.random() * (max - min); }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  /* ------------------------------------------------------------------ *
   * 2. Animação de abertura (hero) — loop contínuo, decorativo
   * ------------------------------------------------------------------ */

  function initHero() {
    const canvas = document.getElementById("heroCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;

    let ions = [];
    let waters = [];
    let phase = "crystal"; // crystal -> dissolving -> dispersed -> reform
    let phaseTimer = 0;

    function buildCrystal() {
      ions = [];
      const n = 4;
      const spacing = 34;
      const startX = W / 2 - ((n - 1) * spacing) / 2;
      const startY = H / 2 - ((n - 1) * spacing) / 2 - 10;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          ions.push({
            type: (i + j) % 2 === 0 ? "Na" : "Cl",
            homeX: startX + i * spacing,
            homeY: startY + j * spacing,
            x: startX + i * spacing,
            y: startY + j * spacing,
            vx: 0, vy: 0,
            hydration: 0,
            free: false
          });
        }
      }
      waters = [];
      for (let i = 0; i < 26; i++) {
        waters.push({
          x: rand(0, W), y: rand(0, H),
          vx: rand(-14, 14), vy: rand(-14, 14),
          r: rand(3.4, 5)
        });
      }
    }

    buildCrystal();

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      phaseTimer += dt;

      ctx.clearRect(0, 0, W, H);

      // fase de estado
      if (phase === "crystal" && phaseTimer > 1.6) { phase = "dissolving"; phaseTimer = 0; }
      if (phase === "dissolving" && phaseTimer > 5.5) { phase = "dispersed"; phaseTimer = 0; }
      if (phase === "dispersed" && phaseTimer > 2.2) { buildCrystal(); phase = "crystal"; phaseTimer = 0; }

      // água
      waters.forEach(w => {
        w.x += w.vx * dt; w.y += w.vy * dt;
        if (w.x < 0 || w.x > W) w.vx *= -1;
        if (w.y < 0 || w.y > H) w.vy *= -1;
        w.x = clamp(w.x, 0, W); w.y = clamp(w.y, 0, H);
        drawWater(ctx, w.x, w.y, w.r, Math.atan2(w.vy, w.vx));
      });

      // íons
      ions.forEach((ion, idx) => {
        if (phase === "dissolving") {
          const chance = 0.006 + (idx / ions.length) * 0.002;
          if (!ion.free && Math.random() < chance) {
            ion.free = true;
            ion.vx = rand(-22, 22);
            ion.vy = rand(-22, 22);
          }
        }
        if (ion.free) {
          ion.hydration = clamp(ion.hydration + dt * 0.8, 0, 1);
          ion.x += ion.vx * dt;
          ion.y += ion.vy * dt;
          if (ion.x < 20 || ion.x > W - 20) ion.vx *= -1;
          if (ion.y < 20 || ion.y > H - 20) ion.vy *= -1;
          ion.x = clamp(ion.x, 20, W - 20);
          ion.y = clamp(ion.y, 20, H - 20);
        } else {
          ion.x = ion.homeX + Math.sin(now / 260 + idx) * 0.6;
          ion.y = ion.homeY + Math.cos(now / 300 + idx) * 0.6;
          ion.hydration = clamp(ion.hydration - dt * 2, 0, 1);
        }
        drawIon(ctx, ion.x, ion.y, 13, ion.type, ion.hydration);
      });

      if (!prefersReducedMotion) requestAnimationFrame(frame);
    }

    if (prefersReducedMotion) {
      // desenha um único quadro estático (cristal) em vez de animar
      ctx.clearRect(0, 0, W, H);
      waters.forEach(w => drawWater(ctx, w.x, w.y, w.r, 0));
      ions.forEach(ion => drawIon(ctx, ion.x, ion.y, 13, ion.type, 0));
    } else {
      requestAnimationFrame(frame);
    }
  }

  /* ------------------------------------------------------------------ *
   * 3. Animação didática por etapas
   * ------------------------------------------------------------------ */

  function initStages() {
    const canvas = document.getElementById("stageCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;

    const stages = [
      {
        title: "Cristal intacto",
        desc: "Os íons Na⁺ (violeta) e Cl⁻ (verde) estão organizados em uma rede cristalina rígida, sem água por perto."
      },
      {
        title: "Água se aproxima",
        desc: "Moléculas de água polares se aproximam da superfície do cristal, orientando seu polo negativo (oxigênio) para o Na⁺ e o positivo (hidrogênio) para o Cl⁻."
      },
      {
        title: "Hidratação dos íons das bordas",
        desc: "Os íons das bordas, menos presos que os do interior, começam a se soltar e ficam envoltos por camadas de água."
      },
      {
        title: "Íons totalmente dispersos",
        desc: "A rede se desfaz por completo. Cada Na⁺ e Cl⁻ está separado, cercado por sua camada de hidratação, disperso na solução."
      }
    ];

    let current = 0;
    let raf = null;
    let autoplay = false;
    let autoTimer = null;

    const badge = document.getElementById("stageBadge");
    const titleEl = document.getElementById("stageTitle");
    const descEl = document.getElementById("stageDesc");
    const dotsWrap = document.getElementById("stageDots");
    const btnPrev = document.getElementById("stagePrev");
    const btnNext = document.getElementById("stageNext");
    const btnPlay = document.getElementById("stagePlay");

    stages.forEach((s, i) => {
      const dot = document.createElement("button");
      dot.className = "stage-dot";
      dot.type = "button";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
      dot.setAttribute("aria-label", `Ir para etapa ${i + 1}: ${s.title}`);
      dot.addEventListener("click", () => goTo(i));
      dotsWrap.appendChild(dot);
    });

    function updateText() {
      badge.textContent = `Etapa ${current + 1} de ${stages.length}`;
      titleEl.textContent = stages[current].title;
      descEl.textContent = stages[current].desc;
      [...dotsWrap.children].forEach((d, i) => d.setAttribute("aria-selected", i === current ? "true" : "false"));
      btnPrev.disabled = current === 0;
      btnNext.disabled = current === stages.length - 1;
    }

    function goTo(i) {
      current = clamp(i, 0, stages.length - 1);
      updateText();
    }

    // geometria fixa da rede para as etapas 0-2 (permanece coerente entre etapas)
    const n = 4, spacing = 46;
    const startX = W / 2 - ((n - 1) * spacing) / 2;
    const startY = H / 2 - ((n - 1) * spacing) / 2;
    const latticeIons = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const isEdge = i === 0 || i === n - 1 || j === 0 || j === n - 1;
        latticeIons.push({
          type: (i + j) % 2 === 0 ? "Na" : "Cl",
          x: startX + i * spacing,
          y: startY + j * spacing,
          isEdge
        });
      }
    }

    const dispersedIons = latticeIons.map((ion, idx) => ({
      type: ion.type,
      x: rand(60, W - 60),
      y: rand(60, H - 60),
      seed: idx
    }));

    const incomingWaters = Array.from({ length: 10 }, (_, i) => ({
      angle: (i / 10) * Math.PI * 2,
      dist: rand(210, 260),
      speed: rand(0.15, 0.3)
    }));

    function render(t) {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;

      if (current === 0) {
        latticeIons.forEach((ion, idx) => {
          const jitter = prefersReducedMotion ? 0 : Math.sin(t / 400 + idx) * 0.7;
          drawIon(ctx, ion.x + jitter, ion.y + jitter, 15, ion.type, 0);
        });
      }

      if (current === 1) {
        latticeIons.forEach((ion, idx) => {
          const jitter = prefersReducedMotion ? 0 : Math.sin(t / 400 + idx) * 0.7;
          drawIon(ctx, ion.x + jitter, ion.y + jitter, 15, ion.type, 0);
        });
        incomingWaters.forEach((w, i) => {
          const d = prefersReducedMotion ? w.dist : w.dist - (Math.sin(t / 900 + i) * 20 + 20);
          const wx = cx + Math.cos(w.angle) * d;
          const wy = cy + Math.sin(w.angle) * d;
          drawWater(ctx, wx, wy, 6, w.angle + Math.PI);
        });
      }

      if (current === 2) {
        latticeIons.forEach((ion, idx) => {
          const hydration = ion.isEdge ? clamp(0.55 + Math.sin(t / 500 + idx) * 0.25, 0.2, 0.9) : 0;
          const wobble = ion.isEdge && !prefersReducedMotion ? Math.sin(t / 260 + idx) * 2.2 : 0;
          drawIon(ctx, ion.x + wobble, ion.y + wobble, 15, ion.type, hydration);
        });
      }

      if (current === 3) {
        dispersedIons.forEach((ion) => {
          const dx = prefersReducedMotion ? 0 : Math.sin(t / 700 + ion.seed) * 10;
          const dy = prefersReducedMotion ? 0 : Math.cos(t / 620 + ion.seed * 1.3) * 10;
          drawIon(ctx, ion.x + dx, ion.y + dy, 13, ion.type, 0.85);
        });
      }

      if (!prefersReducedMotion) raf = requestAnimationFrame(render);
    }

    function startRender() {
      if (raf) cancelAnimationFrame(raf);
      if (prefersReducedMotion) {
        render(0);
      } else {
        raf = requestAnimationFrame(render);
      }
    }

    btnPrev.addEventListener("click", () => { stopAutoplay(); goTo(current - 1); });
    btnNext.addEventListener("click", () => { stopAutoplay(); goTo(current + 1); });

    function stopAutoplay() {
      autoplay = false;
      btnPlay.textContent = "▶ Reproduzir sequência";
      if (autoTimer) clearInterval(autoTimer);
    }

    btnPlay.addEventListener("click", () => {
      if (autoplay) { stopAutoplay(); return; }
      autoplay = true;
      btnPlay.textContent = "⏸ Pausar sequência";
      if (current === stages.length - 1) goTo(0);
      autoTimer = setInterval(() => {
        if (current === stages.length - 1) {
          stopAutoplay();
          return;
        }
        goTo(current + 1);
      }, 3200);
    });

    updateText();
    startRender();
  }

  /* ------------------------------------------------------------------ *
   * 4 + 5. Simulação interativa e gráfico dinâmico
   * ------------------------------------------------------------------ */

  function initSimulationAndChart() {
    const simCanvas = document.getElementById("simCanvas");
    const chartCanvas = document.getElementById("chartCanvas");
    if (!simCanvas || !chartCanvas) return;

    const simCtx = simCanvas.getContext("2d");
    const chartCtx = chartCanvas.getContext("2d");
    const SW = simCanvas.width, SH = simCanvas.height;

    const tempRange = document.getElementById("tempRange");
    const saltRange = document.getElementById("saltRange");
    const stirToggle = document.getElementById("stirToggle");
    const tempValue = document.getElementById("tempValue");
    const saltValue = document.getElementById("saltValue");
    const startBtn = document.getElementById("simStart");
    const resetBtn = document.getElementById("simReset");
    const readoutDissolved = document.getElementById("readoutDissolved");
    const readoutTime = document.getElementById("readoutTime");
    const readoutState = document.getElementById("readoutState");
    const chartNote = document.getElementById("chartNote");

    const SALT_LABELS = { 1: "Pequena", 2: "Média", 3: "Grande" };
    const SALT_N = { 1: 3, 2: 4, 3: 5 };

    let ions = [];
    let waters = [];
    let running = false;
    let elapsed = 0;
    let raf = null;
    let last = null;
    let history = []; // {t, pct}
    let saturationNote = false;

    function label() {
      tempValue.textContent = `${tempRange.value} °C`;
      saltValue.textContent = SALT_LABELS[saltRange.value];
    }
    tempRange.addEventListener("input", label);
    saltRange.addEventListener("input", () => { label(); if (!running) buildScene(); });
    label();

    function buildScene() {
      const n = SALT_N[saltRange.value];
      const spacing = Math.min(30, (SW * 0.42) / n);
      const startX = SW * 0.28 - ((n - 1) * spacing) / 2;
      const startY = SH * 0.62 - ((n - 1) * spacing) / 2;
      ions = [];
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const isEdge = i === 0 || i === n - 1 || j === 0 || j === n - 1;
          ions.push({
            type: (i + j) % 2 === 0 ? "Na" : "Cl",
            x: startX + i * spacing,
            y: startY + j * spacing,
            homeX: startX + i * spacing,
            homeY: startY + j * spacing,
            vx: 0, vy: 0,
            free: false,
            hydration: 0,
            isEdge
          });
        }
      }
      const waterCount = 36;
      waters = Array.from({ length: waterCount }, () => ({
        x: rand(0, SW), y: rand(0, SH),
        vx: rand(-10, 10), vy: rand(-10, 10),
        r: rand(3.6, 5.4)
      }));
      elapsed = 0;
      history = [{ t: 0, pct: 0 }];
      saturationNote = false;
      updateReadouts(0);
      drawSim();
      drawChart();
    }

    function edgeIons() {
      // após alguns íons de borda dissolverem, novos íons ficam expostos:
      // simplificação: qualquer íon "cristal" adjacente (na grade) a uma posição já dissolvida também conta como borda
      return ions.filter(i => !i.free);
    }

    function step(dt) {
      elapsed += dt;
      const temp = Number(tempRange.value);
      const stirring = stirToggle.checked;
      const totalIons = ions.length;
      const dissolvedCount = ions.filter(i => i.free).length;
      const concentration = dissolvedCount / totalIons; // 0..1, usado como fator de saturação

      const speedFactor = (0.5 + temp / 55) * (stirring ? 2.1 : 1);

      waters.forEach(w => {
        // leve corrente circular quando agitando
        if (stirring) {
          const cx = SW / 2, cy = SH / 2;
          const dx = w.y - cy, dy = -(w.x - cx);
          const len = Math.hypot(dx, dy) || 1;
          w.vx += (dx / len) * 6 * dt;
          w.vy += (dy / len) * 6 * dt;
        }
        w.x += w.vx * dt * speedFactor;
        w.y += w.vy * dt * speedFactor;
        if (w.x < 0 || w.x > SW) w.vx *= -1;
        if (w.y < 0 || w.y > SH) w.vy *= -1;
        w.x = clamp(w.x, 0, SW); w.y = clamp(w.y, 0, SH);
      });

      const crystalEdges = edgeIons().filter(i => i.isEdge || ions.every(x => x.free));
      crystalEdges.forEach(ion => {
        const baseChance = 0.0009 * (temp / 25 + 0.4) * (stirring ? 1.8 : 1);
        const saturationPenalty = clamp(1 - concentration * 0.6, 0.15, 1);
        if (Math.random() < baseChance * saturationPenalty) {
          ion.free = true;
          ion.vx = rand(-16, 16) * (0.6 + temp / 100);
          ion.vy = rand(-16, 16) * (0.6 + temp / 100);
          ion.isEdge = false;
          // expõe vizinhos: qualquer íon do cristal agora pode ser considerado de borda
          ions.forEach(other => { if (!other.free) other.isEdge = true; });
        }
      });

      ions.forEach(ion => {
        if (ion.free) {
          ion.hydration = clamp(ion.hydration + dt * 1.1, 0, 1);
          ion.x += ion.vx * dt * (0.6 + temp / 90) * (stirring ? 1.4 : 1);
          ion.y += ion.vy * dt * (0.6 + temp / 90) * (stirring ? 1.4 : 1);
          if (ion.x < 16 || ion.x > SW - 16) ion.vx *= -1;
          if (ion.y < 16 || ion.y > SH - 16) ion.vy *= -1;
          ion.x = clamp(ion.x, 16, SW - 16);
          ion.y = clamp(ion.y, 16, SH - 16);
        } else {
          ion.x = ion.homeX;
          ion.y = ion.homeY;
        }
      });

      const pct = (ions.filter(i => i.free).length / totalIons) * 100;
      updateReadouts(pct);

      if (Math.floor(elapsed * 3) !== Math.floor((elapsed - dt) * 3)) {
        history.push({ t: elapsed, pct });
        if (history.length > 400) history.shift();
        drawChart();
      }

      if (pct >= 99.9 && running) {
        stopSim(true);
      }
    }

    function updateReadouts(pct) {
      readoutDissolved.textContent = `${Math.round(pct)}%`;
      readoutTime.textContent = `${elapsed.toFixed(1)} s`;
      readoutState.textContent = running ? "Em andamento" : (pct > 0 ? "Pausado" : "Pronto");
    }

    function drawSim() {
      simCtx.clearRect(0, 0, SW, SH);
      waters.forEach(w => drawWater(simCtx, w.x, w.y, w.r, Math.atan2(w.vy, w.vx)));
      ions.forEach(ion => drawIon(simCtx, ion.x, ion.y, 14, ion.type, ion.hydration));
    }

    function loop(now) {
      if (!running) return;
      if (last === null) last = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt);
      drawSim();
      raf = requestAnimationFrame(loop);
    }

    function startSim() {
      if (running) { pauseSim(); return; }
      running = true;
      last = null;
      startBtn.textContent = "Pausar simulação";
      updateReadouts(Number(readoutDissolved.textContent.replace("%", "")) || 0);
      raf = requestAnimationFrame(loop);
    }

    function pauseSim() {
      running = false;
      startBtn.textContent = "Continuar simulação";
      if (raf) cancelAnimationFrame(raf);
      updateReadouts(parseFloat(readoutDissolved.textContent) || 0);
    }

    function stopSim() {
      running = false;
      startBtn.textContent = "Iniciar simulação";
      if (raf) cancelAnimationFrame(raf);
      readoutState.textContent = "Concluído";
    }

    startBtn.addEventListener("click", startSim);
    resetBtn.addEventListener("click", () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      startBtn.textContent = "Iniciar simulação";
      buildScene();
      chartNote.textContent = "Nenhum dado ainda — inicie a simulação na seção anterior para gerar a curva.";
    });

    /* ---- Gráfico ---- */
    function drawChart() {
      const W = chartCanvas.width, H = chartCanvas.height;
      chartCtx.clearRect(0, 0, W, H);

      const margin = { top: 20, right: 24, bottom: 40, left: 52 };
      const plotW = W - margin.left - margin.right;
      const plotH = H - margin.top - margin.bottom;

      // eixos
      chartCtx.strokeStyle = "#D7E2E8";
      chartCtx.lineWidth = 1;
      chartCtx.font = "12px 'JetBrains Mono', monospace";
      chartCtx.fillStyle = "#3A5164";

      for (let p = 0; p <= 100; p += 25) {
        const y = margin.top + plotH - (p / 100) * plotH;
        chartCtx.beginPath();
        chartCtx.moveTo(margin.left, y);
        chartCtx.lineTo(margin.left + plotW, y);
        chartCtx.stroke();
        chartCtx.textAlign = "right";
        chartCtx.textBaseline = "middle";
        chartCtx.fillText(`${p}%`, margin.left - 10, y);
      }

      const maxT = Math.max(10, elapsed);
      const steps = 5;
      for (let s = 0; s <= steps; s++) {
        const tv = (maxT / steps) * s;
        const x = margin.left + (tv / maxT) * plotW;
        chartCtx.textAlign = "center";
        chartCtx.textBaseline = "top";
        chartCtx.fillText(`${tv.toFixed(0)}s`, x, margin.top + plotH + 10);
      }

      chartCtx.strokeStyle = "#0B2036";
      chartCtx.beginPath();
      chartCtx.moveTo(margin.left, margin.top);
      chartCtx.lineTo(margin.left, margin.top + plotH);
      chartCtx.lineTo(margin.left + plotW, margin.top + plotH);
      chartCtx.stroke();

      chartCtx.save();
      chartCtx.translate(14, margin.top + plotH / 2);
      chartCtx.rotate(-Math.PI / 2);
      chartCtx.textAlign = "center";
      chartCtx.fillStyle = "#3A5164";
      chartCtx.font = "11px Inter, sans-serif";
      chartCtx.fillText("% de sal dissolvido", 0, 0);
      chartCtx.restore();
      chartCtx.textAlign = "center";
      chartCtx.fillText("tempo (s)", margin.left + plotW / 2, margin.top + plotH + 26);

      if (history.length < 2) {
        chartNote.textContent = "Nenhum dado ainda — inicie a simulação na seção anterior para gerar a curva.";
        return;
      }

      chartCtx.beginPath();
      history.forEach((pt, i) => {
        const x = margin.left + (pt.t / maxT) * plotW;
        const y = margin.top + plotH - (pt.pct / 100) * plotH;
        if (i === 0) chartCtx.moveTo(x, y); else chartCtx.lineTo(x, y);
      });
      chartCtx.strokeStyle = COLORS.water;
      chartCtx.lineWidth = 2.5;
      chartCtx.lineJoin = "round";
      chartCtx.stroke();

      // área preenchida
      const last = history[history.length - 1];
      chartCtx.lineTo(margin.left + (last.t / maxT) * plotW, margin.top + plotH);
      chartCtx.lineTo(margin.left, margin.top + plotH);
      chartCtx.closePath();
      chartCtx.fillStyle = "rgba(79,195,247,0.12)";
      chartCtx.fill();

      // ponto atual
      const cx = margin.left + (last.t / maxT) * plotW;
      const cy = margin.top + plotH - (last.pct / 100) * plotH;
      chartCtx.beginPath();
      chartCtx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      chartCtx.fillStyle = COLORS.gold;
      chartCtx.fill();

      chartNote.textContent = `Em ${last.t.toFixed(1)} s, ${last.pct.toFixed(0)}% do sal está dissolvido.`;
    }

    buildScene();
  }

  /* ------------------------------------------------------------------ *
   * 6. Quiz com feedback formativo e pontuação
   * ------------------------------------------------------------------ */

  function initQuiz() {
    const panel = document.getElementById("quizPanel");
    if (!panel) return;

    const questions = [
      {
        q: "O que mantém os íons Na⁺ e Cl⁻ unidos no sal sólido?",
        options: [
          "Ligações covalentes compartilhando elétrons",
          "Ligações iônicas por atração elétrica entre cargas opostas",
          "Forças de atrito entre as partículas",
          "Pontes de hidrogênio"
        ],
        correct: 1,
        feedbackCorrect: "Isso mesmo — a atração eletrostática entre Na⁺ (positivo) e Cl⁻ (negativo) forma a ligação iônica que estrutura o cristal.",
        feedbackIncorrect: "A resposta certa é a ligação iônica: a atração elétrica entre o cátion Na⁺ e o ânion Cl⁻ é o que mantém o cristal coeso."
      },
      {
        q: "Por que a água consegue separar os íons do cristal de sal?",
        options: [
          "Porque a água é ácida",
          "Porque a água tem alta densidade",
          "Porque a molécula de água é polar, com polos parcialmente positivo e negativo",
          "Porque a água está sempre quente"
        ],
        correct: 2,
        feedbackCorrect: "Exatamente — a polaridade da água permite que ela se oriente em torno de cada íon e o afaste da rede cristalina.",
        feedbackIncorrect: "O ponto-chave é a polaridade: a água tem um polo negativo (oxigênio) e um positivo (hidrogênios), o que permite atrair e envolver os íons."
      },
      {
        q: "Como se chama a camada de moléculas de água que envolve um íon dissolvido?",
        options: [
          "Camada de valência",
          "Camada de hidratação",
          "Membrana iônica",
          "Nuvem eletrônica"
        ],
        correct: 1,
        feedbackCorrect: "Correto! A camada (ou esfera) de hidratação é o conjunto de moléculas de água orientadas ao redor do íon.",
        feedbackIncorrect: "O nome correto é camada de hidratação — moléculas de água organizadas ao redor do íon dissolvido."
      },
      {
        q: "Qual fator, isoladamente, mais aumenta a velocidade de dissolução do sal na simulação?",
        options: [
          "Diminuir a temperatura da água",
          "Aumentar a temperatura e agitar a solução",
          "Usar água destilada gelada parada",
          "Adicionar mais sal sem mexer"
        ],
        correct: 1,
        feedbackCorrect: "Isso — mais temperatura significa moléculas mais agitadas, e a agitação aproxima mais água do cristal, acelerando a dissolução.",
        feedbackIncorrect: "O ideal é aumentar a temperatura e agitar: ambos aumentam o contato entre a água e os íons do cristal."
      },
      {
        q: "Qual equação representa corretamente a dissociação do NaCl em água?",
        options: [
          "NaCl (s) → Na (s) + Cl (g)",
          "NaCl (aq) → NaCl (s)",
          "NaCl (s) → Na⁺(aq) + Cl⁻(aq)",
          "Na⁺ + Cl⁻ → NaCl (aq)"
        ],
        correct: 2,
        feedbackCorrect: "Perfeito — o sal sólido se dissocia em íons sódio e cloreto, ambos hidratados (aq) em solução.",
        feedbackIncorrect: "A equação correta é NaCl (s) → Na⁺(aq) + Cl⁻(aq): o sólido origina os dois íons hidratados."
      }
    ];

    let currentQ = 0;
    let score = 0;
    let answered = false;

    const metaEl = document.getElementById("quizMeta");
    const progressBar = document.getElementById("quizProgressBar");
    const questionEl = document.getElementById("quizQuestion");
    const optionsEl = document.getElementById("quizOptions");
    const feedbackEl = document.getElementById("quizFeedback");
    const checkBtn = document.getElementById("quizCheck");
    const nextBtn = document.getElementById("quizNext");
    const questionArea = document.getElementById("quizQuestionArea");
    const resultArea = document.getElementById("quizResult");
    const resultScore = document.getElementById("resultScore");
    const resultMessage = document.getElementById("resultMessage");
    const restartBtn = document.getElementById("quizRestart");

    let selectedIndex = null;

    function renderQuestion() {
      selectedIndex = null;
      answered = false;
      const item = questions[currentQ];
      metaEl.textContent = `Pergunta ${currentQ + 1} de ${questions.length}`;
      progressBar.style.width = `${((currentQ) / questions.length) * 100}%`;
      questionEl.textContent = item.q;
      optionsEl.innerHTML = "";
      feedbackEl.className = "quiz-feedback";
      feedbackEl.textContent = "";
      checkBtn.hidden = false;
      checkBtn.disabled = true;
      nextBtn.hidden = true;

      item.options.forEach((opt, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quiz-option";
        btn.setAttribute("role", "radio");
        btn.setAttribute("aria-checked", "false");
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          if (answered) return;
          selectedIndex = i;
          [...optionsEl.children].forEach(c => c.setAttribute("aria-checked", "false"));
          btn.setAttribute("aria-checked", "true");
          checkBtn.disabled = false;
        });
        optionsEl.appendChild(btn);
      });
    }

    function checkAnswer() {
      if (selectedIndex === null || answered) return;
      answered = true;
      const item = questions[currentQ];
      const isCorrect = selectedIndex === item.correct;
      if (isCorrect) score++;

      [...optionsEl.children].forEach((c, i) => {
        c.disabled = true;
        if (i === item.correct) c.classList.add("is-correct");
        else if (i === selectedIndex) c.classList.add("is-incorrect");
      });

      feedbackEl.textContent = isCorrect ? item.feedbackCorrect : item.feedbackIncorrect;
      feedbackEl.className = `quiz-feedback show ${isCorrect ? "correct" : "incorrect"}`;

      checkBtn.hidden = true;
      nextBtn.hidden = false;
      nextBtn.textContent = currentQ === questions.length - 1 ? "Ver resultado ▶" : "Próxima pergunta ▶";
      progressBar.style.width = `${((currentQ + 1) / questions.length) * 100}%`;
    }

    function nextQuestion() {
      if (currentQ < questions.length - 1) {
        currentQ++;
        renderQuestion();
      } else {
        showResult();
      }
    }

    function showResult() {
      questionArea.hidden = true;
      resultArea.hidden = false;
      resultScore.textContent = `${score}/${questions.length}`;
      let msg;
      if (score === questions.length) {
        msg = "Excelente! Você entendeu muito bem a dissolução iônica do NaCl — ligações, polaridade e hidratação.";
      } else if (score >= questions.length - 1) {
        msg = "Muito bom! Você domina quase todos os conceitos. Revise o item que errou para fechar o entendimento.";
      } else if (score >= questions.length - 2) {
        msg = "Bom resultado. Vale revisar a explicação conceitual e a animação por etapas para reforçar alguns pontos.";
      } else {
        msg = "Você deu os primeiros passos. Volte às seções de conceito e animação e tente o quiz novamente.";
      }
      resultMessage.textContent = msg;
    }

    checkBtn.addEventListener("click", checkAnswer);
    nextBtn.addEventListener("click", nextQuestion);
    restartBtn.addEventListener("click", () => {
      currentQ = 0;
      score = 0;
      questionArea.hidden = false;
      resultArea.hidden = true;
      renderQuestion();
    });

    renderQuestion();
  }

  /* ------------------------------------------------------------------ *
   * Init geral
   * ------------------------------------------------------------------ */

  document.addEventListener("DOMContentLoaded", function () {
    initHero();
    initStages();
    initSimulationAndChart();
    initQuiz();
  });
})();
