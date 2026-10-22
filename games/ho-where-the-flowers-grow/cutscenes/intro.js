// Built from intro-animatic.html by build-cutscenes.sh; edit the animatic, not this.
window.LadybugCutscenes = window.LadybugCutscenes || {};
window.LadybugCutscenes.intro = function (host) {
host.innerHTML = `<div class="wrap">
  <header>
    <h1>Past the Garden Wall</h1>
    <p>Intro animatic · built from your Figma storyboard frames · rough timing</p>
  </header>

  <div class="stage"><canvas id="stage" width="800" height="450" aria-label="Animatic playback. Click to play or pause."></canvas><button class="skip" id="skip" title="Skip the intro (S)">skip &gt;&gt;</button></div>

  <div class="transport">
    <button class="primary" id="play">Play</button>
    <button id="prev" aria-label="Previous shot">◀ Shot</button>
    <button id="next" aria-label="Next shot">Shot ▶</button>
    <button id="restart">Restart</button>
    <div class="toggles">
      <label><input type="checkbox" id="tags" checked> Show “to draw” tags</label>
      <label><input type="checkbox" id="loop"> Loop</label>
    </div>
    <span class="time" id="time">0.0s / 30.0s</span>
  </div>

  <div class="scrub">
    <input type="range" id="scrub" min="0" max="30000" step="10" value="0" aria-label="Scrub through the animatic">
    <div class="strip" id="strip"></div>
  </div>

  <div class="notes">
    <div class="card">
      <span class="label" id="shotLabel">Shot 1 · 5s</span>
      <h2 id="shotName">Inside, morning</h2>
      <p id="shotNotes"></p>
    </div>
    <div class="card">
      <span class="label">Stand-ins in this shot</span>
      <ul class="todo" id="shotTodo"></ul>
      <p class="feedback">Give notes by shot, for example <b>“shot 3 longer”</b>, <b>“closer in shot 5”</b>, <b>“Clover flies instead of climbing”</b>, or drop a rough sketch in for any shot.</p>
    </div>
  </div>
</div>
`;
// The whole animatic runs inside startAnimatic(), so when the page is updated
// while someone has it open, a fresh copy boots cleanly (back at the same
// moment) and the old copy's playback loop stops itself.
function startAnimatic(saved = {}) {
const RUN = (window.__animaticRun = (window.__animaticRun || 0) + 1);
// Played by the game as a cutscene: no tools or notes, no "to draw" tags,
// plays once from the start and tells the game when it's done. The game runs
// it inside its own page (build-cutscenes.sh turns this into cutscenes/*.js),
// handing over { run, on(type) } as window.__CUTSCENE__ first; ?cutscene
// turns the mode on in a page of its own, for testing by hand.
const HOST = typeof window.__CUTSCENE__ === 'object' ? window.__CUTSCENE__ : null;
const CUTSCENE = !!HOST || new URLSearchParams(location.search).has('cutscene');
if (CUTSCENE && !HOST) document.documentElement.classList.add('cutscene');
// In the game, it's told directly; in a page of its own, any frame above
// it is told by message.
const tellGame = type => {
  if (!CUTSCENE) return;
  if (HOST) { HOST.on?.(type); return; }
  for (let w = window; w !== window.top; ) { w = w.parent; w.postMessage({ ladybugCutscene: true, type, cutscene: document.title }, '*'); }
};
/* ======================================================================
   ASSETS — the game's own art; anything not drawn yet is a stand-in
   ====================================================================== */
const img = src => Object.assign(new Image(), { src });
const A = {
  blueWalk: [img('cutscenes/img/bug-walk0.png'), img('cutscenes/img/bug-walk1.png')],
  blueIdle: [img('cutscenes/img/bug-idle0.png'), img('cutscenes/img/bug-idle1.png')],
  green: [img('cutscenes/img/green0.png'), img('cutscenes/img/green1.png'), img('cutscenes/img/green2.png')],
  greenWalk: [img('cutscenes/img/green0.png'), img('cutscenes/img/green-walk.png')], // Clover's legs stepping, made from Bluebell's walk
  clover: [img('cutscenes/img/clover0.png'), img('cutscenes/img/clover1.png')],
  sky: img('cutscenes/img/day-back.png'), middle: img('cutscenes/img/day-middle.png'), front: img('cutscenes/img/day-front.png'),
  groundTop: img('cutscenes/img/ground-top.png'), groundFill: img('cutscenes/img/ground-fill.png'),
  bush: img('cutscenes/img/bush.png'), bushFlowers: img('cutscenes/img/bush-flowers.png'),
};
// The storyboard art from the Figma file: the hollow-log panorama (2400x450,
// drawn at 6x) and the bug poses (64x64, sampled down from 8x exports).
const F = {
  pano: img('cutscenes/img/log-home.png'), panoOpen: img('cutscenes/img/log-home-open.png'),
  blueIdle: img('cutscenes/img/blue-idle.png'), blueLook: img('cutscenes/img/blue-look.png'), blueClose: img('cutscenes/img/blue-close.png'),
  blueHat: img('cutscenes/img/blue-hat.png'), blueHatPack: img('cutscenes/img/blue-hatpack.png'),
  tableBowl: img('cutscenes/img/table-bowl.png'), // top-down close-up of the table and the empty berry bowl (800x450, drawn 1:1)
  blueClover: img('cutscenes/img/blue-clover.png'), luckyClover: [img('cutscenes/img/lucky-clover0.png'), img('cutscenes/img/lucky-clover1.png')], // 2-frame shimmer, 330ms each
  green: img('cutscenes/img/green.png'),
  berries: img('cutscenes/img/berries.png'), // three blueberries (37x36, on the bugs' pixel scale)
  // walk frames made from the game's walk: the same pose with the legs mid-step
  blueIdleWalk: img('cutscenes/img/blue-idle-walk.png'), blueLookWalk: img('cutscenes/img/blue-look-walk.png'), greenWalk: img('cutscenes/img/green-walk.png'),
  logHouse: img('cutscenes/img/log-house.png'), gardenWall: img('cutscenes/img/garden-wall.png'),
};
const ready = im => im.complete && im.naturalWidth > 0;

/* ======================================================================
   STAGE — a 400x225 "world" at game scale (bugs 64px, tiles 32px), seen
   through a camera that's normally at 2x so it fills the 800x450 frame
   ====================================================================== */
const cv = document.getElementById('stage');
const ctx = cv.getContext('2d');
const CW = 800, CH = 450;
const GROUND = 180;                       // top of the grass, world px
// The log house is drawn big, so Bluebell looks small beside it; the camera
// stays at the usual closeness and follows Bluebell along to the wall.
const WALL = { x: 430, s: 1.25, bottomRow: 253, archCol: 60 }; // your garden wall drawing

const HOLE_X = WALL.x + WALL.archCol * WALL.s; // the middle of the arch


let dpr = 1;
let fixedSize = null; // a set canvas size, for test captures (see window.__animatic)
function fitCanvas() {
  dpr = Math.min(3, window.devicePixelRatio || 1);
  const r = cv.getBoundingClientRect();
  const w = fixedSize ? fixedSize[0] : Math.max(1, Math.round(r.width * dpr)), h = fixedSize ? fixedSize[1] : Math.max(1, Math.round(r.height * dpr));
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
}

let cam = { x: 200, y: 112.5, z: 2 };
function applyCamera() {
  const s = cv.width / CW;
  ctx.setTransform(s * cam.z, 0, 0, s * cam.z, s * (CW / 2 - cam.x * cam.z), s * (CH / 2 - cam.y * cam.z));
  ctx.imageSmoothingEnabled = false;
}
// tiltY slides the whole picture up or down (in 800x450 units) for camera tilts between views; 0 otherwise
let tiltY = 0;
function screenSpace() { const s = cv.width / CW; ctx.setTransform(s, 0, 0, s, 0, s * tiltY); ctx.imageSmoothingEnabled = false; }
const toScreen = (x, y) => [CW / 2 + (x - cam.x) * cam.z, CH / 2 + (y - cam.y) * cam.z];

/* ---------- helpers ---------- */
const clamp01 = v => Math.max(0, Math.min(1, v));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const ease = t => t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
const lerp = (a, b, t) => a + (b - a) * t;
let clock = 0; // seconds into the whole animatic, for idle cycles

/* ---------- scenery ---------- */
function drawSky(drift) {
  // tall enough to fill a wide, zoomed-out view; bottom stays at y=225
  const h = 440, y0 = 225 - h;
  ctx.fillStyle = '#7fa6d8'; ctx.fillRect(-200, y0 - 400, 1400, 1000);
  if (!ready(A.sky)) return;
  const w = A.sky.naturalWidth * (h / A.sky.naturalHeight);
  const right = cam.x + CW / 2 / cam.z + w;
  for (const [layer, par, dx] of [[A.sky, 0.1, drift], [A.middle, 0.25, 0], [A.front, 0.45, 0]]) {
    if (!ready(layer)) continue;
    let off = ((cam.x - 200) * par + dx) % w; if (off < 0) off += w;
    for (let x = -off - w; x < right; x += w) ctx.drawImage(layer, 1, 0, layer.naturalWidth - 2, layer.naturalHeight, Math.round(x), y0, Math.ceil(w) + 1, h);
  }
}
function drawGround() {
  for (let x = -64; x < 1100; x += 32) {
    if (ready(A.groundTop)) ctx.drawImage(A.groundTop, x, GROUND);
    if (ready(A.groundFill)) { ctx.drawImage(A.groundFill, x, GROUND + 32); ctx.drawImage(A.groundFill, x, GROUND + 64); ctx.drawImage(A.groundFill, x, GROUND + 96); }
  }
}
function drawBush(im, cx, s = 2) {
  if (!ready(im)) return;
  ctx.drawImage(im, Math.round(cx - 16 * s), GROUND - 30 * s + 3, 32 * s, 32 * s);
}
// The garden wall (your 120x254 drawing), at 1.25x so its arch is a little
// wider than Bluebell; its lowest row (253) sits just into the grass. It's
// taller than the frame, so it rises out of the top of the shot.
function drawWall() {
  const im = F.gardenWall;
  if (!ready(im)) return;
  ctx.drawImage(im, WALL.x, Math.round(GROUND + 3 - (WALL.bottomRow + 1) * WALL.s), im.naturalWidth * WALL.s, im.naturalHeight * WALL.s);
}
// The log house from outside (your 128x104 drawing), shown at 2.5x so it
// towers over Bluebell; its lowest row (102) sits just into the grass.
const LOG = { x: 10, s: 2.5, doorCol: 65, bottomRow: 102 }; // big, so Bluebell looks tiny beside it
const LOG_DOOR_X = LOG.x + LOG.doorCol * LOG.s;
function drawHome() {
  const im = F.logHouse;
  if (!ready(im)) return;
  ctx.drawImage(im, LOG.x, Math.round(GROUND + 3 - (LOG.bottomRow + 1) * LOG.s), im.naturalWidth * LOG.s, im.naturalHeight * LOG.s);
}
function drawScene(drift) {
  drawSky(drift);
  drawHome();
  drawGround();
  drawWall();
  drawBush(A.bush, 372, 2);
}

/* ---------- characters ---------- */
// bug sprites are 64x64, facing right, with feet on art row 52
function drawBug(kind, x, opts = {}) {
  const { facing = 1, frame = 0, walking = false, hop = 0, sy = 1, rot = 0, alpha = 1, y = GROUND } = opts;
  const set = kind === 'green' ? (walking ? A.greenWalk : A.green) : (walking ? A.blueWalk : A.blueIdle);
  const im = set[frame % set.length];
  if (!ready(im)) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y - hop));
  ctx.rotate(rot);
  ctx.scale(facing, sy);
  ctx.drawImage(im, -32, -53, 64, 64);
  ctx.restore();
}
const idleFrame = (period = 1) => Math.floor(clock / period) % 2;
const walkFrame = () => Math.floor(clock / 0.14) % 2;

