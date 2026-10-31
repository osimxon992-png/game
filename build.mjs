// Yig'ish:
//   dist/oyin.js            — o'yin kodi (three.js bilan birga)
//   dist/Kosmik-Kema.html   — internetsiz ishlaydigan bitta fayl
//   docs/                   — telefonga o'rnatiladigan ilova (PWA); GitHub Pages shu papkadan ochadi
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";

mkdirSync("dist", { recursive: true });

await build({
  entryPoints: ["src/main.js"],
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020"],
  outfile: "dist/oyin.js",
  legalComments: "eof"
});

const sahifa = readFileSync("index.html", "utf8");
const SKRIPT = '<script src="dist/oyin.js"></script>';
const SHRIFT = /<link rel="preconnect"[^\n]*\n<link rel="preconnect"[^\n]*\n<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^\n]*\n/;
if (!sahifa.includes(SKRIPT) || !SHRIFT.test(sahifa)) throw new Error("index.html tuzilishi kutilganidek emas");

// index.html qismlari: bosh (meta, title), uslub, tana
const [bosh, qolgan] = sahifa.split("<style>");
const [uslub, tana] = qolgan.split("</style>");
const hujjat = (boshQismi, tanaQismi) =>
  `<!doctype html>\n<html lang="uz">\n<head>\n${boshQismi}<style>${uslub}</style>\n</head>\n<body>\n${tanaQismi.trim()}\n</body>\n</html>\n`;

// 1) Bitta faylli offline nusxa
const bundle = readFileSync("dist/oyin.js", "utf8");
writeFileSync("dist/Kosmik-Kema.html", hujjat(bosh,
  tana.replace(SKRIPT, () => `<script>window.KOSMIK_OFFLINE = true;</script>\n<script>${bundle.replace(/<\/script/gi, "<\\/script")}</script>`)));

// 2) PWA
rmSync("docs", { recursive: true, force: true });
mkdirSync("docs/icons", { recursive: true });
cpSync("dist/oyin.js", "docs/oyin.js");
cpSync("assets/fonts", "docs/fonts", { recursive: true });
cpSync("assets/icons", "docs/icons", { recursive: true });

const pwaBosh = bosh.replace(SHRIFT, `<link rel="stylesheet" href="fonts/fonts.css">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#020207">
<meta name="description" content="Kosmik Kema — asteroidlar orasida 3D parvoz, yoqilg'i baklari va kosmos haqidagi savollar.">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Kosmik Kema">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" type="image/png" href="icons/favicon-64.png">
`).replace(/<meta name="claude:viewport-fit-sides"[^\n]*\n/, "");
writeFileSync("docs/index.html", hujjat(pwaBosh,
  tana.replace(SKRIPT, '<script>window.KOSMIK_PWA = true;</script>\n<script src="oyin.js"></script>')));
// shrift yo'llari fonts/ papkasiga nisbatan
writeFileSync("docs/fonts/fonts.css", readFileSync("docs/fonts/fonts.css", "utf8").replace(/url\(fonts\//g, "url("));

writeFileSync("docs/manifest.webmanifest", JSON.stringify({
  id: "./",
  name: "Kosmik Kema",
  short_name: "Kosmik Kema",
  description: "Asteroidlar orasida 3D parvoz: yoqilg'ini tejang, baklarni yig'ing, kosmos haqidagi savollarga javob bering.",
  lang: "uz",
  start_url: "./",
  scope: "./",
  display: "fullscreen",
  display_override: ["fullscreen", "standalone"],
  orientation: "any",
  background_color: "#020207",
  theme_color: "#020207",
  categories: ["games", "education"],
  icons: [
    { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
    { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
  ]
}, null, 2));

writeFileSync("docs/.nojekyll", "");

// Service worker: barcha fayllarni oldindan keshlaydi, keyin internetsiz ishlaydi
const fayllar = ["./", "index.html", "oyin.js", "manifest.webmanifest", "fonts/fonts.css",
  ...readdirSync("docs/fonts").filter((f) => f.endsWith(".woff2")).map((f) => "fonts/" + f),
  ...readdirSync("docs/icons").map((f) => "icons/" + f)];
const xesh = createHash("sha256");
for (const f of fayllar) if (f !== "./") xesh.update(readFileSync("docs/" + f));
const versiya = xesh.digest("hex").slice(0, 10);
writeFileSync("docs/sw.js", `// Kosmik Kema service worker (avtomatik yaratilgan)
const KESH = "kosmik-kema-${versiya}";
const FAYLLAR = ${JSON.stringify(fayllar)};

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(KESH).then((c) => c.addAll(FAYLLAR)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((k) => Promise.all(k.filter((n) => n.startsWith("kosmik-kema-") && n !== KESH).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(caches.match("index.html").then((r) => r || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
});
`);

const kb = (f) => (readFileSync(f).length / 1024).toFixed(0) + " KB";
console.log("dist/oyin.js", kb("dist/oyin.js"));
console.log("dist/Kosmik-Kema.html", kb("dist/Kosmik-Kema.html"));
console.log("docs/ tayyor, kesh versiyasi", versiya, "·", fayllar.length, "ta fayl");
