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

  // ---------- lokalizasyon ----------
  const I18N = {
    tr: {
      title: "stera studio — oyunlar yapıyoruz",
      desc: "stera studio: bağımsız bir oyun stüdyosu. ilk oyunumuz üzerinde çalışıyoruz.",
      dom: {
        "nav.games": "oyunlar", "nav.about": "hakkımızda", "nav.contact": "iletişim",
        "tagline": "oyunlar yapıyoruz.", "hint": "kaydır ↓",
        "games.h": "oyunlar",
        "games.lead": "ilk oyunumuz üzerinde çalışıyoruz. şimdilik bu kadarını söyleyebiliriz:",
        "soon": "yakında", "verysoon": "çok yakında",
        "about.h": "hakkımızda",
        "about.lead": "stera studio, küçük ama iddialı bağımsız bir oyun stüdyosu. az kişiyiz, çok hayalimiz var. oynaması kadar yapması da keyifli oyunlar peşindeyiz — detaylar yakında.",
        "contact.h": "iletişim",
        "contact.lead": "bir fikriniz mi var? sadece merhaba mı demek istediniz?",
        "footer": "© 2026 stera studio — logomuz canlıdır, nazik olun.",
      },
      intro: "merhaba, biz stera.",
      poke: ["hihi.", "bir daha!", "gıdıklanıyorum.", "bunu sevdim.", "hey!"],
      dizzy: "of… başım döndü.",
      bored: "sıkıldım…",
      sleep: "zZz…",
      sections: {
        oyunlar: "oyunlarımız… yakında. söz.",
        hakkimizda: "evet, bunlar biziz.",
        iletisim: "bize yazın, cevap veririz!",
      },
    },
    en: {
      title: "stera studio — we make games",
      desc: "stera studio: an independent game studio. we're working on our first game.",
      dom: {
        "nav.games": "games", "nav.about": "about", "nav.contact": "contact",
        "tagline": "we make games.", "hint": "scroll ↓",
        "games.h": "games",
        "games.lead": "we're working on our first game. this is all we can say for now:",
        "soon": "soon", "verysoon": "very soon",
        "about.h": "about",
        "about.lead": "stera studio is a small but ambitious independent game studio. few people, many dreams. we chase games that are as fun to make as they are to play — details soon.",
        "contact.h": "contact",
        "contact.lead": "got an idea? or just wanted to say hi?",
        "footer": "© 2026 stera studio — our logo is alive, please be gentle.",
      },
      intro: "hi, we're stera.",
      poke: ["hehe.", "again!", "that tickles.", "i liked that.", "hey!"],
      dizzy: "whoa… my head is spinning.",
      bored: "i'm bored…",
      sleep: "zZz…",
      sections: {
        oyunlar: "our games… soon. promise.",
        hakkimizda: "yep, that's us.",
        iletisim: "write to us — we reply!",
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
    langBtn.textContent = l === "tr" ? "en" : "tr";
  }
  applyLang(lang);
  langBtn.addEventListener("click", () => applyLang(lang === "tr" ? "en" : "tr"));

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
      say(L.dizzy, 2200);
    } else {
      say(L.poke[pokeIdx++ % L.poke.length], 1400);
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
          const msg = L.sections[en.target.id];
          if (msg) say(msg, 2600);
          if (en.target.id === "iletisim") {
            eyeL.classList.add("wink");
            setTimeout(() => eyeL.classList.remove("wink"), 500);
          }
        }
      });
    },
    { threshold: 0.45 }
  );
  document.querySelectorAll("main section").forEach((s) => io.observe(s));

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
        say(L.sleep, Infinity);
      } else if (idle > 12000 && st === "awake") {
        mascot.dataset.state = "bored";
        say(L.bored, 2000);
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
      say(L.intro, 2800);
      scheduleBlink();
    }, RM ? 200 : 1700);
  }
})();
