// Osmon: yulduzlar va Somon yo'li (ekvirektangulyar tekstura), yorug'lik muhiti,
// Quyosh, halqali gaz giganti va kosmik chang.
import * as THREE from "three";
import { fbm, noise3, rng, smooth, clamp } from "./shovqin.js";

export const QUYOSH = new THREE.Vector3(-0.62, 0.38, -0.69).normalize();
export const SAYYORA_YON = new THREE.Vector3(0.56, -0.2, -0.8).normalize();

// Ekvirektangulyar piksel → yo'nalish (three.js bilan bir xil)
function yonalish(u, v, out) {
  const th = (u - 0.5) * Math.PI * 2, lat = (v - 0.5) * Math.PI;
  out[0] = Math.cos(th) * Math.cos(lat);
  out[1] = Math.sin(lat);
  out[2] = Math.sin(th) * Math.cos(lat);
  return out;
}

export function osmonTeksturasi(katta) {
  const W = katta ? 4096 : 2048, H = W / 2;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#010103";
  g.fillRect(0, 0, W, H);

  // Galaktika tasmasi va tumanliklar — past o'lchamda hisoblab, kattalashtiramiz
  const nw = katta ? 640 : 384, nh = nw / 2;
  const nc = document.createElement("canvas");
  nc.width = nw; nc.height = nh;
  const ng = nc.getContext("2d");
  const img = ng.createImageData(nw, nh);
  const bn = [0.28, 0.86, 0.42], d = [0, 0, 0];
  const bl = Math.hypot(...bn); bn[0] /= bl; bn[1] /= bl; bn[2] /= bl;
  const tasma = new Float32Array(nw * nh);
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      yonalish((x + 0.5) / nw, 1 - (y + 0.5) / nh, d);
      const b = d[0] * bn[0] + d[1] * bn[1] + d[2] * bn[2];
      const band = Math.exp(-(b * b) / 0.03);
      const n1 = fbm(d[0] * 2.4, d[1] * 2.4, d[2] * 2.4, 5) * 0.5 + 0.5;
      const lane = 1 - smooth(0.0, 0.11, Math.abs(fbm(d[0] * 4.2 + 9, d[1] * 4.2, d[2] * 4.2, 4)));
      let I = band * (0.25 + n1 * n1 * 1.1) * (1 - 0.75 * lane * band);
      const core = Math.exp(-(b * b) / 0.006) * Math.max(0, d[0] * 0.6 + 0.4);
      I += core * 0.5 * n1;
      const neb1 = Math.max(0, fbm(d[0] * 1.7 + 33, d[1] * 1.7, d[2] * 1.7, 5) + 0.05);
      const neb2 = Math.max(0, fbm(d[0] * 1.4 + 71, d[1] * 1.4, d[2] * 1.4, 5));
      tasma[y * nw + x] = band;
      let r = I * 0.2 + neb1 * neb1 * 0.22 + neb2 * neb2 * 0.05;
      let gg = I * 0.19 + neb1 * neb1 * 0.10 + neb2 * neb2 * 0.20;
      let bb = I * 0.21 + neb1 * neb1 * 0.16 + neb2 * neb2 * 0.38;
      const k = (i) => Math.round(255 * Math.pow(clamp(i, 0, 1), 1 / 1.6));
      const o = (y * nw + x) * 4;
      img.data[o] = k(r); img.data[o + 1] = k(gg); img.data[o + 2] = k(bb); img.data[o + 3] = 255;
    }
  }
  ng.putImageData(img, 0, 0);
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(nc, 0, 0, W, H);

  // Yulduzlar
  const R = rng(7);
  const N = katta ? 16000 : 9000;
  const sk = W / 4096;
  const ranglar = [[155, 176, 255], [202, 215, 255], [248, 247, 255], [255, 244, 234], [255, 210, 161], [255, 178, 120]];
  const vaznlar = [0.06, 0.18, 0.34, 0.24, 0.12, 0.06];
  for (let i = 0; i < N; i++) {
    const lat = Math.asin(2 * R() - 1), th = (R() * 2 - 1) * Math.PI;
    const u = th / (Math.PI * 2) + 0.5, v = lat / Math.PI + 0.5;
    const band = tasma[Math.min(nh - 1, Math.floor((1 - v) * nh)) * nw + Math.min(nw - 1, Math.floor(u * nw))];
    if (R() > 0.3 + 0.7 * band) continue;
    const x = u * W, y = (1 - v) * H;
    const m = Math.pow(R(), 8);
    let q = R(), ci = 0;
    while (ci < vaznlar.length - 1 && q > vaznlar[ci]) { q -= vaznlar[ci]; ci++; }
    const [cr, cg, cb] = ranglar[ci];
    const a = clamp(0.14 + m * 2.0 + R() * 0.22, 0, 1);
    const s = (0.6 + m * 1.5) * sk;
    if (m > 0.55) {
      const gr = g.createRadialGradient(x, y, 0, x, y, s * 3.5);
      gr.addColorStop(0, `rgba(${cr},${cg},${cb},${0.22 * a})`);
      gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      g.fillStyle = gr;
      g.fillRect(x - s * 3.5, y - s * 3.5, s * 7, s * 7);
    }
    g.fillStyle = `rgba(${cr},${cg},${cb},${a})`;
    if (s < 1.3) g.fillRect(x, y, Math.max(1, s), Math.max(1, s));
    else { g.beginPath(); g.arc(x, y, s / 2, 0, Math.PI * 2); g.fill(); }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// HDR yorug'lik muhiti: qorong'i fazo, yorqin Quyosh, sayyoradan qaytgan iliq nur
export function muhitTeksturasi(renderer) {
  const W = 256, H = 128;
  const data = new Uint16Array(W * H * 4), d = [0, 0, 0];
  const h = THREE.DataUtils.toHalfFloat;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      yonalish((x + 0.5) / W, (y + 0.5) / H, d);
      const s = Math.max(0, d[0] * QUYOSH.x + d[1] * QUYOSH.y + d[2] * QUYOSH.z);
      const pl = Math.max(0, d[0] * SAYYORA_YON.x + d[1] * SAYYORA_YON.y + d[2] * SAYYORA_YON.z);
      const sun = Math.pow(s, 600) * 22 + Math.pow(s, 24) * 0.6 + Math.pow(s, 3) * 0.06;
      const up = d[1] * 0.5 + 0.5;
      const r = 0.006 + sun * 1.0 + Math.pow(pl, 4) * 0.22 + up * 0.012;
      const gg = 0.007 + sun * 0.95 + Math.pow(pl, 4) * 0.14 + up * 0.016;
      const b = 0.012 + sun * 0.88 + Math.pow(pl, 4) * 0.08 + up * 0.03;
      const o = (y * W + x) * 4;
      data[o] = h(r); data[o + 1] = h(gg); data[o + 2] = h(b); data[o + 3] = h(1);
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromEquirectangular(tex).texture;
  pm.dispose();
  tex.dispose();
  return env;
}

export function nurTeksturasi() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.08, "rgba(255,255,255,0.85)");
  gr.addColorStop(0.25, "rgba(255,255,255,0.22)");
  gr.addColorStop(0.6, "rgba(255,255,255,0.04)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function quyoshYasash(nurTex) {
  const g = new THREE.Group();
  const yadro = new THREE.Sprite(new THREE.SpriteMaterial({
    map: nurTex, color: new THREE.Color(1, 0.93, 0.82).multiplyScalar(14),
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false
  }));
  yadro.scale.setScalar(150);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: nurTex, color: new THREE.Color(1, 0.8, 0.6).multiplyScalar(0.55),
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false
  }));
  halo.scale.setScalar(1100);
  g.add(halo, yadro);
  g.position.copy(QUYOSH).multiplyScalar(2600);
  return g;
}

