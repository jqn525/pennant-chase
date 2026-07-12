// ── 3D ballpark: orbitable night park where every ball in play actually flies ──
// Drag to rotate, pinch/scroll to zoom, two-finger drag to pan. Ball flight is
// a true ballistic arc built from the engine's real spray/distance/launch data.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { LEAGUE } from "../game/constants.js";
import Panel from "./Panel.jsx";
import { DiamondNavIcon } from "./Icons.jsx";
import "./Field3D.css";

const CAM_HOME = { pos: [0, 165, 175], target: [0, 0, -145] };

const FENCE_H = 10;
const BALL_COLORS = { hr: 0xe9a431, hit: 0xf5edda, err: 0xc6503f, out: 0x4a6355 };
const fenceAt = (deg) =>
  LEAGUE.fenceCenter - (LEAGUE.fenceCenter - LEAGUE.fenceCorner) * (Math.abs(deg) / 45);
// Field coordinates: home plate at origin, center field toward -z
const spot = (deg, dist) => {
  const rad = (deg * Math.PI) / 180;
  return [Math.sin(rad) * dist, -Math.cos(rad) * dist];
};

function buildPark(scene) {
  // Grass beyond the park
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(900, 48),
    new THREE.MeshLambertMaterial({ color: 0x122b1c }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.3;
  scene.add(ground);

  // Fair territory: wedge from home to the fence arc, striped like a mowed outfield
  for (let band = 0; band < 7; band++) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    for (let a = -45; a <= 45; a += 3) {
      const r = fenceAt(a) * ((band + 1) / 7);
      const [x, z] = spot(a, r);
      shape.lineTo(x, -z); // Shape is XY; we rotate onto XZ below
    }
    shape.lineTo(0, 0);
    const mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshLambertMaterial({ color: band % 2 ? 0x1a3a28 : 0x16331f }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -0.2 + (7 - band) * 0.012; // outer bands sit lowest
    scene.add(mesh);
  }

  // Infield dirt: rotated square through the bases plus the mound and home circle
  const dirtMat = new THREE.MeshLambertMaterial({ color: 0x7c5330 });
  const dirt = new THREE.Mesh(new THREE.CircleGeometry(98, 4), dirtMat);
  dirt.rotation.x = -Math.PI / 2;
  dirt.rotation.z = Math.PI / 4;
  dirt.position.set(0, 0.02, -63.6);
  scene.add(dirt);
  const mound = new THREE.Mesh(new THREE.CylinderGeometry(11, 13, 1.6, 20), dirtMat);
  mound.position.set(0, 0.8, -60.5);
  scene.add(mound);
  const homeDirt = new THREE.Mesh(new THREE.CircleGeometry(14, 20), dirtMat);
  homeDirt.rotation.x = -Math.PI / 2;
  homeDirt.position.y = 0.03;
  scene.add(homeDirt);

  // Inner grass square
  const innerGrass = new THREE.Mesh(
    new THREE.CircleGeometry(72, 4),
    new THREE.MeshLambertMaterial({ color: 0x1d422c }),
  );
  innerGrass.rotation.x = -Math.PI / 2;
  innerGrass.rotation.z = Math.PI / 4;
  innerGrass.position.set(0, 0.04, -63.6);
  scene.add(innerGrass);

  // Foul lines
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xd8cba9 });
  for (const side of [-45, 45]) {
    const len = fenceAt(side);
    const line = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, len), lineMat);
    const [x, z] = spot(side, len / 2);
    line.position.set(x, 0.06, z);
    line.rotation.y = (-side * Math.PI) / 180;
    scene.add(line);
  }

  // Bases (1B, 2B, 3B) + home plate
  const basePos = [spot(45, 90), spot(0, 127.3), spot(-45, 90)];
  const baseMeshes = basePos.map(([x, z]) => {
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 1.1, 4.5),
      new THREE.MeshLambertMaterial({ color: 0xf5edda }),
    );
    bag.rotation.y = Math.PI / 4;
    bag.position.set(x, 0.6, z);
    scene.add(bag);
    return bag;
  });
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.4, 3.4),
    new THREE.MeshLambertMaterial({ color: 0xf5edda }),
  );
  plate.rotation.y = Math.PI / 4;
  plate.position.y = 0.2;
  scene.add(plate);

  // Runners: amber pins on occupied bases
  const runners = basePos.map(([x, z]) => {
    const pin = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 2.1, 6.5, 10),
      new THREE.MeshLambertMaterial({ color: 0xe9a431, emissive: 0x7a4d10 }),
    );
    body.position.y = 3.9;
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(1.7, 10, 8),
      new THREE.MeshLambertMaterial({ color: 0xe9a431, emissive: 0x7a4d10 }),
    );
    head.position.y = 8.3;
    pin.add(body, head);
    pin.position.set(x, 0.6, z);
    pin.visible = false;
    scene.add(pin);
    return pin;
  });

  // The outfield wall
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x2c5540 });
  const capMat = new THREE.MeshLambertMaterial({ color: 0xc89b6c });
  for (let a = -45; a < 45; a += 3) {
    const [x1, z1] = spot(a, fenceAt(a));
    const [x2, z2] = spot(a + 3, fenceAt(a + 3));
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(len + 0.6, FENCE_H, 1.6), wallMat);
    seg.position.set((x1 + x2) / 2, FENCE_H / 2, (z1 + z2) / 2);
    seg.rotation.y = -Math.atan2(dz, dx);
    scene.add(seg);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(len + 0.6, 0.9, 2.1), capMat);
    cap.position.set((x1 + x2) / 2, FENCE_H + 0.4, (z1 + z2) / 2);
    cap.rotation.y = seg.rotation.y;
    scene.add(cap);
  }

  // Floodlight banks
  for (const [deg, dist] of [[-58, 300], [58, 300], [-24, 470], [24, 470]]) {
    const [x, z] = spot(deg, dist);
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 2, 92, 8),
      new THREE.MeshLambertMaterial({ color: 0x24352a }),
    );
    pole.position.set(x, 46, z);
    scene.add(pole);
    const bank = new THREE.Mesh(
      new THREE.BoxGeometry(22, 9, 3),
      new THREE.MeshBasicMaterial({ color: 0xf3e6bd }),
    );
    bank.position.set(x, 95, z);
    bank.lookAt(0, 0, -120);
    scene.add(bank);
  }

  return { baseMeshes, runners };
}

