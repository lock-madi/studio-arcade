// DOM wiring + game flow orchestration.

Game.el = {}; // cached elements, filled in Game.initScreens

Game.initScreens = function () {
  const ids = [
    'titleScreen', 'playBtn', 'scoreBug', 'pauseBtn',
    'skinScreen', 'skinGrid', 'chooseSkinBtn', 'skinBackBtn',
    'skinPedestalImg', 'skinPedestalName',
    'aimScreen', 'aimTarget', 'throwBtn', 'aimHint',
    'readyPanel', 'readyBtn',
    'swipePanel', 'swipeHandle', 'swipeBox',
    'timingPanel', 'oscTrack', 'oscTarget', 'oscMover', 'releaseBtn',
    'fifaPanel', 'fifaTrack', 'fifaTarget', 'fifaMover', 'fifaBtn', 'fifaHint',
    'qualityBanner',
    'catchBtn', 'catchIcon',
    'turnToast',
    'popupLayer', 'popupCard', 'popupText', 'popupSub',
    'gameOverScreen', 'gameOverTitle', 'gameOverScore', 'playAgainBtn',
    'pauseScreen', 'resumeBtn', 'quitBtn',
    'tutorialBtn', 'tutorialSwipePopup', 'tutorialSwipeContinueBtn',
    'tutorialTimingPopup', 'tutorialTimingContinueBtn',
    'tutorialCatchPopup', 'tutorialCatchContinueBtn',
    'tutorialFifaPopup', 'tutorialFifaContinueBtn',
    'tutorialFinishScreen', 'tutorialFinishBtn', 'tutorialRestartBtn',
    'scoreYou', 'scoreCpu',
  ];
  ids.forEach((id) => { Game.el[id] = document.getElementById(id); });

  Game.el.playBtn.addEventListener('click', Game.startMatch);
  Game.el.playAgainBtn.addEventListener('click', Game.startMatch);
  Game.el.throwBtn.addEventListener('click', Game.enterSwipe);
  Game.el.readyBtn.addEventListener('click', () => {
    if (Game.state.phase !== 'readyPrompt') return;
    hide(Game.el.readyPanel);
    Game.cpuThrow();
  });
  // pointerdown (not click) — matches wireCatchTap's pattern. A plain
  // 'click' listener needs the browser to synthesize a click from the
  // touch, which under #app's touch-action:none plus the oscillator's
  // own rAF loop was unreliable enough on mobile to require two taps.
  Game.el.releaseBtn.addEventListener('pointerdown', Game.lockTiming);
  Game.el.fifaBtn.addEventListener('pointerdown', Game.lockFifa);
  Game.el.chooseSkinBtn.addEventListener('click', Game.enterSkinSelect);
  Game.el.skinBackBtn.addEventListener('click', Game.exitSkinSelect);
  Game.el.pauseBtn.addEventListener('click', Game.pauseGame);
  Game.el.resumeBtn.addEventListener('click', Game.resumeGame);
  Game.el.quitBtn.addEventListener('click', Game.quitToMenu);
  Game.el.tutorialBtn.addEventListener('click', Game.startTutorial);
  Game.el.tutorialSwipeContinueBtn.addEventListener('click', () => {
    hide(Game.el.tutorialSwipePopup);
  });
  Game.el.tutorialTimingContinueBtn.addEventListener('click', () => {
    hide(Game.el.tutorialTimingPopup);
    Game.state.phase = 'timing';
    Game.startOscillator();
  });
  Game.el.tutorialCatchContinueBtn.addEventListener('click', () => {
    hide(Game.el.tutorialCatchPopup);
    Game.tutorialDefenseStep();
  });
  Game.el.tutorialFifaContinueBtn.addEventListener('click', () => {
    hide(Game.el.tutorialFifaPopup);
    Game.enterFifaKick();
  });
  Game.el.tutorialFinishBtn.addEventListener('click', Game.exitTutorial);
  Game.el.tutorialRestartBtn.addEventListener('click', () => {
    Game.exitTutorial();
    Game.startTutorial();
  });

  Game.wireAimDrag();
  Game.wireSwipeDrag();
  Game.wireCatchTap();
};

function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

// ------------------------------------------------------------ skin select

Game.enterSkinSelect = function () {
  Game.renderSkinGrid();
  hide(Game.el.titleScreen);
  show(Game.el.skinScreen);
};

Game.exitSkinSelect = function () {
  hide(Game.el.skinScreen);
  show(Game.el.titleScreen);
};

Game.renderSkinGrid = function () {
  const grid = Game.el.skinGrid;
  grid.innerHTML = '';
  const selectedId = Game.getSelectedSkinId();
  const selectedSkin = Game.getSelectedSkin();

  // Pedestal preview updates live to whichever card is selected.
  Game.el.skinPedestalImg.src = selectedSkin.src;
  Game.el.skinPedestalImg.alt = selectedSkin.name;
  Game.el.skinPedestalName.textContent = selectedSkin.name;

  Game.SKINS.forEach((skin) => {
    const card = document.createElement('div');
    card.className = 'skin-card' + (skin.id === selectedId ? ' selected' : '');

    const img = document.createElement('img');
    img.src = skin.src;
    img.alt = skin.name;

    const label = document.createElement('div');
    label.className = 'skin-name';
    label.textContent = skin.name;

    card.appendChild(img);
    card.appendChild(label);
    card.addEventListener('click', () => {
      Game.setSelectedSkinId(skin.id);
      Game.renderSkinGrid();
    });
    grid.appendChild(card);
  });
};

// ---------------------------------------------------------------- helpers

Game.toast = function (msg, ms) {
  const t = Game.el.turnToast;
  t.textContent = msg;
  show(t);
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(Game._toastTimer);
  Game._toastTimer = setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => hide(t), 250);
  }, ms || 1400);
};

Game.updateScoreBug = function () {
  Game.el.scoreYou.textContent = Game.state.scoreYou;
  Game.el.scoreCpu.textContent = Game.state.scoreCpu;
};

Game.showQualityBanner = function (tier, displayMs) {
  const b = Game.el.qualityBanner;
  b.className = 'quality-banner ' + tier.cls;
  b.textContent = tier.label;
  show(b);
  requestAnimationFrame(() => b.classList.add('show'));
  setTimeout(() => {
    b.classList.remove('show');
    setTimeout(() => hide(b), 250);
  }, displayMs || 700);
};

