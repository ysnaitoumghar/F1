/* PIT WALL — scène 3D (Three.js) : voiture sur sol réfléchissant, studio, caméra liée au scroll.
   Charge /assets/models/f1car.glb si présent ; sinon voiture stylisée construite en formes Three.js. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function createCarScene(canvas, { color = '#FF8000', accent = '#0b0b0b' } = {}) {
  const P = window.PITWALL;
  const mobile = innerWidth < 760;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
  // rendu logiciel (SwiftShader / llvmpipe) : mode basse qualité pour garder la page fluide
  let soft = false;
  try {
    const gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    soft = !!ext && /swiftshader|llvmpipe|software/i.test(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
  } catch (e) { /* ignore */ }
  renderer.setPixelRatio(soft ? 0.5 : Math.min(devicePixelRatio, mobile ? 1.4 : 1.8));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x07080a, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x07080a, 12, 34);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);

  /* ── Éclairage studio ── */
  const key = new THREE.SpotLight(0xffffff, 190, 30, 0.5, 0.7, 1.6);
  key.position.set(-4, 8, 5); key.target.position.set(0, 0.4, 0);
  scene.add(key, key.target);
  const rimL = new THREE.PointLight(new THREE.Color(color), 28, 14, 1.6); rimL.position.set(-4.5, 1.6, -4);
  const rimR = new THREE.PointLight(new THREE.Color(color), 28, 14, 1.6); rimR.position.set(4.5, 1.6, -3);
  const top = new THREE.SpotLight(0xdfe8ff, 80, 24, 0.7, 0.9, 1.4); top.position.set(0, 9, 0); top.target.position.set(0, 0, 0);
  scene.add(rimL, rimR, top, top.target);

  /* ── Sol sombre réfléchissant ── */
  const mirror = new Reflector(new THREE.PlaneGeometry(60, 60), {
    textureWidth: Math.floor(innerWidth * (soft ? 0.12 : mobile ? 0.35 : 0.6)), textureHeight: Math.floor(innerHeight * (soft ? 0.12 : mobile ? 0.35 : 0.6)),
    color: 0x6a6e76, clipBias: 0.003
  });
  mirror.rotation.x = -Math.PI / 2;
  scene.add(mirror);
  const fadeC = document.createElement('canvas'); fadeC.width = fadeC.height = 512;
  const g = fadeC.getContext('2d'), gr = g.createRadialGradient(256, 256, 20, 256, 256, 256);
  gr.addColorStop(0, 'rgba(7,8,10,.52)'); gr.addColorStop(0.45, 'rgba(7,8,10,.82)'); gr.addColorStop(0.78, 'rgba(7,8,10,1)'); gr.addColorStop(1, 'rgba(7,8,10,1)');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  const fade = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(fadeC), transparent: true, depthWrite: false }));
  fade.rotation.x = -Math.PI / 2; fade.position.y = 0.004;
  scene.add(fade);

  // anneaux lumineux au sol (ambiance « piste »)
  const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0.55, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.55, 3.585, 128), ringMat);
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.008; scene.add(ring);

  /* ── Voiture ── */
  const car = new THREE.Group();
  const yawGroup = new THREE.Group(); yawGroup.add(car); scene.add(yawGroup);

  const livery = []; // matériaux colorés selon l'équipe
  const accentMats = [];
  const paint = (c) => { const m = new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.35, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 }); livery.push(m); return m; };
  const accentM = (c) => { const m = new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.3, roughness: 0.35, clearcoat: 0.6 }); accentMats.push(m); return m; };
  const carbon = new THREE.MeshStandardMaterial({ color: 0x0d0e10, metalness: 0.7, roughness: 0.42 });
  const tyre = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0, roughness: 0.85 });
  const rim = new THREE.MeshStandardMaterial({ color: 0xb9bcc2, metalness: 1, roughness: 0.25 });
  const red = new THREE.MeshBasicMaterial({ color: 0xe10600 });

  function buildFallback() {
    const grp = new THREE.Group();
    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, s) => {
      const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
      if (s) m.scale.set(...s); grp.add(m); return m;
    };
    const PI2 = Math.PI / 2;
    // carrosserie : plan de forme extrudé et biseauté (nez fin, pontons larges, taille « bouteille de Coca »)
    const body = (pts, depth, y, bevel = 0.05) => {
      const R = pts.map(([z, w]) => new THREE.Vector2(w, -z)), L = pts.slice().reverse().map(([z, w]) => new THREE.Vector2(-w, -z));
      const sp = new THREE.SplineCurve(R.concat(L)).getPoints(120);
      const sh = new THREE.Shape(sp);
      const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 40 });
      g.rotateX(-PI2);
      const m = new THREE.Mesh(g, paint(color)); m.position.y = y; grp.add(m); return m;
    };
    body([[2.95, 0.035], [2.5, 0.09], [1.9, 0.15], [1.3, 0.2], [0.9, 0.3], [0.45, 0.62], [-0.2, 0.72], [-0.8, 0.62], [-1.4, 0.34], [-2.0, 0.17], [-2.45, 0.1]], 0.16, 0.22, 0.05);
    body([[2.2, 0.05], [1.6, 0.1], [1.05, 0.15], [0.9, 0.16]], 0.06, 0.4, 0.03);                      // dessus du nez
    body([[-0.1, 0.19], [-0.5, 0.25], [-1.2, 0.2], [-2.1, 0.09], [-2.35, 0.05]], 0.34, 0.4, 0.05);    // capot moteur
    // entrées d'air des pontons
    [-1, 1].forEach((s) => add(new THREE.BoxGeometry(0.2, 0.15, 0.06), carbon, s * 0.43, 0.38, 0.5));
    // prise d'air + cockpit
    add(new THREE.BoxGeometry(0.2, 0.22, 0.24), carbon, 0, 0.92, -0.25);
    add(new THREE.SphereGeometry(0.12, 20, 16), accentM(accent), 0, 0.62, 0.5);
    // halo
    add(new THREE.TorusGeometry(0.27, 0.022, 10, 28, Math.PI), carbon, 0, 0.62, 0.8);
    add(new THREE.CylinderGeometry(0.018, 0.018, 0.5, 8), carbon, 0, 0.8, 1.05, 1.25, 0, 0);
    // fond plat + diffuseur
    add(new THREE.BoxGeometry(1.7, 0.05, 4.2), carbon, 0, 0.12, 0.1);
    add(new THREE.BoxGeometry(1.2, 0.05, 0.7), carbon, 0, 0.2, -2.3, -0.28, 0, 0);
    // aileron avant (plan principal, volets, bords de fuite)
    add(new THREE.BoxGeometry(2.05, 0.035, 0.5), carbon, 0, 0.13, 2.7);
    add(new THREE.BoxGeometry(2.0, 0.03, 0.32), paint(color), 0, 0.2, 2.62, -0.12);
    add(new THREE.BoxGeometry(1.9, 0.03, 0.24), carbon, 0, 0.27, 2.55, -0.22);
    [-1, 1].forEach((s) => add(new THREE.BoxGeometry(0.035, 0.26, 0.7), accentM(accent), s * 1.02, 0.2, 2.65));
    // aileron arrière
    add(new THREE.BoxGeometry(1.55, 0.04, 0.45), paint(color), 0, 1.06, -2.42, 0.06);
    add(new THREE.BoxGeometry(1.55, 0.035, 0.34), carbon, 0, 1.22, -2.5, 0.2);
    [-1, 1].forEach((s) => add(new THREE.BoxGeometry(0.035, 0.62, 0.62), accentM(accent), s * 0.78, 1.0, -2.45));
    add(new THREE.BoxGeometry(0.06, 0.62, 0.32), carbon, 0, 0.78, -2.28);
    // roues + suspensions
    const wheel = (x, z, r, w) => {
      const wg = new THREE.Group();
      const t = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 36), tyre); t.rotation.z = PI2; wg.add(t);
      const rm = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, w + 0.01, 28), rim); rm.rotation.z = PI2; wg.add(rm);
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(r * 0.8, 0.012, 6, 48), red); stripe.rotation.y = PI2; stripe.position.x = Math.sign(x) * (w / 2 + 0.002); wg.add(stripe);
      wg.position.set(x, r, z); grp.add(wg);
      const arm = (y0) => {
        const from = new THREE.Vector3(x * 0.55, y0, z), to = new THREE.Vector3(x, r + (y0 - 0.35) * 0.4, z);
        const len = from.distanceTo(to), m = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, len, 6), carbon);
        m.position.copy(from).lerp(to, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize()); grp.add(m);
      };
      arm(0.25); arm(0.42);
    };
    wheel(-0.97, 1.65, 0.34, 0.3); wheel(0.97, 1.65, 0.34, 0.3);
    wheel(-0.99, -1.55, 0.37, 0.42); wheel(0.99, -1.55, 0.37, 0.42);
    return grp;
  }

  let model = buildFallback(); car.add(model);
  car.position.y = 0.02;

  // GLB utilisateur (optionnel)
  const loader = new GLTFLoader();
  if (P.hasModel) loader.load('assets/models/f1car.glb', (gltf) => {
    car.remove(model);
    const obj = gltf.scene;
    const box = new THREE.Box3().setFromObject(obj), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
    const s = 5.4 / Math.max(size.x, size.z); obj.scale.setScalar(s);
    obj.position.set(-ctr.x * s, -box.min.y * s, -ctr.z * s);
    livery.length = 0;
    obj.traverse((o) => {
      if (!o.isMesh) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => { if (/body|paint|livery|carpaint|color|main/i.test(m.name || '')) { m.color.set(color); livery.push(m); } });
      o.castShadow = false;
    });
    car.add(obj); model = obj; api.glb = true;
  }, undefined, () => { /* pas de GLB : on garde la voiture stylisée */ });

  /* ── Couleur d'équipe ── */
  const cur = new THREE.Color(color);
  function setTeam(c, c2, dur = 0.9) {
    const from = cur.clone(), to = new THREE.Color(c), p = { t: 0 };
    gsap.to(p, {
      t: 1, duration: dur, ease: 'power3.inOut', onUpdate() {
        cur.copy(from).lerp(to, p.t);
        livery.forEach((m) => m.color.copy(cur));
        rimL.color.copy(cur); rimR.color.copy(cur); ringMat.color.copy(cur);
      }
    });
    if (c2) accentMats.forEach((m) => m.color.set(c2));
  }

  /* ── Caméra : paramètres pilotés par le scroll ── */
  const view = { az: 0.55, el: 0.14, dist: 9.6, shift: 0.22, ty: 0.5 };
  const user = { yaw: 0, vel: 0, zoom: 1, drag: false };
  const stateScroll = { p: 0 };
  function applyCam() {
    const d = view.dist * user.zoom;
    camera.position.set(Math.sin(view.az) * Math.cos(view.el) * d, view.ty + Math.sin(view.el) * d, Math.cos(view.az) * Math.cos(view.el) * d);
    camera.lookAt(0, view.ty, 0);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    camera.setViewOffset(w, h, -view.shift * w, 0, w, h);
  }

  /** Définit les images-clés de caméra (appelé par home.js avec ScrollTrigger). */
  function bindScroll(trigger) {
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger, start: 'top top', end: 'bottom bottom', scrub: 1 } });
    tl.to(view, { az: 0.0, el: 0.1, dist: 6.4, shift: -0.2, ty: 0.5, duration: 1 })           // face
      .to(view, { duration: 0.5 })
      .to(view, { az: Math.PI / 2, el: 0.05, dist: 9.2, shift: 0.2, ty: 0.55, duration: 1.2 })  // profil
      .to(view, { duration: 0.5 })
      .to(view, { az: Math.PI / 2 + 0.01, el: 1.38, dist: 10.5, shift: 0, ty: 0.2, duration: 1.2 }) // dessus
      .to(view, { duration: 0.3 });
    return tl;
  }

  /* ── Interaction : glisser pour tourner, molette (Ctrl) / boutons pour zoomer ── */
  let lx = 0;
  canvas.addEventListener('pointerdown', (e) => { user.drag = true; lx = e.clientX; user.vel = 0; canvas.setPointerCapture(e.pointerId); canvas.classList.add('grab'); });
  canvas.addEventListener('pointermove', (e) => { if (!user.drag) return; const dx = e.clientX - lx; lx = e.clientX; user.yaw += dx * 0.009; user.vel = dx * 0.009; });
  const up = () => { user.drag = false; canvas.classList.remove('grab'); };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', (e) => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); user.zoom = Math.min(1.5, Math.max(0.6, user.zoom * (1 + e.deltaY * 0.001))); }, { passive: false });
  const zoom = (f) => { user.zoom = Math.min(1.5, Math.max(0.6, user.zoom * f)); };

  /* ── Boucle ── */
  let visible = true, last = performance.now(), scrolled = false, lastDraw = 0;
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(canvas);
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 0.9 ? 46 : 34; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    if (soft) { const n = performance.now(); if (n - lastDraw < 90) return; lastDraw = n; } // ~11 i/s en rendu logiciel
    const dt = Math.min(0.05, clock.getDelta());
    scrolled = scrollY > innerHeight * 0.3;
    if (!user.drag) {
      user.yaw += user.vel; user.vel *= 0.94;
      if (scrolled) user.yaw += (0 - user.yaw) * Math.min(1, dt * 1.6);
      else if (!P.reduced) user.yaw += dt * 0.12; // rotation lente d'exposition
    }
    yawGroup.rotation.y = user.yaw;
    const t = clock.elapsedTime;
    car.position.y = 0.02 + Math.sin(t * 1.3) * 0.004;
    ring.rotation.z = t * 0.15;
    applyCam();
    renderer.render(scene, camera);
  }
  frame();

  const api = { setTeam, bindScroll, zoom, renderer, scene, camera, view, glb: false };
  return api;
}
