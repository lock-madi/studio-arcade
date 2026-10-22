// Scoring / probability model + simple CPU AI. Pure logic, no DOM here.

Game.combineQuality = function (pullScore, timingScore) {
  const q = pullScore * 0.4 + timingScore * 0.6;
  return Math.max(0, Math.min(1, q));
};

// Returns one of: 'miss' | 'score3' | 'catchable'
Game.rollThrowOutcome = function (quality, edginess) {
  let pMiss = (1 - quality) * (0.28 + 0.42 * edginess);
  pMiss = Math.max(0, Math.min(0.62, pMiss));
  const remain = 1 - pMiss;

  // Combines the old separate "hit the cup" and "spun through the cups"
  // probability mass into one "in the cup" outcome. Steeper than a plain
  // product of quality*edginess — squaring/raising both means an
  // average throw (quality/edginess around 0.5-0.7) lands in the cup
  // much less than before, while a near-perfect throw aimed right at
  // the cup still climbs to a meaningfully high chance. Edginess gets
  // the steeper exponent since "aim close to the cup" is the harder/
  // riskier half of the ask.
  let pCup3 = 0.38 * Math.pow(quality, 2) * Math.pow(edginess, 2.5);
  const cap = remain * 0.85;
  if (pCup3 > cap && pCup3 > 0) {
    pCup3 = cap;
  }

  const r = Math.random();
  if (r < pMiss) return 'miss';
  if (r < pMiss + pCup3) return 'score3';
  return 'catchable';
};

// When the player is on offense and the throw is "catchable", the CPU defense
// auto-resolves whether it stops the point. Better player throw quality lowers
// the CPU's catch chance. A throw aimed safely at the table's center was
// previously just as catchable as one aimed out toward the cups — meaning a
// good, safe, center-aimed throw almost always scored, with no reason to
// risk aiming anywhere else. Now a safe/center aim (low edginess) gives the
// CPU an easier read and a real bonus to its catch chance — dead center is
// the easiest throw for the CPU to defend, right in front of it — fading to
// no bonus at all once the aim is out at the cups, where the CPU has to
// react more.
Game.cpuDefenseCatchRoll = function (quality, edginess) {
  const base = (1 - quality) * 0.65 + 0.08;
  const safeAimBonus = (1 - edginess) * 0.2;
  const chance = Math.max(0, Math.min(0.9, base + safeAimBonus));
  return Math.random() < chance;
};

// When the CPU is on offense, a "miss" gives the CPU's own defense-flavored
// fifa attempt (auto, fixed baseline skill).
Game.cpuFifaRoll = function () {
  return Math.random() < 0.24;
};

// Maps the player's catch-ring timing tier score (0..1, or exactly 0 for a
// full miss) to the chance the point gets stopped.
Game.playerCatchChanceFromTier = function (tierScore) {
  if (tierScore <= 0) return 0;
  return Math.max(0, Math.min(0.93, tierScore * 0.85 + 0.05));
};

// Maps the player's fifa timing tier score to success chance.
Game.playerFifaChanceFromTier = function (tierScore) {
  if (tierScore <= 0) return 0;
  return Math.max(0, Math.min(0.85, tierScore * 0.75));
};

// ---- CPU AI: choose an aim point + throw quality for its own offense ----
Game.cpuChooseThrow = function () {
  // CPU aims somewhere in the player's half. Previously riskBias was
  // capped to 0.35-0.85 of the half's radius, which kept every throw
  // (and so every catch-button landing spot, since the button appears
  // at the bounce's actual rest point) clustered in a fairly consistent
  // mid-zone — reads as predictable/too easy to time since the player
  // can tell roughly where to look before the ring even appears. Widened
  // to span almost the full half (near center to right at the edge/cups)
  // so the landing spot varies a lot more throw to throw.
  const half = Game.PLAYER_HALF_CENTROID;
  const maxR = Game.PLAYER_HALF_MAX_R;
  const riskBias = 0.08 + Math.random() * 1.0; // 0.08 - 1.08 (clampToHalf pulls anything past the real edge back in)
  const angle = Math.random() * Math.PI * 2;
  const r = riskBias * maxR;
  let x = half.x + Math.cos(angle) * r;
  let y = half.y + Math.sin(angle) * r * 0.7; // flatten vertically to keep on table
  const aim = Game.clampToHalf({ x, y }, 'player');

  // CPU throw quality: moderate skill with some variance.
  const quality = Math.max(0.15, Math.min(0.97, 0.55 + (Math.random() - 0.5) * 0.6));

  return { aim, quality, edginess: Game.edginess(aim, 'player') };
};