Game.showPopup = function (text, sub, confetti) {
  Game.el.popupText.textContent = text;
  Game.el.popupSub.textContent = sub;
  Game.el.popupCard.style.animation = 'none';
  void Game.el.popupCard.offsetWidth;
  Game.el.popupCard.style.animation = '';
  show(Game.el.popupLayer);
  if (confetti) Game.burstConfetti(110);
  clearTimeout(Game._popupTimer);
  Game._popupTimer = setTimeout(() => hide(Game.el.popupLayer), 1100);
};

// ---------------------------------------------------------------- match flow

Game.startMatch = function () {
  Object.assign(Game.state, {
    phase: 'aim',
    scoreYou: 0,
    scoreCpu: 0,
    possession: 'you',
    throwsThisTurn: 0,
    trail: [],
    throwAnim: null,
  });
  Game.state.die.visible = false;
  hide(Game.el.titleScreen);
  hide(Game.el.gameOverScreen);
  show(Game.el.scoreBug);
  show(Game.el.pauseBtn);
  Game.updateScoreBug();
  Game.toast('YOUR TURN TO THROW');
  Game.enterAim();
};

// Deliberately does NOT touch Game.state.phase — the dim overlay just
// visually covers (and, via its own pointer-events, blocks taps on)
// whatever's on screen. Any still-running timer (the oscillator, the
// Fifa meter, the catch-button shrink) keeps ticking for real underneath
// it, same as if the player had simply looked away: nothing needs a
// special resume path, and nothing can desync from a stale saved phase.
Game.pauseGame = function () {
  if (Game.state.phase === 'title' || Game.state.phase === 'gameover') return;
  show(Game.el.pauseScreen);
};

Game.resumeGame = function () {
  hide(Game.el.pauseScreen);
};

Game.quitToMenu = function () {
  hide(Game.el.pauseScreen);

  cancelAnimationFrame(Game.osc.raf);
  clearTimeout(Game._oscAutoTimer);
  cancelAnimationFrame(Game._fifaRaf);
  clearTimeout(Game._fifaAutoTimer);
  cancelAnimationFrame(Game._catchRaf);

  hide(Game.el.scoreBug);
  hide(Game.el.pauseBtn);
  hide(Game.el.aimScreen);
  hide(Game.el.aimTarget);
  hide(Game.el.readyPanel);
  hide(Game.el.swipePanel);
  hide(Game.el.swipeHandle);
  hide(Game.el.swipeBox);
  hide(Game.el.timingPanel);
  hide(Game.el.fifaPanel);
  hide(Game.el.catchBtn);
  hide(Game.el.gameOverScreen);
  hide(Game.el.qualityBanner);

  Game.state.phase = 'title';
  Game.state.die.visible = false;
  show(Game.el.titleScreen);
};

// ============================================================= TUTORIAL
// Built incrementally, one practice step at a time. So far: Power Swipe
// only — starts at the real aim screen's THROW button (same as a real
// match) so the entry point feels identical, then shows a dimmed popup
// with a looping hand-swipe demo before letting the player try the real
// gesture themselves. No score is ever touched.

Game.startTutorial = function () {
  Game.state.tutorialMode = true;
  Object.assign(Game.state, {
    phase: 'aim',
    possession: 'you',
    throwsThisTurn: 0,
    trail: [],
    throwAnim: null,
    aim: { x: 200, y: 205 },
  });
  Game.state.die.visible = false;
  hide(Game.el.titleScreen);
  Game.enterAim();
};

// Step 1 -> step 2: straight into the real timing screen (its own popup
// holds the oscillator still until CONTINUE; see enterTiming).
Game.tutorialAfterSwipe = function (score) {
  if (!Game.state.tutorialMode) return;
  Game.enterTiming();
};

Game.tutorialAfterTiming = function () {
  if (!Game.state.tutorialMode) return;
  hide(Game.el.timingPanel);

  // Same combined swipe+timing quality banner the real game shows
  // (finishTiming) right before the throw leaves the player's hand.
  const quality = Game.combineQuality(Game.state.pullScore, Game.state.timingScore);
  Game.state.quality = quality;
  Game.showQualityBanner(Game.qualityTier(quality));
  setTimeout(Game.tutorialLaunchThrow, 550);
};

// The character actually throws, same wind-up and toss as a real throw,
// but with no outcome roll and no scoring: the die flies to wherever the
// aim was, bounces once, and the tutorial moves on. (Every callback
// re-checks tutorialMode, since none of these animations are cancelable.)
Game.tutorialLaunchThrow = function () {
  if (!Game.state.tutorialMode) return;
  Game.state.phase = 'flight';
  const fromX = 130;
  const windStartY = 440;
  const windEndY = 395;
  Game.state.throwAnim = { active: true, side: 'right', start: performance.now(), duration: 520 };
  const to = Game.state.aim;

  Game.animateWindupDie(fromX, windStartY, windEndY, 170, () => {
    if (!Game.state.tutorialMode) return;
    Game.animateDie({ x: fromX, y: windEndY }, to, 480, () => {
      if (!Game.state.tutorialMode) return;
      Game.animateBounce(to, () => {
        setTimeout(Game.tutorialAfterThrow, 700);
      });
    });
  });
};

// Step 2 -> step 3: the catch intro popup goes up over the dimmed scene,
// and CONTINUE starts the CPU's practice throw. possession flips to
// 'cpu' because animateBounce and the defensive lean both key off it.
Game.tutorialAfterThrow = function () {
  if (!Game.state.tutorialMode) return;
  Game.state.die.visible = false;
  Game.state.trail = [];
  Game.state.throwAnim = null;
  Game.state.possession = 'cpu';
  Game.state.phase = 'catchIntro';
  show(Game.el.tutorialCatchPopup);
};

// The CPU's practice throw: same toss and bounce as a real one, but a
// fixed landing spot and quality (no RNG, no outcome roll), always ending
// in the real catch circle so there's exactly one catch to practice.
Game.tutorialDefenseStep = function () {
  if (!Game.state.tutorialMode) return;
  Game.state.phase = 'flight';
  const from = { x: 200, y: 135 };
  const to = Game.clampToHalf({ x: 200, y: 360 }, 'player');
  Game.animateDie(from, to, 480, () => {
    if (!Game.state.tutorialMode) return;
    Game.animateBounce(to, (restPoint) => {
      if (!Game.state.tutorialMode) return;
      Game.enterCatchMinigame(restPoint, 0.6);
    });
  });
};