function drawClover(x, y, s = 0.75) {
  const im = A.clover[Math.floor(clock / 0.33) % 2];
  if (ready(im)) ctx.drawImage(im, Math.round(x - 32 * s), Math.round(y - 32 * s), 64 * s, 64 * s);
}
function drawCloverPile(x, n) {
  // a little pyramid, bottom row first
  const spots = [[0, 0], [-14, 0], [14, 0], [-7, -10], [7, -10], [0, -20]];
  for (let i = 0; i < Math.min(n, spots.length); i++) drawClover(x + spots[i][0], GROUND - 8 + spots[i][1], 0.6);
}

// the blueberries, centred on cx/cy (cell = screen px per art pixel)
function drawBerries(cx, cy, cell = 1) {
  const im = F.berries;
  if (!ready(im)) return;
  const w = im.naturalWidth * cell, h = im.naturalHeight * cell;
  ctx.drawImage(im, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
}

// STAND-INS for the gear: a flower hat and a backpack
function drawHat(x, y, s = 1) {
  ctx.fillStyle = '#e1a7c5';
  for (let k = 0; k < 5; k++) { const a = k * 2 * Math.PI / 5 - Math.PI / 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 5 * s, y + Math.sin(a) * 4 * s, 4 * s, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#ffd887'; ctx.beginPath(); ctx.arc(x, y, 2.6 * s, 0, Math.PI * 2); ctx.fill();
}
function drawPack(x, y) {
  ctx.fillStyle = '#9a6a3f'; ctx.fillRect(x - 9, y - 7, 18, 14);
  ctx.fillStyle = '#c08a52'; ctx.fillRect(x - 7, y - 5, 14, 4);
  ctx.fillStyle = '#6b4526'; ctx.fillRect(x - 2, y - 1, 4, 3);
}

/* ---------- light, fireflies, sparkles (screen space) ---------- */
function grade(dusk, night) {
  screenSpace();
  if (dusk > 0) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(255,178,140,${0.55 * dusk})`; ctx.fillRect(0, 0, CW, CH);
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(0, 0, 0, CH);
    g.addColorStop(0, `rgba(240,120,150,${0.25 * dusk})`); g.addColorStop(1, 'rgba(240,120,150,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
  }
  if (night > 0) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(62,62,138,${0.85 * night})`; ctx.fillRect(0, 0, CW, CH);
    ctx.globalCompositeOperation = 'source-over';
  }
}
const flies = Array.from({ length: 10 }, (_, i) => ({ x: 40 + i * 37 % 330, y: 60 + (i * 53) % 110, ph: i * 1.7, sp: 0.6 + (i % 4) * 0.2 }));
function drawFireflies(amount) {
  if (amount <= 0) return;
  screenSpace();
  ctx.globalCompositeOperation = 'lighter';
  for (const f of flies) {
    const blink = Math.pow(Math.max(0, Math.sin(clock * f.sp * 2 + f.ph)), 2) * amount;
    if (blink < 0.03) continue;
    const [sx, sy] = toScreen(f.x + Math.sin(clock * 0.7 + f.ph) * 12, f.y + Math.cos(clock * 0.5 + f.ph) * 8);
    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 14);
    g.addColorStop(0, `rgba(217,255,0,${0.5 * blink})`); g.addColorStop(1, 'rgba(217,255,0,0)');
    ctx.fillStyle = g; ctx.fillRect(sx - 14, sy - 14, 28, 28);
    ctx.fillStyle = `rgba(244,255,176,${blink})`; ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
  }
  ctx.globalCompositeOperation = 'source-over';
}
function drawSparkles(wx, wy, t) {
  if (t <= 0 || t >= 1) return;
  screenSpace();
  const [cx, cy] = toScreen(wx, wy);
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4 + 0.3, r = 20 + 70 * ease(t), s = 10 * (1 - t);
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    ctx.fillStyle = k % 2 ? '#d9ff00' : '#ffffff';
    ctx.globalAlpha = 1 - t;
    ctx.fillRect(x - s / 2, y - 1.5, s, 3); ctx.fillRect(x - 1.5, y - s / 2, 3, s);
  }
  ctx.globalAlpha = 1;
}

