// Génère les icônes PWA depuis le logo "B" de la marque, sur fond blanc.
// Usage: node scripts/make_pwa_icons.cjs
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const PUB = path.join(__dirname, "..", "public");
const SRC = path.join(PUB, "brand", "bloomy-b.png");
const OUT = path.join(PUB, "icons");

async function makeIcon(size, padRatio, file) {
  const pad = Math.round(size * padRatio);
  const logo = await sharp(SRC)
    .resize(size - 2 * pad, size - 2 * pad, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#ffffff" } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(path.join(OUT, file));
  console.log("icon", file);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await makeIcon(192, 0.18, "icon-192.png");
  await makeIcon(512, 0.18, "icon-512.png");
  await makeIcon(512, 0.24, "icon-maskable-512.png"); // zone de sécurité maskable
  await makeIcon(180, 0.16, "apple-touch-icon.png");
})();
