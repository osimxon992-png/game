// Kosmik Kema — asosiy o'yin: sahna, kamera, boshqaruv, o'yin sikli, interfeys.
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { BOSHLANGICH_HOLAT, Mantiq, SAVOLLAR } from "./mantiq.js";
import { QUYOSH, osmonTeksturasi, muhitTeksturasi, nurTeksturasi, quyoshYasash, sayyoraYasash, changYasash } from "./osmon.js";
import { kemaYasash } from "./kema.js";
import { asteroidGeometriyasi, toshMaterial, bakYasash } from "./asteroid.js";
import { ilovaTugmasiniSozla } from "./ilova.js";

const $ = (id) => document.getElementById(id);
const kutish = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
const mobil = Math.min(screen.width, screen.height) < 700 || /Android|iPhone|iPad/i.test(navigator.userAgent);

ilovaTugmasiniSozla();
if (location.search.includes("sinov")) window.__sinov = { Mantiq };

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
} catch (e) {
  $("yuklanish").textContent = "Bu brauzerda 3D grafika (WebGL) o'chirilgan. O'yinni Chrome, Edge yoki Firefox'da oching.";
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobil ? 1.5 : 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
$("sahna").prepend(renderer.domElement);

const sahna = new THREE.Scene();
const kamera = new THREE.PerspectiveCamera(55, 1, 0.1, 6000);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(sahna, kamera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.45, 0.35, 0.92);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- Yuklanish: protsedurali teksturalarni yaratish ----------
let kemaObj, asteroidShakl = [], mayda = [], nurTex, sayyora, chang;
const bezakToshlar = [];

async function tayyorla() {
  const holat = $("yuklanish");
  holat.textContent = "Yulduzlar xaritasi chizilmoqda…";
  await kutish();
  sahna.background = osmonTeksturasi(!mobil && renderer.capabilities.maxTextureSize >= 4096);
  sahna.backgroundIntensity = 1.0;
  sahna.environment = muhitTeksturasi(renderer);
  nurTex = nurTeksturasi();

  holat.textContent = "Sayyora yaratilmoqda…";
  await kutish();
  sayyora = sayyoraYasash(!mobil);
  sahna.add(sayyora, quyoshYasash(nurTex));

  const quyosh = new THREE.DirectionalLight(0xfff0dc, 3.4);
  quyosh.position.copy(QUYOSH).multiplyScalar(50);
  sahna.add(quyosh);
  sahna.add(new THREE.HemisphereLight(0x8090b0, 0x201812, 0.12));

  holat.textContent = "Asteroidlar shakllantirilmoqda…";
  await kutish();
  const detal = mobil ? 22 : 40;
  for (let i = 0; i < 7; i++) {
    asteroidShakl.push(asteroidGeometriyasi(101 + i * 17, detal));
    if (i % 2) await kutish();
  }
  for (let i = 0; i < 4; i++) mayda.push(asteroidGeometriyasi(900 + i, 3));

  holat.textContent = "Kema yig'ilmoqda…";
  await kutish();
  kemaObj = kemaYasash();
  sahna.add(kemaObj.kema);
  chang = changYasash(mobil ? 600 : 1100);
  sahna.add(chang);

  // Uzoqdagi yirik toshlar — manzara uchun, to'qnashmaydi
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(asteroidShakl[i % asteroidShakl.length], toshMaterial);
    bezakToshJoyla(m, -80 - Math.random() * 600);
    sahna.add(m);
    bezakToshlar.push({ m, vr: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.25) });
  }

  olcham();
  renderer.compile(sahna, kamera);
  holat.textContent = "";
  $("btn-boshlash").disabled = false;
  $("btn-boshlash").focus({ preventScroll: true });
  requestAnimationFrame(kadr);
}

function bezakToshJoyla(m, z) {
  const s = Math.random() < 0.5 ? -1 : 1;
  m.position.set(s * (24 + Math.random() * 60), (Math.random() - 0.5) * 50, z);
  m.scale.setScalar(5 + Math.random() * 16);
  m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
}

