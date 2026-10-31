// Kema sprayti: metall panelli korpus, oltin rangli kabina oynasi, uchta dvigatel,
// ion oqimi (sheyder), navigatsiya chiroqlari.
import * as THREE from "three";
import { rng } from "./shovqin.js";

function panelTeksturalari() {
  const S = 1024;
  const mk = () => { const c = document.createElement("canvas"); c.width = c.height = S; return c; };
  const rang = mk(), gadir = mk();
  const g = rang.getContext("2d"), r = gadir.getContext("2d");
  const R = rng(91);
  g.fillStyle = "#73787f"; g.fillRect(0, 0, S, S);
  r.fillStyle = "rgb(120,120,120)"; r.fillRect(0, 0, S, S);

  const qatorlar = 8, qh = S / qatorlar;
  for (let q = 0; q < qatorlar; q++) {
    let x = -R() * 60;
    while (x < S) {
      const w = (S / 14) * (1 + Math.floor(R() * 3));
      const v = (R() - 0.5) * 22;
      g.fillStyle = `rgb(${116 + v},${121 + v},${128 + v})`;
      g.fillRect(x, q * qh, w, qh);
      const rv = 95 + R() * 70;
      r.fillStyle = `rgb(${rv},${rv},${rv})`;
      r.fillRect(x, q * qh, w, qh);
      // choklar
      g.strokeStyle = "rgba(28,30,34,0.9)"; g.lineWidth = 2;
      g.strokeRect(x + 1, q * qh + 1, w - 2, qh - 2);
      g.strokeStyle = "rgba(255,255,255,0.10)"; g.lineWidth = 1;
      g.beginPath(); g.moveTo(x + 3, q * qh + 3); g.lineTo(x + w - 3, q * qh + 3); g.stroke();
      r.strokeStyle = "rgb(220,220,220)"; r.lineWidth = 3;
      r.strokeRect(x + 1, q * qh + 1, w - 2, qh - 2);
      // parchinlar
      g.fillStyle = "rgba(50,52,56,0.7)";
      for (let k = x + 8; k < x + w - 4; k += 14) {
        g.fillRect(k, q * qh + 6, 2, 2);
        g.fillRect(k, q * qh + qh - 8, 2, 2);
      }
      // texnik lyuk
      if (R() < 0.18) {
        const lx = x + 12 + R() * (w - 50), ly = q * qh + 16 + R() * (qh - 50);
        g.strokeStyle = "rgba(25,27,30,0.85)"; g.lineWidth = 1.5;
        g.strokeRect(lx, ly, 28, 22);
        g.fillStyle = "rgba(40,42,46,0.6)"; g.fillRect(lx + 3, ly + 3, 4, 4);
      }
      x += w;
    }
  }
  // ogohlantiruvchi chiziq va belgi
  g.fillStyle = "#c9681c"; g.fillRect(0, qh * 3 + 18, S, 22);
  g.fillStyle = "rgba(20,20,20,0.85)"; g.fillRect(0, qh * 3 + 14, S, 3); g.fillRect(0, qh * 3 + 41, S, 3);
  g.font = "bold 46px 'Barlow Condensed', 'Arial Narrow', sans-serif";
  g.fillStyle = "rgba(24,26,30,0.85)";
  g.fillText("KK-01", S * 0.18, qh * 5 + 70);
  g.fillText("KK-01", S * 0.68, qh * 5 + 70);
  // kir va kuyik izlari
  for (let i = 0; i < 700; i++) {
    const x = R() * S, y = R() * S, rr = 6 + R() * 50;
    const gr = g.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, `rgba(35,30,26,${0.05 + R() * 0.05})`);
    gr.addColorStop(1, "rgba(35,30,26,0)");
    g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  for (let i = 0; i < 140; i++) {
    const x = R() * S, y = R() * S;
    g.strokeStyle = `rgba(30,28,26,${0.03 + R() * 0.05})`;
    g.lineWidth = 1 + R() * 3;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 6, y + 30 + R() * 120); g.stroke();
  }
  const t1 = new THREE.CanvasTexture(rang); t1.colorSpace = THREE.SRGBColorSpace;
  const t2 = new THREE.CanvasTexture(gadir);
  [t1, t2].forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; });
  return { rang: t1, gadir: t2 };
}

function takrorla(tex, x, y) {
  const t = tex.clone();
  t.repeat.set(x, y);
  t.needsUpdate = true;
  return t;
}

