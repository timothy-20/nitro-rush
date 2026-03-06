import * as THREE from 'three';
import { minDistToTrack } from '@/utils/math';

export class SceneryBuilder {
  build(type: string, SP: number[][], SW: number[], SN: number): THREE.Group {
    const group = new THREE.Group();
    const safeMargin = 55;

    if (type === 'monaco') {
      for (let i = 0; i < SN; i += Math.max(1, Math.floor(SN / 55))) {
        const p = SP[i], n = SP[(i + 1) % SN];
        const dx = n[0] - p[0], dz = n[1] - p[1], l = Math.sqrt(dx * dx + dz * dz) || 1;
        const nx = -dz / l, nz = dx / l;
        [-1, 1].forEach(side => {
          if (Math.random() < 0.55) {
            const w = SW[i] + 18 + Math.random() * 25;
            const bx = p[0] + nx * side * w, bz = p[1] + nz * side * w;
            if (minDistToTrack(bx, bz, SP, 4) < safeMargin) return;
            const h = 14 + Math.random() * 30;
            const bw = 8 + Math.random() * 14, bd = 6 + Math.random() * 10;
            const b = new THREE.Mesh(new THREE.BoxGeometry(bw, h, bd),
              new THREE.MeshStandardMaterial({ color: 0x1a1525, roughness: 0.8, metalness: 0.2, emissive: 0x110818, emissiveIntensity: 0.3 }));
            b.position.set(bx, h / 2, bz); b.castShadow = true; group.add(b);
            if (Math.random() < 0.5) {
              const wl = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.7, 0.6, bd * 0.7),
                new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 0.12 }));
              wl.position.set(bx, h * 0.6, bz); group.add(wl);
            }
          }
        });
      }
      const water = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000),
        new THREE.MeshStandardMaterial({ color: 0x001133, roughness: 0.15, metalness: 0.8, transparent: true, opacity: 0.6 }));
      water.rotation.x = -Math.PI / 2; water.position.y = -0.8; group.add(water);
    } else if (type === 'city') {
      for (let i = 0; i < SN; i += Math.max(1, Math.floor(SN / 45))) {
        const p = SP[i], n = SP[(i + 1) % SN];
        const dx = n[0] - p[0], dz = n[1] - p[1], l = Math.sqrt(dx * dx + dz * dz) || 1;
        const nx = -dz / l, nz = dx / l;
        [-1, 1].forEach(side => {
          if (Math.random() < 0.5) {
            const w = SW[i] + 22 + Math.random() * 30;
            const bx = p[0] + nx * side * w, bz = p[1] + nz * side * w;
            if (minDistToTrack(bx, bz, SP, 4) < safeMargin) return;
            const h = 22 + Math.random() * 65;
            const bw = 10 + Math.random() * 16, bd = 8 + Math.random() * 12;
            const b = new THREE.Mesh(new THREE.BoxGeometry(bw, h, bd),
              new THREE.MeshStandardMaterial({ color: 0x0a0820, roughness: 0.6, metalness: 0.4 }));
            b.position.set(bx, h / 2, bz); b.castShadow = true; group.add(b);
            const nc = [0xff00ff, 0x00ffff, 0xff4488, 0x44ffaa][Math.floor(Math.random() * 4)];
            const strip = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.5, 0.4, bd + 0.5),
              new THREE.MeshBasicMaterial({ color: nc, transparent: true, opacity: 0.5 }));
            strip.position.set(bx, h * 0.3 + Math.random() * h * 0.4, bz); group.add(strip);
          }
        });
      }
    } else if (type === 'desert') {
      for (let i = 0; i < 30; i++) {
        const a = i / 30 * Math.PI * 2, r = 500 + Math.random() * 600;
        const dx2 = Math.cos(a) * r, dz2 = Math.sin(a) * r;
        if (minDistToTrack(dx2, dz2, SP, 6) < safeMargin + 20) continue;
        const h = 15 + Math.random() * 40;
        const dune = new THREE.Mesh(new THREE.ConeGeometry(30 + Math.random() * 40, h, 6),
          new THREE.MeshStandardMaterial({ color: 0x2a1a08, roughness: 1 }));
        dune.position.set(dx2, 0, dz2); group.add(dune);
      }
      for (let i = 0; i < SN; i += Math.max(1, Math.floor(SN / 20))) {
        const p = SP[i], n = SP[(i + 1) % SN];
        const ddx = n[0] - p[0], ddz = n[1] - p[1], ll = Math.sqrt(ddx * ddx + ddz * ddz) || 1;
        const nnx = -ddz / ll, nnz = ddx / ll;
        if (Math.random() < 0.3) {
          const side = Math.random() < 0.5 ? -1 : 1;
          const w = SW[i] + 25 + Math.random() * 20;
          const bx = p[0] + nnx * side * w, bz = p[1] + nnz * side * w;
          if (minDistToTrack(bx, bz, SP, 4) < safeMargin) continue;
          const h = 12 + Math.random() * 18;
          const tower = new THREE.Mesh(new THREE.BoxGeometry(3, h, 3),
            new THREE.MeshStandardMaterial({ color: 0x333322, roughness: 0.8, metalness: 0.5 }));
          tower.position.set(bx, h / 2, bz); tower.castShadow = true; group.add(tower);
          const rl = new THREE.PointLight(0xff2200, 0.6, 35);
          rl.position.set(bx, h + 2, bz); group.add(rl);
        }
      }
    }

    // Background mountains
    for (let i = 0; i < 28; i++) {
      const a = i / 28 * Math.PI * 2;
      const col = type === 'desert' ? 0x1a1005 : type === 'monaco' ? 0x060618 : 0x040420;
      const m = new THREE.Mesh(new THREE.ConeGeometry(40 + Math.random() * 35, 80 + Math.random() * 110, 5),
        new THREE.MeshStandardMaterial({ color: col, roughness: 1 }));
      m.position.set(Math.cos(a) * 1200, 0, Math.sin(a) * 1200); group.add(m);
    }

    return group;
  }
}