// ---------- O'yin holati ----------
let h = { ...BOSHLANGICH_HOLAT };
let holat = "kutish"; // kutish | parvoz | savol | pauza | tugadi
let asteroidlar = [], baklar = [], portlashlar = [];
let astTaymer = 1, bakTaymer = 8, keyingiSavol = Mantiq.SAVOL_ORALIQ;
let savolNavbat = [], joriySavol = null;
let silkinish = 0, daxlsiz = 0, kirishVaqt = 0;
let stat = { togri: 0, savol: 0, toqnashuv: 0, bak: 0 };
const chegara = { x: 5, y: 2.8 };
let nishon = null;
const tugmalar = {};

let ekranQulfi = null;
async function ekranniYoqiqTut(yoq) {
  try {
    if (yoq && !ekranQulfi && navigator.wakeLock) ekranQulfi = await navigator.wakeLock.request("screen");
    if (!yoq && ekranQulfi) { await ekranQulfi.release(); ekranQulfi = null; }
  } catch (e) { ekranQulfi = null; }
}
const tebrat = (ms) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* qo'llab-quvvatlanmaydi */ } };

const aralashtir = (a) => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

// HUD
const segmentlar = [];
for (let i = 0; i < 20; i++) { const s = document.createElement("i"); $("hud-segment").append(s); segmentlar.push(s); }
let oldingiHud = "";
function hudYangila() {
  const y = Math.max(0, h.yoqilgi);
  const kalit = Math.ceil(y) + "|" + Math.floor(h.masofa) + "|" + h.ball;
  if (kalit === oldingiHud) return;
  oldingiHud = kalit;
  $("hud-yoqilgi").textContent = String(Math.ceil(y)).padStart(3, "0");
  const yonik = Math.ceil(y / 5);
  segmentlar.forEach((s, i) => s.classList.toggle("on", i < yonik));
  $("hud").classList.toggle("kam", y < 25);
  $("hud-masofa").textContent = Math.floor(h.masofa).toLocaleString("uz-UZ").replace(/,/g, " ");
  $("hud-ball").textContent = h.ball;
}

let toastTaymer = null;
function xabar(matn, tur) {
  const t = $("toast");
  t.textContent = matn;
  t.dataset.tur = tur || "";
  t.hidden = false;
  t.classList.remove("chiq");
  void t.offsetWidth;
  t.classList.add("chiq");
  clearTimeout(toastTaymer);
  toastTaymer = setTimeout(() => { t.hidden = true; }, 2200);
}

function tozalash() {
  asteroidlar.forEach((a) => sahna.remove(a.m));
  baklar.forEach((b) => sahna.remove(b.m));
  portlashlar.forEach(portlashOchir);
  asteroidlar = []; baklar = []; portlashlar = [];
}

// 1-topshiriq: boshlang'ich holat
function boshlash() {
  if (!kemaObj) return;
  ovoz.tayyorla();
  tozalash();
  h = { ...BOSHLANGICH_HOLAT };
  stat = { togri: 0, savol: 0, toqnashuv: 0, bak: 0 };
  kemaObj.kema.position.set(0, 0, 0);
  kemaObj.kema.visible = true;
  astTaymer = 1.2; bakTaymer = 8; keyingiSavol = Mantiq.SAVOL_ORALIQ;
  savolNavbat = aralashtir(SAVOLLAR);
  daxlsiz = 0; kirishVaqt = 0;
  ["boshlash-oyna", "yakun-oyna", "savol-oyna", "pauza"].forEach((id) => { $(id).hidden = true; });
  document.body.classList.add("parvozda");
  holat = "parvoz";
  oldingiHud = "";
  hudYangila();
  ovoz.dvigatel(true);
  ekranniYoqiqTut(true);
}

function asteroidQosh() {
  const r = 0.7 + Math.pow(Math.random(), 1.5) * 1.9;
  const m = new THREE.Mesh(asteroidShakl[Math.floor(Math.random() * asteroidShakl.length)], toshMaterial);
  m.scale.setScalar(r);
  m.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
  // ba'zan to'g'ridan-to'g'ri kema tomon uchadi
  const nishonga = Math.random() < 0.35;
  m.position.set(
    nishonga ? kemaObj.kema.position.x + (Math.random() - 0.5) * 1.5 : (Math.random() * 2 - 1) * chegara.x * 1.2,
    nishonga ? kemaObj.kema.position.y + (Math.random() - 0.5) * 1.0 : (Math.random() * 2 - 1) * chegara.y * 1.2,
    -360
  );
  sahna.add(m);
  asteroidlar.push({
    m, r,
    vr: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(1.4 / r),
    vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8
  });
}