// Same catch feedback as the real game (the tier banner already showed in
// finishCatch's shared top; then the die either goes to the player's
// hands or hits the ground, with a popup) — minus the scoring.
Game.tutorialAfterCatch = function (tierScore, timedOut) {
  if (!Game.state.tutorialMode) return;
  const caught = Math.random() < Game.playerCatchChanceFromTier(tierScore);
  const restPoint = { x: Game.state.die.x, y: Game.state.die.y };
  setTimeout(() => {
    if (!Game.state.tutorialMode) return;
    if (caught) {
      Game.animateDieToCatcher(restPoint, 'player', () => {
        Game.showPopup('CAUGHT!', 'NO SCORE', true);
        setTimeout(Game.tutorialFifaIntro, 1300);
      });
    } else {
      Game.animateDieToGround(restPoint, 'player', () => {
        Game.showPopup('MISSED', timedOut ? 'TOO SLOW' : 'JUST MISSED', false);
        setTimeout(Game.tutorialFifaIntro, 1300);
      });
    }
  }, 500);
};

// Step 3 -> step 4: the Fifa intro popup goes up over the dimmed scene,
// and CONTINUE starts the real kick meter (possession is already 'cpu').
Game.tutorialFifaIntro = function () {
  if (!Game.state.tutorialMode) return;
  Game.state.die.visible = false;
  Game.state.trail = [];
  Game.state.phase = 'fifaIntro';
  show(Game.el.tutorialFifaPopup);
};

// Called from lockFifa once the tier banner has had its 1.5s. The kick
// always leads into the catch stage (no RNG gate) so both get practiced;
// the catch stage ends the tutorial.
Game.tutorialAfterFifaStage = function (wasKick) {
  if (!Game.state.tutorialMode) return;
  if (wasKick) {
    Game.enterFifaCatch();
    return;
  }
  hide(Game.el.fifaPanel);
  Game.state.phase = 'resolve';
  show(Game.el.tutorialFinishScreen);
};

Game.exitTutorial = function () {
  cancelAnimationFrame(Game.osc.raf);
  clearTimeout(Game._oscAutoTimer);
  hide(Game.el.timingPanel);
  hide(Game.el.tutorialTimingPopup);
  hide(Game.el.tutorialSwipePopup);
  hide(Game.el.tutorialCatchPopup);
  hide(Game.el.tutorialFifaPopup);
  hide(Game.el.tutorialFinishScreen);
  hide(Game.el.fifaPanel);
  cancelAnimationFrame(Game._fifaRaf);
  clearTimeout(Game._fifaAutoTimer);
  cancelAnimationFrame(Game._catchRaf);
  hide(Game.el.catchBtn);
  hide(Game.el.popupLayer);
  hide(Game.el.aimScreen);
  hide(Game.el.aimTarget);
  hide(Game.el.swipePanel);
  hide(Game.el.swipeHandle);
  hide(Game.el.swipeBox);
  hide(Game.el.qualityBanner);
  Game.state.tutorialMode = false;
  Game.state.throwAnim = null;
  Game.state.trail = [];
  Game.state.possession = 'you';
  Game.state.phase = 'title';
  Game.state.die.visible = false;
  show(Game.el.titleScreen);
};

Game.checkGameOver = function () {
  const s = Game.state;
  if (s.scoreYou >= Game.WIN_SCORE || s.scoreCpu >= Game.WIN_SCORE) {
    Game.endGame(s.scoreYou >= Game.WIN_SCORE ? 'you' : 'cpu');
    return true;
  }
  return false;
};

Game.endGame = function (winner) {
  Game.state.phase = 'gameover';
  Game.el.gameOverTitle.textContent = winner === 'you' ? 'YOU WIN!' : 'CPU WINS';
  Game.el.gameOverTitle.style.color = winner === 'you' ? '#ffd75e' : '#ff8686';
  Game.el.gameOverScore.textContent = `${Game.state.scoreYou} - ${Game.state.scoreCpu}`;
  show(Game.el.gameOverScreen);
  if (winner === 'you') Game.burstConfetti(160);
};

// Called after a throw fully resolves, decides what happens next.
Game.advanceTurn = function () {
  // A timer or animation still running when the player quit to the menu
  // must not drag the match UI back over the title screen.
  if (Game.state.phase === 'title') return;
  if (Game.checkGameOver()) return;
  const s = Game.state;
  s.throwsThisTurn++;
  s.trail = [];
  s.die.visible = false;

  if (s.throwsThisTurn < 2) {
    if (s.possession === 'you') {
      Game.enterAim();
    } else {
      setTimeout(Game.cpuThrow, 500);
    }
    return;
  }

  // switch possession
  s.throwsThisTurn = 0;
  s.possession = s.possession === 'you' ? 'cpu' : 'you';
  Game.updateScoreBug();
  if (s.possession === 'you') {
    Game.toast('YOUR TURN TO THROW');
    Game.enterAim();
  } else {
    Game.toast('CPU IS ON OFFENSE - DEFEND!');
    setTimeout(Game.enterReadyPrompt, 900);
  }
};

// Gives the player a moment to prepare after their own offense throws
// before the CPU's first throw of its turn fires — otherwise there's no
// gap between finishing your own throw and needing to react to the CPU's.
Game.enterReadyPrompt = function () {
  // A timer or animation still running when the player quit to the menu
  // must not drag the match UI back over the title screen.
  if (Game.state.phase === 'title') return;
  Game.state.phase = 'readyPrompt';
  show(Game.el.readyPanel);
};

// ================================================================== AIM

Game.enterAim = function () {
  // A timer or animation still running when the player quit to the menu
  // must not drag the match UI back over the title screen.
  if (Game.state.phase === 'title') return;
  Game.state.phase = 'aim';
  Game.state.aim = Game.clampToHalf(Game.state.aim, 'cpu');
  show(Game.el.aimScreen);
  show(Game.el.aimTarget);
  Game.positionAimTarget();
};

Game.positionAimTarget = function () {
  const p = Game.state.aim;
  Game.el.aimTarget.style.left = p.x + 'px';
  Game.el.aimTarget.style.top = p.y + 'px';
};

Game.wireAimDrag = function () {
  const el = Game.el.aimTarget;
  let dragging = false;
  const appRect = () => document.getElementById('app').getBoundingClientRect();

  el.addEventListener('pointerdown', (e) => {
    if (Game.state.phase !== 'aim') return;
    dragging = true;
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const r = appRect();
    const scaleX = 400 / r.width;
    const scaleY = 750 / r.height;
    const x = (e.clientX - r.left) * scaleX;
    const y = (e.clientY - r.top) * scaleY;
    Game.state.aim = Game.clampToHalf({ x, y }, 'cpu');
    Game.positionAimTarget();
  });
  const end = () => { dragging = false; };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
};

// =========================================================== SWIPE (power)
// Replaces the old vertical pull-back track: the player drags the die from
// a fixed start point up toward a fixed ring target and releases. How close
// the release point lands to the ring (2D distance) sets pullScore, same
// as the old track did — everything downstream (combineQuality, tiers,
// the following timing step) is unchanged.

