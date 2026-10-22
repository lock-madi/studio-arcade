// Asset manifest: custom art pulled in from Figma. Each entry is preloaded at
// startup; render.js checks Game.assetImages[key] and falls back to the
// procedural (hand-drawn) version whenever a piece hasn't been supplied yet,
// so the game always renders completely no matter how many pieces exist.

Game.ASSETS = {
  character_cpu: { src: 'assets/character_cpu.svg' },
  cup: { src: 'assets/cup.svg' },
  table: { src: 'assets/table.svg' },
  die: { src: 'assets/die.svg' },
  swipe_ring: { src: 'assets/swipe_ring.svg' },
  swipe_diamond: { src: 'assets/swipe_diamond.svg' },
};

// Every player skin (Game.SKINS, defined in state.js) gets its own asset
// key so they all preload up front and can be swapped at render time
// based on the player's selection.
Game.SKINS.forEach((skin) => {
  Game.ASSETS['skin_' + skin.id] = { src: skin.src };
});

Game.assetImages = {};

Game.loadAssets = function (onDone) {
  const keys = Object.keys(Game.ASSETS);
  let remaining = keys.length;
  if (remaining === 0) { onDone && onDone(); return; }

  keys.forEach((key) => {
    const img = new Image();
    img.onload = () => {
      Game.assetImages[key] = img;
      if (--remaining === 0) onDone && onDone();
    };
    img.onerror = () => {
      if (--remaining === 0) onDone && onDone();
    };
    img.src = Game.ASSETS[key].src;
  });
};