function bakQosh() {
  const m = bakYasash(nurTex);
  m.position.set((Math.random() * 2 - 1) * chegara.x * 0.85, (Math.random() * 2 - 1) * chegara.y * 0.85, -360);
  sahna.add(m);
  baklar.push({ m });
}

// Portlash: chaqnash, uchqunlar va tosh bo'laklari
function portlash(pos, tur) {
  const toshmi = tur === "tosh";
  const rang = toshmi ? new THREE.Color(1, 0.62, 0.3) : new THREE.Color(1, 0.6, 0.15);
  const fl = new THREE.Sprite(new THREE.SpriteMaterial({
    map: nurTex, color: rang.clone().multiplyScalar(toshmi ? 6 : 4), blending: THREE.AdditiveBlending,
    transparent: true, depthWrite: false, toneMapped: false
  }));
  fl.position.copy(pos);
  sahna.add(fl);
  const n = toshmi ? 140 : 90;
  const p = new Float32Array(n * 3), v = [];
  for (let i = 0; i < n; i++) {
    p.set([pos.x, pos.y, pos.z], i * 3);
    v.push(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(3 + Math.random() * 11));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
  const sp = new THREE.Points(geo, new THREE.PointsMaterial({
    map: nurTex, color: rang.clone().multiplyScalar(4), size: 0.11, blending: THREE.AdditiveBlending,
    transparent: true, depthWrite: false, toneMapped: false
  }));
  sahna.add(sp);
  const bolak = [];
  if (toshmi) {
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(mayda[i % mayda.length], toshMaterial);
      m.position.copy(pos);
      m.scale.setScalar(0.06 + Math.random() * 0.22);
      sahna.add(m);
      bolak.push({ m, v: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(9), vr: new THREE.Vector3(Math.random() * 6, Math.random() * 6, Math.random() * 6), s: m.scale.x });
    }
  }
  portlashlar.push({ t: 0, fl, sp, v, bolak, toshmi });
}
function portlashOchir(p) {
  sahna.remove(p.fl, p.sp);
  p.fl.material.dispose();
  p.sp.geometry.dispose(); p.sp.material.dispose();
  p.bolak.forEach((b) => sahna.remove(b.m));
}

// 3-topshiriq: savol-javob
function savolBer() {
  holat = "savol";
  if (!savolNavbat.length) savolNavbat = aralashtir(SAVOLLAR);
  joriySavol = savolNavbat.pop();
  stat.savol++;
  $("savol-km").textContent = Math.floor(h.masofa) + " km";
  $("savol-matn").textContent = joriySavol.s;
  $("javob").value = "";
  $("javob").disabled = false;
  $("savol-natija").hidden = true;
  $("btn-javob").hidden = false;
  $("btn-davom").hidden = true;
  $("savol-oyna").hidden = false;
  ovoz.dvigatel(false);
  ovoz.chal("aloqa");
  setTimeout(() => $("javob").focus(), 40);
}

function javobBer() {
  if (holat !== "savol" || $("javob").disabled) return;
  const togri = Mantiq.javobTekshir(joriySavol, $("javob").value);
  h = Mantiq.javobBall(h, togri);
  const n = $("savol-natija");
  n.hidden = false;
  n.dataset.tur = togri ? "yaxshi" : "xavf";
  if (togri) {
    stat.togri++;
    n.textContent = "To'g'ri. +10 ball";
    ovoz.chal("togri");
  } else {
    n.textContent = "Noto'g'ri. To'g'ri javob: " + joriySavol.k + ". −5 ball";
    ovoz.chal("notogri");
  }
  $("javob").disabled = true;
  $("btn-javob").hidden = true;
  $("btn-davom").hidden = false;
  $("btn-davom").focus();
  hudYangila();
}

function davomEt() {
  $("savol-oyna").hidden = true;
  holat = "parvoz";
  ovoz.dvigatel(true);
}