export default function Field3D({ g, speed }) {
  const mountRef = useRef(null);
  const resetRef = useRef(null);
  const gRef = useRef(g);
  const speedRef = useRef(speed);
  gRef.current = g;
  speedRef.current = speed;

  useEffect(() => {
    const mount = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a1c12, 650, 1100);
    scene.add(new THREE.AmbientLight(0xcfe4d2, 0.75));
    const sun = new THREE.DirectionalLight(0xffe9bd, 1.35);
    sun.position.set(-180, 260, 140);
    scene.add(sun);
    const glow = new THREE.PointLight(0xe9a431, 0.5, 500);
    glow.position.set(0, 60, -120);
    scene.add(glow);

    const camera = new THREE.PerspectiveCamera(46, 16 / 10, 1, 2400);
    camera.position.set(...CAM_HOME.pos);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAM_HOME.target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 70;
    controls.maxDistance = 800;
    controls.maxPolarAngle = 1.45; // stay above the turf
    controls.update();
    resetRef.current = () => {
      camera.position.set(...CAM_HOME.pos);
      controls.target.set(...CAM_HOME.target);
      controls.update();
    };

    const { runners } = buildPark(scene);

    // Landed balls: one instanced mesh recolored from the live game's spray chart
    const MAXB = 100;
    const dots = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1.9, 8, 6),
      new THREE.MeshBasicMaterial(),
      MAXB,
    );
    dots.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAXB * 3), 3);
    dots.count = 0;
    scene.add(dots);

    // The ball in flight + its fading trail
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(2.6, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    ball.visible = false;
    scene.add(ball);
    const TRAIL = 15;
    const trail = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1.15, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0xf5edda, transparent: true, opacity: 0.4 }),
      TRAIL,
    );
    trail.count = 0;
    scene.add(trail);

    const M = new THREE.Matrix4();
    const CLR = new THREE.Color();
    let flight = null; // {x, z, apex, color, start, dur}
    let seenG = null, seenBalls = 0;
    let raf;

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const game = gRef.current;

      // New game object -> clear the chart
      if (game !== seenG) {
        seenG = game;
        seenBalls = game?.balls?.length ?? 0;
        flight = null;
        ball.visible = false;
        trail.count = 0;
      }

      const balls = game?.balls ?? [];
      // Sync landed dots
      const n = Math.min(balls.length, MAXB);
      for (let i = 0; i < n; i++) {
        const b = balls[i];
        const [x, z] = spot(b.spray, b.dist);
        M.makeTranslation(x, 1.2, z);
        dots.setMatrixAt(i, M);
        dots.setColorAt(i, CLR.setHex(BALL_COLORS[b.t] ?? BALL_COLORS.out));
      }
      dots.count = n;
      dots.instanceMatrix.needsUpdate = true;
      if (dots.instanceColor) dots.instanceColor.needsUpdate = true;

      // Launch a flight for each newly recorded ball
      if (balls.length > seenBalls) {
        const b = balls[balls.length - 1];
        const [x, z] = spot(b.spray, b.dist);
        const apex = b.launch === "ground" ? 5 : b.launch === "liner" ? 16 : Math.max(38, b.dist * 0.3);
        flight = {
          x, z, apex,
          color: BALL_COLORS[b.t] ?? BALL_COLORS.out,
          start: now,
          dur: speedRef.current === 4 ? 210 : b.launch === "ground" ? 460 : 700,
        };
        seenBalls = balls.length;
        trail.count = 0;
      }

      // Animate the flight: ballistic arc from the plate to the landing spot
      if (flight) {
        const t = Math.min(1, (now - flight.start) / flight.dur);
        const px = flight.x * t;
        const pz = flight.z * t;
        const py = 3 * (1 - t) + flight.apex * Math.sin(Math.PI * t);
        ball.position.set(px, Math.max(1.2, py), pz);
        ball.material.color.setHex(flight.color);
        ball.visible = true;
        if (trail.count < TRAIL && t < 0.96) {
          M.makeTranslation(px, Math.max(1.2, py), pz);
          trail.setMatrixAt(trail.count, M);
          trail.count += 1;
          trail.instanceMatrix.needsUpdate = true;
        }
        if (t >= 1) { flight = null; ball.visible = false; trail.count = 0; }
      }

      // Runners on the bases
      const over = !game || game.over;
      runners.forEach((pin, i) => { pin.visible = !over && !!game.bases[i]; });

      controls.update();
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      scene.traverse((o) => {
        o.geometry?.dispose?.();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      });
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <Panel title="FIELD VIEW">
      <div className="field3d-frame">
        <div ref={mountRef} className="field3d" aria-label="3D field view" />
        <button className="field3d-reset" aria-label="reset camera" onClick={() => resetRef.current?.()}>
          <DiamondNavIcon size={15} />
        </button>
      </div>
      <div className="field3d-legend">
        {[["HR", "#e9a431"], ["HIT", "#f5edda"], ["ERROR", "#c6503f"], ["OUT", "#4a6355"]].map(([label, color]) => (
          <span key={label}><i style={{ background: color }} />{label}</span>
        ))}
      </div>
    </Panel>
  );
}
