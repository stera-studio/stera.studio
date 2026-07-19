/* stera studio — living logo */
(() => {
  "use strict";

  const mascot = document.getElementById("mascot");
  const stage = document.getElementById("stage");
  const svg = document.getElementById("logoSvg");
  const face = document.getElementById("face");
  const eyeL = document.getElementById("eyeL");
  const pupilL = document.getElementById("pupilL");
  const pupilR = document.getElementById("pupilR");
  const bubble = document.getElementById("bubble");
  const bubbleText = document.getElementById("bubbleText");

  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // ?static: final state without animations (for screenshots / social cards)
  const PARAMS = new URLSearchParams(location.search);
  const STATIC = PARAMS.has("static");

  // ---------- localization ----------
  const I18N = {
    tr: {
      title: "stera studio — oyunlar yapıyoruz",
      desc: "stera studio: bağımsız bir oyun stüdyosu. ilk oyunumuz üzerinde çalışıyoruz.",
      dom: {
        "nav.games": "oyunlar", "nav.about": "hakkımızda", "nav.contact": "iletişim", "nav.minigame": "minigame",
        "tagline": "oyunlar yapıyoruz.", "hint": "kaydır ↓",
        "games.h": "oyunlar",
        "games.lead": "ilk oyunumuz üzerinde çalışıyoruz. şimdilik bu kadarını söyleyebiliriz:",
        "soon": "yakında", "verysoon": "çok yakında",
        "about.h": "hakkımızda",
        "about.lead": "stera studio, küçük ama iddialı bağımsız bir oyun stüdyosu. az kişiyiz, çok hayalimiz var. oynaması kadar yapması da keyifli oyunlar peşindeyiz — detaylar yakında.",
        "contact.h": "iletişim",
        "contact.lead": "bir fikriniz mi var? sadece merhaba mı demek istediniz?",
        "footer": "© 2026 stera studio — logomuz canlıdır, nazik olun.",
        "mg.h": "minigame",
        "mg.lead": "henüz bir oyunumuz yok ama siz sıkılmayın diye küçük bir şey hazırladık.",
        "mg.btn": "oyuna atla",
        "mg.score": "skor",
        "mg.best": "rekor",
        "mg.again": "tekrar",
        "mg.exit": "çık",
      },
      intro: "merhaba, biz stera.",
      poke: ["hihi.", "bir daha!", "gıdıklanıyorum.", "bunu sevdim.", "hey!"],
      dizzy: "of… başım döndü.",
      bored: "sıkıldım…",
      sleep: "zZz…",
      mgGo: "geliyorum!",
      mgOver: "yakalandım…",
      mgFall: "aaa… düştüm.",
      mgBye: "iyi oyundu!",
      mgWarn: "eyvah, geliyorlar!",
      mgJump: "zıpla! (boşluk / dokun)",
      mgQuips: ["beni yakalayamazsınız!", "yukarı, hep yukarı!", "daha hızlı!", "tırmanmaya devam!"],
      sections: {
        games: "oyunlarımız… yakında. söz.",
        about: "evet, bunlar biziz.",
        contact: "bize yazın, cevap veririz!",
        minigame: "sıkıldınız mı? aşağıya bakın.",
      },
    },
    en: {
      title: "stera studio — we make games",
      desc: "stera studio: an independent game studio. we're working on our first game.",
      dom: {
        "nav.games": "games", "nav.about": "about", "nav.contact": "contact", "nav.minigame": "minigame",
        "tagline": "we make games.", "hint": "scroll ↓",
        "games.h": "games",
        "games.lead": "we're working on our first game. this is all we can say for now:",
        "soon": "soon", "verysoon": "very soon",
        "about.h": "about",
        "about.lead": "stera studio is a small but ambitious independent game studio. few people, many dreams. we chase games that are as fun to make as they are to play — details soon.",
        "contact.h": "contact",
        "contact.lead": "got an idea? or just wanted to say hi?",
        "footer": "© 2026 stera studio — our logo is alive, please be gentle.",
        "mg.h": "minigame",
        "mg.lead": "we don't have a game yet, but we made a little something so you don't get bored.",
        "mg.btn": "jump in",
        "mg.score": "score",
        "mg.best": "best",
        "mg.again": "again",
        "mg.exit": "exit",
      },
      intro: "hi, we're stera.",
      poke: ["hehe.", "again!", "that tickles.", "i liked that.", "hey!"],
      dizzy: "whoa… my head is spinning.",
      bored: "i'm bored…",
      sleep: "zZz…",
      mgGo: "here i come!",
      mgOver: "they got me…",
      mgFall: "aaah… i fell.",
      mgBye: "good game!",
      mgWarn: "uh oh, they're coming!",
      mgJump: "jump! (space / tap)",
      mgQuips: ["can't catch me!", "up, always up!", "faster!", "keep climbing!"],
      sections: {
        games: "our games… soon. promise.",
        about: "yep, that's us.",
        contact: "write to us — we reply!",
        minigame: "bored? look below.",
      },
    },
  };

  let lang =
    PARAMS.get("lang") ||
    localStorage.getItem("stera-lang") ||
    ((navigator.language || "en").toLowerCase().startsWith("tr") ? "tr" : "en");
  if (!I18N[lang]) lang = "en";
  let L = I18N[lang];

  const langBtn = document.getElementById("langBtn");

  function applyLang(l) {
    lang = l;
    L = I18N[l];
    try { localStorage.setItem("stera-lang", l); } catch (e) {}
    document.documentElement.lang = l;
    document.title = L.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", L.desc);
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const t = L.dom[el.dataset.i18n];
      if (t) el.textContent = t;
    });
    langBtn.textContent = l;
  }
  applyLang(lang);
  langBtn.addEventListener("click", () => applyLang(lang === "tr" ? "en" : "tr"));

  // ---------- state ----------
  const S = {
    x: innerWidth / 2, y: innerHeight * 0.42, size: 100,
    lean: 0, spin: 0, spinExtra: 0, spinExtraTarget: 0,
    squash: { v: 0, vel: 0 },
    hop: { v: 0, vel: 0 },
  };
  let pointerX = innerWidth / 2, pointerY = innerHeight * 0.42;
  let lastActive = Date.now();
  let introDone = false;
  let pokeTimes = [];

  const EYES = [
    { ex: 218, ey: 150, el: pupilL },
    { ex: 282, ey: 150, el: pupilR },
  ];

  // ---------- springs ----------
  function stepSpring(s, k = 0.18, damp = 0.8) {
    s.vel += -s.v * k;
    s.vel *= damp;
    s.v += s.vel;
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => t * t * (3 - 2 * t);

  // ---------- audio (chime greeting) ----------
  let ac = null;
  function ensureAudio() {
    if (!ac) {
      try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
  }
  function note(freq, delay = 0, dur = 0.22, vol = 0.06) {
    if (!ac) return;
    const t = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }
  const PENTA = [392, 440, 523.25, 587.33, 659.25, 783.99];

  // ---------- speech bubble ----------
  let typeTimer = null, hideTimer = null;
  function say(text, holdMs = 2400) {
    clearInterval(typeTimer);
    clearTimeout(hideTimer);
    bubble.classList.add("show");
    bubbleText.textContent = "";
    let i = 0;
    typeTimer = setInterval(() => {
      bubbleText.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(typeTimer);
    }, 26);
    if (holdMs !== Infinity) {
      hideTimer = setTimeout(() => bubble.classList.remove("show"), holdMs + text.length * 26);
    }
  }

  // ---------- blinking ----------
  function scheduleBlink() {
    setTimeout(() => {
      if (mascot.dataset.state === "awake" && mascot.dataset.eyes === "open") {
        mascot.dataset.eyes = "closed";
        setTimeout(() => {
          if (mascot.dataset.state === "awake") mascot.dataset.eyes = "open";
        }, 130);
      }
      scheduleBlink();
    }, 2500 + Math.random() * 4000);
  }

  // ---------- sleep / boredom ----------
  function wake() {
    lastActive = Date.now();
    if (mascot.dataset.state === "sleep") {
      mascot.dataset.state = "awake";
      mascot.dataset.eyes = "open";
      S.hop.vel -= 7;
      say("!", 900);
    } else if (mascot.dataset.state === "bored") {
      mascot.dataset.state = "awake";
    }
  }

  // ---------- poking ----------
  let pokeIdx = 0;

  function particles(x, y) {
    for (let i = 0; i < 10; i++) {
      const el = document.createElement("div");
      el.className = "pt " + ["round", "tri", ""][i % 3];
      el.style.left = x + "px";
      el.style.top = y + "px";
      document.body.appendChild(el);
      const a = Math.random() * Math.PI * 2;
      const d = 40 + Math.random() * 70;
      el.animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d}px) rotate(${Math.random() * 360}deg) scale(0.15)`, opacity: 0 },
        ],
        { duration: 450 + Math.random() * 350, easing: "cubic-bezier(0.1, 0.8, 0.3, 1)" }
      ).onfinish = () => el.remove();
    }
  }

  function poke(x, y) {
    if (G.mode === "playing") { doJump(); return; }
    if (G.mode !== "off") return;
    wake();
    ensureAudio();
    S.squash.vel += 0.16;
    particles(x, y);
    note(PENTA[Math.floor(Math.random() * PENTA.length)]);
    note(PENTA[Math.floor(Math.random() * PENTA.length)] * 1.5, 0.07);

    mascot.dataset.eyes = "happy";
    setTimeout(() => {
      if (mascot.dataset.state === "awake") mascot.dataset.eyes = "open";
    }, 420);

    const now = Date.now();
    pokeTimes = pokeTimes.filter((t) => now - t < 2200);
    pokeTimes.push(now);
    if (pokeTimes.length >= 6) {
      pokeTimes = [];
      S.spinExtraTarget += 360;
      say(L.dizzy, 2200);
    } else {
      say(L.poke[pokeIdx++ % L.poke.length], 1400);
    }
  }

  svg.addEventListener("pointerdown", (e) => poke(e.clientX, e.clientY));

  // ---------- input tracking ----------
  addEventListener("pointermove", (e) => {
    pointerX = e.clientX;
    pointerY = e.clientY;
    wake();
  }, { passive: true });
  addEventListener("scroll", wake, { passive: true });
  addEventListener("pointerdown", ensureAudio, { once: true });

  // ---------- section messages ----------
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting && introDone && G.mode === "off" && scrollY > innerHeight * 0.4) {
          S.hop.vel -= 6;
          const msg = L.sections[en.target.id];
          if (msg) say(msg, 2600);
          if (en.target.id === "contact") {
            eyeL.classList.add("wink");
            setTimeout(() => eyeL.classList.remove("wink"), 500);
          }
        }
      });
    },
    { threshold: 0.45 }
  );
  document.querySelectorAll("main section").forEach((s) => io.observe(s));

  // ---------- minigame: stera chase ----------
  // auto-runner on climbing terrain: jump over spikes and up walls,
  // roll under floating blocks, and stay ahead of the chasing storm.
  const mgSection = document.getElementById("minigame");
  const gameBox = document.getElementById("gameBox");
  const gameField = document.getElementById("gameField");
  const terrainSvg = document.getElementById("terrainSvg");
  const terrainPath = document.getElementById("terrainPath");
  const spikePath = document.getElementById("spikePath");
  const chaserEl = document.getElementById("chaser");
  const hudScore = document.getElementById("hudScore");
  const hudBest = document.getElementById("hudBest");
  const ovScore = document.getElementById("ovScore");
  const ovBest = document.getElementById("ovBest");
  const jumpInBtn = document.getElementById("jumpInBtn");
  const againBtn = document.getElementById("againBtn");
  const exitBtn = document.getElementById("exitBtn");

  const GRAV = 2200, JUMP_V = 830;         // px/s^2, px/s (apex ~157px)
  const BASE_SPEED = 260, MAX_SPEED = 500; // forward speed ramp
  const TSTEP = 8;                          // terrain sample spacing
  const WALK = 15, DROP = 18;               // max walkable rise / step-off drop per sample
  const PX_PER_M = 40, CATCH_GAP = 30;

  const G = {
    mode: "off", // off | entering | playing | over
    score: 0, milestone: 0,
    best: parseInt(localStorage.getItem("stera-chase-best") || "0", 10) || 0,
    w: 0, h: 0, time: 0,
    X: 0, y: 0, vy: 0, speed: 0,
    grounded: true, coyote: 0, jumpBuf: 0,
    stun: 0, inv: 0, blockedT: 0, hinted: false, warnCd: 0,
    chX: 0, chY: 0,
    camX: 0, camY: 0,
    pts: [], genX: 0, justWall: false, lastTrapX: 0,
    traps: [], decos: [], decoT: 0,
    minions: [], minionT: 0,
    pits: [], groundRef: 0,
  };
  hudBest.textContent = G.best + "m";

  function terrainY(x) {
    const pts = G.pts;
    if (pts.length < 2) return 0;
    const i = clamp(Math.floor((x - pts[0].x) / TSTEP), 0, pts.length - 2);
    const a = pts[i], b = pts[i + 1];
    const t = clamp((x - a.x) / TSTEP, 0, 1);
    return a.y + (b.y - a.y) * t;
  }

  function addTrap(x, type) {
    const w = type === "spike" ? 46 + Math.random() * 24 : 40 + Math.random() * 24;
    let el = null;
    if (type === "block") {
      // floating blocks get a DOM element; spikes are drawn into the terrain svg
      el = document.createElement("div");
      el.className = "trap block";
      el.style.width = w + "px";
      gameField.appendChild(el);
    }
    G.traps.push({ x, w, ty: terrainY(x + w / 2), type, el });
    G.lastTrapX = x;
  }

  function spawnMinion() {
    const el = document.createElement("div");
    el.className = "minion";
    el.innerHTML =
      '<svg viewBox="0 0 40 40">' +
      '<circle class="cloud" cx="20" cy="22" r="14"/>' +
      '<circle class="ceye" cx="15" cy="20" r="3.4"/><circle class="ceye" cx="25" cy="20" r="3.4"/>' +
      "</svg>";
    gameField.appendChild(el);
    G.minions.push({ x: G.camX + G.w + 80, speed: 110 + Math.random() * 80, phase: Math.random() * 6, el });
  }

  function genTerrain(toX) {
    while (G.genX < toX) {
      const segX = G.genX;
      const prevY = G.pts.length ? G.pts[G.pts.length - 1].y : 0;
      const roll = Math.random();
      let type =
        roll < 0.28 ? "flat" :
        roll < 0.58 ? "hill" :
        roll < 0.72 ? "down" :
        roll < 0.93 ? "wall" : "gap";
      if (G.justWall || G.pts.length < 2) type = "flat";
      if (type === "gap" && segX < 500) type = "hill";
      G.justWall = false;

      if (type === "flat") {
        const n = 12 + Math.floor(Math.random() * 14);
        for (let i = 0; i < n; i++) { G.pts.push({ x: G.genX, y: prevY }); G.genX += TSTEP; }
      } else if (type === "hill") {
        const n = 20 + Math.floor(Math.random() * 15);
        const rise = 50 + Math.random() * 70;
        for (let i = 1; i <= n; i++) {
          const t = i / n;
          G.pts.push({ x: G.genX, y: prevY - rise * (1 - Math.cos(Math.PI * t)) / 2 });
          G.genX += TSTEP;
        }
      } else if (type === "down") {
        const n = 15 + Math.floor(Math.random() * 12);
        const drop = 20 + Math.random() * 45;
        for (let i = 1; i <= n; i++) {
          const t = i / n;
          G.pts.push({ x: G.genX, y: prevY + drop * (1 - Math.cos(Math.PI * t)) / 2 });
          G.genX += TSTEP;
        }
      } else if (type === "wall") {
        // wall: a sharp step up that has to be jumped
        const rise = 72 + Math.random() * 38;
        G.pts.push({ x: G.genX, y: prevY - rise * 0.5 }); G.genX += TSTEP;
        G.pts.push({ x: G.genX, y: prevY - rise }); G.genX += TSTEP;
        G.justWall = true;
      } else {
        // gap: a deep pit that has to be cleared with a jump
        const gw = 70 + Math.random() * 60;
        const depth = 260;
        const x0 = G.genX;
        const n = Math.ceil(gw / TSTEP);
        for (let i = 0; i < n; i++) {
          G.pts.push({ x: G.genX, y: prevY + depth });
          G.genX += TSTEP;
        }
        const farY = prevY - Math.random() * 20;
        G.pts.push({ x: G.genX, y: farY });
        G.genX += TSTEP;
        G.pits.push({ x0, x1: G.genX - TSTEP, top: prevY });
        G.justWall = true;
      }

      // traps live on calm ground only, never right after a wall
      if ((type === "flat" || type === "hill") && G.mode !== "off" &&
          segX > G.X + 300 && segX - G.lastTrapX > 280 && Math.random() < 0.34) {
        addTrap(segX + 30 + Math.random() * 40, type === "flat" && Math.random() < 0.45 ? "block" : "spike");
      }
    }
  }

  function addDeco() {
    const depth = Math.random() < 0.5 ? 0.3 : 0.55;
    const kind = ["q", "circle", "tri"][Math.floor(Math.random() * 3)];
    const size = (kind === "q" ? 30 : 22) * (depth + 0.5) + Math.random() * 14;
    const el = document.createElement("div");
    el.className = "deco " + kind;
    if (kind === "q") {
      el.textContent = "?";
      el.style.fontSize = size + "px";
    } else {
      el.style.width = size + "px";
      el.style.height = size + "px";
    }
    el.style.opacity = (depth * 0.16).toFixed(2);
    gameField.appendChild(el);
    G.decos.push({ wx: G.camX * depth + G.w + 60, fy: 0.04 + Math.random() * 0.42, depth, el });
  }

  function clearWorld() {
    G.traps.forEach((t) => t.el && t.el.remove());
    G.decos.forEach((d) => d.el.remove());
    G.minions.forEach((m) => m.el.remove());
    G.traps = []; G.decos = []; G.minions = []; G.pts = []; G.pits = [];
  }

  function initWorld() {
    const r = gameBox.getBoundingClientRect();
    G.w = r.width; G.h = r.height;
    clearWorld();
    G.time = 0;
    G.score = 0; G.milestone = 0;
    G.X = 0; G.vy = 0; G.grounded = true;
    G.coyote = 0; G.jumpBuf = 0;
    G.stun = 0; G.inv = 0; G.blockedT = 0; G.hinted = false; G.warnCd = 0;
    G.speed = BASE_SPEED;
    G.genX = -G.w; G.justWall = false; G.lastTrapX = 0;
    genTerrain(G.w + 400);
    G.y = terrainY(0) - S.size * 0.34;
    G.groundRef = terrainY(0);
    G.camX = -G.w * 0.34;
    G.camY = terrainY(0) - G.h * 0.62;
    G.chX = -280;
    G.chY = G.camY + G.h * 0.4;
    G.decoT = 0;
    G.minionT = 6;
    gameBox.classList.remove("over");
    hudScore.textContent = "0m";
    mascot.dataset.state = "awake";
    mascot.dataset.eyes = "open";
  }

  function enterGame() {
    if (G.mode !== "off") return;
    ensureAudio();
    wake();
    mgSection.dataset.game = "on";
    initWorld();
    G.mode = "entering";
    S.hop.vel -= 6;
    say(L.mgGo, 1400);
    note(PENTA[0]); note(PENTA[2], 0.09); note(PENTA[4], 0.18);
  }

  function restartRun() {
    initWorld();
    G.mode = "entering";
  }

  function doJump() {
    if (G.mode !== "playing" || G.stun > 0) return;
    if (G.grounded || G.coyote > 0) {
      G.grounded = false;
      G.coyote = 0;
      G.vy = -JUMP_V;
      S.squash.vel -= 0.1;
      note(PENTA[3], 0, 0.12, 0.045);
    } else {
      G.jumpBuf = 0.12;
    }
  }

  function stunPlayer() {
    G.stun = 0.55;
    G.inv = 1.2;
    G.X -= 24;
    if (G.vy < 0) G.vy = 120;
    S.squash.vel += 0.2;
    particles(S.x, S.y);
    note(160, 0, 0.25, 0.06);
    mascot.dataset.eyes = "dizzy";
    setTimeout(() => { if (G.mode === "playing") mascot.dataset.eyes = "open"; }, 550);
  }

  function endRun(msg) {
    G.mode = "over";
    mascot.dataset.eyes = "dizzy";
    say(msg || L.mgOver, 2600);
    note(392, 0, 0.16, 0.05); note(330, 0.12, 0.16, 0.05); note(262, 0.24, 0.3, 0.05);
    if (!RM) {
      gameBox.classList.add("shake");
      setTimeout(() => gameBox.classList.remove("shake"), 500);
    }
    if (G.score > G.best) {
      G.best = G.score;
      try { localStorage.setItem("stera-chase-best", String(G.best)); } catch (e) {}
    }
    ovScore.textContent = G.score + "m";
    ovBest.textContent = G.best + "m";
    hudBest.textContent = G.best + "m";
    setTimeout(() => { if (G.mode === "over") gameBox.classList.add("over"); }, 350);
  }

  function exitGame() {
    G.mode = "off";
    mgSection.dataset.game = "off";
    gameBox.classList.remove("over");
    clearWorld();
    terrainPath.setAttribute("d", "");
    spikePath.setAttribute("d", "");
    mascot.dataset.eyes = "open";
    // fold the accumulated game spin into the scroll-driven target to avoid a big unwind
    const fold = Math.round((S.spin - scrollY * 0.15) / 360) * 360;
    S.spinExtra = fold;
    S.spinExtraTarget = fold;
    lastActive = Date.now();
    say(L.mgBye, 1800);
  }

  function drawWorld(r) {
    if (terrainSvg.getAttribute("width") !== String(Math.round(G.w))) {
      terrainSvg.setAttribute("width", Math.round(G.w));
      terrainSvg.setAttribute("height", Math.round(G.h));
    }
    let d = "";
    const x0 = Math.floor(G.camX / TSTEP) * TSTEP;
    for (let x = x0; x <= G.camX + G.w + TSTEP; x += TSTEP) {
      d += (d ? "L" : "M") + (x - G.camX).toFixed(1) + " " + (terrainY(x) - G.camY).toFixed(1) + " ";
    }
    d += `L${G.w + 20} ${G.h + 20} L-20 ${G.h + 20} Z`;
    terrainPath.setAttribute("d", d);

    let sd = "";
    for (let i = G.traps.length - 1; i >= 0; i--) {
      const t = G.traps[i];
      if (t.x + t.w < G.camX - 60) {
        if (t.el) t.el.remove();
        G.traps.splice(i, 1);
        continue;
      }
      if (t.type === "block") {
        t.el.style.transform = `translate(${(t.x - G.camX).toFixed(1)}px, ${(t.ty - 78 - G.camY).toFixed(1)}px)`;
      } else {
        // spike teeth conform to the terrain line
        const n = Math.max(3, Math.round(t.w / 13));
        const tw = t.w / n;
        for (let k = 0; k < n; k++) {
          const ax = t.x + k * tw, bx = ax + tw, mx = ax + tw / 2;
          sd +=
            `M${(ax - G.camX).toFixed(1)} ${(terrainY(ax) - G.camY + 1).toFixed(1)}` +
            `L${(mx - G.camX).toFixed(1)} ${(terrainY(mx) - 15 - G.camY).toFixed(1)}` +
            `L${(bx - G.camX).toFixed(1)} ${(terrainY(bx) - G.camY + 1).toFixed(1)}Z`;
        }
      }
    }
    spikePath.setAttribute("d", sd);

    const tNow = performance.now();
    for (const mn of G.minions) {
      const my = (mn.y === undefined ? terrainY(mn.x) - 13 : mn.y) - 13 + Math.sin(tNow / 130 + mn.phase) * 2;
      mn.el.style.transform = `translate(${(mn.x - G.camX - 15).toFixed(1)}px, ${(my - G.camY).toFixed(1)}px)`;
    }

    for (let i = G.decos.length - 1; i >= 0; i--) {
      const dd = G.decos[i];
      const sx = dd.wx - G.camX * dd.depth;
      if (sx < -80) {
        dd.el.remove();
        G.decos.splice(i, 1);
        continue;
      }
      dd.el.style.transform = `translate(${sx.toFixed(1)}px, ${(dd.fy * G.h).toFixed(1)}px)`;
    }

    const chSy = G.chY - G.camY;
    chaserEl.style.transform = `translate(${(G.chX - G.camX - 40).toFixed(1)}px, ${(chSy - 40).toFixed(1)}px)`;
  }

  function gameStep(dt) {
    const r = gameBox.getBoundingClientRect();
    const psize = clamp(r.height * 0.14, 40, 56);
    S.size += (psize - S.size) * 0.18;
    const pr = S.size * 0.34;

    if (G.mode === "entering") {
      const tx = r.left + G.w * 0.34;
      const ty = r.top + (G.y - G.camY);
      S.x += (tx - S.x) * 0.09;
      S.y += (ty - S.y) * 0.09;
      S.lean += (0 - S.lean) * 0.1;
      S.spin += 300 * dt;
      drawWorld(r);
      if (Math.abs(tx - S.x) < 5 && Math.abs(ty - S.y) < 5) G.mode = "playing";
      return;
    }

    if (G.mode === "over") {
      S.x = r.left + (G.X - G.camX);
      S.y = r.top + (G.y - G.camY);
      S.lean += (0 - S.lean) * 0.1;
      drawWorld(r);
      return;
    }

    // playing
    G.w = r.width; G.h = r.height;
    G.time += dt;
    G.speed = Math.min(MAX_SPEED, BASE_SPEED + G.time * 6);
    G.stun = Math.max(0, G.stun - dt);
    G.inv = Math.max(0, G.inv - dt);
    G.coyote = Math.max(0, G.coyote - dt);
    G.jumpBuf = Math.max(0, G.jumpBuf - dt);
    G.warnCd = Math.max(0, G.warnCd - dt);

    // forward motion + terrain following
    let move = G.stun > 0 ? 0 : G.speed * dt;
    let blocked = false;
    const nx = G.X + move;
    const g = terrainY(nx);
    if (G.grounded) {
      if (G.y + pr - g > WALK) {
        // wall in front: stop and wait for a jump
        blocked = true;
      } else {
        G.X = nx;
        if (g - pr - G.y > DROP) {
          G.grounded = false;
          G.vy = 0;
          G.coyote = 0.09;
        } else {
          G.y = g - pr;
          G.groundRef = g;
        }
      }
    } else {
      if (G.y < g - pr + 2) G.X = nx;
      else blocked = true;
      G.y += G.vy * dt;
      G.vy += GRAV * dt;
      const g2 = terrainY(G.X);
      if (G.vy > 0 && G.y >= g2 - pr) {
        G.y = g2 - pr;
        G.vy = 0;
        G.grounded = true;
        G.groundRef = g2;
        S.squash.vel += 0.12;
        note(PENTA[0], 0, 0.07, 0.025);
        if (G.jumpBuf > 0) { G.jumpBuf = 0; doJump(); }
      }
    }
    if (blocked && G.grounded) {
      G.blockedT += dt;
      if (G.blockedT > 0.25 && !G.hinted) {
        G.hinted = true;
        say(L.mgJump, 2000);
      }
    } else {
      G.blockedT = 0;
    }

    // traps
    if (G.inv <= 0) {
      for (const t of G.traps) {
        if (t.type === "spike") {
          // terrain-relative: hit when over the strip and close to the ground
          if (G.X > t.x - 6 && G.X < t.x + t.w + 6 && G.y + pr > terrainY(G.X) - 19) {
            stunPlayer();
            break;
          }
        } else {
          const top = t.ty - 78, bot = t.ty - 62;
          const cx = clamp(G.X, t.x, t.x + t.w);
          const cy = clamp(G.y, top, bot);
          const dx = G.X - cx, dy = G.y - cy;
          if (dx * dx + dy * dy < pr * pr) {
            stunPlayer();
            break;
          }
        }
      }
    }

    // minion scouts running in from ahead — jump over them
    G.minionT -= dt;
    if (G.minionT <= 0) {
      G.minionT = Math.max(3.5, 9 - G.time * 0.08) + Math.random() * 2;
      spawnMinion();
    }
    for (let i = G.minions.length - 1; i >= 0; i--) {
      const mn = G.minions[i];
      mn.x -= mn.speed * dt;
      if (mn.x < G.camX - 80) {
        mn.el.remove();
        G.minions.splice(i, 1);
        continue;
      }
      const gy = terrainY(mn.x) - 13;
      mn.y = mn.y === undefined ? gy : mn.y + (gy - mn.y) * Math.min(1, 12 * dt);
      if (G.inv <= 0) {
        const dx = G.X - mn.x, dy = G.y - mn.y;
        if (dx * dx + dy * dy < (pr + 11) * (pr + 11)) stunPlayer();
      }
    }

    // the chasing storm: rubber-banded to a shrinking target gap
    const target = Math.max(170, 320 - G.time * 2);
    const gap = G.X - G.chX;
    const cs = clamp(G.speed + (gap - target) * 0.5, 60, G.speed + 260);
    G.chX += cs * dt;
    G.chY += (terrainY(G.chX) - 74 - G.chY) * Math.min(1, 5 * dt);
    if (gap < 160 && G.warnCd <= 0) {
      G.warnCd = 6;
      say(L.mgWarn, 1600);
    }
    if (gap <= CATCH_GAP) {
      drawWorld(r);
      endRun();
      return;
    }

    // falling into a pit
    for (const p of G.pits) {
      if (G.X > p.x0 && G.X < p.x1 && G.y > p.top + 70) {
        drawWorld(r);
        endRun(L.mgFall);
        return;
      }
    }

    // camera: rigid horizontally, smooth vertically; follows the last solid
    // ground (groundRef) so it doesn't dive into pits mid-jump
    G.camX = G.X - G.w * 0.34;
    G.camY += (G.groundRef - G.h * 0.62 - G.camY) * Math.min(1, 6 * dt);
    genTerrain(G.camX + G.w + 400);
    while (G.pts.length > 2 && G.pts[1].x < G.camX - 320) G.pts.shift();
    while (G.pits.length && G.pits[0].x1 < G.camX - 400) G.pits.shift();

    // parallax decor
    G.decoT -= dt;
    if (G.decoT <= 0) {
      G.decoT = 0.5 + Math.random() * 0.7;
      addDeco();
    }

    // score + quips
    const m = Math.floor(G.X / PX_PER_M);
    if (m > G.score) {
      G.score = m;
      hudScore.textContent = m + "m";
    }
    if (G.score - G.milestone >= 100) {
      G.milestone = G.score;
      say(L.mgQuips[Math.floor(Math.random() * L.mgQuips.length)], 1600);
      note(PENTA[4], 0, 0.1, 0.04); note(PENTA[5], 0.08, 0.14, 0.04);
    }

    drawWorld(r);

    // map the player onto the mascot
    S.x = r.left + (G.X - G.camX);
    S.y = r.top + (G.y - G.camY);
    const rollV = G.grounded && !blocked && G.stun <= 0 ? G.speed : G.speed * 0.35;
    S.spin += ((rollV * dt) / (Math.PI * S.size)) * 360;
    const leanT = blocked ? -10 : clamp(G.speed * 0.02, 0, 10);
    S.lean += (leanT - S.lean) * 0.12;
  }

  jumpInBtn.addEventListener("click", enterGame);
  againBtn.addEventListener("click", restartRun);
  exitBtn.addEventListener("click", exitGame);
  gameBox.addEventListener("pointerdown", () => {
    if (G.mode === "playing") doJump();
  });
  addEventListener("keydown", (e) => {
    if (G.mode === "playing" && (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW")) {
      e.preventDefault();
      doJump();
    } else if (G.mode === "over" && e.code === "Space") {
      e.preventDefault();
      restartRun();
    }
  });

  // ---------- pupils ----------
  function updatePupils() {
    const k = S.size / 500;
    const rot = ((S.spin + S.lean) * Math.PI) / 180;
    const cos = Math.cos(rot), sin = Math.sin(rot);
    EYES.forEach(({ ex, ey, el }) => {
      const lx = (ex - 250) * k, ly = (ey - 250) * k;
      const sxp = S.x + lx * cos - ly * sin;
      const syp = S.y + lx * sin + ly * cos;
      const dx = pointerX - sxp, dy = pointerY - syp;
      const dist = Math.hypot(dx, dy);
      const mag = Math.min(6.5, dist * 0.06);
      const ang = Math.atan2(dy, dx) - rot;
      el.setAttribute("transform", `translate(${(Math.cos(ang) * mag).toFixed(2)} ${(Math.sin(ang) * mag).toFixed(2)})`);
    });
  }

  // ---------- main loop ----------
  let lastFrameT = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - lastFrameT) / 1000));
    lastFrameT = now;

    if (G.mode !== "off") {
      gameStep(dt);
    } else {
      const heroH = innerHeight * 0.8;
      const p = ease(clamp(scrollY / heroH, 0, 1));

      const sizeHero = Math.min(innerWidth, innerHeight) * 0.52;
      const sizeDock = Math.max(72, sizeHero * 0.17);
      S.size = lerp(sizeHero, sizeDock, p);

      const dockX = 32 + sizeDock / 2;
      const dockY = innerHeight * 0.85;
      const tx = lerp(innerWidth / 2, dockX, p);
      const ty = lerp(innerHeight * 0.42, dockY, p);

      // follow feel: ease toward the target
      S.x += (tx - S.x) * 0.14;
      S.y += (ty - S.y) * 0.14;

      // slight lean toward the pointer
      const leanT = introDone ? clamp((pointerX - S.x) * 0.012, -6, 6) * (1 - p * 0.6) : 0;
      S.lean += (leanT - S.lean) * 0.08;

      // rolling with scroll
      S.spinExtra += (S.spinExtraTarget - S.spinExtra) * 0.1;
      const spinT = (RM ? 0 : scrollY * 0.15) + S.spinExtra;
      S.spin += (spinT - S.spin) * 0.12;
    }

    stepSpring(S.squash, 0.18, 0.8);
    stepSpring(S.hop, 0.12, 0.82);
    const sq = clamp(S.squash.v, -0.3, 0.3);

    mascot.style.transform = `translate3d(${S.x.toFixed(1)}px, ${(S.y + S.hop.v).toFixed(1)}px, 0)`;
    stage.style.width = stage.style.height = S.size.toFixed(1) + "px";
    stage.style.transform = `translate(-50%,-50%) rotate(${S.lean.toFixed(2)}deg) scale(${(1 + sq).toFixed(3)}, ${(1 - sq).toFixed(3)})`;
    svg.style.transform = `rotate(${S.spin.toFixed(2)}deg)`;

    bubble.style.left = (S.size * 0.34).toFixed(0) + "px";
    bubble.style.top = (-S.size * 0.58).toFixed(0) + "px";

    updatePupils();

    // boredom / sleep
    if (introDone && G.mode === "off") {
      const idle = Date.now() - lastActive;
      const st = mascot.dataset.state;
      if (idle > 26000 && st !== "sleep") {
        mascot.dataset.state = "sleep";
        mascot.dataset.eyes = "closed";
        say(L.sleep, Infinity);
      } else if (idle > 12000 && st === "awake") {
        mascot.dataset.state = "bored";
        say(L.bored, 2000);
      }
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- intro ----------
  if (STATIC) {
    document.querySelectorAll(".half").forEach((h) => (h.style.transition = "none"));
    face.style.transition = "none";
    svg.classList.add("assembled");
    face.classList.add("faceIn");
    introDone = true;
    const sc = parseFloat(PARAMS.get("scrollto") || "0");
    if (sc) scrollTo(0, sc);
    if (PARAMS.has("nohero")) document.querySelector(".hero").style.display = "none";
    if (PARAMS.has("nomascot")) mascot.style.display = "none";
  } else {
    setTimeout(() => svg.classList.add("assembled"), RM ? 0 : 250);
    setTimeout(() => { S.squash.vel += 0.12; }, RM ? 0 : 1150);   // "splat"
    setTimeout(() => face.classList.add("faceIn"), RM ? 100 : 1350);
    setTimeout(() => {
      introDone = true;
      lastActive = Date.now();
      say(L.intro, 2800);
      scheduleBlink();
    }, RM ? 200 : 1700);
  }
})();
