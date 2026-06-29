import sharp from "sharp";

export type OptimizeOptions = {
  /** Largeur max (px). L'image est réduite si elle dépasse, jamais agrandie. */
  maxWidth?: number;
  /** Hauteur max (px). */
  maxHeight?: number;
  /** Qualité WebP (0-100). */
  quality?: number;
};

/**
 * Optimise n'importe quelle image uploadée : auto-rotation EXIF, redimension-
 * nement à des dimensions web raisonnables, et conversion en WebP fortement
 * compressé. Les métadonnées sont supprimées (sharp ne les conserve pas par
 * défaut). Utilisé par TOUS les points d'upload pour garantir des images légères.
 */
export async function optimizeToWebp(input: Buffer, opts: OptimizeOptions = {}): Promise<Buffer> {
  const { maxWidth = 1400, maxHeight = 1800, quality = 80 } = opts;
  return sharp(input)
    .rotate()
    .resize({ width: maxWidth, height: maxHeight, fit: "inside", withoutEnlargement: true })
    .webp({ quality, effort: 5, smartSubsample: true })
    .toBuffer();
}