// 2-topshiriq: yoqilg'i tugashi
function tugat() {
  holat = "tugadi";
  xabar("Yoqilg'i tugadi. Parvoz to'xtatildi.", "xavf");
  ovoz.dvigatel(false);
  ovoz.chal("tugadi");
  ekranniYoqiqTut(false);
  tebrat(400);
  let rekord = 0;
  try { rekord = +localStorage.getItem("kosmik-kema-rekord") || 0; } catch (e) { /* xotira yo'q */ }
  const yangi = h.ball > rekord;
  if (yangi) { rekord = h.ball; try { localStorage.setItem("kosmik-kema-rekord", rekord); } catch (e) { /* xotira yo'q */ } }
  $("yk-masofa").textContent = Math.floor(h.masofa) + " km";
  $("yk-ball").textContent = h.ball;
  $("yk-rekord").textContent = rekord + (yangi && h.ball > 0 ? " · yangi" : "");
  $("yk-togri").textContent = stat.togri + " / " + stat.savol;
  $("yk-toqnashuv").textContent = stat.toqnashuv;
  $("yk-bak").textContent = stat.bak;
  setTimeout(() => {
    document.body.classList.remove("parvozda");
    $("yakun-oyna").hidden = false;
    $("btn-qayta").focus();
  }, 1600);
}

function pauza() {
  if (holat === "parvoz") { holat = "pauza"; $("pauza").hidden = false; ovoz.dvigatel(false); }
  else if (holat === "pauza") { holat = "parvoz"; $("pauza").hidden = true; ovoz.dvigatel(true); }
}

// ---------- Kadr yangilanishi ----------
const v3 = new THREE.Vector3();
const kamPoz = new THREE.Vector3(5.5, 1.4, 6.5), kamNishon = new THREE.Vector3();
let kamMasofa = 8.5;
let kamBirinchi = true;

