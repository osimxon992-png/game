# Kosmik Kema

Three.js'da yozilgan 3D kosmik o'yin. Telefonga ilova (PWA) sifatida o'rnatiladi va internetsiz ishlaydi.

**O'ynash:** https://osimxon992-png.github.io/game/

Telefonda havolani oching va **Ilovani o'rnatish** tugmasini bosing. iPhone'da Safari'dagi **Ulashish → Bosh ekranga qo'shish** orqali o'rnatiladi.

## O'yin qoidalari

- Yoqilg'i 100 dan boshlanadi va har soniyada 4 ga kamayadi, masofa esa har soniyada 20 km ga oshadi.
- Asteroidga urilsangiz −5 ball.
- Yoqilg'i baki +25 yoqilg'i beradi, lekin yoqilg'i 100 dan oshmaydi.
- Har 200 km da kosmos haqida savol beriladi: to'g'ri javob +10, noto'g'ri −5 ball.
- Yoqilg'i tugaganda parvoz to'xtaydi.

## Loyiha tuzilishi

| Papka / fayl | Vazifasi |
|---|---|
| `src/mantiq.js` | O'yin qoidalari (sof funksiyalar) va savollar |
| `src/main.js` | Sahna, kamera, boshqaruv, o'yin sikli |
| `src/kema.js`, `src/asteroid.js`, `src/osmon.js` | Kema, asteroidlar va yoqilg'i baki, osmon va sayyora |
| `src/ilova.js` | PWA o'rnatish tugmasi |
| `test/mantiq.test.mjs` | 12 ta test: normal, chegaraviy, xato/noodatiy holatlar |
| `docs/` | Yig'ilgan PWA (GitHub Pages shu papkadan ochadi) |

## Ishlab chiqish

```bash
npm install
npm test
npm run build
```

`npm run build` buyrug'i `docs/` papkani qayta yig'adi.
