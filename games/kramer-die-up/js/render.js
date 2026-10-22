// Canvas rendering: yard/house background, table, cups, cartoon characters, die + trail.

Game.ctx = null;
Game.swipeFeedbackCtx = null;

Game.initRender = function () {
  const canvas = document.getElementById('scene');
  Game.ctx = canvas.getContext('2d');
  Game.swipeFeedbackCtx = document.getElementById('swipeFeedback').getContext('2d');
};

// --- geometry helpers -------------------------------------------------

Game.edginess = function (pt, half) {
  const c = half === 'cpu' ? Game.CPU_HALF_CENTROID : Game.PLAYER_HALF_CENTROID;
  const maxR = half === 'cpu' ? Game.CPU_HALF_MAX_R : Game.PLAYER_HALF_MAX_R;
  const d = Math.hypot(pt.x - c.x, pt.y - c.y);
  return Math.max(0, Math.min(1, d / maxR));
};

Game.clampToHalf = function (pt, half) {
  const t = Game.TABLE;
  const minY = half === 'cpu' ? t.farLeft.y + 8 : Game.CENTER_LINE.left.y + 8;
  const maxY = half === 'cpu' ? Game.CENTER_LINE.left.y - 8 : t.nearLeft.y - 8;
  const y = Math.max(minY, Math.min(maxY, pt.y));
  // interpolate left/right edge x-bounds at this y (table narrows toward far side)
  const frac = (y - t.farLeft.y) / (t.nearLeft.y - t.farLeft.y);
  const leftX = t.farLeft.x + (t.nearLeft.x - t.farLeft.x) * frac;
  const rightX = t.farRight.x + (t.nearRight.x - t.farRight.x) * frac;
  const pad = 14;
  const x = Math.max(leftX + pad, Math.min(rightX - pad, pt.x));
  return { x, y };
};

// --- drawing ------------------------------------------------------------

function drawSky(ctx) {
  ctx.fillStyle = Game.COLORS.sky;
  ctx.fillRect(0, 0, 400, Game.HORIZON_Y);
}

function drawYard(ctx) {
  ctx.fillStyle = Game.COLORS.grass;
  ctx.fillRect(0, Game.HORIZON_Y, 400, 750 - Game.HORIZON_Y);
}