/* ---------- "to draw" tags (collected during the frame, drawn in screen space) ---------- */
let tags = [];
let showTags = !CUTSCENE;
function tag(x, y, w, h, text) { tags.push({ x, y, w, h, text }); }
function drawTags() {
  if (!showTags) { tags = []; return; }
  screenSpace();
  ctx.font = `700 12px 'Atkinson Hyperlegible', system-ui, sans-serif`;
  for (const t of tags) {
    const [x0, y0] = toScreen(t.x, t.y), [x1, y1] = toScreen(t.x + t.w, t.y + t.h);
    ctx.setLineDash([6, 4]); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(235,147,97,0.9)';
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    ctx.setLineDash([]);
    const tw = ctx.measureText(t.text).width + 10;
    const lx = Math.max(4, Math.min(CW - tw - 4, x0)), ly = Math.max(4, y0 - 20);
    ctx.fillStyle = 'rgba(235,147,97,0.95)'; ctx.fillRect(lx, ly, tw, 18);
    ctx.fillStyle = '#15122a'; ctx.fillText(t.text, lx + 5, ly + 13);
  }
  tags = [];
}

/* ---------- spoken lines: floating captions, typed out ---------- */
// Just the words, low and centred with an outline in Bluebell's dark shell
// blue — no box and no name tag, so nothing covers the art.
const VOICE = `'Pixelta', 'Venice Classic', Georgia, serif`; // Venice Classic fills in the apostrophes, quotes and dashes Pixelta lacks
const OUTLINE = '#000'; // black outline on every line of text on screen; null draws the text with no outline
const outlined = (text, x, y) => { if (OUTLINE) ctx.strokeText(text, x, y); };
function wrapWords(text, maxW) {
  const lines = []; let line = '';
  for (const w of text.split(' ')) {
    const test = line ? line + ' ' + w : w;
    if (line && ctx.measureText(test).width > maxW) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}
// A caption, typed out from `start` and gone by `end`. Played in the game, it
// talks as it types, in `speaker`'s voice ('You' is Bluebell, '???' Clover:
// the game's names for them), one blip per new letter.
let spoken = {};
function drawLine(text, t, start, end, speaker) {
  if (t < start || t > end) return;
  screenSpace();
  const count = Math.floor((t - start) * 34);
  if (speaker && HOST?.sound && playing) {
    const was = spoken[text] ?? 0;
    if (count > was && count <= text.length) HOST.sound.talk(speaker, text[count - 1]);
    spoken[text] = count;
  }
  ctx.save();
  ctx.globalAlpha = Math.min(1, (t - start) * 6, (end - t) * 6);
  ctx.lineJoin = 'round'; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 6; ctx.textAlign = 'left';
  ctx.font = `28px ${VOICE}`; ctx.letterSpacing = '2px'; // Pixelta is narrow; spacing keeps it legible
  const lines = wrapWords(text, 640);
  const y0 = CH - 30 - (lines.length - 1) * 32;
  let left = count;
  lines.forEach((ln, i) => {
    if (left <= 0) return;
    const part = ln.slice(0, left); left -= ln.length + 1;
    // each line stays centred on its full width, so typing doesn't slide it
    const lx = CW / 2 - ctx.measureText(ln).width / 2;
    outlined(part, lx, y0 + i * 32);
    ctx.fillStyle = '#d9ff00'; ctx.fillText(part, lx, y0 + i * 32);
  });
  ctx.restore();
}

/* ---------- the day counter over the time-lapse ---------- */
// "Day N", low and centred. The number rolls like a flip clock / odometer:
// at each dawn the old number scrolls up out of its slot as the new one
// scrolls up in from below, with a tiny overshoot as it settles.
const ROLL_S = 0.45;
function drawDayCounter(day, sinceChange, alpha) {
  if (alpha <= 0) return;
  screenSpace();
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `44px 'Pixelta', system-ui, sans-serif`;
  ctx.lineJoin = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = OUTLINE; ctx.fillStyle = '#fff3d6';
  const word = 'Day ', slotW = ctx.measureText('88').width, wordW = ctx.measureText(word).width;
  const left = CW / 2 - (wordW + slotW) / 2, base = CH - 46, rowH = 50;
  ctx.textAlign = 'left';
  outlined(word, left, base); ctx.fillText(word, left, base);
  // the number's slot: clipped so the rolling numbers only show inside it
  const sx = left + wordW;
  ctx.beginPath(); ctx.rect(sx - 8, base - 44, slotW + 16, 56); ctx.clip();
  const u = clamp01(sinceChange / ROLL_S);
  const roll = u >= 1 ? 1 : 1 - Math.pow(1 - u, 3) * Math.cos(u * Math.PI * 1.5); // ease out with a little settle
  const num = (n, dy) => { const s = String(n), x = sx + (slotW - ctx.measureText(s).width) / 2; outlined(s, x, base + dy); ctx.fillText(s, x, base + dy); };
  if (u < 1 && day > 1) num(day - 1, -rowH * roll);   // the old day leaving upward
  num(day, rowH * (1 - roll));                        // the new day arriving from below
  ctx.restore();
}
function fadeTo(color, a) {
  if (a <= 0) return;
  screenSpace(); ctx.globalAlpha = a; ctx.fillStyle = color; ctx.fillRect(0, 0, CW, CH); ctx.globalAlpha = 1;
}

/* ----------------------------------------------------------------------
   STORYBOARD KEYFRAMES — the frames from the Figma storyboard page, layer
   by layer. Each layer is placed by Figma's own transform [a, b, c, d, e, f]
   (so flips and tilts come across exactly) at its size in the 800x450 frame.
   The animatic plays these in order and fills in the motion between them.
   ---------------------------------------------------------------------- */
const pano = (e, f, w = 2400, h = 450) => ({ role: 'pano', img: 'pano', m: [1, 0, 0, 1, e, f], w, h });
const bug = (role, imgKey, m, w) => ({ role, img: imgKey, m, w, h: w });
const kf = (L, dim = 0) => ({ L, dim });
const only = (fr, roles) => kf(fr.L.filter(l => roles.includes(l.role)), fr.dim);
// the same frame with the round door swung open
const opened = fr => kf(fr.L.map(l => l.role === 'pano' ? { ...l, img: 'panoOpen' } : l), fr.dim);

const CLOSE = [-538.592, -139.373, 3688.664, 691.625];   // the window close-up
const WINDOW = [-1203.398, -182.443, 5738.327, 1075.936]; // tight on the window
const DOOR = [-1656.691, -200.517, 4003.517, 750.659];    // by the door, hooks + scarves

// Intro 1. opens with Bluebell crossing the room to the table (Frames 28 and 35)...
const I1_WALK = [
  kf([pano(-1314.743, 0), bug('blue', 'blueIdle', [1, 0, 0, 1, -80.49, 141.414], 308.586)]),
  kf([pano(-1314.743, 0), bug('blue', 'blueIdle', [1, 0, 0, 1, 245.707, 141.414], 308.586)]),
];
// ...then tilts down onto the empty berry bowl (Frames 41-43). The bowl
// flashes full of berries for a moment, then empty again. The berries fill
// the spot the dashed circles mark in Frame 42 (x/y in the 800x450 frame).
const BOWL_BERRIES = { x: 403, y: 225, cell: 2 }; // each berry about the size of one dashed circle
const I1 = [ // Intro 1., after the bowl
  kf([pano(-1314.743, 0), bug('blue', 'blueIdle', [1, 0, 0, 1, 50.935, 141.414], 308.586)]),
  kf([pano(-1314.743, 0), bug('green', 'green', [-1, 0, 0, 1, 897.32, 142], 308), bug('blue', 'blueLook', [1, 0, 0, 1, 51.521, 141.414], 308)]),
  kf([pano(-610.681, 0), bug('green', 'green', [-1, 0, 0, 1, 815.437, 142], 308)]),
  kf([pano(-610.681, 0), bug('green', 'green', [-1, 0, 0, 1, 589.32, 114.706], 308)]),
  kf([pano(-610.681, 0), bug('blue', 'blueIdle', [-1, 0, 0, 1, 897.906, 120.119], 308.586)]),
  kf([pano(-610.681, 0), bug('blue', 'blueIdle', [-1, 0, 0, 1, 341.201, 114.035], 308.586)]),
];
const I2 = [ // Intro 2.
  kf([pano(...CLOSE), bug('blue', 'blueIdle', [1, -0.01, 0.01, 1, 20.264, -53.166], 562.107)]),
];
const I34 = [ // Intro 3. + 4.
  kf([pano(...CLOSE), bug('blue', 'blueLook', [1, 0, 0, 1, 26.086, -53.089], 562)], 0.24),
  // the clover moment: eyes closed, blushing, a lucky clover at Bluebell's feet
  kf([pano(...CLOSE), bug('blue', 'blueClover', [1, 0, 0, 1, 20.586, -61.5], 573), bug('clover', 'luckyClover', [1, 0, 0, 1, 155.899, 287.377], 189.388)], 0.24),
  kf([pano(...CLOSE), bug('blue', 'blueLook', [-1, 0, 0, 1, 400, -55.117], 562)], 0.24),
  kf([pano(...CLOSE)], 0.24),
  kf([pano(...WINDOW)], 0.24),
  kf([pano(...WINDOW)], 0),
  kf([pano(...WINDOW)], 0.24),
];
const I56 = [ // Intro 5. + 6.
  kf([pano(-578.666, 0), bug('blue', 'blueIdle', [1, 0, 0, 1, 36.481, 122.624], 308.586)]),
  kf([pano(...DOOR), bug('blue', 'blueClose', [1, 0, 0, 1, 31.89, -39.439], 528)]),
  kf([pano(...DOOR), bug('blue', 'blueHat', [1, 0, 0, 1, 31.89, -38.561], 528)]),
  kf([pano(...DOOR), bug('blue', 'blueHatPack', [1, 0, 0, 1, 31.89, -38.561], 528)]),
];

// Where everything is at time t, given keys [{ t, fr, enter, exit, pop }].
// Between two keys, a layer in both slides/turns/zooms from one to the other
// (a flip squeezes through, reading as a turn); one only in the next key
// enters (fading in, sliding from `enter[role]` px away); one only in the
// previous key leaves (fading out, sliding `exit[role]` px, and moving with
// any camera pan so it doesn't stay pinned to the screen). Bugs that travel
// step through their walk frames. A `pop` key swaps the pose with a little bounce.
// Each pose's other walk frame (the legs mid-step); poses not listed just slide.
const WALK_OF = { blueIdle: 'blueIdleWalk', blueLook: 'blueLookWalk', green: 'greenWalk' };
const stepping = (imgKey, moving) => moving && WALK_OF[imgKey] && Math.floor(clock / 0.14) % 2 ? WALK_OF[imgKey] : imgKey; // the game's walk speed
function poseAt(keys, t) {
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
  const A0 = keys[i], B0 = keys[Math.min(i + 1, keys.length - 1)];
  const raw = B0.t > A0.t ? clamp01((t - A0.t) / (B0.t - A0.t)) : 1;
  const u = ease(raw);
  const a = A0.fr, b = B0.fr;
  const panoA = a.L.find(l => l.role === 'pano'), panoB = b.L.find(l => l.role === 'pano');
  const panDx = panoA && panoB ? (panoB.m[4] - panoA.m[4]) * u : 0;
  const out = [];
  const roles = [...new Set([...a.L.map(l => l.role), ...b.L.map(l => l.role)])];
  for (const role of roles) {
    const la = a.L.find(l => l.role === role), lb = b.L.find(l => l.role === role);
    if (la && lb) {
      const m = la.m.map((v, k) => lerp(v, lb.m[k], u));
      const w = lerp(la.w, lb.w, u), h = lerp(la.h, lb.h, u);
      const moved = Math.abs(lb.m[4] - la.m[4]) + Math.abs(lb.m[5] - la.m[5]);
      const walking = role !== 'pano' && moved > 40 && raw > 0 && raw < 1;
      const popping = B0.pop === role && la.img !== lb.img;
      const imgKey = popping ? lb.img : (raw < 0.5 ? la.img : lb.img);
      const pop = popping ? 1 + 0.14 * Math.sin(Math.PI * clamp01(raw * 1.4)) : 1;
      out.push({ role, img: stepping(imgKey, walking), m, w, h, alpha: 1, sx: pop, sy: pop });
    } else if (lb) {
      const dx = (B0.enter && B0.enter[role]) || 0;
      const m = lb.m.slice(); m[4] += dx * (1 - u);
      out.push({ ...lb, img: stepping(lb.img, dx && raw < 1), m, alpha: u, sx: 1, sy: 1 });
    } else if (la) {
      const dx = (B0.exit && B0.exit[role]) || 0;
      const m = la.m.slice(); m[4] += dx * u + panDx;
      out.push({ ...la, img: stepping(la.img, dx && raw > 0 && raw < 1), m, alpha: 1 - u, sx: 1, sy: 1 });
    }
  }
  // the panorama always goes underneath
  out.sort((p, q) => (p.role === 'pano' ? -1 : 0) - (q.role === 'pano' ? -1 : 0));
  return { layers: out, dim: lerp(a.dim, b.dim, u) };
}

/* The grass outside the round window sways. The window's glass is a circle
   in the panorama (art px: centre 112.5,28.5, radius ~19.6; the panorama is
   drawn at 6x). Its two greens are lifted onto their own layer and redrawn
   row by row with a sideways shift — tips move most, roots stay put — and
   the window's cross bars are drawn back on top so they stay crisp. */
const WIN = { x0: 92, y0: 9, w: 41, h: 39, cx: 112.5, cy: 28.5, r: 19.6, px: 6 };
const GRASS_GREENS = ['#6aab7c', '#b5de89'];
const windowCache = {};
let swayT = 0;           // the clock the grass sways to (a shot can run it faster)
let lastWindow = null;   // where the window was on screen this frame, for the fireflies
function windowLayers(key) {
  if (windowCache[key]) return windowCache[key];
  const im = F[key];
  const S = WIN.px, W = WIN.w * S, H = WIN.h * S;
  const src = document.createElement('canvas'); src.width = W; src.height = H;
  const g = src.getContext('2d'); g.drawImage(im, WIN.x0 * S, WIN.y0 * S, W, H, 0, 0, W, H);
  // opened straight from disk, the browser won't let the art's pixels be
  // read: the window then just stays still (no swaying grass)
  let data;
  try { data = g.getImageData(0, 0, W, H); }
  catch (e) {
    const none = document.createElement('canvas'); none.width = W; none.height = H;
    return (windowCache[key] = { grass: none, bars: src });
  }
  const grass = new ImageData(W, H), bars = new ImageData(W, H);
  const hex = (i) => '#' + [0, 1, 2].map(k => data.data[i + k].toString(16).padStart(2, '0')).join('');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const inside = Math.hypot(WIN.x0 + x / S - WIN.cx, WIN.y0 + y / S - WIN.cy) < WIN.r;
    if (!inside || data.data[i + 3] < 128) continue;
    const target = GRASS_GREENS.includes(hex(i)) ? grass : bars;
    for (let k = 0; k < 4; k++) target.data[i + k] = data.data[i + k];
  }
  const toCanvas = d => { const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').putImageData(d, 0, 0); return c; };
  return (windowCache[key] = { grass: toCanvas(grass), bars: toCanvas(bars) });
}
function drawWindowSway(L) {
  const im = F[L.img];
  if (!ready(im)) return;
  const { grass, bars } = windowLayers(L.img);
  const S = WIN.px, k = L.w / 2400;
  ctx.save();
  ctx.globalAlpha = L.alpha;
  ctx.transform(...L.m);
  ctx.scale(k, k);
  ctx.beginPath(); ctx.arc(WIN.cx * S, WIN.cy * S, (WIN.r - 0.4) * S, 0, Math.PI * 2); ctx.clip();
  for (let row = 0; row < WIN.h; row++) {
    const reach = 1 - row / WIN.h;                     // tips (top) sway most
    const gust = 0.6 + 0.4 * Math.sin(swayT * 0.7);
    const off = Math.round(Math.sin(swayT * 2.2 - row * 0.18) * 1.6 * reach * gust) * S; // whole art pixels
    ctx.drawImage(grass, 0, row * S, WIN.w * S, S, WIN.x0 * S + off, (WIN.y0 + row) * S, WIN.w * S, S);
  }
  ctx.drawImage(bars, WIN.x0 * S, WIN.y0 * S);
  ctx.restore();
  // remember the window on screen (for fireflies at night)
  const m = L.m;
  lastWindow = { cx: m[4] + WIN.cx * S * k * m[0], cy: m[5] + WIN.cy * S * k * m[3], r: WIN.r * S * k };
}

function drawPose(P, zoom = 1, tweak) {
  screenSpace();
  ctx.translate(CW / 2, CH / 2); ctx.scale(zoom, zoom); ctx.translate(-CW / 2, -CH / 2);
  for (const L of P.layers) {
    const art = F[L.img];
    const im = Array.isArray(art) ? art[Math.floor(clock / 0.33) % art.length] : art; // animated art cycles its frames
    if (!ready(im)) continue;
    if (tweak) tweak(L);
    ctx.save();
    ctx.globalAlpha = L.alpha;
    ctx.transform(...L.m);
    if (L.sx !== 1 || L.sy !== 1) { ctx.translate(L.w / 2, L.h); ctx.scale(L.sx, L.sy); ctx.translate(-L.w / 2, -L.h); } // feet stay planted
    ctx.drawImage(im, 0, 0, L.w, L.h);
    ctx.restore();
    if (L.role === 'pano') drawWindowSway(L);
  }
  if (P.dim > 0) { screenSpace(); ctx.fillStyle = `rgba(0,0,0,${P.dim})`; ctx.fillRect(0, 0, CW, CH); }
}

/* Time of day as a colour wash over the frame. `p` runs 0..1 per day:
   0 midday, .3 sunset, .5 deep night, .78 dawn, 1 midday again — each
   blended smoothly into the next. Returns how much it's night (0..1). */
const DAY_STOPS = [
  [0.00, [255, 255, 255], 0.00],
  [0.30, [255, 160, 110], 0.42],
  [0.50, [46, 52, 128], 0.80],
  [0.78, [255, 180, 200], 0.32],
  [1.00, [255, 255, 255], 0.00],
];
function timeOfDay(p, weight = 1) {
  p = ((p % 1) + 1) % 1;
  let i = 0; while (i < DAY_STOPS.length - 2 && p > DAY_STOPS[i + 1][0]) i++;
  const [p0, c0, a0] = DAY_STOPS[i], [p1, c1, a1] = DAY_STOPS[i + 1];
  const u = 0.5 - 0.5 * Math.cos(Math.PI * (p - p0) / (p1 - p0));
  const c = c0.map((v, k) => Math.round(lerp(v, c1[k], u)));
  const a = lerp(a0, a1, u) * weight;
  if (a > 0.003) {
    screenSpace();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${a})`; ctx.fillRect(0, 0, CW, CH);
    ctx.globalCompositeOperation = 'source-over';
  }
  return weight * clamp01(1 - Math.abs(p - 0.5) / 0.2);
}
// fireflies drifting outside the round window at night
function windowFireflies(night, zoom = 1) {
  if (night <= 0.02 || !lastWindow) return;
  screenSpace();
  ctx.globalCompositeOperation = 'lighter';
  const cx = CW / 2 + (lastWindow.cx - CW / 2) * zoom, cy = CH / 2 + (lastWindow.cy - CH / 2) * zoom, r = lastWindow.r * zoom;
  for (let k = 0; k < 7; k++) {
    const ph = k * 1.9, blink = Math.pow(Math.max(0, Math.sin(clock * (1 + k * 0.17) + ph)), 2) * night;
    if (blink < 0.03) continue;
    const x = cx + Math.cos(ph + clock * 0.3) * r * 0.6, y = cy + Math.sin(ph * 1.3 + clock * 0.4) * r * 0.5;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
    g.addColorStop(0, `rgba(217,255,0,${0.55 * blink})`); g.addColorStop(1, 'rgba(217,255,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 16, y - 16, 32, 32);
    ctx.fillStyle = `rgba(244,255,176,${blink})`; ctx.fillRect(x - 2, y - 2, 4, 4);
  }
  ctx.globalCompositeOperation = 'source-over';
}

// screen-space sparkle burst for the gear-up
function sparkleAt(cx, cy, t) {
  if (t <= 0 || t >= 1) return;
  screenSpace();
  for (let k = 0; k < 10; k++) {
    const ang = k * Math.PI / 5 + 0.3, r = 30 + 150 * ease(t), s = 18 * (1 - t);
    const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r * 0.7;
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = k % 2 ? '#d9ff00' : '#ffffff';
    ctx.fillRect(x - s / 2, y - 2, s, 4); ctx.fillRect(x - 2, y - s / 2, 4, s);
  }
  ctx.globalAlpha = 1;
}

/* ======================================================================
   SHOTS — built on the storyboard frames; the last one is still a stand-in
   ====================================================================== */
const SHOTS = [
  {
    name: 'Inside, morning', dur: 16.6, board: 'Intro 1.',
    sounds: [[4.2, 'pop'], [5.2, 'miss'], [13.2, 'door']], // the berries flash in and out; the door
    notes: 'Bluebell walks over to the table, and the camera tilts down onto the berry bowl: it\'s empty, then it flashes full of berries for a moment, then empty again. The camera tilts back up; Clover comes in, says the line, and the camera pans to the door as Clover heads out. Then Bluebell comes to the door and stays there, looking after them.',
    todo: ['Clover going out the door (just fades out here)', 'Walk frames are made from the game walk (legs only)'],
    // Bluebell's walk to the table, before the tilt down to the bowl
    walkKeys: [{ t: 0, fr: I1_WALK[0] }, { t: 0.6, fr: I1_WALK[0] }, { t: 2.2, fr: I1_WALK[1] }, { t: 2.7, fr: I1_WALK[1] }],
    // the tilt down (2.7-3.5), the bowl (3.5-6.1: empty, full of berries 4.2-5.2, empty again), the tilt back up (6.1-6.9)
    bowl: { down: [2.7, 3.5], up: [6.1, 6.9], full: [4.2, 5.2] },
    keys: [
      { t: 6.9, fr: I1[0] }, { t: 7.3, fr: I1[0] },
      { t: 8.3, fr: I1[1], enter: { green: 320 } }, { t: 10.7, fr: I1[1] },
      { t: 11.9, fr: I1[2] }, { t: 12.9, fr: I1[3] }, { t: 13.2, fr: I1[3] },
      { t: 13.2, fr: opened(I1[3]) }, { t: 13.4, fr: opened(I1[3]) }, // the door swings open
      { t: 14.0, fr: only(opened(I1[3]), ['pano']), exit: { green: -20 } },
      { t: 14.7, fr: opened(I1[4]), enter: { blue: 260 } }, { t: 15.6, fr: opened(I1[5]) }, { t: 16.6, fr: opened(I1[5]) },
    ],
    // the bowl seen from above: empty, a flash of it full of berries, then empty again
    drawBowl(t) {
      const b = this.bowl;
      screenSpace();
      // a slow push in while we look, centred on the bowl
      const z = 1 + 0.04 * ease(seg(t, b.down[0], b.up[1]));
      ctx.translate(403, 225); ctx.scale(z, z); ctx.translate(-403, -225);
      if (ready(F.tableBowl)) ctx.drawImage(F.tableBowl, 0, 0, CW, CH);
      if (t >= b.full[0] && t < b.full[1]) {
        drawBerries(BOWL_BERRIES.x, BOWL_BERRIES.y, BOWL_BERRIES.cell);
      }
      // a quick white flash at each cut, in and out
      const flash = Math.max(0, ...b.full.map(c => 1 - Math.abs(t - c) / 0.14));
      if (flash > 0) { screenSpace(); ctx.fillStyle = `rgba(255,250,235,${0.55 * flash})`; ctx.fillRect(0, 0, CW, CH); }
    },
    draw(t) {
      const b = this.bowl;
      const room = () => t < b.up[0] ? drawPose(poseAt(this.walkKeys, Math.min(t, b.down[0]))) : drawPose(poseAt(this.keys, Math.max(t, b.up[1])));
      if (t < b.down[0] || t >= b.up[1]) { room(); }
      else if (t < b.down[1]) {          // tilt down: the room slides up, the bowl comes up from below
        const u = ease(seg(t, b.down[0], b.down[1]));
        tiltY = -CH * u; room();
        tiltY = CH * (1 - u); this.drawBowl(t);
        tiltY = 0;
      } else if (t < b.up[0]) { this.drawBowl(t); }
      else {                             // tilt back up
        const u = ease(seg(t, b.up[0], b.up[1]));
        tiltY = CH * u; this.drawBowl(t);
        tiltY = -CH * (1 - u); room();
        tiltY = 0;
      }
      drawLine("I'll be back by sundown — with berries!", t, 8.5, 11.1, '???');
    },
  },
  {
    name: 'At the window', dur: 3.5, board: 'Intro 2.',
    notes: 'Close-up of Bluebell at the round window, watching. The camera pushes in slowly.',
    todo: [],
    keys: [{ t: 0, fr: I2[0] }, { t: 3.5, fr: I2[0] }],
    draw(t) { drawPose(poseAt(this.keys, t), 1 + 0.05 * ease(t / 3.5)); },
  },
  {
    name: 'Waiting', dur: 13.8, board: 'Intro 3. + 4.',
    sounds: [[1.95, 'clover']], // the lucky clover pops up
    notes: 'Picks up exactly where shot 2 ends, then the camera eases back as evening falls and Bluebell\'s face changes. The clover moment: Bluebell closes their eyes and blushes, a lucky clover pops in at their feet, and it reminds them of Clover — "A clover... it reminds me of you, Clover." Then Bluebell turns away and leaves the window. The camera moves in on the window for a time-lapse: the days go by — sunset, night with fireflies, dawn, midday — while the grass outside sways faster and faster.',
    todo: [],
    keys: [
      // starts on shot 2's last frame, so the cut doesn't jump
      { t: 0, fr: I2[0] }, { t: 1.4, fr: I34[0] }, { t: 1.9, fr: I34[0] },
      { t: 2.3, fr: I34[1], pop: 'blue' }, { t: 4.9, fr: I34[1] },   // the clover moment
      { t: 5.7, fr: I34[2] },
      { t: 6.4, fr: I34[3], exit: { blue: -280 } },
      { t: 7.2, fr: I34[4] },
      { t: 7.7, fr: kf([pano(...WINDOW)], 0) },   // the dim hands over to the time-lapse colours
      { t: 13.8, fr: kf([pano(...WINDOW)], 0) },
    ],
    draw(t) {
      const LAPSE0 = 7.2;
      const lapse = Math.max(0, t - LAPSE0);
      // time-lapse: the grass sways quicker as the days speed by
      swayT = clock + lapse * lapse * 0.35;
      // shot 2 ends pushed in; ease back out from there, then creep in again for the time-lapse
      const zoom = lerp(1.05, 1, ease(seg(t, 0, 1.4))) + 0.06 * ease(clamp01(lapse / 6.6));
      // the clover pops up with a little bounce as it fades in
      const cb = seg(t, 1.9, 2.6);
      drawPose(poseAt(this.keys, t), zoom, L => {
        if (L.role === 'clover' && cb > 0 && cb < 1) L.sx = L.sy = 1 + 0.3 * Math.sin(Math.PI * cb) * (1 - cb);
      });
      drawLine('A clover... it reminds me of you, Clover.', t, 2.5, 4.9, 'You');
      // the days go by faster and faster, starting from the evening the shot
      // opens on (about four days in all); p counts days, dawn at each .78
      const P0 = 0.22, RATE = 1 / 3, SPEEDUP = 0.045;
      const p = P0 + lapse * RATE + lapse * lapse * SPEEDUP;
      const night = timeOfDay(p, ease(seg(t, LAPSE0, LAPSE0 + 0.5)));
      windowFireflies(night, zoom);
      // day counter, 1.5s into the time-lapse until just before the cut
      // (about 28.8s to 33.8s into the intro): Clover left on day 1, so each
      // dawn after that is a new day
      const day = 1 + Math.floor(p + 0.22);
      const dawnP = day - 1.22; // when this day's dawn was
      const dawnLapse = (-RATE + Math.sqrt(RATE * RATE + 4 * SPEEDUP * Math.max(0, dawnP - P0))) / (2 * SPEEDUP);
      const show = Math.min(seg(t, LAPSE0 + 1.5, LAPSE0 + 1.9), 1 - seg(t, LAPSE0 + 6.2, LAPSE0 + 6.5));
      drawDayCounter(day, lapse - dawnLapse, show);
    },
  },
  {
    name: 'Decision + gear up', dur: 7, board: 'Intro 5. + 6.',
    sounds: [[1.0, 'jump'], [3.75, 'pop'], [5.15, 'pop']], // the hop; the hat, then the backpack
    notes: 'Bluebell decides with a hop, then a cut to the close-up by the door: the flower hat pops on, then the backpack, each with a sparkle.',
    todo: [],
    keys: [
      { t: 0, fr: I56[0] }, { t: 2.4, fr: I56[0] },
      { t: 2.4, fr: I56[1] }, { t: 3.4, fr: I56[1] },
      { t: 3.75, fr: I56[2], pop: 'blue' }, { t: 4.8, fr: I56[2] },
      { t: 5.15, fr: I56[3], pop: 'blue' }, { t: 7, fr: I56[3] },
    ],
    draw(t) {
      // the "that's it" hop: squash, stretch, settle — feet planted
      const h = seg(t, 0.8, 1.5);
      const squash = h <= 0 || h >= 1 ? 1 : h < 0.3 ? lerp(1, 0.84, h / 0.3) : h < 0.6 ? lerp(0.84, 1.12, (h - 0.3) / 0.3) : lerp(1.12, 1, (h - 0.6) / 0.4);
      const lift = h > 0.3 && h < 1 ? Math.sin(Math.PI * (h - 0.3) / 0.7) * 26 : 0;
      const P = poseAt(this.keys, t);
      drawPose(P, 1, L => {
        if (L.role === 'blue' && t < 2.4) { L.sy *= squash; L.sx *= 2 - squash; L.m = L.m.slice(); L.m[5] -= lift; }
      });
      sparkleAt(300, 290, seg(t, 3.6, 4.6));
      sparkleAt(300, 290, seg(t, 5.0, 6.0));
      drawLine("That's it. I'm going.", t, 0.4, 2.3, 'You');
    },
  },
  {
    name: 'Out the door', dur: 6, board: '(log house drawing)',
    sounds: [[0.05, 'door'], [4.3, 'rustle'], [5.35, 'roundWon']], // out the door; through the hole; the Greenhouse card
    notes: 'The only outdoor shot. Bluebell, in full gear, comes out of the log\'s round door, walks to the hole at the foot of the garden wall, looks back at home once and goes through. Fade to white, then the Greenhouse.',
    todo: ["The sky and ground are the game's daylight art, standing in"],
    draw(t) {
      const stop = HOLE_X - 30;
      let x = LOG_DOOR_X, facing = 1, walking = false, alpha = clamp01(t / 0.4);
      if (t > 0.4 && t < 3.4) { x = lerp(LOG_DOOR_X, stop, seg(t, 0.4, 3.4)); walking = true; }
      else if (t >= 3.4 && t < 4.1) { x = stop; facing = t > 3.55 && t < 3.95 ? -1 : 1; } // one look back at home
      else if (t >= 4.1) { x = lerp(stop, HOLE_X + 8, seg(t, 4.1, 4.8)); walking = true; alpha = 1 - seg(t, 4.3, 4.8); }
      // the usual closeness (Bluebell at their normal size); the camera just
      // follows them sideways
      cam = { x: Math.max(190, Math.min(x + 40, HOLE_X - 40)), y: 112.5, z: 2.1 }; applyCamera();
      drawScene(t * 4);
      drawBug('blue', x, { facing, walking, frame: walking ? walkFrame() : idleFrame(), alpha });
      drawTags();
      drawLine("Hold on. I'm coming.", t, 0.5, 2.6, 'You');
      fadeTo('#ffffff', seg(t, 4.9, 5.5));
      if (t > 5.3) {
        screenSpace(); ctx.globalAlpha = seg(t, 5.3, 5.7);
        ctx.fillStyle = '#2a2140'; ctx.font = `28px 'Pixelta', system-ui, sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('The Sunlit Greenhouse', CW / 2, CH / 2);
        ctx.font = `700 14px 'Atkinson Hyperlegible', system-ui, sans-serif`; ctx.fillText('gameplay begins', CW / 2, CH / 2 + 26);
        ctx.textAlign = 'left'; ctx.globalAlpha = 1;
      }
    },
  },
];

