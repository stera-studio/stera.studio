/* stera studio — yaşayan logo */
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
  // ?static: animasyonsuz son hal (ekran görüntüsü / sosyal kart için)
  const PARAMS = new URLSearchParams(location.search);
  const STATIC = PARAMS.has("static");

  // ---------- durum ----------
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

  // ---------- yaylar ----------
  function stepSpring(s, k = 0.18, damp = 0.8) {
    s.vel += -s.v * k;
    s.vel *= damp;
    s.v += s.vel;
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (t) => t * t * (3 - 2 * t);

  // ---------- ses (chimes selamı) ----------
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

  // ---------- konuşma balonu ----------
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

  // ---------- göz kırpma ----------
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

  // ---------- uyku / sıkılma ----------
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

  // ---------- dürtme ----------
  const POKE_MSGS = ["hihi.", "bir daha!", "gıdıklanıyorum.", "bunu sevdim.", "hey!"];
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
      say("of… başım döndü.", 2200);
    } else {
      say(POKE_MSGS[pokeIdx++ % POKE_MSGS.length], 1400);
    }
  }

  svg.addEventListener("pointerdown", (e) => poke(e.clientX, e.clientY));

  // ---------- girdi takibi ----------
  addEventListener("pointermove", (e) => {
    pointerX = e.clientX;
    pointerY = e.clientY;
    wake();
  }, { passive: true });
  addEventListener("scroll", wake, { passive: true });
  addEventListener("pointerdown", ensureAudio, { once: true });

  // ---------- bölüm mesajları ----------
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting && introDone && scrollY > innerHeight * 0.4) {
          S.hop.vel -= 6;
          say(en.target.dataset.msg, 2600);
          if (en.target.id === "iletisim") {
            eyeL.classList.add("wink");
            setTimeout(() => eyeL.classList.remove("wink"), 500);
          }
        }
      });
    },
    { threshold: 0.45 }
  );
  document.querySelectorAll("section[data-msg]").forEach((s) => io.observe(s));

  // ---------- gözbebekleri ----------
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

  // ---------- ana döngü ----------
  function frame() {
    const heroH = innerHeight * 0.8;
    const p = ease(clamp(scrollY / heroH, 0, 1));

    const sizeHero = Math.min(innerWidth, innerHeight) * 0.52;
    const sizeDock = Math.max(72, sizeHero * 0.17);
    S.size = lerp(sizeHero, sizeDock, p);

    const dockX = 32 + sizeDock / 2;
    const dockY = innerHeight * 0.85;
    const tx = lerp(innerWidth / 2, dockX, p);
    const ty = lerp(innerHeight * 0.42, dockY, p);

    // peşinden gelme hissi: hedefe yumuşak yaklaş
    S.x += (tx - S.x) * 0.14;
    S.y += (ty - S.y) * 0.14;

    // imlece doğru hafif eğilme
    const leanT = introDone ? clamp((pointerX - S.x) * 0.012, -6, 6) * (1 - p * 0.6) : 0;
    S.lean += (leanT - S.lean) * 0.08;

    // scroll ile yuvarlanma
    S.spinExtra += (S.spinExtraTarget - S.spinExtra) * 0.1;
    const spinT = (RM ? 0 : scrollY * 0.15) + S.spinExtra;
    S.spin += (spinT - S.spin) * 0.12;

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

    // sıkılma / uyku
    if (introDone) {
      const idle = Date.now() - lastActive;
      const st = mascot.dataset.state;
      if (idle > 26000 && st !== "sleep") {
        mascot.dataset.state = "sleep";
        mascot.dataset.eyes = "closed";
        say("zZz…", Infinity);
      } else if (idle > 12000 && st === "awake") {
        mascot.dataset.state = "bored";
        say("sıkıldım…", 2000);
      }
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- açılış ----------
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
    setTimeout(() => { S.squash.vel += 0.12; }, RM ? 0 : 1150);   // "şlak"
    setTimeout(() => face.classList.add("faceIn"), RM ? 100 : 1350);
    setTimeout(() => {
      introDone = true;
      lastActive = Date.now();
      say("merhaba, biz stera.", 2800);
      scheduleBlink();
    }, RM ? 200 : 1700);
  }
})();