function yangila(dt, t) {
  const faol = holat === "parvoz";
  const oqim = faol ? 70 + h.masofa * 0.045 : holat === "kutish" ? 14 : holat === "tugadi" ? 6 : 0;
  const kema = kemaObj.kema;

  // chang
  const cp = chang.geometry.attributes.position.array;
  for (let i = 2; i < cp.length; i += 3) {
    cp[i] += oqim * dt;
    if (cp[i] > 20) cp[i] -= 380;
  }
  chang.geometry.attributes.position.needsUpdate = true;

  // manzara toshlari
  bezakToshlar.forEach((b) => {
    b.m.position.z += oqim * 0.35 * dt;
    b.m.rotation.x += b.vr.x * dt; b.m.rotation.y += b.vr.y * dt;
    if (b.m.position.z > 60) bezakToshJoyla(b.m, -650);
  });
  sayyora.userData.shar.rotation.y += dt * 0.004;
  sayyora.userData.atmos.material.uniforms.uSun.value.copy(QUYOSH).transformDirection(kamera.matrixWorldInverse);

  // portlashlar
  for (let k = portlashlar.length - 1; k >= 0; k--) {
    const p = portlashlar[k];
    p.t += dt;
    p.fl.scale.setScalar((p.toshmi ? 2 : 1.5) + p.t * 16);
    p.fl.material.opacity = Math.max(0, 1 - p.t * 3);
    const a = p.sp.geometry.attributes.position.array;
    for (let i = 0; i < p.v.length; i++) {
      a[i * 3] += p.v[i].x * dt; a[i * 3 + 1] += p.v[i].y * dt; a[i * 3 + 2] += (p.v[i].z + oqim * 0.7) * dt;
      p.v[i].multiplyScalar(1 - dt * 0.8);
    }
    p.sp.geometry.attributes.position.needsUpdate = true;
    p.sp.material.opacity = Math.max(0, 1 - p.t * 0.9);
    p.bolak.forEach((b) => {
      b.m.position.addScaledVector(b.v, dt);
      b.m.position.z += oqim * 0.7 * dt;
      b.m.rotation.x += b.vr.x * dt; b.m.rotation.y += b.vr.y * dt;
      b.m.scale.setScalar(b.s * Math.max(0, 1 - Math.max(0, p.t - 0.8) * 1.2));
    });
    if (p.t > 1.8) { portlashOchir(p); portlashlar.splice(k, 1); }
  }

  // kema dvigateli
  const kuch = holat === "tugadi" ? Math.max(0, 1 - kirishVaqt) : holat === "pauza" || holat === "savol" ? 0.35 : 1;
  if (holat === "tugadi") kirishVaqt += dt * 1.5;
  kemaObj.yangila(t, h.yoqilgi > 0 || holat !== "tugadi" ? kuch : 0);

  if (holat === "kutish") {
    kema.position.set(0, Math.sin(t * 0.9) * 0.12, 0);
    kemaObj.korpus.rotation.set(Math.sin(t * 0.6) * 0.03, 0, Math.sin(t * 0.5) * 0.08);
  }

  if (faol) {
    let dx = 0, dy = 0, sp = 1;
    if (tugmalar.chap) dx -= 1;
    if (tugmalar.ong) dx += 1;
    if (tugmalar.yuqori) dy += 1;
    if (tugmalar.past) dy -= 1;
    if (nishon) {
      const ex = nishon.x - kema.position.x, ey = nishon.y - kema.position.y, d = Math.hypot(ex, ey);
      if (d > 0.04) { dx = ex / d; dy = ey / d; sp = Math.min(1, d / 1.0); } else { dx = dy = 0; }
    } else if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
    const KT = 8.5;
    kema.position.x = THREE.MathUtils.clamp(kema.position.x + dx * KT * sp * dt, -chegara.x, chegara.x);
    kema.position.y = THREE.MathUtils.clamp(kema.position.y + dy * KT * sp * dt, -chegara.y, chegara.y);
    const k = Math.min(1, dt * 6);
    kemaObj.korpus.rotation.z += (-dx * sp * 0.6 - kemaObj.korpus.rotation.z) * k;
    kemaObj.korpus.rotation.x += (dy * sp * 0.22 - kemaObj.korpus.rotation.x) * k;
    kemaObj.korpus.rotation.y += (-dx * sp * 0.12 - kemaObj.korpus.rotation.y) * k;
    daxlsiz = Math.max(0, daxlsiz - dt);
    kema.visible = daxlsiz <= 0 || Math.floor(daxlsiz * 14) % 2 === 0;

    // 2-topshiriq: Masofa oshadi, Yoqilg'i kamayadi
    h = Mantiq.parvozQadami(h, dt);

    astTaymer -= dt;
    if (astTaymer <= 0) {
      astTaymer = Math.max(0.26, 0.9 - h.masofa / 2400) * (0.6 + Math.random() * 0.8);
      asteroidQosh();
    }
    bakTaymer -= dt;
    if (bakTaymer <= 0) { bakTaymer = 8; bakQosh(); }
  }

  // asteroidlar
  if (holat !== "savol" && holat !== "pauza") {
    for (let a = asteroidlar.length - 1; a >= 0; a--) {
      const as = asteroidlar[a], m = as.m;
      m.position.z += oqim * dt;
      m.position.x += as.vx * dt; m.position.y += as.vy * dt;
      m.rotation.x += as.vr.x * dt; m.rotation.y += as.vr.y * dt; m.rotation.z += as.vr.z * dt;
      // 3-topshiriq: to'qnashuv
      if (faol && daxlsiz <= 0 && m.position.distanceTo(kema.position) < as.r * 0.82 + 0.7) {
        portlash(m.position, "tosh");
        sahna.remove(m); asteroidlar.splice(a, 1);
        h = Mantiq.toqnashuv(h);
        stat.toqnashuv++;
        daxlsiz = 1.4; silkinish = 0.55;
        xabar("To'qnashuv · −5 ball", "xavf");
        tebrat([90, 40, 60]);
        ovoz.chal("urish");
        continue;
      }
      if (m.position.z > 16) { sahna.remove(m); asteroidlar.splice(a, 1); }
    }
    // 5-topshiriq: yoqilg'i baklari
    for (let b = baklar.length - 1; b >= 0; b--) {
      const bk = baklar[b].m, u = bk.userData;
      bk.position.z += oqim * dt;
      u.idish.rotation.y += dt * 1.3;
      u.mayoq.visible = (t * 2) % 1 < 0.5;
      u.nur.material.opacity = 0.55 + 0.45 * Math.sin(t * 12.5);
      if (faol && bk.position.distanceTo(kema.position) < 1.45) {
        portlash(bk.position, "bak");
        sahna.remove(bk); baklar.splice(b, 1);
        h = Mantiq.bakOlish(h);
        stat.bak++;
        xabar("Yoqilg'i baki olindi · +25", "yoqilgi");
        tebrat(25);
        ovoz.chal("bak");
        continue;
      }
      if (bk.position.z > 16) { sahna.remove(bk); baklar.splice(b, 1); }
    }
  }

  if (faol) {
    hudYangila();
    if (h.toxtadi) { hudYangila(); tugat(); return; }
    if (h.masofa >= keyingiSavol) { keyingiSavol += Mantiq.SAVOL_ORALIQ; savolBer(); }
  }
}

