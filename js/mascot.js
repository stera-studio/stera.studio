/* the living logo: springs, eyes, speech bubble, moods and the intro */
import { PARAMS, RM, lerp, clamp, ease, stepSpring } from "./utils.js";
import { ensureAudio, note, PENTA } from "./audio.js";
import { L } from "./i18n.js";

const mascotEl = document.getElementById("mascot");
const stage = document.getElementById("stage");
const logoSvg = document.getElementById("logoSvg");
const face = document.getElementById("face");
const eyeL = document.getElementById("eyeL");
const pupilL = document.getElementById("pupilL");
const pupilR = document.getElementById("pupilR");
const bubble = document.getElementById("bubble");
const bubbleText = document.getElementById("bubbleText");

const STATIC = PARAMS.has("static");

export const S = {
  x: innerWidth / 2, y: innerHeight * 0.42, size: 100,
  lean: 0, spin: 0, spinExtra: 0, spinExtraTarget: 0,
  squash: { v: 0, vel: 0 },
  hop: { v: 0, vel: 0 },
};

let pointerX = innerWidth / 2, pointerY = innerHeight * 0.42;
let lastActive = Date.now();
let introDone = false;
let pokeTimes = [];
let pokeIdx = 0;

const EYES = [
  { ex: 218, ey: 150, el: pupilL },
  { ex: 282, ey: 150, el: pupilR },
];

export const isIntroDone = () => introDone;
export const setEyes = (v) => { mascotEl.dataset.eyes = v; };
export const setMood = (v) => { mascotEl.dataset.state = v; };
export const markActive = () => { lastActive = Date.now(); };

// ---------- speech bubble ----------
let typeTimer = null, hideTimer = null;
export function say(text, holdMs = 2400) {
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
    if (mascotEl.dataset.state === "awake" && mascotEl.dataset.eyes === "open") {
      mascotEl.dataset.eyes = "closed";
      setTimeout(() => {
        if (mascotEl.dataset.state === "awake") mascotEl.dataset.eyes = "open";
      }, 130);
    }
    scheduleBlink();
  }, 2500 + Math.random() * 4000);
}

export function wink() {
  eyeL.classList.add("wink");
  setTimeout(() => eyeL.classList.remove("wink"), 500);
}

// ---------- sleep / boredom ----------
export function wake() {
  lastActive = Date.now();
  if (mascotEl.dataset.state === "sleep") {
    mascotEl.dataset.state = "awake";
    mascotEl.dataset.eyes = "open";
    S.hop.vel -= 7;
    say("!", 900);
  } else if (mascotEl.dataset.state === "bored") {
    mascotEl.dataset.state = "awake";
  }
}

// ---------- poking ----------
export function particles(x, y) {
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

export function poke(x, y) {
  wake();
  ensureAudio();
  S.squash.vel += 0.16;
  particles(x, y);
  note(PENTA[Math.floor(Math.random() * PENTA.length)]);
  note(PENTA[Math.floor(Math.random() * PENTA.length)] * 1.5, 0.07);

  mascotEl.dataset.eyes = "happy";
  setTimeout(() => {
    if (mascotEl.dataset.state === "awake") mascotEl.dataset.eyes = "open";
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

// fold accumulated extra spin into the scroll-driven target to avoid a big unwind
export function foldSpin() {
  const fold = Math.round((S.spin - scrollY * 0.15) / 360) * 360;
  S.spinExtra = fold;
  S.spinExtraTarget = fold;
}

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

// ---------- scroll-driven behavior (when no game is running) ----------
export function scrollStep() {
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

// ---------- per-frame rendering shared by both modes ----------
export function render(gameActive) {
  stepSpring(S.squash, 0.18, 0.8);
  stepSpring(S.hop, 0.12, 0.82);
  const sq = clamp(S.squash.v, -0.3, 0.3);

  mascotEl.style.transform = `translate3d(${S.x.toFixed(1)}px, ${(S.y + S.hop.v).toFixed(1)}px, 0)`;
  stage.style.width = stage.style.height = S.size.toFixed(1) + "px";
  stage.style.transform = `translate(-50%,-50%) rotate(${S.lean.toFixed(2)}deg) scale(${(1 + sq).toFixed(3)}, ${(1 - sq).toFixed(3)})`;
  logoSvg.style.transform = `rotate(${S.spin.toFixed(2)}deg)`;

  bubble.style.left = (S.size * 0.34).toFixed(0) + "px";
  bubble.style.top = (-S.size * 0.58).toFixed(0) + "px";

  updatePupils();

  // boredom / sleep
  if (introDone && !gameActive) {
    const idle = Date.now() - lastActive;
    const st = mascotEl.dataset.state;
    if (idle > 26000 && st !== "sleep") {
      mascotEl.dataset.state = "sleep";
      mascotEl.dataset.eyes = "closed";
      say(L.sleep, Infinity);
    } else if (idle > 12000 && st === "awake") {
      mascotEl.dataset.state = "bored";
      say(L.bored, 2000);
    }
  }
}

// ---------- setup + intro ----------
export function initMascot(onLogoTap) {
  logoSvg.addEventListener("pointerdown", (e) => onLogoTap(e.clientX, e.clientY));
  addEventListener("pointermove", (e) => {
    pointerX = e.clientX;
    pointerY = e.clientY;
    wake();
  }, { passive: true });
  addEventListener("scroll", wake, { passive: true });

  if (STATIC) {
    document.querySelectorAll(".half").forEach((h) => (h.style.transition = "none"));
    face.style.transition = "none";
    logoSvg.classList.add("assembled");
    face.classList.add("faceIn");
    introDone = true;
    const sc = parseFloat(PARAMS.get("scrollto") || "0");
    if (sc) scrollTo(0, sc);
    if (PARAMS.has("nohero")) document.querySelector(".hero").style.display = "none";
    if (PARAMS.has("nomascot")) mascotEl.style.display = "none";
  } else {
    setTimeout(() => logoSvg.classList.add("assembled"), RM ? 0 : 250);
    setTimeout(() => { S.squash.vel += 0.12; }, RM ? 0 : 1150);   // "splat"
    setTimeout(() => face.classList.add("faceIn"), RM ? 100 : 1350);
    setTimeout(() => {
      introDone = true;
      lastActive = Date.now();
      say(L.intro, 2800);
      scheduleBlink();
    }, RM ? 200 : 1700);
  }
}
