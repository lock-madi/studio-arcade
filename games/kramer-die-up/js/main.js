function fitApp() {
  const app = document.getElementById('app');
  const scale = Math.min(window.innerWidth / 400, window.innerHeight / 750);
  const left = (window.innerWidth - 400 * scale) / 2;
  const top = (window.innerHeight - 750 * scale) / 2;
  app.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
}

window.addEventListener('resize', fitApp);
window.addEventListener('DOMContentLoaded', () => {
  fitApp();
  Game.initRender();
  Game.initConfetti();
  Game.initScreens();
  Game.startRenderLoop();
  Game.loadAssets();
});