/* ======================================================================
   PLAYBACK
   ====================================================================== */
const starts = []; let total = 0;
for (const s of SHOTS) { starts.push(total); total += s.dur * 1000; }
let T = 0, playing = false, last = performance.now();

const $ = id => document.getElementById(id);
const scrub = $('scrub'); scrub.max = total;
const strip = $('strip');
SHOTS.forEach((s, i) => {
  const b = document.createElement('button');
  b.style.setProperty('--dur', s.dur);
  b.innerHTML = `<b>${i + 1}</b><span>${s.name}</span>`;
  b.title = `Shot ${i + 1}: ${s.name} (${s.dur}s)`;
  b.addEventListener('click', () => { T = starts[i]; renderNow(); });
  strip.appendChild(b);
});

function shotAt(ms) { let i = SHOTS.length - 1; while (i > 0 && ms < starts[i]) i--; return i; }
let shownShot = -1;
function updateNotes(i) {
  if (i === shownShot) return;
  shownShot = i;
  const s = SHOTS[i];
  $('shotLabel').textContent = `Shot ${i + 1} · ${s.dur}s · storyboard: ${s.board}`;
  $('shotName').textContent = s.name;
  $('shotNotes').textContent = s.notes;
  $('shotTodo').innerHTML = s.todo.length ? s.todo.map(x => `<li>${x}</li>`).join('') : '<li class="none">Nothing — all real art</li>';
  strip.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-current', k === i ? 'true' : 'false'));
}

