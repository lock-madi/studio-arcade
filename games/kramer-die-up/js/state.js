// Shared game state, constants, and table geometry.
// Logical canvas space is 400 x 750 (see index.html canvas size).

const Game = {};

// Player character skins. Only the player's own look is selectable — the
// CPU character is fixed. Extensible: append future skins here and
// nothing else needs to change (the select-screen grid and asset preload
// are both driven off this list).
Game.SKINS = [
  { id: 'default', name: 'Brad', src: 'assets/character_you.svg' },
  { id: 'arby', name: 'Arby', src: 'assets/character_you_arby.svg' },
  { id: 'po', name: 'Po', src: 'assets/character_you_po.svg' },
  { id: 'spike', name: 'Spike', src: 'assets/character_you_spike.svg' },
  { id: 'peaches', name: 'Princess Peaches', src: 'assets/character_you_peaches.svg' },
  { id: 'casper', name: 'Casper', src: 'assets/character_you_casper.svg' },
  { id: 'jack', name: 'Jack', src: 'assets/character_you_jack.svg' },
  { id: 'quin', name: 'Quin', src: 'assets/character_you_quin.svg' },
];

Game.SKIN_STORAGE_KEY = 'dieup_selected_skin';

Game.getSelectedSkinId = function () {
  try {
    const saved = localStorage.getItem(Game.SKIN_STORAGE_KEY);
    if (saved && Game.SKINS.some((s) => s.id === saved)) return saved;
  } catch (e) { /* localStorage unavailable (private mode, etc.) */ }
  return Game.SKINS[0].id;
};

Game.setSelectedSkinId = function (id) {
  try { localStorage.setItem(Game.SKIN_STORAGE_KEY, id); } catch (e) { /* ignore */ }
};

Game.getSelectedSkin = function () {
  const id = Game.getSelectedSkinId();
  return Game.SKINS.find((s) => s.id === id) || Game.SKINS[0];
};

Game.COLORS = {
  sky: '#C9FFFA',
  grass: '#51A341',
  tableTop: '#e0a355',
  tableTopLight: '#f0bd72',
  tableEdge: '#8a5423',
  centerLine: '#ffffff',
  cupRed: '#ff4d4d',
  cupRedLight: '#ff8a7a',
  cupRedDark: '#c22f2f',
  you: '#2e9bff',
  youLight: '#7fd0ff',
  youDark: '#1a5fc4',
  cpu: '#ff4d6a',
  cpuLight: '#ff9baa',
  cpuDark: '#c72c47',
  skin: '#ffcb9e',
  skinShade: '#f0a86e',
  hair: '#4a2f1c',
  die: '#ffffff',
  trail: 'rgba(255, 255, 255, 0.55)',
};

// Sky/grass horizon line. Matches the Figma background reference (node
// 164:6593): sky is 184 of 874px tall there, a 0.2105 fraction.
Game.HORIZON_Y = Math.round(750 * (184 / 874));

// Table trapezoid corners (far = CPU side / top, near = player side / bottom).
// Taper ratio (top width / bottom width = 180/280 = 0.643) matches the
// Figma reference (node 160:6535) exactly, rather than the earlier
// guessed 0.5 ratio which read as too sharply tapered/pointy.
Game.TABLE = {
  farLeft:  { x: 110, y: 150 },
  farRight: { x: 290, y: 150 },
  nearRight:{ x: 340, y: 430 },
  nearLeft: { x: 60,  y: 430 },
};

// Center line endpoints (midpoints of left/right edges)
Game.CENTER_LINE = {
  left:  { x: 85,  y: 290 },
  right: { x: 315, y: 290 },
};

// One cup at each of the 4 table corners, positioned at the same fractional
// inset from each corner (~7% of edge width at the top, ~10%/9% at the
// bottom) measured directly from the Figma reference (node 160:6535).
Game.CUPS = [
  { x: 123, y: 149 }, // far-left  (CPU side)
  { x: 277, y: 149 }, // far-right (CPU side)
  { x: 87,  y: 395 }, // near-left  (player side) — nudged up 10px, was hanging off the table edge
  { x: 313, y: 395 }, // near-right (player side) — nudged up 10px, was hanging off the table edge
];
Game.CUP_RADIUS = 13;

// Half-table centroids used for "edginess" (risk/reward) calc
Game.CPU_HALF_CENTROID = { x: 200, y: 218 };
Game.CPU_HALF_MAX_R = 95;
Game.PLAYER_HALF_CENTROID = { x: 200, y: 362 };
Game.PLAYER_HALF_MAX_R = 95;

Game.WIN_SCORE = 15;

// Swipe-for-power meter (replaces the old vertical pull-back track): the
// player drags the die from a fixed start point up toward a fixed ring
// target and releases; how close the release point lands to the ring
// (2D distance) determines power accuracy. Positions/sizes measured from
// the Figma reference (node 150:5083) and mapped onto this canvas.
Game.SWIPE = {
  start: { x: 200, y: 585 },
  ring: { x: 200, y: 420 },
  // Matches the ring's drawn size to its exact proportion to the swipe
  // box backdrop in the Figma reference (node 254:392) — purely visual,
  // scoring is distance-based and untouched by this.
  ringDisplayR: 41.4,
  maxErrorR: 115,
  // How far short/long (in px, measured along the vertical swipe path)
  // still reads as "a little" off (yellow) rather than "very" off (red).
  // Purely a visual-feedback threshold — doesn't affect pullScore.
  shortLongYellowR: 60,
};

Game.state = {
  phase: 'title', // title | aim | swipe | timing | flight | fifa | resolve | gameover
  scoreYou: 0,
  scoreCpu: 0,
  possession: 'you', // 'you' = player offense, 'cpu' = cpu offense (player defends)
  throwsThisTurn: 0, // 0 or 1 (two throws per turn)
  aim: { x: 200, y: 205 }, // current aim target (in CPU half during player offense)
  defendAim: { x: 200, y: 375 }, // where the cpu is aiming during its offense
  swipePos: null, // {x,y} current drag position while swiping, null when idle
  pullScore: 0, // 0..1 quality contribution from the swipe (power)
  timingScore: 0, // 0..1 quality contribution from oscillator
  quality: 0, // combined 0..1
  qualityLabel: '',
  die: {
    x: 200, y: 500, z: 0, // z = height off ground for shadow/scale
    visible: false,
  },
  trail: [],
  confettiActive: false,
  animId: null,
  // Procedural wind-up/release/hop pose for whichever player teammate is
  // actively throwing (player only — CPU's throw is unanimated). Set by
  // Game.launchPlayerThrow, read by drawPlayerTeam in render.js.
  throwAnim: null, // { active, side: 'right'|'left', start, duration }
  // True while the interactive tutorial is running — gates a handful of
  // real gameplay hand-off points (so far: finishSwipe) to skip real
  // scoring/turn-advancing and go to a tutorial-only continuation
  // instead. Set in Game.startTutorial, cleared in Game.exitTutorial.
  tutorialMode: false,
};

Game.QUALITY_TIERS = [
  { min: 0.85, label: 'PERFECT', cls: 'quality-perfect' },
  { min: 0.65, label: 'GREAT',   cls: 'quality-great' },
  { min: 0.45, label: 'GOOD',    cls: 'quality-good' },
  { min: 0.25, label: 'OK',      cls: 'quality-ok' },
  { min: -1,   label: 'BAD',     cls: 'quality-bad' },
];

Game.qualityTier = function (score) {
  for (const t of Game.QUALITY_TIERS) {
    if (score >= t.min) return t;
  }
  return Game.QUALITY_TIERS[Game.QUALITY_TIERS.length - 1];
};