Game.enterSwipe = function () {
  // A timer or animation still running when the player quit to the menu
  // must not drag the match UI back over the title screen.
  if (Game.state.phase === 'title') return;
  hide(Game.el.aimScreen);
  hide(Game.el.aimTarget);
  Game.state.phase = 'swipe';
  Game.state.swipePos = null;
  Game.positionSwipeHandle(Game.SWIPE.start);
  show(Game.el.swipePanel);
  show(Game.el.swipeHandle);
  show(Game.el.swipeBox);

  // Tutorial: block the real controls behind a dimmed popup with a
  // looping hand-swipe demo until the player taps CONTINUE.
  if (Game.state.tutorialMode) {
    show(Game.el.tutorialSwipePopup);
  }
};

Game.positionSwipeHandle = function (p) {
  Game.el.swipeHandle.style.left = p.x + 'px';
  Game.el.swipeHandle.style.top = p.y + 'px';
};

Game.wireSwipeDrag = function () {
  const el = Game.el.swipeHandle;
  let dragging = false;
  let stallTimer = null;
  let gestureStart = 0;
  let lastMoveTime = 0;
  let lastPos = null;

  // Absolute backstop: if the finger goes fully still for this long,
  // lock in regardless of the velocity check below (catches sparse-event
  // edge cases the per-move check wouldn't see in time).
  const STALL_MS = 120;
  // Minimum speed (canvas px/ms) a move has to keep up once the gesture
  // is underway. A real flick comfortably clears this the whole way; a
  // deliberate slow drag — the "pull it to the ring by hand" case this
  // is meant to stop — can't, since aiming precisely requires slowing
  // down right as you approach the target. The instant speed drops below
  // this, the release locks in right there, before the player can finish
  // nudging it into place.
  const MIN_SPEED = 0.35;
  // Real swipes naturally accelerate from a standing start, so the very
  // first stretch of movement is exempt from the speed floor — it only
  // starts enforcing once the gesture has had a moment to get going.
  const GRACE_MS = 70;

  const appRect = () => document.getElementById('app').getBoundingClientRect();

  function clearStall() {
    clearTimeout(stallTimer);
    stallTimer = null;
  }

  const end = () => {
    if (!dragging) return;
    dragging = false;
    clearStall();
    Game.finishSwipe();
  };

  el.addEventListener('pointerdown', (e) => {
    if (Game.state.phase !== 'swipe') return;
    dragging = true;
    gestureStart = performance.now();
    lastMoveTime = gestureStart;
    lastPos = null;
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const r = appRect();
    const scaleX = 400 / r.width;
    const scaleY = 750 / r.height;
    const x = Math.max(0, Math.min(400, (e.clientX - r.left) * scaleX));
    const y = Math.max(0, Math.min(750, (e.clientY - r.top) * scaleY));
    const now = performance.now();

    if (lastPos && now - gestureStart > GRACE_MS) {
      const dt = now - lastMoveTime;
      if (dt > 15) {
        const speed = Math.hypot(x - lastPos.x, y - lastPos.y) / dt;
        if (speed < MIN_SPEED) {
          Game.state.swipePos = { x, y };
          Game.positionSwipeHandle(Game.state.swipePos);
          end();
          return;
        }
      }
    }

    lastMoveTime = now;
    lastPos = { x, y };
    Game.state.swipePos = { x, y };
    Game.positionSwipeHandle(Game.state.swipePos);

    clearStall();
    stallTimer = setTimeout(end, STALL_MS);
  });
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
};

// Shared by the swipe (power) and timing (accuracy) meters. Labels/colors
// match the green (>0.66) / yellow (>0.33) / red (below) bands already
// used for the live feedback line, so the popup tier always agrees with
// the color the player was just watching.
Game.deviationTier = function (score, dx) {
  const dir = dx >= 0 ? 'RIGHT' : 'LEFT';
  if (score >= 0.92) return { label: 'PERFECT', cls: 'quality-perfect' };
  if (score >= 0.66) return { label: 'GOOD', cls: 'quality-great' };
  if (score >= 0.33) return { label: 'SLIGHTLY ' + dir, cls: 'quality-slightly' };
  return { label: 'VERY ' + dir, cls: 'quality-bad' };
};

Game.finishSwipe = function () {
  const cur = Game.state.swipePos || Game.SWIPE.start;
  const dx = cur.x - Game.SWIPE.ring.x;
  const dist = Math.hypot(dx, cur.y - Game.SWIPE.ring.y);
  const score = Math.max(0, Math.min(1, 1 - dist / Game.SWIPE.maxErrorR));
  Game.state.pullScore = score;

  // No text banner — "left/right" framing fits the timing step's
  // sliding bar, not a swipe that's purely about power. Instead, freeze
  // the line/ring/handle in place for 1s so the player can read the
  // line's own color: green if it landed in the ring, yellow/red for a
  // little/very short (released too early) or long (held on too long) —
  // see swipeLineColor() in render.js.
  Game.state.phase = 'swipeResult';
  setTimeout(() => {
    hide(Game.el.swipePanel);
    hide(Game.el.swipeHandle);
    hide(Game.el.swipeBox);
    Game.state.swipePos = null;
    if (Game.state.tutorialMode) {
      Game.tutorialAfterSwipe(score);
    } else {
      Game.enterTiming();
    }
  }, 1000);
};

// ================================================================= TIMING
// White line slides side to side; the gray line is a fixed target at dead
// center. Tap RELEASE when they line up. Same tier scheme + 1.5s freeze-
// and-feedback pause as the swipe meter; the combined-quality banner
// (PERFECT/GREAT/GOOD/OK/BAD) still follows afterward, unchanged.

Game.osc = { raf: null, t: 0, omega: 0.004, trackWidth: 300, bullseyeHalfWidth: 20 };

Game.enterTiming = function () {
  // A timer or animation still running when the player quit to the menu
  // must not drag the match UI back over the title screen.
  if (Game.state.phase === 'title') return;
  Game.state.phase = 'timing';
  const o = Game.osc;
  o.trackWidth = 300;
  const edg = Game.edginess(Game.state.aim, 'cpu');
  o.omega = 0.0032 + edg * 0.0068;
  Game.el.oscTarget.style.left = (o.trackWidth / 2) + 'px';
  show(Game.el.timingPanel);

  // Tutorial: hold the meter still behind a dimmed intro popup (so the
  // 6s auto-release can't fire while the player is still reading it);
  // the popup's CONTINUE button starts the oscillator.
  if (Game.state.tutorialMode) {
    Game.state.phase = 'timingIntro';
    show(Game.el.tutorialTimingPopup);
    return;
  }
  Game.startOscillator();
};

