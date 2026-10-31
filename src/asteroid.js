// Asteroid sprayti: shovqin bilan shakllangan, kraterli, rang-barang tosh.
// Yoqilg'i baki sprayti (yangi funksiya) ham shu yerda.
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { fbm, noise3, rng, clamp } from "./shovqin.js";

export function asteroidGeometriyasi(seed, detail) {
  let geo = new THREE.IcosahedronGeometry(1, detail);
  geo.deleteAttribute("normal");
  geo.deleteAttribute("uv");
  geo = mergeVertices(geo);

  const R = rng(seed);
  const o1 = R() * 100, o2 = R() * 100, o3 = R() * 100;
  const kraterlar = [];
  const nk = 6 + Math.floor(R() * 10);
  for (let i = 0; i < nk; i++) {
    kraterlar.push({
      c: new THREE.Vector3(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1).normalize(),
      r: 0.1 + Math.pow(R(), 1.6) * 0.42,
      d: 0.03 + R() * 0.08
    });
  }
  const sy = 0.62 + R() * 0.3, sz = 0.72 + R() * 0.28;
  const asos = new THREE.Color().setHSL(0.06 + R() * 0.05, 0.08 + R() * 0.12, 0.2 + R() * 0.1);

  const pos = geo.attributes.position;
  const rang = new Float32Array(pos.count * 3);
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    n.fromBufferAttribute(pos, i).normalize();
    const h =
      fbm(n.x * 1.1 + o1, n.y * 1.1 + o2, n.z * 1.1 + o3, 4) * 0.42 +
      fbm(n.x * 3.4 + o2, n.y * 3.4 + o3, n.z * 3.4 + o1, 4) * 0.11 +
      noise3(n.x * 13 + o3, n.y * 13 + o1, n.z * 13 + o2) * 0.018 +
      noise3(n.x * 31, n.y * 31, n.z * 31) * 0.006;
    let kr = 0;
    for (const k of kraterlar) {
      const d = Math.acos(clamp(n.dot(k.c), -1, 1)) / k.r;
      if (d < 1.7) {
        if (d < 1) kr += (d * d - 1) * k.d;
        kr += k.d * 0.32 * Math.exp(-((d - 1) * (d - 1)) / 0.045);
      }
    }
    const r = 1 + h + kr;
    pos.setXYZ(i, n.x * r, n.y * r * sy, n.z * r * sz);
    const dog = fbm(n.x * 2.6 + 40, n.y * 2.6, n.z * 2.6, 3);
    const k = clamp((0.85 + dog * 0.9) * (1 + kr * 2.2) * (0.92 + h * 0.4), 0.35, 1.6);
    rang[i * 3] = asos.r * k;
    rang[i * 3 + 1] = asos.g * k;
    rang[i * 3 + 2] = asos.b * k * 0.97;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(rang, 3));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

export const toshMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true, roughness: 0.94, metalness: 0.0, envMapIntensity: 0.35
});

function bakTeksturasi() {
  const W = 1024, H = 512;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#cfd1cd"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#d4691f"; g.fillRect(0, H * 0.36, W, H * 0.28);
  // xavf chiziqlari
  g.save();
  g.beginPath(); g.rect(0, H * 0.08, W, H * 0.07); g.rect(0, H * 0.85, W, H * 0.07); g.clip();
  for (let x = -H; x < W + H; x += 40) {
    g.fillStyle = "#e8b625"; g.fillRect(x, 0, 20, H);
  }
  g.fillStyle = "rgba(20,20,20,0.9)";
  for (let x = -H; x < W + H; x += 40) {
    g.beginPath(); g.moveTo(x + 20, H * 0.08); g.lineTo(x + 40, H * 0.08); g.lineTo(x + 30, H * 0.15); g.lineTo(x + 10, H * 0.15); g.fill();
    g.beginPath(); g.moveTo(x + 20, H * 0.85); g.lineTo(x + 40, H * 0.85); g.lineTo(x + 30, H * 0.92); g.lineTo(x + 10, H * 0.92); g.fill();
  }
  g.restore();
  g.fillStyle = "#16171a";
  g.font = "bold 62px 'Barlow Condensed', 'Arial Narrow', sans-serif";
  g.fillText("YOQILG'I  H₂", 60, H * 0.56);
  g.fillText("YOQILG'I  H₂", 580, H * 0.56);
  g.font = "28px 'IBM Plex Mono', monospace";
  g.fillStyle = "rgba(20,20,22,0.8)";
  g.fillText("SIG'IM 25  ·  BOSIM 700 BAR", 60, H * 0.76);
  const R = rng(5);
  for (let i = 0; i < 400; i++) {
    const x = R() * W, y = R() * H, rr = 5 + R() * 40;
    const gr = g.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, `rgba(40,34,28,${0.06 + R() * 0.06})`);
    gr.addColorStop(1, "rgba(40,34,28,0)");
    g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

let bakTex = null;
export function bakYasash(nurTex) {
  if (!bakTex) bakTex = bakTeksturasi();
  const g = new THREE.Group();
  const idish = new THREE.Group();
  g.add(idish);
  const tana = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.36, 0.95, 12, 40),
    new THREE.MeshStandardMaterial({ map: bakTex, metalness: 0.35, roughness: 0.42, envMapIntensity: 1.1 })
  );
  idish.add(tana);
  const ramaMat = new THREE.MeshStandardMaterial({ color: 0x2b2e33, metalness: 0.9, roughness: 0.35 });
  [-0.32, 0.32].forEach((y) => {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.375, 0.04, 12, 48), ramaMat);
    h.rotation.x = Math.PI / 2;
    h.position.y = y;
    idish.add(h);
  });
  const klapan = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.16, 16), ramaMat);
  klapan.position.y = 0.88;
  idish.add(klapan);
  const mayoq = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 16, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.55, 0.1).multiplyScalar(12), toneMapped: false })
  );
  mayoq.position.y = 1.0;
  idish.add(mayoq);
  const nur = new THREE.Sprite(new THREE.SpriteMaterial({
    map: nurTex, color: new THREE.Color(1, 0.55, 0.15).multiplyScalar(1.6),
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false
  }));
  nur.scale.setScalar(2.4);
  nur.position.y = 1.0;
  idish.add(nur);
  idish.rotation.z = Math.PI / 2 - 0.3;
  g.userData = { idish, mayoq, nur };
  return g;
}