const OQIM_VERTEX = `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){ vUv = uv; vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`;
const OQIM_FRAGMENT = `uniform float uTime; uniform float uKuch; uniform vec3 uYadro; uniform vec3 uChet;
varying vec2 vUv; varying vec3 vN; varying vec3 vV;
void main(){
  float t = vUv.y;
  float yuz = abs(dot(normalize(vN), normalize(vV)));
  float yadro = pow(yuz, 2.5);
  float sonish = pow(1.0 - t, 1.8);
  float titrash = 0.88 + 0.12 * sin(uTime * 71.0 + t * 23.0) * sin(uTime * 37.0);
  float olmos = 0.8 + 0.2 * sin(t * 46.0 - uTime * 34.0);
  vec3 c = mix(uChet, uYadro, yadro * (1.0 - t * 0.7));
  float a = sonish * (0.15 + 0.85 * yadro) * titrash * olmos * uKuch;
  gl_FragColor = vec4(c * a * 1.15, a);
}`;

export function kemaYasash() {
  const kema = new THREE.Group();
  const korpus = new THREE.Group(); // egilish shu guruhga beriladi
  kema.add(korpus);

  const { rang, gadir } = panelTeksturalari();
  const korpusMat = new THREE.MeshStandardMaterial({
    map: takrorla(rang, 3, 3), roughnessMap: takrorla(gadir, 3, 3),
    metalness: 0.72, roughness: 0.85, envMapIntensity: 0.8
  });
  const qanotMat = new THREE.MeshStandardMaterial({
    map: takrorla(rang, 0.75, 0.75), roughnessMap: takrorla(gadir, 0.75, 0.75),
    metalness: 0.72, roughness: 0.85, envMapIntensity: 0.8
  });
  const qoraMat = new THREE.MeshStandardMaterial({ color: 0x24272c, metalness: 0.9, roughness: 0.62, envMapIntensity: 1.0 });
  const issiqMat = new THREE.MeshStandardMaterial({ color: 0x3a2f28, metalness: 0.95, roughness: 0.3, envMapIntensity: 1.0 });

  // Fyuzelyaj — aylanish jismi, yassilangan
  const profil = [
    [0.0, -1.78], [0.5, -1.78], [0.6, -1.6], [0.67, -1.15], [0.7, -0.4], [0.66, 0.4],
    [0.57, 1.1], [0.43, 1.7], [0.27, 2.15], [0.12, 2.48], [0.0, 2.62]
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const fg = new THREE.LatheGeometry(profil, 72);
  fg.scale(1.2, 1, 0.74);
  fg.rotateX(-Math.PI / 2);
  korpus.add(new THREE.Mesh(fg, korpusMat));

  // Kabina oynasi — oltin qatlamli shisha
  const ko = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhysicalMaterial({
      color: 0x2b2110, metalness: 1.0, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2
    })
  );
  ko.scale.set(0.62, 0.52, 1.55);
  ko.position.set(0, 0.26, -0.95);
  korpus.add(ko);
  const romka = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 8, 64), qoraMat);
  romka.scale.set(0.62, 1.55, 1);
  romka.rotation.x = Math.PI / 2;
  romka.position.set(0, 0.27, -0.95);
  korpus.add(romka);

  // Qanotlar — orqaga qayrilgan, qalinlikda fask bilan
  function qanot(ishora) {
    const sh = new THREE.Shape();
    const nuqta = [[0.42, -0.55], [2.72, 0.85], [2.8, 1.02], [2.78, 1.38], [0.42, 1.62]];
    sh.moveTo(nuqta[0][0] * ishora, nuqta[0][1]);
    for (let i = 1; i < nuqta.length; i++) sh.lineTo(nuqta[i][0] * ishora, nuqta[i][1]);
    sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.035, bevelSegments: 3, curveSegments: 2 });
    geo.rotateX(Math.PI / 2);
    geo.translate(0, -0.06, 0);
    const m = new THREE.Mesh(geo, qanotMat);
    m.rotation.z = ishora * -0.06; // biroz pastga (anhedral)
    return m;
  }
  korpus.add(qanot(1), qanot(-1));

  // Qanot uchidagi podlar
  const podGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.95, 16);
  podGeo.rotateX(Math.PI / 2);
  [1, -1].forEach((s) => {
    const pod = new THREE.Mesh(podGeo, qoraMat);
    pod.position.set(2.82 * s, -0.22, 1.18);
    korpus.add(pod);
  });

  // Vertikal stabilizatorlar
  function fin(ishora) {
    const sh = new THREE.Shape();
    sh.moveTo(0.55, 0); sh.lineTo(1.65, 0); sh.lineTo(1.72, 0.82); sh.lineTo(1.38, 0.86); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.045, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.02, bevelSegments: 2 });
    geo.rotateY(-Math.PI / 2);
    const m = new THREE.Mesh(geo, qanotMat);
    m.position.set(0.32 * ishora, 0.3, 0);
    m.rotation.z = -0.38 * ishora;
    return m;
  }
  korpus.add(fin(1), fin(-1));

  // Dvigatellar: ikkita gondola + markaziy dvigatel
  const dvigatellar = [];
  function dvigatel(x, y, z, r, uzunlik) {
    if (uzunlik > 0) {
      const g = new THREE.CylinderGeometry(r, r * 1.12, uzunlik, 40);
      g.rotateX(Math.PI / 2);
      const m = new THREE.Mesh(g, korpusMat);
      m.position.set(x, y, z - uzunlik / 2);
      korpus.add(m);
      const kirish = new THREE.Mesh(new THREE.TorusGeometry(r * 0.98, r * 0.16, 12, 40), qoraMat);
      kirish.position.set(x, y, z - uzunlik);
      korpus.add(kirish);
      const qopqoq = new THREE.Mesh(new THREE.CircleGeometry(r * 0.9, 32), new THREE.MeshStandardMaterial({ color: 0x0b0c0e, metalness: 0.6, roughness: 0.6 }));
      qopqoq.rotation.y = Math.PI;
      qopqoq.position.set(x, y, z - uzunlik + 0.02);
      korpus.add(qopqoq);
    }
    const sopla = new THREE.CylinderGeometry(r * 1.0, r * 1.28, 0.38, 40, 1, true);
    sopla.rotateX(Math.PI / 2);
    const s = new THREE.Mesh(sopla, new THREE.MeshStandardMaterial({ color: 0x3a2f28, metalness: 0.95, roughness: 0.3, side: THREE.DoubleSide }));
    s.position.set(x, y, z + 0.19);
    korpus.add(s);
    const ichki = new THREE.Mesh(
      new THREE.CircleGeometry(r * 1.0, 32),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.8, 1.0).multiplyScalar(1.5), toneMapped: false })
    );
    ichki.position.set(x, y, z + 0.06);
    korpus.add(ichki);
    const uz = 2.1 * (r / 0.22);
    const og = new THREE.ConeGeometry(r * 1.05, uz, 40, 1, true);
    og.translate(0, uz / 2, 0);
    og.rotateX(Math.PI / 2);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uKuch: { value: 1 },
        uYadro: { value: new THREE.Color(0.85, 0.95, 1.0) }, uChet: { value: new THREE.Color(0.25, 0.5, 1.0) }
      },
      vertexShader: OQIM_VERTEX, fragmentShader: OQIM_FRAGMENT,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false
    });
    const oqim = new THREE.Mesh(og, mat);
    oqim.position.set(x, y, z + 0.3);
    korpus.add(oqim);
    dvigatellar.push({ oqim, mat, ichki });
  }
  dvigatel(0.98, -0.2, 1.75, 0.22, 1.7);
  dvigatel(-0.98, -0.2, 1.75, 0.22, 1.7);
  dvigatel(0, 0, 1.78, 0.34, 0);

  // Mayda detallar
  const sensor = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.6), qoraMat);
  sensor.position.set(0, 0.5, 0.35);
  korpus.add(sensor);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.6, 6), qoraMat);
  antenna.position.set(0.16, 0.7, 0.8);
  antenna.rotation.x = 0.5;
  korpus.add(antenna);
  const qorin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 1.2), issiqMat);
  qorin.position.set(0, -0.48, 0.2);
  korpus.add(qorin);
  [-1, 1].forEach((s) => {
    const rcs = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.16), qoraMat);
    rcs.position.set(0.36 * s, 0.05, -1.75);
    korpus.add(rcs);
  });

  // Navigatsiya chiroqlari: chap — qizil, o'ng — yashil, dumda oq strob
  const chiroq = (rang, x, y, z) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), new THREE.MeshBasicMaterial({ color: rang, toneMapped: false }));
    m.position.set(x, y, z);
    korpus.add(m);
    return m;
  };
  const qizil = chiroq(new THREE.Color(1, 0.08, 0.05).multiplyScalar(5), -2.82, -0.22, 0.68);
  const yashil = chiroq(new THREE.Color(0.05, 1, 0.2).multiplyScalar(5), 2.82, -0.22, 0.68);
  const strob = chiroq(new THREE.Color(1, 1, 1).multiplyScalar(8), 0, 0.12, 1.5);
  strob.position.set(0, 0.62, 1.55);

  const dvChiroq = new THREE.PointLight(0x8fc4ff, 6, 7, 2);
  dvChiroq.position.set(0, 0, 2.7);
  kema.add(dvChiroq);

  kema.scale.setScalar(0.62);

  function yangila(t, kuch) {
    dvigatellar.forEach((d, i) => {
      d.mat.uniforms.uTime.value = t + i * 1.7;
      d.mat.uniforms.uKuch.value = kuch;
      d.oqim.scale.z = 0.75 + kuch * (0.35 + Math.random() * 0.12);
      d.ichki.visible = kuch > 0.05;
    });
    dvChiroq.intensity = kuch * (2.2 + Math.random() * 0.6);
    const bl = (t * 1.1) % 1;
    qizil.visible = yashil.visible = bl < 0.85;
    strob.visible = ((t * 1.1 + 0.4) % 1) < 0.06;
  }

  return { kema, korpus, yangila };
}