function kameraYangila(dt, t) {
  const kema = kemaObj.kema.position;
  if (holat === "kutish" || (holat === "tugadi" && $("yakun-oyna").hidden === false)) {
    // kinematik ko'rinish: kemani yon tomondan
    const a = t * 0.08, k = kamMasofa / 8.5;
    v3.set((Math.sin(a) * 1.2 + 4.6) * k, (1.3 + Math.sin(t * 0.3) * 0.2) * k, (5.6 + Math.cos(a) * 0.8) * k);
    kamNishon.set(-0.6, 0, -1.5);
  } else {
    v3.set(kema.x * 0.55, 1.5 + kema.y * 0.45, kamMasofa);
    kamNishon.set(kema.x * 0.3, kema.y * 0.3, -20);
  }
  if (kamBirinchi) { kamPoz.copy(v3); kamBirinchi = false; }
  kamPoz.lerp(v3, Math.min(1, dt * (holat === "parvoz" ? 3.5 : 1.2)));
  kamera.position.copy(kamPoz);
  if (silkinish > 0) {
    silkinish = Math.max(0, silkinish - dt);
    kamera.position.x += (Math.random() - 0.5) * silkinish * 0.6;
    kamera.position.y += (Math.random() - 0.5) * silkinish * 0.6;
  }
  kamera.lookAt(kamNishon);
}

const soat = new THREE.Clock();
function kadr() {
  const dt = Math.min(0.05, soat.getDelta()), t = soat.elapsedTime;
  yangila(dt, t);
  kameraYangila(dt, t);
  composer.render();
  requestAnimationFrame(kadr);
}

// ---------- O'lcham ----------
function olcham() {
  const w = window.innerWidth, hh = window.innerHeight;
  renderer.setSize(w, hh);
  composer.setSize(w, hh);
  kamera.aspect = w / hh;
  kamMasofa = kamera.aspect < 1 ? 8.5 + (1 - kamera.aspect) * 9 : 8.5;
  kamera.updateProjectionMatrix();
  const yarimH = Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2)) * kamMasofa;
  chegara.y = yarimH * 0.58;
  chegara.x = Math.max(1.2, yarimH * kamera.aspect * 0.78 - 0.9);
}
window.addEventListener("resize", olcham);

// ---------- Boshqaruv ----------
const KALIT = { ArrowLeft: "chap", KeyA: "chap", ArrowRight: "ong", KeyD: "ong", ArrowUp: "yuqori", KeyW: "yuqori", ArrowDown: "past", KeyS: "past" };
window.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") {
    if (e.key === "Enter") { e.preventDefault(); javobBer(); }
    return;
  }
  if (KALIT[e.code]) { tugmalar[KALIT[e.code]] = true; e.preventDefault(); }
  if (e.code === "Space" && e.target.tagName !== "BUTTON") {
    e.preventDefault();
    if ((holat === "kutish" || holat === "tugadi") && kemaObj) boshlash();
    else pauza();
  }
  if (e.code === "KeyP" || e.code === "Escape") pauza();
});
window.addEventListener("keyup", (e) => { if (KALIT[e.code]) tugmalar[KALIT[e.code]] = false; });
window.addEventListener("blur", () => { for (const k in tugmalar) tugmalar[k] = false; });

