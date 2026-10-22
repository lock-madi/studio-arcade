// Lightweight confetti burst on the dedicated confetti canvas.

Game.confetti = {
  ctx: null,
  particles: [],
  running: false,
};

Game.initConfetti = function () {
  const canvas = document.getElementById('confettiCanvas');
  Game.confetti.ctx = canvas.getContext('2d');
};

const CONFETTI_COLORS = ['#ffd75e', '#ff5b5b', '#3aa0ff', '#63e06b', '#ff9c3c', '#ffffff'];

Game.burstConfetti = function (count) {
  count = count || 90;
  const c = Game.confetti;
  for (let i = 0; i < count; i++) {
    c.particles.push({
      x: 200 + (Math.random() - 0.5) * 120,
      y: 260 + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 6,
      vy: -Math.random() * 7 - 3,
      size: 4 + Math.random() * 5,
      color: CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0],
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      life: 0,
      maxLife: 70 + Math.random() * 30,
    });
  }
  if (!c.running) {
    c.running = true;
    requestAnimationFrame(Game.tickConfetti);
  }
};

Game.tickConfetti = function () {
  const c = Game.confetti;
  const ctx = c.ctx;
  ctx.clearRect(0, 0, 400, 750);

  for (let i = c.particles.length - 1; i >= 0; i--) {
    const p = c.particles[i];
    p.vy += 0.18;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life++;
    if (p.life > p.maxLife || p.y > 780) {
      c.particles.splice(i, 1);
      continue;
    }
    const alpha = Math.max(0, 1 - p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    ctx.restore();
  }

  if (c.particles.length > 0) {
    requestAnimationFrame(Game.tickConfetti);
  } else {
    c.running = false;
    ctx.clearRect(0, 0, 400, 750);
  }
};
