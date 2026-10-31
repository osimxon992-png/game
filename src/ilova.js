// Ilova tugmasi uch rejimda ishlaydi:
//  - PWA (o'z saytida): service worker'ni ro'yxatdan o'tkazadi va "Ilovani o'rnatish" tugmasini ko'rsatadi;
//  - claude.ai ichida: internetsiz ishlaydigan HTML faylni downloads imkoniyati orqali beradi;
//  - yuklab olingan nusxa ichida: tugma ko'rinmaydi.

const FAYL_NOMI = "Kosmik-Kema.html";
const MANBA_CLAUDE = "yuklab/Kosmik-Kema.txt";

const $ = (id) => document.getElementById(id);
const tugmalar = () => [...document.querySelectorAll("[data-yuklab]")];
function yorliq(matn) {
  tugmalar().forEach((b) => { const s = b.querySelector("[data-yorliq]"); if (s) s.textContent = matn; });
}
function izoh(m) {
  const el = $("yuklab-izoh");
  if (el) { el.textContent = m; el.hidden = !m; }
}

export function ilovaTugmasiniSozla() {
  if (window.KOSMIK_PWA) return pwaSozla();
  if (window.KOSMIK_OFFLINE) return;
  return claudeSozla();
}

// ---------- PWA ----------
function pwaSozla() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch((e) => console.warn("Service worker:", e));
    });
  }
  const ornatilgan =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    navigator.standalone === true;
  if (ornatilgan) return;

  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  let taklif = null;

  const korsat = () => tugmalar().forEach((b) => { b.hidden = false; });
  const yashir = () => tugmalar().forEach((b) => { b.hidden = true; });
  yorliq("Ilovani o'rnatish");

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    taklif = e;
    korsat();
  });
  window.addEventListener("appinstalled", () => {
    taklif = null;
    yashir();
    izoh("O'rnatildi. O'yinni bosh ekrandagi Kosmik Kema belgisidan oching.");
  });
  // Tizim taklifi kelmasa ham (iPhone, Firefox), qo'lda o'rnatish ko'rsatmasini beramiz
  setTimeout(() => { if (!taklif) korsat(); }, ios ? 0 : 3000);

  tugmalar().forEach((b) => b.addEventListener("click", async () => {
    if (taklif) {
      taklif.prompt();
      const { outcome } = await taklif.userChoice;
      taklif = null;
      if (outcome === "accepted") yashir();
      return;
    }
    korsatma(ios);
  }));
  $("btn-ornatish-yop").addEventListener("click", () => { $("ornatish-oyna").hidden = true; });
}

function korsatma(ios) {
  const qadamlar = ios
    ? ["Sahifani <b>Safari</b> brauzerida oching.", "Pastdagi <b>Ulashish</b> tugmasini bosing (yuqoriga strelkali kvadrat).", "<b>Bosh ekranga qo'shish</b> bandini tanlang va <b>Qo'shish</b>ni bosing."]
    : ["Sahifani <b>Chrome</b> brauzerida oching.", "Yuqori o'ng burchakdagi <b>⋮</b> menyuni bosing.", "<b>Ilovani o'rnatish</b> yoki <b>Bosh ekranga qo'shish</b> bandini tanlang."];
  $("ornatish-qadamlar").innerHTML = qadamlar.map((q) => "<li>" + q + "</li>").join("");
  $("ornatish-oyna").hidden = false;
  $("btn-ornatish-yop").focus();
}

// ---------- claude.ai ichida: offline faylni berish ----------
async function claudeSozla() {
  let dl = null;
  if (window.claude && typeof window.claude.use === "function") {
    try { dl = await window.claude.use("downloads"); } catch (e) { dl = null; }
  }
  if (!dl) return;
  tugmalar().forEach((b) => {
    b.hidden = false;
    b.addEventListener("click", async () => {
      tugmalar().forEach((t) => { t.disabled = true; });
      izoh("Fayl tayyorlanmoqda…");
      try {
        const javob = await fetch(MANBA_CLAUDE);
        if (!javob.ok) throw { code: "fetch" };
        const matn = await javob.text();
        izoh("");
        await dl.save({ filename: FAYL_NOMI, data: matn });
        izoh("Saqlandi. Faylni ikki marta bosib oching — internet kerak emas.");
      } catch (e) {
        const k = e && e.code;
        if (k === "declined") izoh("");
        else if (k === "rate_limited") izoh("Oyna allaqachon ochiq. Biroz kutib, qayta bosing.");
        else if (k === "fetch") izoh("Faylni olib bo'lmadi. Sahifani yangilab, qayta urinib ko'ring.");
        else izoh("Bu ko'rinishda yuklab olish ishlamaydi.");
      } finally {
        tugmalar().forEach((t) => { t.disabled = false; });
      }
    });
  });
}