function drawTable(ctx) {
  const t = Game.TABLE;
  const tableImg = Game.assetImages.table;
  if (tableImg) {
    // Stretch the art's bounding box onto the trapezoid's own bounding box
    // so it lines up with the game's aim/cup/table geometry.
    const left = Math.min(t.farLeft.x, t.nearLeft.x);
    const right = Math.max(t.farRight.x, t.nearRight.x);
    const top = t.farLeft.y;
    const bottom = t.nearLeft.y;
    ctx.drawImage(tableImg, left, top, right - left, bottom - top);
    return;
  }

  // top (glossy gradient for toy-plastic look)
  const topGrad = ctx.createLinearGradient(t.farLeft.x, t.farLeft.y, t.nearLeft.x, t.nearLeft.y);
  topGrad.addColorStop(0, Game.COLORS.tableTopLight);
  topGrad.addColorStop(1, Game.COLORS.tableTop);
  ctx.fillStyle = topGrad;
  ctx.beginPath();
  ctx.moveTo(t.farLeft.x, t.farLeft.y);
  ctx.lineTo(t.farRight.x, t.farRight.y);
  ctx.lineTo(t.nearRight.x, t.nearRight.y);
  ctx.lineTo(t.nearLeft.x, t.nearLeft.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = Game.COLORS.tableEdge;
  ctx.lineWidth = 5;
  ctx.stroke();

  // wood plank lines
  ctx.strokeStyle = 'rgba(138,90,40,0.4)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    const f = i / 6;
    const lx = t.farLeft.x + (t.nearLeft.x - t.farLeft.x) * f;
    const rx = t.farRight.x + (t.nearRight.x - t.farRight.x) * f;
    const ly = t.farLeft.y + (t.nearLeft.y - t.farLeft.y) * f;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(rx, ly);
    ctx.stroke();
  }

  // center line
  ctx.strokeStyle = Game.COLORS.centerLine;
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(Game.CENTER_LINE.left.x, Game.CENTER_LINE.left.y);
  ctx.lineTo(Game.CENTER_LINE.right.x, Game.CENTER_LINE.right.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawCupImage(ctx, img, x, y) {
  const w = Game.CUP_RADIUS * 2;
  const h = w * (img.naturalHeight / img.naturalWidth);
  ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
}

function drawCups(ctx) {
  const cupImg = Game.assetImages.cup;
  for (const p of Game.CUPS) {
    if (cupImg) {
      drawCupImage(ctx, cupImg, p.x, p.y);
    } else {
      drawCup(ctx, p.x, p.y);
    }
  }
}

function drawCup(ctx, x, y) {
  const r = Game.CUP_RADIUS;
  const grad = ctx.createLinearGradient(x - r, y, x + r, y);
  grad.addColorStop(0, Game.COLORS.cupRedDark);
  grad.addColorStop(0.4, Game.COLORS.cupRed);
  grad.addColorStop(0.62, Game.COLORS.cupRedLight);
  grad.addColorStop(1, Game.COLORS.cupRedDark);
  ctx.fillStyle = grad;
  ctx.strokeStyle = Game.COLORS.cupRedDark;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x - r, y - r * 0.9);
  ctx.lineTo(x + r, y - r * 0.9);
  ctx.lineTo(x + r * 0.72, y + r * 0.9);
  ctx.lineTo(x - r * 0.72, y + r * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // glossy highlight streak
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.35, y, r * 0.14, r * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = Game.COLORS.cupRedDark;
  ctx.beginPath();
  ctx.ellipse(x, y - r * 0.9, r, r * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = Game.COLORS.cupRed;
  ctx.beginPath();
  ctx.ellipse(x, y - r * 0.9, r * 0.8, r * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Chunky 3D-toy / chibi character (Clash Royale-ish proportions):
// oversized head, stubby rounded body, glossy vinyl-figure shading.
function drawCharacter(ctx, x, y, shirtColor, shirtLight, shirtDark, scale, facing, drawShadow) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';

  if (drawShadow !== false) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 48, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // legs (short & chunky)
  ctx.fillStyle = '#333';
  ctx.strokeStyle = '#1c1c1c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-15, 16, 12, 24, 5);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(3, 16, 12, 24, 5);
  ctx.fill(); ctx.stroke();

  // body / shirt (toy-plastic gradient)
  const bodyGrad = ctx.createLinearGradient(-16, -18, 16, 22);
  bodyGrad.addColorStop(0, shirtLight);
  bodyGrad.addColorStop(0.55, shirtColor);
  bodyGrad.addColorStop(1, shirtDark);
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = shirtDark;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-17, 20);
  ctx.quadraticCurveTo(-20, -12, -9, -18);
  ctx.lineTo(9, -18);
  ctx.quadraticCurveTo(20, -12, 17, 20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // arms
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.roundRect(-27, -12, 11, 28, 5.5);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(16, -12, 11, 28, 5.5);
  ctx.fill(); ctx.stroke();

  // hands
  const handGrad = ctx.createRadialGradient(-24, 14, 1, -22, 16, 8);
  handGrad.addColorStop(0, '#fff2e0');
  handGrad.addColorStop(1, Game.COLORS.skinShade);
  ctx.fillStyle = handGrad;
  ctx.beginPath();
  ctx.arc(-22, 16, 7, 0, Math.PI * 2);
  ctx.arc(22, 16, 7, 0, Math.PI * 2);
  ctx.fill();

  // head (big + chibi, glossy gradient)
  const headR = 24;
  const headGrad = ctx.createRadialGradient(-8, -42, 4, 0, -34, headR + 4);
  headGrad.addColorStop(0, '#fff4e6');
  headGrad.addColorStop(0.45, Game.COLORS.skin);
  headGrad.addColorStop(1, Game.COLORS.skinShade);
  ctx.fillStyle = headGrad;
  ctx.strokeStyle = '#c9885a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -34, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // hair (chunky cap shape)
  ctx.fillStyle = Game.COLORS.hair;
  ctx.beginPath();
  ctx.arc(0, -39, headR + 1.5, Math.PI * 1.02, Math.PI * 1.98);
  ctx.closePath();
  ctx.fill();

  // glossy highlight
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.ellipse(-9, -44, 6, 4, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // big expressive chibi eyes
  const eyeOffset = facing === 'left' ? -1 : 1;
  for (const dir of [-1, 1]) {
    const ex = dir * 8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(ex, -33, 4.6, 5.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.arc(ex + eyeOffset * 1.2, -32, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ex + eyeOffset * 1.2 - 1, -33, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // rosy cheeks
  ctx.fillStyle = 'rgba(255,120,120,0.35)';
  ctx.beginPath();
  ctx.ellipse(-13, -25, 3.6, 2.4, 0, 0, Math.PI * 2);
  ctx.ellipse(13, -25, 3.6, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // smile
  ctx.strokeStyle = '#7a4a30';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, -25, 5, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

// Vertical envelope a character occupies at scale=1, matching the
// procedural drawCharacter() proportions: head top at -58, feet at +40,
// ground shadow at +48. Image-based characters are sized/anchored to the
// same envelope so custom art drops in at the same scale as the fallback.
const CHAR_HEIGHT_AT_SCALE1 = 98;
const CHAR_FOOT_OFFSET_AT_SCALE1 = 40;
const CHAR_SHADOW_OFFSET_AT_SCALE1 = 48;

function drawGroundShadow(ctx, x, y, scale) {
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y + CHAR_SHADOW_OFFSET_AT_SCALE1 * scale, 24 * scale, 7 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawCharacterImage(ctx, img, x, y, scale, drawShadow) {
  if (drawShadow !== false) drawGroundShadow(ctx, x, y, scale);
  const h = CHAR_HEIGHT_AT_SCALE1 * scale;
  const w = h * (img.naturalWidth / img.naturalHeight);
  const feetY = y + CHAR_FOOT_OFFSET_AT_SCALE1 * scale;
  ctx.drawImage(img, x - w / 2, feetY - h, w, h);
}

// Defending-team lean: smoothed toward the incoming die's live x while
// the relevant side is on defense and the die is actually in flight or
// resting at a catch point, easing back to 0 (centered) otherwise. Pure
// cosmetic reaction — "move towards the direction where the die is going
// to catch it" — computed once per render tick in Game.render().
Game.LEAN = { player: 0, cpu: 0 };
const LEAN_FACTOR = 0.3;
const LEAN_MAX = 46;

function updateLean() {
  const s = Game.state;
  const dieX = s.die.visible ? s.die.x : 200;
  const reacting = s.phase === 'flight' || s.phase === 'catch';

  let playerTarget = 0;
  let cpuTarget = 0;
  if (reacting && s.possession === 'cpu') {
    playerTarget = Math.max(-LEAN_MAX, Math.min(LEAN_MAX, (dieX - 200) * LEAN_FACTOR));
  } else if (s.phase === 'flight' && s.possession === 'you') {
    cpuTarget = Math.max(-LEAN_MAX, Math.min(LEAN_MAX, (dieX - 200) * LEAN_FACTOR));
  }

  Game.LEAN.player += (playerTarget - Game.LEAN.player) * 0.15;
  Game.LEAN.cpu += (cpuTarget - Game.LEAN.cpu) * 0.15;
}

// Procedural throw wind-up/release/hop pose for whichever player teammate
// is actively throwing (Game.state.throwAnim). Motion reference: Figma
// node 250:52 (a 9-frame hand-drawn sequence) — used only as a reference
// for the shape of the motion, not as literal sprite frames, so this
// works for every skin's single static artwork. p is progress in [0,1]:
// lean back (windup) -> swing through release -> hop + settle.
function getThrowPose(p) {
  if (p <= 0 || p >= 1) return { rot: 0, hopY: 0 };
  let rot = 0, hopY = 0;
  if (p < 0.32) {
    const t = p / 0.32;
    rot = -0.22 * Math.sin(t * Math.PI / 2);
  } else if (p < 0.5) {
    const t = (p - 0.32) / 0.18;
    rot = -0.22 + 0.34 * t; // swings from -0.22 to +0.12 through release
  } else if (p < 0.85) {
    const t = (p - 0.5) / 0.35;
    rot = 0.12 * (1 - t);
    hopY = Math.sin(t * Math.PI) * 14;
  }
  return { rot, hopY };
}

// CPU team is drawn BEFORE the table (see Game.render) so the table's
// opaque fill occludes their lower half — they stand close behind the
// table, only visible from about the waist up, freeing up space above
// the table for the score bug/scene instead of a big visible gap.
function drawCpuTeam(ctx) {
  const cpuImg = Game.assetImages.character_cpu;
  const lean = Game.LEAN.cpu;
  if (cpuImg) {
    drawCharacterImage(ctx, cpuImg, 150 + lean, 138, 0.85);
    drawCharacterImage(ctx, cpuImg, 250 + lean, 138, 0.85);
  } else {
    drawCharacter(ctx, 150 + lean, 138, Game.COLORS.cpu, Game.COLORS.cpuLight, Game.COLORS.cpuDark, 0.85, 'right');
    drawCharacter(ctx, 250 + lean, 138, Game.COLORS.cpu, Game.COLORS.cpuLight, Game.COLORS.cpuDark, 0.85, 'left');
  }
}

// Player team is drawn AFTER the table, fully visible, standing in front
// of it on the near grass.
function drawPlayerTeam(ctx) {
  const youImg = Game.assetImages['skin_' + Game.getSelectedSkin().id];
  const lean = Game.LEAN.player;
  const anim = Game.state.throwAnim;
  const now = performance.now();

  function poseFor(side) {
    if (!anim || !anim.active || anim.side !== side) return { rot: 0, hopY: 0 };
    const p = (now - anim.start) / anim.duration;
    if (p >= 1) { anim.active = false; return { rot: 0, hopY: 0 }; }
    return getThrowPose(p);
  }

  function drawOne(baseX, side, facing) {
    const x = baseX + lean;
    const y = 460;
    const pose = poseFor(side);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(pose.rot);
    ctx.translate(-x, -y);
    const drawY = y - pose.hopY;
    if (youImg) {
      drawCharacterImage(ctx, youImg, x, drawY, 1.15, false);
    } else {
      drawCharacter(ctx, x, drawY, Game.COLORS.you, Game.COLORS.youLight, Game.COLORS.youDark, 1.15, facing, false);
    }
    ctx.restore();
  }

  drawOne(130, 'right', 'right');
  drawOne(270, 'left', 'left');
}

function drawDieShape(ctx, x, y, size, spin) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin || 0);
  ctx.fillStyle = Game.COLORS.die;
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 2;
  const r = size * 0.18;
  ctx.beginPath();
  ctx.roundRect(-size / 2, -size / 2, size, size, r);
  ctx.fill();
  ctx.stroke();
  // pips (show a fixed "5" face for visual flair)
  ctx.fillStyle = '#333';
  const p = size * 0.14;
  const off = size * 0.27;
  const pip = (dx, dy) => { ctx.beginPath(); ctx.arc(dx, dy, p, 0, Math.PI * 2); ctx.fill(); };
  pip(-off, -off); pip(off, -off);
  pip(-off, off); pip(off, off);
  pip(0, 0);
  ctx.restore();
}

function drawDieImage(ctx, img, x, y, size, spin) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin || 0);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawTrail(ctx, trail) {
  if (!trail || trail.length < 2) return;
  ctx.save();
  for (let i = 1; i < trail.length; i++) {
    const a = trail[i - 1];
    const b = trail[i];
    const alpha = (i / trail.length) * 0.6;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAimTargetOnCanvas(ctx, pt, edginess) {
  const pulse = 1 + Math.sin(Date.now() / 180) * 0.08;
  const r = 20 * pulse;
  ctx.save();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.restore();
}

function drawDiamondIcon(ctx, x, y, r, opacity) {
  const img = Game.assetImages.swipe_diamond;
  ctx.save();
  ctx.globalAlpha = opacity != null ? opacity : 1;
  if (img) {
    const size = r * 2;
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
  } else {
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    const s = r * 1.15;
    ctx.beginPath();
    ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Color-codes the drag line by how far short or long of the ring the
// current/release point is — not left/right (that framing moved to the
// timing step's sliding bar; this one is purely about power). Landing
// inside the ring itself is green; outside it, short reads as "released
// too early" and long as "held on too long," each with its own
// yellow-then-red band as the miss gets bigger.
function swipeLineColor(cur) {
  const sw = Game.SWIPE;
  const dx = cur.x - sw.ring.x;
  const dy = cur.y - sw.ring.y; // > 0 = short (below the ring), < 0 = long (past it)
  const dist = Math.hypot(dx, dy);
  if (dist <= sw.ringDisplayR) return '#63e06b'; // in the circle
  return Math.abs(dy) <= sw.shortLongYellowR ? '#ffd75e' : '#ff5b5b';
}

function drawSwipeMeter(ctx) {
  const sw = Game.SWIPE;
  const cur = Game.state.swipePos || sw.start;

  // ring target (fixed)
  const ringImg = Game.assetImages.swipe_ring;
  const rSize = sw.ringDisplayR * 2;
  ctx.save();
  if (ringImg) {
    ctx.drawImage(ringImg, sw.ring.x - rSize / 2, sw.ring.y - rSize / 2, rSize, rSize * (ringImg.naturalHeight / ringImg.naturalWidth));
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(sw.ring.x, sw.ring.y, sw.ringDisplayR, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Accuracy line from the fixed start point to the current/release
  // position — stays drawn (frozen) through the post-release pause too,
  // since Game.state.swipePos isn't cleared until that pause ends.
  if (Game.state.swipePos) {
    const color = swipeLineColor(cur);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sw.start.x, sw.start.y);
    ctx.lineTo(cur.x, cur.y);
    ctx.stroke();
    ctx.restore();
  }

  // fixed anchor marker at the start point (dimmer than the live handle)
  drawDiamondIcon(ctx, sw.start.x, sw.start.y, 18.38, 0.55);
}

Game.render = function () {
  const ctx = Game.ctx;
  if (!ctx) return;
  ctx.clearRect(0, 0, 400, 750);

  const s = Game.state;
  updateLean();

  drawSky(ctx);
  drawYard(ctx);

  // Title screen shows only the flat sky/grass background (no table,
  // cups, or characters) so it doesn't preview the game scene.
  if (s.phase !== 'title') {
    drawCpuTeam(ctx);
    drawTable(ctx);
    drawCups(ctx);
    drawPlayerTeam(ctx);
  }

  if (s.phase === 'aim') {
    drawAimTargetOnCanvas(ctx, s.aim, Game.edginess(s.aim, 'cpu'));
  }

  // Drawn to a separate overlay canvas (stacked above #swipeBox) instead
  // of the main scene ctx, so the live ring/line/anchor never get dimmed
  // underneath the box's own opacity.
  Game.swipeFeedbackCtx.clearRect(0, 0, 400, 750);
  if (s.phase === 'swipe' || s.phase === 'swipeResult') {
    drawSwipeMeter(Game.swipeFeedbackCtx);
  }

  drawTrail(ctx, s.trail);

  if (s.die.visible) {
    const baseScale = Math.max(0.55, 1 + (s.die.z / 220)); // bigger when higher/closer to camera
    const scale = baseScale * (1 - (s.die.sink || 0)); // shrinks away when dropping into a cup
    const size = 26 * scale;
    const dieImg = Game.assetImages.die;
    if (dieImg) {
      drawDieImage(ctx, dieImg, s.die.x, s.die.y, size, s.die.spin || 0);
    } else {
      drawDieShape(ctx, s.die.x, s.die.y, size, s.die.spin || 0);
    }
  }
};

Game.startRenderLoop = function () {
  function loop() {
    Game.render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
};