Game.startOscillator = function () {
  Game.osc.t = performance.now();
  Game.tickOscillator();

  // safety auto-release so play never soft-locks
  clearTimeout(Game._oscAutoTimer);
  Game._oscAutoTimer = setTimeout(() => { if (Game.state.phase === 'timing') Game.lockTiming(); }, 6000);
};

Game.tickOscillator = function () {
  if (Game.state.phase !== 'timing') return;
  const o = Game.osc;
  const now = performance.now();
  const half = o.trackWidth / 2;
  const x = half + half * Math.sin((now - o.t) * o.omega);
  Game._oscX = x;
  Game.el.oscMover.style.left = x + 'px';
  Game.osc.raf = requestAnimationFrame(Game.tickOscillator);
};

Game.proximityScore = function (dist, halfWidth) {
  return Math.max(0, Math.min(1, 1 - dist / (halfWidth * 3)));
};

Game.lockTiming = function () {
  if (Game.state.phase !== 'timing') return;
  cancelAnimationFrame(Game.osc.raf);
  clearTimeout(Game._oscAutoTimer);
  const center = Game.osc.trackWidth / 2;
  const dx = (Game._oscX || 0) - center;
  const score = Game.proximityScore(Math.abs(dx), Game.osc.bullseyeHalfWidth);
  Game.state.timingScore = score;

  // Freeze the meter where it was tapped and show tier feedback for 1.5s
  // (same pattern as the swipe step) before the combined-quality banner.
  Game.state.phase = 'timingResult';
  Game.showQualityBanner(Game.deviationTier(score, dx), 1500);
  setTimeout(Game.state.tutorialMode ? Game.tutorialAfterTiming : Game.finishTiming, 1500);
};

Game.finishTiming = function () {
  hide(Game.el.timingPanel);

  const quality = Game.combineQuality(Game.state.pullScore, Game.state.timingScore);
  Game.state.quality = quality;
  const tier = Game.qualityTier(quality);
  Game.state.qualityLabel = tier.label;
  Game.showQualityBanner(tier);

  setTimeout(() => Game.launchPlayerThrow(quality), 550);
};

// ================================================================ FLIGHT

Game.animateDie = function (from, to, duration, onDone) {
  const s = Game.state;
  s.die.visible = true;
  s.trail = [];
  const start = performance.now();

  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const ease = t; // linear arc timing, height handled separately
    const x = from.x + (to.x - from.x) * ease;
    const y = from.y + (to.y - from.y) * ease;
    const z = Math.sin(Math.PI * ease) * 160; // arc height
    s.die.x = x;
    s.die.y = y - z * 0.5;
    s.die.z = z;
    s.die.spin = ease * 10;
    s.trail.push({ x: s.die.x, y: s.die.y });
    if (s.trail.length > 18) s.trail.shift();

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      onDone && onDone();
    }
  }
  requestAnimationFrame(step);
};

// A shorter, lower secondary arc played after the main toss lands, so the
// die visibly bounces once before a catch opportunity appears (matches
// the real rule — catch happens off the bounce, not on arrival) and the
// trail reads as one continuous, more complete path instead of stopping
// dead on arrival. `from` is wherever the main toss landed; `onDone`
// receives the bounce's actual rest point so callers can position things
// (e.g. the catch button) at the true final spot, not the original aim.
Game.animateBounce = function (from, onDone) {
  const s = Game.state;
  const half = s.possession === 'you' ? 'cpu' : 'player';
  const driftX = (Math.random() - 0.5) * 36;
  const driftY = 18 + Math.random() * 14;
  const to = Game.clampToHalf({ x: from.x + driftX, y: from.y + driftY }, half);
  const duration = 240;
  const start = performance.now();

  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    const z = Math.sin(Math.PI * t) * 46; // lower bounce arc than the main toss
    s.die.x = x;
    s.die.y = y - z * 0.5;
    s.die.z = z;
    s.die.spin = (s.die.spin || 0) + 0.3;
    s.trail.push({ x: s.die.x, y: s.die.y });
    if (s.trail.length > 18) s.trail.shift();

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      onDone && onDone(to);
    }
  }
  requestAnimationFrame(step);
};

// Resolution animations, played after the bounce depending on the
// outcome: either the die is actually caught (travels to the catching
// team and "disappears" into their hand) or it's missed (continues past
// the table edge, further in the direction it was already heading, and
// settles on the grass) — instead of just freezing in place while a
// popup explains what happened.

// `side` is which team is catching: 'cpu' (during the player's own
// offense) or 'player' (during the player's defense).
Game.animateDieToCatcher = function (from, side, onDone) {
  const s = Game.state;
  const to = side === 'cpu' ? { x: 200, y: 145 } : { x: 200, y: 420 };
  const duration = 220;
  const start = performance.now();

  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    const z = Math.sin(Math.PI * t) * 20 * (1 - t); // small arc, flattening into the hand
    s.die.x = x;
    s.die.y = y - z * 0.5;
    s.die.z = Math.max(0, z);
    s.die.spin = (s.die.spin || 0) + 0.5;
    s.trail.push({ x: s.die.x, y: s.die.y });
    if (s.trail.length > 18) s.trail.shift();

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      s.die.visible = false; // caught — no longer a free-floating die
      onDone && onDone();
    }
  }
  requestAnimationFrame(step);
};

// `side` is whose half of the table the die is currently in: 'cpu' or
// 'player'. Continues further in the same direction it was already
// bouncing (past that half's own far/near edge) so it reads as rolling
// off the table rather than teleporting onto the grass.
Game.animateDieToGround = function (from, side, onDone) {
  const s = Game.state;
  const dir = side === 'cpu' ? -1 : 1;
  const to = {
    x: Math.max(40, Math.min(360, from.x + (Math.random() - 0.5) * 30)),
    y: from.y + dir * (50 + Math.random() * 20),
  };
  const duration = 260;
  const start = performance.now();

  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    const z = Math.sin(Math.PI * t) * 24;
    s.die.x = x;
    s.die.y = y - z * 0.5;
    s.die.z = z;
    s.die.spin = (s.die.spin || 0) + 0.4;
    s.trail.push({ x: s.die.x, y: s.die.y });
    if (s.trail.length > 18) s.trail.shift();

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      s.die.z = 0; // resting on the grass — stays visible until advanceTurn hides it
      onDone && onDone();
    }
  }
  requestAnimationFrame(step);
};