// Gaz giganti teksturasi: kenglik bo'ylab turbulent tasmalar va bo'ron
function sayyoraTeksturasi(katta) {
  const W = katta ? 1024 : 640, H = W / 2;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  const img = g.createImageData(W, H);
  const d = [0, 0, 0];
  const st = [[0.20, 0.12, 0.08], [0.47, 0.30, 0.18], [0.74, 0.58, 0.40], [0.90, 0.82, 0.66], [0.62, 0.40, 0.24], [0.83, 0.70, 0.52]];
  const pal = (t) => {
    t = clamp(t, 0, 0.9999) * (st.length - 1);
    const i = Math.floor(t), f = t - i, a = st[i], b = st[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      yonalish((x + 0.5) / W, 1 - (y + 0.5) / H, d);
      const tb = fbm(d[0] * 3, d[1] * 3, d[2] * 3, 4) * 0.10 + fbm(d[0] * 11, d[1] * 11, d[2] * 11, 3) * 0.025;
      const yy = d[1] + tb;
      const b1 = 0.5 + 0.5 * Math.sin(yy * 23 + Math.sin(yy * 6) * 2.0);
      const b2 = 0.5 + 0.5 * Math.sin(yy * 61 + 2.3);
      let t = b1 * 0.72 + b2 * 0.18 + noise3(d[0] * 30, d[1] * 80, d[2] * 30) * 0.08;
      // Katta bo'ron (oval)
      const sx = (x / W - 0.3) * 6, sy = ((y / H) - 0.62) * 14;
      const so = Math.exp(-(sx * sx + sy * sy) * 1.2);
      let [r, gg, bb] = pal(t);
      r = r * (1 - so) + 0.62 * so; gg = gg * (1 - so) + 0.30 * so; bb = bb * (1 - so) + 0.18 * so;
      const o = (y * W + x) * 4;
      img.data[o] = Math.round(255 * Math.pow(clamp(r, 0, 1), 1 / 2.2));
      img.data[o + 1] = Math.round(255 * Math.pow(clamp(gg, 0, 1), 1 / 2.2));
      img.data[o + 2] = Math.round(255 * Math.pow(clamp(bb, 0, 1), 1 / 2.2));
      img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function halqaTeksturasi() {
  const W = 1024;
  const c = document.createElement("canvas");
  c.width = W; c.height = 4;
  const g = c.getContext("2d");
  const R = rng(21);
  for (let x = 0; x < W; x++) {
    const t = x / W;
    let a = 0.25 + 0.6 * (0.5 + 0.5 * noise3(t * 40, 0.5, 0.5)) * (0.6 + 0.4 * noise3(t * 160, 1.5, 0.5));
    if (t > 0.55 && t < 0.6) a *= 0.08; // Kassini bo'shlig'i
    if (t < 0.04 || t > 0.97) a *= 0.3;
    a *= 0.85 + R() * 0.15;
    const l = 175 + 50 * noise3(t * 25, 3.3, 1);
    g.fillStyle = `rgba(${l | 0},${(l * 0.9) | 0},${(l * 0.78) | 0},${clamp(a, 0, 1)})`;
    g.fillRect(x, 0, 1, 4);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function sayyoraYasash(katta) {
  const R = 430;
  const g = new THREE.Group();
  const shar = new THREE.Mesh(
    new THREE.SphereGeometry(R, 128, 96),
    new THREE.MeshStandardMaterial({ map: sayyoraTeksturasi(katta), roughness: 1, metalness: 0, envMapIntensity: 0 })
  );
  shar.rotation.z = 0.25;
  g.add(shar);

  const atmos = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.035, 96, 64),
    new THREE.ShaderMaterial({
      uniforms: { uSun: { value: new THREE.Vector3() }, uColor: { value: new THREE.Color(1.0, 0.72, 0.45) } },
      vertexShader: `varying vec3 vN; varying vec3 vV;
        void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 uSun; uniform vec3 uColor; varying vec3 vN; varying vec3 vV;
        void main(){ float rim = 1.0 - max(dot(vN, vV), 0.0); float a = pow(rim, 4.0);
          float l = clamp(dot(vN, uSun) * 0.9 + 0.25, 0.0, 1.0);
          gl_FragColor = vec4(uColor * a * l * 1.4, 1.0); }`,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
    })
  );
  g.add(atmos);

  const ichki = R * 1.3, tashqi = R * 2.25;
  const hg = new THREE.RingGeometry(ichki, tashqi, 256, 1);
  const pos = hg.attributes.position, uv = hg.attributes.uv, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    uv.setXY(i, (v.length() - ichki) / (tashqi - ichki), 0.5);
  }
  const halqa = new THREE.Mesh(hg, new THREE.MeshBasicMaterial({
    map: halqaTeksturasi(), color: new THREE.Color(0.55, 0.5, 0.45), side: THREE.DoubleSide, transparent: true, depthWrite: false
  }));
  halqa.rotation.x = Math.PI / 2 - 0.32;
  halqa.rotation.y = 0.22;
  g.add(halqa);

  g.position.copy(SAYYORA_YON).multiplyScalar(3000);
  g.userData = { shar, atmos };
  return g;
}

// Tezlik hissini beruvchi mayda kosmik chang
export function changYasash(N) {
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 90;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 56;
    pos[i * 3 + 2] = -360 + Math.random() * 380;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xb7c2d6, size: 0.05, sizeAttenuation: true, transparent: true, opacity: 0.4, depthWrite: false
  }));
  pts.frustumCulled = false;
  return pts;
}
