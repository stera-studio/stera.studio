/* entry point: wires localization, the living logo and the minigame together */
import { initI18n, L } from "./i18n.js";
import { initTheme } from "./theme.js";
import { ensureAudio } from "./audio.js";
import { S, initMascot, scrollStep, render, say, poke, wink, isIntroDone } from "./mascot.js";
import { gameMode, gameStep, doJump } from "./game.js";

initI18n();
initTheme();

initMascot((x, y) => {
  // tapping the logo: a jump mid-game, a poke otherwise
  if (gameMode() === "playing") doJump();
  else if (gameMode() === "off") poke(x, y);
});

addEventListener("pointerdown", ensureAudio, { once: true });

// ---------- section messages ----------
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting && isIntroDone() && gameMode() === "off" && scrollY > innerHeight * 0.4) {
        S.hop.vel -= 6;
        const msg = L.sections[en.target.id];
        if (msg) say(msg, 2600);
        if (en.target.id === "contact") wink();
      }
    });
  },
  { threshold: 0.45 }
);
document.querySelectorAll("main section").forEach((s) => io.observe(s));

// ---------- main loop ----------
let lastFrameT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - lastFrameT) / 1000));
  lastFrameT = now;

  if (gameMode() !== "off") gameStep(dt);
  else scrollStep();

  render(gameMode() !== "off");
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