// The table's left/right edges are slanted (the trapezoid is narrower at
// the far/CPU end than the near/player end), so "past the side edge" is a
// different x at every y. Interpolates between the two edges' known
// corners to find where the edge actually is at a given height.
Game.tableEdgeXAtY = function (y, side) {
  const T = Game.TABLE;
  const t = Math.max(0, Math.min(1, (y - T.farLeft.y) / (T.nearLeft.y - T.farLeft.y)));
  return side === 'left'
    ? T.farLeft.x + (T.nearLeft.x - T.farLeft.x) * t
    : T.farRight.x + (T.nearRight.x - T.farRight.x) * t;
};

// The player scored specifically because the CPU failed to catch it —
// send the die clearly off the table's LEFT or RIGHT side into the grass
// (rather than continuing straight back the way it was already going, per
// animateDieToGround above) so a scored point reads unmistakably as "they
// didn't catch it," not just "it rolled a bit further."
Game.animateDieMissedCatchToSide = function (from, onDone) {
  const s = Game.state;
  const dir = Math.random() < 0.5 ? -1 : 1; // -1 = off the left side, 1 = off the right
  const edgeX = Game.tableEdgeXAtY(from.y, dir === -1 ? 'left' : 'right');
  const clearance = 45 + Math.random() * 40; // comfortably past the side edge, into the grass
  const to = {
    x: Math.max(20, Math.min(380, edgeX + dir * clearance)),
    y: from.y + (Math.random() - 0.5) * 40,
  };
  const duration = 380;
  const start = performance.now();

  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    const z = Math.sin(Math.PI * t) * 40;
    s.die.x = x;
    s.die.y = y - z * 0.5;
    s.die.z = z;
    s.die.spin = (s.die.spin || 0) + 0.5;
    s.trail.push({ x: s.die.x, y: s.die.y });
    if (s.trail.length > 18) s.trail.shift();

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      s.die.z = 0; // resting in the grass off to the side
      onDone && onDone();
    }
  }
  requestAnimationFrame(step);
};

// A genuine miss (the 'miss' outcome — die goes "off the table" per the
// scoring toast) needs to read as ONE continuous throw that sails over
// the table and lands past it — not the normal toss landing on the
// table first (z returning to 0 right at the aim point) and then a
// second arc hopping back up from there, which plays as a bounce no
// matter how the second arc itself is styled. So this replaces the
// normal animateDie call entirely for misses: flies straight from the
// thrower's hand to a point clearly beyond the table's real edge
// (`Game.TABLE`'s flat top/bottom edge y, both flat lines regardless of
// x) in a single rise-and-fall arc that never touches down until that
// landing spot. `side` is which edge it clears: 'cpu' (over the far
// edge, by the CPU team) or 'player' (over the near edge, by the
// player's team). `onDone` receives the landing point.
Game.animateMissThrow = function (from, aimPoint, side, duration, onDone) {
  const s = Game.state;
  s.die.visible = true;
  s.trail = [];

  const edgeY = side === 'cpu' ? Game.TABLE.farLeft.y : Game.TABLE.nearLeft.y;
  const dir = side === 'cpu' ? -1 : 1;
  const clearance = 55 + Math.random() * 45; // comfortably past the edge, not just barely past it
  const to = {
    x: Math.max(30, Math.min(370, aimPoint.x + (Math.random() - 0.5) * 80)),
    y: edgeY + dir * clearance,
  };
  const start = performance.now();

  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;
    const z = Math.sin(Math.PI * t) * 170; // same peak height as a normal toss — clears the table the whole way through
    s.die.x = x;
    s.die.y = y - z * 0.5;
    s.die.z = z;
    s.die.spin = t * 10;
    s.trail.push({ x: s.die.x, y: s.die.y });
    if (s.trail.length > 18) s.trail.shift();

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      s.die.z = 0; // resting in the grass
      onDone && onDone(to);
    }
  }
  requestAnimationFrame(step);
};

// The two cups on a given half, matching the order they're placed in
// Game.CUPS (far/top pair for 'cpu', near/bottom pair for 'player').
Game.cupsForHalf = function (half) {
  return half === 'cpu' ? [Game.CUPS[0], Game.CUPS[1]] : [Game.CUPS[2], Game.CUPS[3]];
};

Game.nearestCup = function (point, half) {
  const cups = Game.cupsForHalf(half);
  let best = cups[0];
  let bestDist = Infinity;
  for (const c of cups) {
    const d = (c.x - point.x) ** 2 + (c.y - point.y) ** 2;
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best;
};

// The 'score3' outcome should actually look like the die landing inside a
// cup, not just stopping near one: hops to the nearest cup's exact center,
// then shrinks away during the back half of the hop (via `s.die.sink`,
// read by Game.render's size calc) so it reads as dropping in and
// disappearing from view rather than freezing mid-air above the table.
Game.animateDieIntoCup = function (from, half, onDone) {
  const s = Game.state;
  const cup = Game.nearestCup(from, half);
  const duration = 220;
  const start = performance.now();

  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    s.die.x = from.x + (cup.x - from.x) * t;
    s.die.y = from.y + (cup.y - from.y) * t;
    s.die.z = Math.sin(Math.PI * t) * 20;
    s.die.sink = t > 0.5 ? (t - 0.5) / 0.5 : 0;
    s.die.spin = (s.die.spin || 0) + 0.6;
    s.trail.push({ x: s.die.x, y: s.die.y });
    if (s.trail.length > 18) s.trail.shift();

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      s.die.visible = false; // dropped in, out of sight
      s.die.sink = 0; // reset for the next throw
      onDone && onDone();
    }
  }
  requestAnimationFrame(step);
};

// Since characters are single flat images (no separate arm layer to
// move), the "hand" motion is the die itself: it becomes visible early
// and rises near the thrower's body from hip to shoulder height during
// the wind-up, then hands off straight into the normal throw arc from
// that exact spot — no fake arm drawn, so it never looks like an extra
// limb on top of the character's own art.
Game.animateWindupDie = function (x, startY, endY, duration, onDone) {
  const s = Game.state;
  s.die.visible = true;
  const start = performance.now();

  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    s.die.x = x;
    s.die.y = startY + (endY - startY) * t;
    s.die.z = 18 * t;
    s.die.spin = t * 1.4;

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      onDone && onDone();
    }
  }
  requestAnimationFrame(step);
};