function renderNow() {
  fitCanvas();
  const i = shotAt(T), t = (T - starts[i]) / 1000;
  clock = T / 1000;
  swayT = clock;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  tiltY = 0;
  tags = [];
  SHOTS[i].draw(Math.min(t, SHOTS[i].dur));
  scrub.value = T;
  $('time').textContent = `${(T / 1000).toFixed(1)}s / ${(total / 1000).toFixed(1)}s`;
  updateNotes(i);
  skipBtn.hidden = T >= SKIP_TO;
  skipBtn.classList.toggle('is-blue', i === SHOTS.length - 1);
}

// Skip jumps past the story to the "The Sunlit Greenhouse" card at the very
// end (the moment the white fade gives way to it), and keeps playing from there.
const SKIP_TO = starts[SHOTS.length - 1] + 5300;
const skipBtn = $('skip');
function skipIntro() { T = SKIP_TO; setPlaying(true); renderNow(); }
skipBtn.addEventListener('click', e => { e.stopPropagation(); skipIntro(); });

// Played in the game, each shot's `sounds` ([seconds into the shot, the
// game's sfx name], or a function giving that list) play as playback passes
// them; a skip lands past them, so it doesn't set them all off at once.
function playCues(from, to) {
  if (!HOST?.sound) return;
  SHOTS.forEach((s, i) => {
    const cues = typeof s.sounds === 'function' ? s.sounds() : s.sounds || [];
    for (const [at, name] of cues) {
      const ms = starts[i] + at * 1000;
      if (ms > from && ms <= to) HOST.sound[name]?.();
    }
  });
}
function setPlaying(p) { playing = p; $('play').textContent = p ? 'Pause' : 'Play'; last = performance.now(); }
function frame(now) {
  if (RUN !== window.__animaticRun) return; // a newer copy of the page has taken over
  if (playing) {
    playCues(T, T + (now - last));
    T += now - last;
    if (T >= total) {
      if ($('loop').checked && !CUTSCENE) T = 0;
      else { T = total - 1; setPlaying(false); tellGame('cutscene-done'); }
    }
  }
  last = now;
  renderNow();
  requestAnimationFrame(frame);
}