// Sichqoncha: kema kursorga uchadi. Barmoq: kema barmoq siljishi bo'yicha suriladi (barmoq kemani yopmaydi).
const cv = renderer.domElement;
let tegish = null;
function nishonOl(e) {
  const r = cv.getBoundingClientRect();
  if (tegish && !tegish.sichqon) {
    const sx = (chegara.x * 2 / r.width) * 1.8, sy = (chegara.y * 2 / r.height) * 2.4;
    nishon = {
      x: THREE.MathUtils.clamp(tegish.kx + (e.clientX - tegish.x) * sx, -chegara.x, chegara.x),
      y: THREE.MathUtils.clamp(tegish.ky - (e.clientY - tegish.y) * sy, -chegara.y, chegara.y)
    };
    return;
  }
  const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
  nishon = { x: nx * chegara.x * 1.3, y: ny * chegara.y * 1.5 + 0.4 };
}
cv.addEventListener("pointerdown", (e) => {
  if (holat !== "parvoz") return;
  cv.setPointerCapture(e.pointerId);
  const k = kemaObj.kema.position;
  tegish = { x: e.clientX, y: e.clientY, kx: k.x, ky: k.y, sichqon: e.pointerType === "mouse" };
  nishonOl(e);
});
cv.addEventListener("pointermove", (e) => { if (tegish) nishonOl(e); });
["pointerup", "pointercancel"].forEach((ev) => cv.addEventListener(ev, () => { tegish = null; nishon = null; }));
cv.addEventListener("contextmenu", (e) => e.preventDefault());

$("btn-boshlash").addEventListener("click", boshlash);
$("btn-qayta").addEventListener("click", boshlash);
$("btn-pauza").addEventListener("click", pauza);
$("btn-javob").addEventListener("click", javobBer);
$("btn-davom").addEventListener("click", davomEt);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && holat === "parvoz") pauza();
  if (!document.hidden && (holat === "parvoz" || holat === "pauza")) { ekranQulfi = null; ekranniYoqiqTut(true); }
});

// ---------- Ovoz ----------
const ovoz = (() => {
  let ac = null, yoqiq = true, dvGain = null;
  function tayyorla() {
    if (ac) return;
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    // dvigatel shovqini: jigarrang shovqin + past chastota filtri
    const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 220;
    dvGain = ac.createGain(); dvGain.gain.value = 0;
    src.connect(f).connect(dvGain).connect(ac.destination);
    src.start();
  }
  function dvigatel(on) {
    if (!ac || !dvGain) return;
    dvGain.gain.setTargetAtTime(on && yoqiq ? 0.22 : 0, ac.currentTime, 0.25);
  }
  function shovqinZarba(dur, chastota, kuch) {
    const n = ac.sampleRate * dur, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.5);
    const s = ac.createBufferSource(); s.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = chastota;
    const g = ac.createGain(); g.gain.value = kuch;
    s.connect(f).connect(g).connect(ac.destination); s.start();
  }
  function ton(f1, f2, tur, dur, kuch, kech = 0) {
    const o = ac.createOscillator(), g = ac.createGain(), n = ac.currentTime + kech;
    o.type = tur;
    o.frequency.setValueAtTime(f1, n); o.frequency.exponentialRampToValueAtTime(f2, n + dur);
    g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(kuch, n + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
    o.connect(g).connect(ac.destination); o.start(n); o.stop(n + dur + 0.05);
  }
  function chal(tur) {
    if (!ac || !yoqiq) return;
    if (tur === "urish") { shovqinZarba(0.9, 700, 0.9); ton(90, 35, "sine", 0.6, 0.5); }
    if (tur === "bak") { ton(520, 780, "sine", 0.18, 0.15); ton(780, 1170, "sine", 0.25, 0.12, 0.09); }
    if (tur === "aloqa") { ton(1400, 1400, "sine", 0.07, 0.08); ton(1400, 1400, "sine", 0.07, 0.08, 0.12); }
    if (tur === "togri") { ton(660, 660, "triangle", 0.14, 0.16); ton(990, 990, "triangle", 0.3, 0.14, 0.12); }
    if (tur === "notogri") { ton(240, 180, "square", 0.35, 0.08); }
    if (tur === "tugadi") { ton(180, 40, "sawtooth", 1.6, 0.12); shovqinZarba(1.5, 300, 0.25); }
  }
  return {
    tayyorla, dvigatel, chal,
    almashtir() { yoqiq = !yoqiq; if (!yoqiq) dvigatel(false); else if (holat === "parvoz") dvigatel(true); return yoqiq; }
  };
})();
$("btn-ovoz").addEventListener("click", function () {
  const y = ovoz.almashtir();
  this.textContent = y ? "Ovoz yoqiq" : "Ovoz o'chiq";
  this.setAttribute("aria-pressed", String(y));
});

tayyorla().catch((e) => {
  $("yuklanish").textContent = "Grafikani yaratishda xato: " + e.message;
  console.error(e);
});