Game.launchPlayerThrow = function (quality) {
  // A timer or animation still running when the player quit to the menu
  // must not drag the match UI back over the title screen.
  if (Game.state.phase === 'title') return;
  Game.state.phase = 'flight';

  // First throw of the turn = the right-side teammate, second = left,
  // matching advanceTurn's throwsThisTurn (0 before the first throw of a
  // turn, 1 before the second) — simulates the two players alternating.
  const throwingRight = Game.state.throwsThisTurn === 0;
  const fromX = throwingRight ? 130 : 270;
  const windStartY = 440;
  const windEndY = 395;
  Game.state.throwAnim = {
    active: true,
    side: throwingRight ? 'right' : 'left',
    start: performance.now(),
    duration: 520,
  };

  // Outcome is rolled up front (not inside resolveOffenseThrow, as it
  // used to be) so the flight animation itself can be chosen correctly:
  // a miss needs a different, continuous "over the table" flight path
  // (see animateMissThrow) rather than the normal toss-then-bounce one.
  const to = Game.state.aim;
  const edg = Game.edginess(to, 'cpu');
  const outcome = Game.rollThrowOutcome(quality, edg);

  Game.animateWindupDie(fromX, windStartY, windEndY, 170, () => {
    const from = { x: fromX, y: windEndY };
    if (outcome === 'miss') {
      Game.animateMissThrow(from, to, 'cpu', 480, () => {
        Game.resolveOffenseThrow(outcome, quality, to);
      });
    } else {
      Game.animateDie(from, to, 480, () => {
        Game.resolveOffenseThrow(outcome, quality, to);
      });
    }
  });
};

Game.resolveOffenseThrow = function (outcome, quality, aimPoint) {
  // A timer or animation still running when the player quit to the menu
  // must not drag the match UI back over the title screen.
  if (Game.state.phase === 'title') return;
  if (outcome === 'score3') {
    Game.animateDieIntoCup(aimPoint, 'cpu', () => {
      Game.state.scoreYou += 3;
      Game.updateScoreBug();
      Game.showPopup('+3', 'IN THE CUP!', true);
      setTimeout(Game.advanceTurn, 1200);
    });
  } else if (outcome === 'miss') {
    // The die has already sailed over the table and landed in the grass
    // by the CPU team (animateMissThrow, played before this was called) —
    // nothing left to animate, just resolve the Fifa roll.
    const cpuGotFifa = Game.cpuFifaRoll();
    if (cpuGotFifa) {
      Game.state.scoreCpu += 1;
      Game.updateScoreBug();
      Game.toast('OFF THE TABLE - CPU COMPLETES THE FIFA (+1 CPU)', 1600);
    } else {
      Game.toast('OFF THE TABLE - NO SCORE', 1200);
    }
    setTimeout(Game.advanceTurn, 1300);
  } else {
    // catchable: die bounces once before CPU's defense auto-rolls
    Game.animateBounce(aimPoint, (restPoint) => {
      const caught = Game.cpuDefenseCatchRoll(quality, Game.edginess(aimPoint, 'cpu'));
      if (caught) {
        Game.animateDieToCatcher(restPoint, 'cpu', () => {
          Game.toast('CPU CATCHES IT - NO SCORE', 1200);
          setTimeout(Game.advanceTurn, 1200);
        });
      } else {
        Game.animateDieMissedCatchToSide(restPoint, () => {
          Game.state.scoreYou += 1;
          Game.updateScoreBug();
          Game.showPopup('+1', 'POINT!', true);
          setTimeout(Game.advanceTurn, 1200);
        });
      }
    });
  }
};

// ============================================================= CPU OFFENSE

Game.cpuThrow = function () {
  // A timer or animation still running when the player quit to the menu
  // must not drag the match UI back over the title screen.
  if (Game.state.phase === 'title') return;
  if (Game.state.phase === 'gameover') return;
  Game.state.phase = 'flight';
  const choice = Game.cpuChooseThrow();
  Game.state.defendAim = choice.aim;
  Game.state._cpuQuality = choice.quality;

  const from = { x: 200, y: 135 };
  const to = choice.aim;
  const edg = Game.edginess(to, 'player');
  const outcome = Game.rollThrowOutcome(choice.quality, edg);

  if (outcome === 'miss') {
    Game.animateMissThrow(from, to, 'player', 480, () => {
      Game.resolveCpuThrow(outcome, choice.quality, to);
    });
  } else {
    Game.animateDie(from, to, 480, () => {
      Game.resolveCpuThrow(outcome, choice.quality, to);
    });
  }
};

Game.resolveCpuThrow = function (outcome, quality, aimPoint) {
  // A timer or animation still running when the player quit to the menu
  // must not drag the match UI back over the title screen.
  if (Game.state.phase === 'title') return;
  if (outcome === 'score3') {
    Game.animateDieIntoCup(aimPoint, 'player', () => {
      Game.state.scoreCpu += 3;
      Game.updateScoreBug();
      Game.showPopup('+3', 'CPU IN THE CUP', false);
      setTimeout(Game.advanceTurn, 1200);
    });
  } else if (outcome === 'miss') {
    // The die has already sailed over the table and landed in the grass
    // by the player's team (animateMissThrow, played before this was
    // called) — go straight into the Fifa kick, nothing left to animate.
    Game.enterFifaKick();
  } else {
    // catchable: die bounces once before the catch button appears, and
    // the button lands exactly where the bounce actually rests.
    Game.animateBounce(aimPoint, (restPoint) => {
      Game.enterCatchMinigame(restPoint, quality);
    });
  }
};

// ============================================================ CATCH MINIGAME

// Faster + tighter than the original tuning per user request: the icon
// (big black circle + hand, per the Figma reference) shrinks from rMax
// down to rTarget noticeably quicker, giving less time to react to the
// CPU's throw.
Game.CATCH = { rMax: 150, rTarget: 34, shrinkMs: 480, graceMs: 130 };

Game.enterCatchMinigame = function (landingPoint, cpuQuality) {
  // A timer or animation still running when the player quit to the menu
  // must not drag the match UI back over the title screen.
  if (Game.state.phase === 'title') return;
  Game.state.phase = 'catch';
  const btn = Game.el.catchBtn;
  btn.style.left = landingPoint.x + 'px';
  btn.style.top = landingPoint.y + 'px';
  show(btn);

  const c = Game.CATCH;
  const shrinkMs = Math.max(260, c.shrinkMs - cpuQuality * 200);
  const start = performance.now();
  Game._catchResolved = false;

  function frame(now) {
    if (Game.state.phase !== 'catch') return;
    const t = now - start;
    let d;
    if (t <= shrinkMs) {
      d = c.rMax - (c.rMax - c.rTarget) * (t / shrinkMs);
    } else if (t <= shrinkMs + c.graceMs) {
      d = c.rTarget - c.rTarget * ((t - shrinkMs) / c.graceMs);
    } else {
      d = 0;
    }
    Game.el.catchIcon.style.width = d + 'px';
    Game.el.catchIcon.style.height = d + 'px';

    if (t > shrinkMs + c.graceMs) {
      Game.finishCatch(0, true);
      return;
    }
    Game._catchRaf = requestAnimationFrame(frame);
  }
  Game._catchRaf = requestAnimationFrame(frame);
  Game._catchShrinkMs = shrinkMs;
  Game._catchStart = start;
};