$('play').addEventListener('click', () => { if (T >= total - 1) T = 0; setPlaying(!playing); });
cv.addEventListener('click', () => { if (CUTSCENE) return; if (T >= total - 1) T = 0; setPlaying(!playing); });
$('restart').addEventListener('click', () => { T = 0; setPlaying(true); });
$('prev').addEventListener('click', () => { const i = shotAt(T); T = starts[(T - starts[i] < 600 && i > 0) ? i - 1 : i]; });
$('next').addEventListener('click', () => { const i = shotAt(T); if (i < SHOTS.length - 1) T = starts[i + 1]; });
scrub.addEventListener('input', () => { T = Number(scrub.value); setPlaying(false); });
$('tags').addEventListener('change', e => { showTags = e.target.checked; });
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' && e.target.type === 'range') return;
  if (CUTSCENE) { if (e.code === 'KeyS' && T < SKIP_TO) skipIntro(); return; } // only skip, as a cutscene
  if (e.code === 'Space') { e.preventDefault(); if (T >= total - 1) T = 0; setPlaying(!playing); }
  else if (e.code === 'KeyS' && T < SKIP_TO) skipIntro();
  else if (e.code === 'ArrowRight') $('next').click();
  else if (e.code === 'ArrowLeft') $('prev').click();
});

