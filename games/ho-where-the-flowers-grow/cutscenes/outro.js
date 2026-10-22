// Built from outro-animatic.html by build-cutscenes.sh; edit the animatic, not this.
window.LadybugCutscenes = window.LadybugCutscenes || {};
window.LadybugCutscenes.outro = function (host) {
host.innerHTML = `<div class="wrap">
  <header>
    <h1>Berries for Clovers</h1>
    <p>Outro animatic · first pass · stand-ins are tagged “to draw”</p>
  </header>

  <div class="stage"><canvas id="stage" width="800" height="450" aria-label="Animatic playback. Click to play or pause."></canvas><button class="skip" id="skip" title="Skip to the end (S)">skip &gt;&gt;</button></div>

  <div class="transport">
    <button class="primary" id="play">Play</button>
    <button id="prev" aria-label="Previous shot">◀ Shot</button>
    <button id="next" aria-label="Next shot">Shot ▶</button>
    <button id="restart">Restart</button>
    <div class="toggles">
      <label><input type="checkbox" id="tags" checked> Show “to draw” tags</label>
      <label><input type="checkbox" id="loop"> Loop</label>
      <label>Clovers found <select id="found"><option value="0">none</option><option value="16">some (16)</option><option value="47" selected>all 47</option></select></label>
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
      <p class="feedback">Give notes by shot, for example <b>“a longer hug”</b>, <b>“Clover cries in shot 1”</b>, <b>“a different gift line”</b>, or drop a rough sketch in for any shot.</p>
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
const OUTLINE = null; // the outro's text has no outline (the intro's is black)
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

function fadeTo(color, a) {
  if (a <= 0) return;
  screenSpace(); ctx.globalAlpha = a; ctx.fillStyle = color; ctx.fillRect(0, 0, CW, CH); ctx.globalAlpha = 1;
}

/* ======================================================================
   OUTRO — the reunion and the gifts, all in the Soil Bed by the lantern
   ====================================================================== */
// the Soil Bed's backdrop (the game's Mossy art)
const SOIL = { back: img('cutscenes/img/soil-back.png'), middle: img('cutscenes/img/soil-middle.png'), front: img('cutscenes/img/soil-front.png') };

// How many clovers the player found (the "Clovers found" picker): sets the
// clovers on Bluebell's back (none if none were found), her gift line, the
// clovers sprouting at the end (all of them only) and the subtitle under "The End".
// Played by the game, both come from the player's run ({ found, total },
// handed over as the cutscene starts: see applyRun).
let TOTAL_CLOVERS = 47;
let found = TOTAL_CLOVERS;
function applyRun(run) {
  if (Number(run.total) > 0) TOTAL_CLOVERS = Number(run.total);
  found = Math.max(0, Math.min(TOTAL_CLOVERS, Number(run.found) || 0));
}

// A garden's three backdrop layers (402x251 each, tiled sideways), in
// screen space: each layer slides at a fraction of the camera's speed — far
// layers slowest — like the game. Its bottom sits at world y=225, under the grass.
function drawBackdrop(set) {
  const h = 440, sh = h * cam.z, sy = toScreen(0, 225 - h)[1];
  screenSpace();
  ctx.fillStyle = '#2b3a33'; ctx.fillRect(0, 0, CW, CH);
  for (const [layer, par] of [[set.back, 0.1], [set.middle, 0.25], [set.front, 0.45]]) {
    if (!ready(layer)) continue;
    const sw = layer.naturalWidth * (sh / layer.naturalHeight);
    let off = (cam.x * cam.z * par) % sw; if (off < 0) off += sw;
    for (let x = -off - sw; x < CW; x += sw) ctx.drawImage(layer, 1, 0, layer.naturalWidth - 2, layer.naturalHeight, Math.round(x), Math.round(sy), Math.ceil(sw) + 1, Math.ceil(sh));
  }
  applyCamera(); // back to world space for whatever's drawn next
}
// ground tiles across whatever the camera can see
function drawGroundAround() {
  const x0 = Math.floor((cam.x - CW / 2 / cam.z) / 32) * 32 - 32, x1 = cam.x + CW / 2 / cam.z + 32;
  for (let x = x0; x < x1; x += 32) {
    if (ready(A.groundTop)) ctx.drawImage(A.groundTop, x, GROUND);
    if (ready(A.groundFill)) for (let k = 1; k <= 3; k++) ctx.drawImage(A.groundFill, x, GROUND + 32 * k);
  }
}
// a colour wash over the whole frame (screen space)
function wash(rgb, a, mode = 'multiply') {
  if (a <= 0.003) return;
  screenSpace();
  ctx.globalCompositeOperation = mode;
  ctx.fillStyle = `rgba(${rgb},${a})`; ctx.fillRect(0, 0, CW, CH);
  ctx.globalCompositeOperation = 'source-over';
  applyCamera();
}
// a soft warm glow at a world point (the lantern); r is in screen px at the usual 2.7x closeness
function glowAt(wx, wy, r, a, rgb = '255,196,120') {
  if (a <= 0) return;
  screenSpace();
  const [sx, sy] = toScreen(wx, wy), sr = r * cam.z / 2.7;
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
  g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g; ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
  ctx.globalCompositeOperation = 'source-over';
  applyCamera();
}
// The Soil Bed: the game's Mossy backdrop and grass, darkened, with the lantern lit behind the two of them
function soilScene() { drawBackdrop(SOIL); drawGroundAround(); }
function soilLight() { wash('58,66,96', 0.55); glowAt(200, GROUND - 50, 260, 0.35); }

// The gifts, lifted out of your two gift drawings (Bluebell carrying the
// clovers on her back, Clover with the basket of berries at her feet) as
// layers on the bugs' own 64x64 sprite grid, so they sit on either bug and
// can be passed across. `center` is each gift's middle in sprite pixels.
const GIFTS = {
  clovers: { im: img('cutscenes/img/gift-clovers.png'), center: [31, 40] },
  basket: { im: img('cutscenes/img/gift-basket.png'), center: [35, 53] },
};
// where a gift's middle is in the world when bug-at-x (facing, hop) has it
function giftSpot(gift, x, facing = 1, hop = 0) {
  const [cx, cy] = GIFTS[gift].center;
  return [x + facing * (cx - 32), GROUND - hop + (cy - 53)];
}
// draw a gift with its middle at a world point, mirrored for a bug facing left
function drawGift(gift, [wx, wy], facing = 1, alpha = 1) {
  const g = GIFTS[gift];
  if (alpha <= 0 || !ready(g.im)) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(wx - facing * (g.center[0] - 32)), Math.round(wy - (g.center[1] - 53)));
  ctx.scale(facing, 1);
  ctx.drawImage(g.im, -32, -53, 64, 64);
  ctx.restore();
}
// a gift passed from one bug to the other: its middle travels in an arc
// (lift px high) and it turns to face its new owner halfway over
function drawGiftPass(gift, from, to, u, lift) {
  const k = ease(u);
  const spot = [lerp(from.spot[0], to.spot[0], k), lerp(from.spot[1], to.spot[1], k) - Math.sin(k * Math.PI) * lift];
  drawGift(gift, spot, k < 0.5 ? from.facing : to.facing);
}
// STAND-IN: little pixel hearts floating up from the hug (world space)
const HEART = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
function drawHearts(x, y, t) {
  if (t <= 0 || t >= 1) return;
  for (let k = 0; k < 3; k++) {
    const u = clamp01(t * 1.4 - k * 0.2);
    if (u <= 0 || u >= 1) continue;
    const hx = Math.round(x + (k - 1) * 12 + Math.sin(u * 6 + k) * 2), hy = Math.round(y - u * 34);
    ctx.globalAlpha = 1 - u;
    HEART.forEach((row, r) => [...row].forEach((c, col) => {
      if (c !== 'X') return;
      ctx.fillStyle = (r === 1 && col === 1) ? '#ffd6e6' : '#ee8fbf';
      ctx.fillRect(hx + col - 3, hy + r, 1, 1);
    }));
  }
  ctx.globalAlpha = 1;
}
// hop height for a little happy bounce: `count` hops between t0 and t1
const bounce = (t, t0, t1, count, h) => { const u = seg(t, t0, t1); return u <= 0 || u >= 1 ? 0 : Math.abs(Math.sin(u * Math.PI * count)) * h; };
// Clover's idle blink cycle (the game's partner sprite, 3 frames)
const cloverFrame = () => Math.floor(clock / 0.6) % 3;

// BONUS (every clover found): lucky clovers sprout up out of the ground
// all around them, one after another, each with a little pop
const SPROUTS = [-150, -118, -96, -70, -48, 48, 70, 96, 120, 150, -132, 134, -84, 84].map((dx, k) => ({ dx, k, s: 0.42 + (k % 3) * 0.08 }));
function drawSprouts(cx, t0, t) {
  if (found < TOTAL_CLOVERS) return;
  for (const p of SPROUTS) {
    const u = seg(t, t0 + p.k * 0.12, t0 + p.k * 0.12 + 0.35);
    if (u <= 0) continue;
    const pop = u < 1 ? Math.sin(u * Math.PI * 0.75) * 1.25 : 1;
    drawClover(cx + p.dx, GROUND - 22 * p.s * pop + 2, p.s * pop); // sits on the grass
  }
}

function drawEndCard(a) {
  if (a <= 0) return;
  screenSpace();
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = '#0e0c17'; ctx.fillRect(0, 0, CW, CH);
  ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  ctx.font = `56px ${VOICE}`; ctx.letterSpacing = '3px'; ctx.lineWidth = 8; ctx.strokeStyle = OUTLINE; ctx.fillStyle = '#d9ff00';
  outlined('The End', CW / 2, CH / 2 + 8); ctx.fillText('The End', CW / 2, CH / 2 + 8);
  ctx.font = `20px ${VOICE}`; ctx.letterSpacing = '2px'; ctx.lineWidth = 5; ctx.fillStyle = '#fff3d6';
  const sub = found >= TOTAL_CLOVERS ? 'A Garden Full of Luck' : 'You Found Each Other'; // the game's own end titles
  outlined(sub, CW / 2, CH / 2 + 48); ctx.fillText(sub, CW / 2, CH / 2 + 48);
  ctx.restore();
}

// Bluebell's line with the clovers depends on how many clovers they found
function giftLine() {
  if (found <= 0) return 'I forgot the clovers... I only thought of you.';
  if (found >= TOTAL_CLOVERS) return 'Every clover in the garden. All 47, for you.';
  return 'I picked these on the way. For you.';
}

/* ======================================================================
   SHOTS — a first pass with stand-ins; frames from the storyboard will
   replace them as they're drawn
   ====================================================================== */
const SHOTS = [
  {
    name: 'Reunion', dur: 8.5, board: '(none yet)', skipBlue: true, // skip button in Bluebell's blue, like intro shot 5
    sounds: [[6.4, 'hug']],
    notes: 'Deep in the Soil Bed, by the lantern. Clover is there, looking away. Bluebell comes in and says their name; Clover turns around ("...you came."), and they rush to each other for a hug, with little hearts.',
    todo: ['The hug (two bounces stand in)', 'Hearts (pixel stand-ins)', 'Clover sitting, looking away (the standing sprite stands in)'],
    draw(t) {
      cam = { x: 200, y: 140, z: 2.7 }; applyCamera();
      soilScene();
      // Bluebell walks in from the left and stops; later both rush together
      const rush = ease(seg(t, 5.6, 6.3));
      const bx = lerp(t < 2.4 ? lerp(90, 150, ease(seg(t, 0, 2.4))) : 150, 184, rush), gx = lerp(250, 216, rush);
      const bWalk = t < 2.4 || (t > 5.6 && t < 6.3), gWalk = t > 5.6 && t < 6.3;
      // Clover turns around: facing squeezes from away (right) to toward Bluebell (left)
      const turn = seg(t, 3.6, 4.0);
      let gFace = turn < 0.5 ? 1 - 2 * turn : -(2 * turn - 1);
      if (Math.abs(gFace) < 0.15) gFace = turn < 0.5 ? 0.15 : -0.15;
      const hugHop = bounce(t, 6.4, 7.6, 2, 5);
      drawBug('blue', bx, { walking: bWalk, frame: bWalk ? walkFrame() : idleFrame(), hop: hugHop });
      drawBug('green', gx, { facing: gFace, walking: gWalk, frame: gWalk ? walkFrame() : cloverFrame(), hop: hugHop });
      // Bluebell arrives with the clovers on her back; Clover's basket waits at
      // her feet, and stays put on the grass when she rushes over for the hug
      if (found > 0) drawGift('clovers', giftSpot('clovers', bx, 1, hugHop));
      drawGift('basket', t < 5.6 ? giftSpot('basket', gx, gFace) : giftSpot('basket', 250, -1), t < 5.6 ? Math.sign(gFace) : -1);
      drawHearts(200, GROUND - 40, seg(t, 6.4, 8.3));
      if (t > 6.3) tag(176, GROUND - 46, 48, 46, 'to draw: the hug');
      soilLight();
      drawSparkles(200, GROUND - 26, seg(t, 6.5, 7.5));
      drawTags();
      drawLine('Clover...?', t, 2.6, 3.7, 'You');
      drawLine('...you came.', t, 4.2, 5.4, '???');
      fadeTo('#000', 1 - seg(t, 0, 0.6));
    },
  },
  {
    name: 'Gifts', dur: 8.5, board: '(none yet)', skipBlue: true, // skip button in Bluebell's blue, like intro shot 5
    sounds: [[0.9, 'flip'], [3.1, 'flip'], [5.3, 'pop'], [6.1, 'clover']], // each gift offered; the swap; the sparkles
    notes: 'They step back with their gifts: Clover\'s basket of blueberries ("I saved the ripest ones for you."), the clovers on Bluebell\'s back, with a line that depends on how many clovers the player found. They swap (the basket passes low, the clovers arc over), then a happy bounce together.',
    todo: ['After the swap, each bug with the other\'s gift is pieced together from your two gift drawings: worth a check'],
    draw(t) {
      cam = { x: 200, y: 140, z: 2.7 }; applyCamera();
      soilScene();
      const step = ease(seg(t, 0, 0.6));
      const bx = lerp(184, 158, step), gx = lerp(216, 242, step); // a little apart, so the gifts have room
      const hopB = bounce(t, 6.4, 7.6, 2, 7), hopG = bounce(t, 6.5, 7.7, 2, 7);
      const backing = t < 0.6; // stepping back to make room, legs walking
      drawBug('blue', bx, { walking: backing, frame: backing ? walkFrame() : idleFrame(), hop: hopB });
      drawBug('green', gx, { facing: -1, walking: backing, frame: backing ? walkFrame() : cloverFrame(), hop: hopG });
      // the gifts: each gives a little hop as it's offered (the basket at 0.9,
      // the clovers at 3.1), then they trade across (5.3-6.1)
      const swap = seg(t, 5.3, 6.1);
      const blue = (gift, hop) => ({ spot: giftSpot(gift, bx, 1, hopB + hop), facing: 1 });
      const green = (gift, hop) => ({ spot: giftSpot(gift, gx, -1, hopG + hop), facing: -1 });
      const basketHop = bounce(t, 0.9, 1.5, 1, 3), cloversHop = bounce(t, 3.1, 3.7, 1, 3);
      drawGiftPass('basket', green('basket', basketHop), blue('basket', 0), swap, 10);
      if (found > 0) drawGiftPass('clovers', blue('clovers', cloversHop), green('clovers', 0), swap, 22);
      soilLight();
      drawSparkles(200, GROUND - 26, seg(t, 6.1, 7.1));
      drawTags();
      drawLine('I saved the ripest ones for you.', t, 0.9, 2.9, '???');
      drawLine(giftLine(), t, 3.1, 5.2, 'You');
    },
  },
  {
    name: 'Together', dur: 10, board: '(none yet)', skipBlue: true, // skip button in Bluebell's blue, like intro shot 5
    // the clovers sprouting (every clover found only), then "The End"
    sounds: () => [...(found >= TOTAL_CLOVERS ? SPROUTS.map(p => [2.2 + p.k * 0.12, 'sprout']) : []), [8.25, 'fanfare']],
    notes: 'The camera slowly pulls back on the two of them side by side, each holding their gift, with fireflies drifting in the lantern light. "Let\'s go home." / "Together, this time." (the game\'s last lines). If the player found every clover, lucky clovers sprout up all around them. Fade to "The End".',
    todo: ['Each bug with the other\'s gift is pieced together from your two gift drawings: worth a check', 'The sprouting clovers use the game\'s clover sprite (all 47 only)'],
    draw(t) {
      const out = ease(seg(t, 0, 6.5));
      cam = { x: 200, y: lerp(140, 128, out), z: lerp(2.7, 1.9, out) }; applyCamera();
      soilScene();
      drawSprouts(200, 2.2, t);
      const bx = 170, gx = 230;
      const hop = bounce(t, 0.3, 1.1, 1, 4);
      drawBug('blue', bx, { frame: idleFrame(), hop });
      drawBug('green', gx, { facing: -1, frame: cloverFrame(), hop });
      // after the trade: the basket at Bluebell's feet, the clovers on Clover's back
      drawGift('basket', giftSpot('basket', bx, 1, hop), 1);
      if (found > 0) drawGift('clovers', giftSpot('clovers', gx, -1, hop), -1);
      soilLight();
      drawFireflies(clamp01(t / 2));
      drawLine("Let's go home.", t, 1.6, 3.4, '???');
      drawLine('Together, this time.', t, 3.8, 5.8, 'You');
      fadeTo('#000', seg(t, 7, 8.2));
      drawEndCard(seg(t, 8.2, 9.2));
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
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
  tiltY = 0;
  tags = [];
  SHOTS[i].draw(Math.min(t, SHOTS[i].dur));
  scrub.value = T;
  $('time').textContent = `${(T / 1000).toFixed(1)}s / ${(total / 1000).toFixed(1)}s`;
  updateNotes(i);
  skipBtn.hidden = T >= SKIP_TO;
  skipBtn.classList.toggle('is-blue', !!SHOTS[i].skipBlue);
}

// Skip jumps past the story to the "The End" card (the moment it fades in),
// and keeps playing from there.
const SKIP_TO = starts[SHOTS.length - 1] + 8200;
const skipBtn = $('skip');
function skipToEnd() { T = SKIP_TO; setPlaying(true); renderNow(); }
skipBtn.addEventListener('click', e => { e.stopPropagation(); skipToEnd(); });

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
$('found').addEventListener('change', e => { found = Number(e.target.value); renderNow(); });
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' && e.target.type === 'range') return;
  if (CUTSCENE) { if (e.code === 'KeyS' && T < SKIP_TO) skipToEnd(); return; } // only skip, as a cutscene
  if (e.code === 'Space') { e.preventDefault(); if (T >= total - 1) T = 0; setPlaying(!playing); }
  else if (e.code === 'KeyS' && T < SKIP_TO) skipToEnd();
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
  get found() { return found; }, set found(v) { found = v; renderNow(); },
};
}
startAnimatic({});
};
