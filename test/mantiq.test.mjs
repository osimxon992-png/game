import { BOSHLANGICH_HOLAT, Mantiq, SAVOLLAR } from "../src/mantiq.js";

// 4-topshiriq: test jadvali
function _f(v) { return Number.isInteger(v) ? v : +v.toFixed(2); }
function _h(o) { return Object.assign({}, BOSHLANGICH_HOLAT, o); }

var TESTLAR = [
  { tur: "Normal", nom: "Bir soniyalik parvoz", kirish: "Yoqilg'i 100, Masofa 0, dt = 1 s", kutilgan: "Yoqilg'i 96, Masofa 20",
    run: function (x) { var r = Mantiq.parvozQadami(_h({}), 1, x);
      return { haqiqiy: "Yoqilg'i " + _f(r.yoqilgi) + ", Masofa " + _f(r.masofa), ok: r.yoqilgi === 96 && r.masofa === 20 }; } },
  { tur: "Normal", nom: "To'qnashuv", kirish: "Ball 20, Kema asteroidga tegdi", kutilgan: "Ball 15",
    run: function () { var r = Mantiq.toqnashuv(_h({ ball: 20 }));
      return { haqiqiy: "Ball " + r.ball, ok: r.ball === 15 }; } },
  { tur: "Normal", nom: "To'g'ri javob", kirish: "«Qizil sayyora?» → mars, Ball 0", kutilgan: "Ball 10",
    run: function (x) { var r = Mantiq.javobBall(_h({}), Mantiq.javobTekshir(SAVOLLAR[0], "mars", x));
      return { haqiqiy: "Ball " + r.ball, ok: r.ball === 10 }; } },
  { tur: "Normal", nom: "Noto'g'ri javob", kirish: "«Qizil sayyora?» → venera, Ball 10", kutilgan: "Ball 5",
    run: function (x) { var r = Mantiq.javobBall(_h({ ball: 10 }), Mantiq.javobTekshir(SAVOLLAR[0], "venera", x));
      return { haqiqiy: "Ball " + r.ball, ok: r.ball === 5 }; } },
  { tur: "Chegaraviy", nom: "Yoqilg'i tugashi", kirish: "Yoqilg'i 1, dt = 1 s", kutilgan: "Yoqilg'i 0, parvoz to'xtaydi",
    run: function (x) { var r = Mantiq.parvozQadami(_h({ yoqilgi: 1 }), 1, x);
      return { haqiqiy: "Yoqilg'i " + _f(r.yoqilgi) + ", " + (r.toxtadi ? "to'xtadi" : "davom etyapti"), ok: r.yoqilgi === 0 && r.toxtadi }; } },
  { tur: "Chegaraviy", nom: "Bo'sh bak bilan parvoz", kirish: "Yoqilg'i 0, Masofa 300, dt = 1 s", kutilgan: "Masofa 300, Yoqilg'i 0",
    run: function (x) { var r = Mantiq.parvozQadami(_h({ yoqilgi: 0, masofa: 300 }), 1, x);
      return { haqiqiy: "Masofa " + _f(r.masofa) + ", Yoqilg'i " + _f(r.yoqilgi), ok: r.masofa === 300 && r.yoqilgi === 0 }; } },
  { tur: "Chegaraviy", nom: "Ball 0 da to'qnashuv", kirish: "Ball 0, Kema asteroidga tegdi", kutilgan: "Ball −5",
    run: function () { var r = Mantiq.toqnashuv(_h({}));
      return { haqiqiy: "Ball " + r.ball, ok: r.ball === -5 }; } },
  { tur: "Chegaraviy", nom: "Bak: to'la bakka yaqin", kirish: "Yoqilg'i 90, bak olindi", kutilgan: "Yoqilg'i 100 (oshmaydi)", yangi: true,
    run: function () { var r = Mantiq.bakOlish(_h({ yoqilgi: 90 }));
      return { haqiqiy: "Yoqilg'i " + r.yoqilgi, ok: r.yoqilgi === 100 }; } },
  { tur: "Normal", nom: "Bak: oddiy holat", kirish: "Yoqilg'i 40, bak olindi", kutilgan: "Yoqilg'i 65", yangi: true,
    run: function () { var r = Mantiq.bakOlish(_h({ yoqilgi: 40 }));
      return { haqiqiy: "Yoqilg'i " + r.yoqilgi, ok: r.yoqilgi === 65 }; } },
  { tur: "Xato / noodatiy", nom: "Katta harf va bo'sh joy", kirish: "«Qizil sayyora?» → «  MARS »", kutilgan: "To'g'ri, Ball 10",
    run: function (x) { var t = Mantiq.javobTekshir(SAVOLLAR[0], "  MARS ", x); var r = Mantiq.javobBall(_h({}), t);
      return { haqiqiy: (t ? "To'g'ri" : "Noto'g'ri") + ", Ball " + r.ball, ok: r.ball === 10 }; } },
  { tur: "Xato / noodatiy", nom: "Bo'sh javob", kirish: "Javob kiritilmadi", kutilgan: "Noto'g'ri, Ball −5",
    run: function (x) { var t = Mantiq.javobTekshir(SAVOLLAR[0], "", x); var r = Mantiq.javobBall(_h({}), t);
      return { haqiqiy: (t ? "To'g'ri" : "Noto'g'ri") + ", Ball " + r.ball, ok: r.ball === -5 }; } },
  { tur: "Xato / noodatiy", nom: "Manfiy vaqt qadami", kirish: "Yoqilg'i 50, Masofa 100, dt = −1 s", kutilgan: "O'zgarmaydi: 50 / 100",
    run: function (x) { var r = Mantiq.parvozQadami(_h({ yoqilgi: 50, masofa: 100 }), -1, x);
      return { haqiqiy: _f(r.yoqilgi) + " / " + _f(r.masofa), ok: r.yoqilgi === 50 && r.masofa === 100 }; } }
];

// Ishga tushirish: npm test
for (const xatoli of [true, false]) {
  console.log(xatoli ? "\nEski (xatoli) versiya:" : "\nTuzatilgan versiya:");
  let otdi = 0;
  TESTLAR.forEach((t, i) => {
    const r = t.run(xatoli);
    if (r.ok) otdi++;
    console.log(`${String(i + 1).padStart(2)}. [${t.tur}] ${t.nom}: ${r.ok ? "O'TDI" : "O'TMADI"} — kutilgan: ${t.kutilgan}; haqiqiy: ${r.haqiqiy}`);
  });
  console.log(`Natija: ${otdi}/${TESTLAR.length}`);
}
