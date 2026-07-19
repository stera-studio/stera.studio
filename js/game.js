/* stera chase: auto-runner on climbing terrain — jump over spikes, pits and
   minions, roll under floating blocks, and stay ahead of the chasing storm. */
import { RM, clamp } from "./utils.js";
import { ensureAudio, note, PENTA } from "./audio.js";
import { L } from "./i18n.js";
import { S, say, wake, particles, setEyes, setMood, foldSpin, markActive } from "./mascot.js";

const mgSection = document.getElementById("minigame");
const gameBox = document.getElementById("gameBox");
const gameField = document.getElementById("gameField");
const terrainSvg = document.getElementById("terrainSvg");
const terrainPath = document.getElementById("terrainPath");
const spikePath = document.getElementById("spikePath");
const lavaPath = document.getElementById("lavaPath");
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

export const gameMode = () => G.mode;

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
      // some open air below the rim, then lava
      G.pits.push({ x0, x1: G.genX - TSTEP, top: prevY, lavaY: prevY + 110 });
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
  const depth = Math.random() < 0.5 ? 0.3 : 0.55;  // parallax factor: smaller = farther
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
  setMood("awake");
  setEyes("open");
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

export function doJump() {
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
  setEyes("dizzy");
  setTimeout(() => { if (G.mode === "playing") setEyes("open"); }, 550);
}

function endRun(msg) {
  G.mode = "over";
  setEyes("dizzy");
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
  lavaPath.setAttribute("d", "");
  setEyes("open");
  foldSpin();
  markActive();
  say(L.mgBye, 1800);
}

function drawWorld() {
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

  // lava pools with a gently waving surface; drawn under the terrain fill and
  // extended into both walls so the pool seals against the pit edges
  let ld = "";
  const wob = RM ? 0 : tNow / 300;
  for (const p of G.pits) {
    if (p.x1 < G.camX || p.x0 > G.camX + G.w) continue;
    const lx0 = p.x0 - 16, lx1 = p.x1 + 16;
    let seg = "";
    for (let x = lx0; x <= lx1; x += TSTEP) {
      const y = p.lavaY + Math.sin(x * 0.08 + wob) * 3;
      seg += (seg ? "L" : "M") + (x - G.camX).toFixed(1) + " " + (y - G.camY).toFixed(1) + " ";
    }
    seg += `L${(lx1 - G.camX).toFixed(1)} ${(p.top + 270 - G.camY).toFixed(1)}` +
           `L${(lx0 - G.camX).toFixed(1)} ${(p.top + 270 - G.camY).toFixed(1)}Z`;
    ld += seg;
  }
  lavaPath.setAttribute("d", ld);
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

export function gameStep(dt) {
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
    drawWorld();
    if (Math.abs(tx - S.x) < 5 && Math.abs(ty - S.y) < 5) G.mode = "playing";
    return;
  }

  if (G.mode === "over") {
    S.x = r.left + (G.X - G.camX);
    S.y = r.top + (G.y - G.camY);
    S.lean += (0 - S.lean) * 0.1;
    drawWorld();
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
    drawWorld();
    endRun(L.mgOver);
    return;
  }

  // touching the lava in a pit
  for (const p of G.pits) {
    if (G.X > p.x0 && G.X < p.x1 && G.y + pr > p.lavaY) {
      drawWorld();
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

  drawWorld();

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
