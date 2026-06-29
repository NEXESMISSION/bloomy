// Effet "confettis" pour les moments de réussite (réclamation d'un gain).
// Importé uniquement par des composants client ; import dynamique pour éviter
// toute référence à `window` côté serveur.
export async function celebrate() {
  if (typeof window === "undefined") return;
  const confetti = (await import("canvas-confetti")).default;
  const colors = ["#D4A24A", "#17171B", "#ffffff", "#E7B567"];

  // Grande salve centrale.
  confetti({ particleCount: 150, spread: 100, startVelocity: 48, origin: { y: 0.62 }, colors });

  // Jets latéraux pendant ~1s pour l'énergie.
  const end = Date.now() + 1000;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 70, startVelocity: 55, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 5, angle: 120, spread: 70, startVelocity: 55, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