if (saved.T) T = Math.max(0, Math.min(saved.T, total - 1));
// As a cutscene: in the game, play from the start with the player's run
// (e.g. how many clovers they found, for shots that depend on it). In a page
// of its own, say it's loaded and wait for a go-ahead carrying the run; with
// no word, it plays anyway after a moment.
if (HOST) {
  if (HOST.run && typeof applyRun === 'function') applyRun(HOST.run);
  T = 0; setPlaying(true);
  tellGame('cutscene-ready');
} else if (CUTSCENE) {
  let begun = false;
  const begin = run => {
    if (begun) return;
    begun = true;
    if (run && typeof applyRun === 'function') applyRun(run);
    T = 0; setPlaying(true);
  };
  window.addEventListener('message', e => { if (e.data?.ladybugCutscene && e.data.type === 'cutscene-start') begin(e.data.run); });
  setTimeout(() => begin(null), 1500);
  tellGame('cutscene-ready');
}
renderNow();
requestAnimationFrame(frame);
// a handle for checking the page from the console
window.__animatic = {
  get T() { return T; }, set T(v) { T = v; renderNow(); },
  get total() { return total; }, get playing() { return playing; }, starts, SHOTS,
  renderNow, setPlaying, frame, fixSize(w, h) { fixedSize = [w, h]; renderNow(); }, canvas: cv,
};
}
startAnimatic({});
};