Game.wireCatchTap = function () {
  Game.el.catchBtn.addEventListener('pointerdown', () => {
    if (Game.state.phase !== 'catch' || Game._catchResolved) return;
    const now = performance.now();
    const t = now - Game._catchStart;
    const c = Game.CATCH;
    let score;
    if (t <= Game._catchShrinkMs) {
      score = t / Game._catchShrinkMs;
    } else {
      score = Math.max(0, 1 - (t - Game._catchShrinkMs) / c.graceMs);
    }
    Game.finishCatch(score, false);
  });
};

Game.finishCatch = function (tierScore, timedOut) {
  if (Game._catchResolved) return;
  Game._catchResolved = true;
  cancelAnimationFrame(Game._catchRaf);
  hide(Game.el.catchBtn);
  Game.state.phase = 'resolve';

  const tier = timedOut ? { label: 'MISSED', cls: 'quality-bad' } : Game.qualityTier(tierScore);
  Game.showQualityBanner(tier);

  if (Game.state.tutorialMode) {
    Game.tutorialAfterCatch(tierScore, timedOut);
    return;
  }

  const chance = Game.playerCatchChanceFromTier(tierScore);
  const caught = Math.random() < chance;
  const restPoint = { x: Game.state.die.x, y: Game.state.die.y };

  setTimeout(() => {
    if (caught) {
      Game.animateDieToCatcher(restPoint, 'player', () => {
        Game.showPopup('CAUGHT!', 'NO SCORE', true);
        setTimeout(Game.advanceTurn, 1200);
      });
    } else {
      Game.animateDieToGround(restPoint, 'player', () => {
        Game.state.scoreCpu += 1;
        Game.updateScoreBug();
        Game.showPopup('+1 CPU', timedOut ? 'MISSED IT' : 'JUST MISSED', false);
        setTimeout(Game.advanceTurn, 1200);
      });
    }
  }, 500);
};

// ============================================================= FIFA MINIGAME
// Two stages back to back, matching the real rule (one teammate kicks the
// die up, the other catches it) — same track/line look and PERFECT/GOOD/
// SLIGHTLY/VERY tier scheme as the throw-timing meter, run twice. Stage 2
// (the catch) is faster than stage 1 (the kick), and clearing both in a
// row is what makes a Fifa a bit harder to convert than a normal point.

Game.FIFA = {
  trackWidth: 260,
  bullseyeHalfWidth: 16,
  kickOmega: 0.0032,  // stage 1: normal speed, matches the throw meter's easiest pace
  catchOmega: 0.0065,  // stage 2: noticeably faster/harder
};

Game.enterFifaKick = function () {
  // A timer or animation still running when the player quit to the menu
  // must not drag the match UI back over the title screen.
  if (Game.state.phase === 'title') return;
  Game.state.phase = 'fifaKick';
  Game.el.fifaHint.textContent = 'KICK IT UP! Tap KICK when the lines match!';
  Game.el.fifaBtn.textContent = 'KICK!';
  show(Game.el.fifaPanel);
  Game.startFifaMeter(Game.FIFA.kickOmega);
};

Game.enterFifaCatch = function () {
  // A timer or animation still running when the player quit to the menu
  // must not drag the match UI back over the title screen.
  if (Game.state.phase === 'title') return;
  Game.state.phase = 'fifaCatch';
  Game.el.fifaHint.textContent = 'NOW THE CATCH! Tap CATCH when the lines match!';
  Game.el.fifaBtn.textContent = 'CATCH!';
  Game.startFifaMeter(Game.FIFA.catchOmega);
};

Game.startFifaMeter = function (omega) {
  const f = Game.FIFA;
  f.omega = omega;
  f.t = performance.now();
  Game.el.fifaTarget.style.left = (f.trackWidth / 2) + 'px';
  Game.tickFifaMeter();

  // safety auto-lock so play never soft-locks
  clearTimeout(Game._fifaAutoTimer);
  Game._fifaAutoTimer = setTimeout(() => {
    if (Game.state.phase === 'fifaKick' || Game.state.phase === 'fifaCatch') Game.lockFifa();
  }, 3200);
};

Game.tickFifaMeter = function () {
  if (Game.state.phase !== 'fifaKick' && Game.state.phase !== 'fifaCatch') return;
  const f = Game.FIFA;
  const now = performance.now();
  const half = f.trackWidth / 2;
  const x = half + half * Math.sin((now - f.t) * f.omega);
  Game._fifaX = x;
  Game.el.fifaMover.style.left = x + 'px';
  Game._fifaRaf = requestAnimationFrame(Game.tickFifaMeter);
};

Game.lockFifa = function () {
  if (Game.state.phase !== 'fifaKick' && Game.state.phase !== 'fifaCatch') return;
  cancelAnimationFrame(Game._fifaRaf);
  clearTimeout(Game._fifaAutoTimer);

  const wasKick = Game.state.phase === 'fifaKick';
  const center = Game.FIFA.trackWidth / 2;
  const dx = (Game._fifaX || 0) - center;
  const score = Game.proximityScore(Math.abs(dx), Game.FIFA.bullseyeHalfWidth);
  const success = Math.random() < Game.playerFifaChanceFromTier(score);

  // Freeze the meter where it was tapped and show tier feedback for 1.5s,
  // same pattern as the swipe/timing steps, before moving on.
  Game.state.phase = 'resolve';
  Game.showQualityBanner(Game.deviationTier(score, dx), 1500);

  if (Game.state.tutorialMode) {
    setTimeout(() => Game.tutorialAfterFifaStage(wasKick), 1500);
    return;
  }

  setTimeout(() => {
    if (wasKick) {
      if (success) {
        Game.enterFifaCatch();
      } else {
        hide(Game.el.fifaPanel);
        Game.showPopup('NO FIFA', 'MISSED THE KICK', false);
        setTimeout(Game.advanceTurn, 1200);
      }
      return;
    }

    hide(Game.el.fifaPanel);
    if (success) {
      Game.state.scoreYou += 1;
      Game.updateScoreBug();
      Game.showPopup('+1', 'FIFA!', true);
    } else {
      Game.showPopup('NO FIFA', 'DROPPED THE CATCH', false);
    }
    setTimeout(Game.advanceTurn, 1200);
  }, 1500);
};
