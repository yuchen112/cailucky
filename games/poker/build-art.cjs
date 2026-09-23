// Delivery conversions only: never crop, composite, paint or fabricate artwork.
const fs = require("fs"),
  path = require("path");
const sharp = require(process.env.CXQ_SHARP_PATH || "sharp");
const base = __dirname,
  manifest = JSON.parse(
    fs.readFileSync(path.join(base, "art/manifest.json"), "utf8"),
  );
(async () => {
  for (const a of manifest.assets) {
    const dst = path.join(base, "art", a.id + ".png");
    if (!fs.existsSync(dst)) fs.copyFileSync(a.source, dst);
    const isCard = a.id.startsWith("card-");
    await sharp(dst)
      .resize({
        width: isCard
          ? 360
          : a.id.startsWith("helper-")
            ? 256
            : a.id.startsWith("ui-")
              ? 640
              : a.id.startsWith("cover")
                ? 800
                : 1600,
        withoutEnlargement: true,
      })
      .webp({ quality: isCard ? 96 : 88, alphaQuality: 100 })
      .toFile(path.join(base, "art", a.id + ".webp"));
  }
  console.log(
    "Converted " + manifest.assets.length + " independent assets; no cropping.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
