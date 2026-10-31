// Kosmik Kema — o'yin mantiqi (sof funksiyalar).
// Bu fayl grafikaga bog'liq emas, shuning uchun uni testlar alohida tekshiradi.
// `xatoli = true` — debugging'dan oldingi eski versiya (4-topshiriq uchun saqlangan).

export const BOSHLANGICH_HOLAT = { yoqilgi: 100, masofa: 0, ball: 0, toxtadi: false };

export const Mantiq = {
  TEZLIK: 20,      // km / soniya
  SARF: 4,         // yoqilg'i birligi / soniya
  BAK: 25,         // bitta bak beradigan yoqilg'i
  MAX: 100,        // bak sig'imi
  SAVOL_ORALIQ: 200, // har 200 km da savol

  // 2-topshiriq: parvoz algoritmi
  parvozQadami: function (h, dt, xatoli) {
    var n = Object.assign({}, h);
    if (xatoli) {
      // ESKI KOD: chegaraviy holatlar tekshirilmagan
      n.masofa += this.TEZLIK * dt;
      n.yoqilgi -= this.SARF * dt;
      n.toxtadi = n.yoqilgi === 0;
      return n;
    }
    if (!(dt > 0)) { n.toxtadi = n.yoqilgi <= 0; return n; }
    if (n.yoqilgi <= 0) { n.yoqilgi = 0; n.toxtadi = true; return n; }
    n.masofa += this.TEZLIK * dt;
    n.yoqilgi -= this.SARF * dt;
    if (n.yoqilgi < 0) n.yoqilgi = 0;
    n.toxtadi = n.yoqilgi <= 0;
    return n;
  },

  // 3-topshiriq: to'qnashuv
  toqnashuv: function (h) {
    return Object.assign({}, h, { ball: h.ball - 5 });
  },

  // 5-topshiriq: yangi funksiya — yoqilg'i baki
  bakOlish: function (h) {
    return Object.assign({}, h, { yoqilgi: Math.min(this.MAX, h.yoqilgi + this.BAK) });
  },

  tozala: function (s) {
    return String(s == null ? "" : s)
      .toLowerCase()
      .replace(/[‘’ʻʼ`´]/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  },

  // 3-topshiriq: savol-javob
  javobTekshir: function (savol, javob, xatoli) {
    if (xatoli) return savol.javoblar.indexOf(javob) !== -1; // ESKI KOD
    var j = this.tozala(javob);
    if (!j) return false;
    var self = this;
    return savol.javoblar.some(function (a) { return self.tozala(a) === j; });
  },

  javobBall: function (h, togri) {
    return Object.assign({}, h, { ball: h.ball + (togri ? 10 : -5) });
  }
};

export const SAVOLLAR = [
  { s: "Qaysi sayyora «Qizil sayyora» deb ataladi?", javoblar: ["mars"], k: "Mars" },
  { s: "Yerning tabiiy yo'ldoshi qanday nomlanadi?", javoblar: ["oy"], k: "Oy" },
  { s: "Quyosh sistemasidagi eng katta sayyora qaysi?", javoblar: ["yupiter", "jupiter"], k: "Yupiter" },
  { s: "Quyoshga eng yaqin sayyora qaysi?", javoblar: ["merkuriy", "merkury", "mercury"], k: "Merkuriy" },
  { s: "Quyosh sistemasida nechta sayyora bor?", javoblar: ["8", "sakkiz", "sakkizta", "8 ta", "8ta"], k: "8" },
  { s: "Kosmosga birinchi uchgan inson kim? (familiyasi)", javoblar: ["gagarin", "yuriy gagarin", "yuri gagarin"], k: "Gagarin" },
  { s: "Oyga birinchi qadam qo'ygan inson kim? (familiyasi)", javoblar: ["armstrong", "nil armstrong", "neil armstrong"], k: "Armstrong" },
  { s: "Halqalari bilan mashhur sayyora qaysi?", javoblar: ["saturn"], k: "Saturn" },
  { s: "Yer Quyosh atrofini taxminan necha kunda aylanib chiqadi?", javoblar: ["365", "365 kun", "365,25", "365.25"], k: "365" },
  { s: "Quyosh sayyorami yoki yulduzmi?", javoblar: ["yulduz"], k: "Yulduz" },
  { s: "Biz yashaydigan galaktika qanday nomlanadi?", javoblar: ["somon yo'li", "somon yoli", "milky way"], k: "Somon yo'li" },
  { s: "Quyoshdan eng uzoqdagi sayyora qaysi?", javoblar: ["neptun", "neptune"], k: "Neptun" }
];
