// Optimise les images de public/ :
//  1) supprime les anciens assets du thème sombre (plus utilisés au runtime),
//  2) recompresse les images réellement utilisées, sur place (mêmes chemins).
// Usage: node scripts/optimize_public.cjs
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const PUB = path.join(__dirname, "..", "public");

// Anciens assets (thème sombre) — référencés uniquement par copy_assets.py.
const DEAD = [
  "textures/blue-texture.png",
  "textures/gold-streaks.png",
  "textures/dark-texture.png",
  "photos/display-dark.png",
  "photos/display-box.png",
  "photos/brand-board.png",
  "brand/bloomy-wordmark.png",
];

// Images utilisées : recompressées sur place en PNG fortement compressé.
const OPTIMIZE = [
  { file: "photos/lineup.png", maxW: 1600 },
  { file: "products/most-wanted.png", maxW: 1100 },
  { file: "products/sauvage.png", maxW: 1100 },
  { file: "products/imagination.png", maxW: 1100 },
  { file: "products/bleu-de-chanel.png", maxW: 1100 },
];

const kb = (n) => Math.round(n / 1024);

(async () => {
  let freed = 0;
  for (const rel of DEAD) {
    const p = path.join(PUB, rel);
    if (fs.existsSync(p)) {
      freed += fs.statSync(p).size;
      fs.rmSync(p);
      console.log("supprimé  ", rel);
    }
  }
  const tex = path.join(PUB, "textures");
  if (fs.existsSync(tex) && fs.readdirSync(tex).length === 0) fs.rmdirSync(tex);

  let before = 0;
  let after = 0;
  for (const { file, maxW } of OPTIMIZE) {
    const p = path.join(PUB, file);
    if (!fs.existsSync(p)) {
      console.log("absent    ", file);
      continue;
    }
    const orig = fs.readFileSync(p);
    before += orig.length;
    const out = await sharp(orig)
      .resize({ width: maxW, withoutEnlargement: true })
      .png({ compressionLevel: 9, effort: 10, palette: true, quality: 90, dither: 1 })
      .toBuffer();
    if (out.length < orig.length) {
      fs.writeFileSync(p, out);
      after += out.length;
      console.log(`optimisé   ${file}: ${kb(orig.length)} -> ${kb(out.length)} KB`);
    } else {
      after += orig.length;
      console.log(`gardé      ${file}: déjà optimal (${kb(orig.length)} KB)`);
    }
  }
  console.log(`\nDead assets supprimés : ${kb(freed)} KB`);
  console.log(`Images optimisées     : ${kb(before)} -> ${kb(after)} KB`);
})();
