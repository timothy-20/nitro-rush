import * as THREE from 'three';
import type { TrackDefinition } from './types';

export class TrackMeshBuilder {
  private group = new THREE.Group();

  private add<T extends THREE.Object3D>(obj: T): T {
    this.group.add(obj);
    return obj;
  }

  build(SP: number[][], SW: number[], theme: TrackDefinition): THREE.Group {
    this.group = new THREE.Group();
    const SN = SP.length;
    this.buildRoad(SP, SW, SN, theme.roadColor);
    this.buildEdgeLines(SP, SW, SN);
    this.buildCurbs(SP, SW, SN);
    this.buildBarriers(SP, SW, SN, theme);
    this.buildStartLine(SP, SW);
    this.buildTrackLights(SP, SN, theme);
    return this.group;
  }

  private buildRoad(SP: number[][], SW: number[], SN: number, roadColor: number): void {
    const v: number[] = [], uv: number[] = [], idx: number[] = [], nr: number[] = [];
    for (let i = 0; i < SN; i++) {
      const c = SP[i], n = SP[(i + 1) % SN], hw = SW[i];
      const dx = n[0] - c[0], dz = n[1] - c[1], l = Math.sqrt(dx * dx + dz * dz) || 1;
      const nx = -dz / l, nz = dx / l, t = i / SN;
      v.push(c[0] + nx * hw, 0.05, c[1] + nz * hw, c[0] - nx * hw, 0.05, c[1] - nz * hw);
      uv.push(0, t * 40, 1, t * 40);
      nr.push(0, 1, 0, 0, 1, 0);
    }
    for (let i = 0; i < SN; i++) {
      const a = i * 2, b = (i * 2 + 2) % (SN * 2), c2 = a + 1, d = b + 1;
      idx.push(a, b, c2, c2, b, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nr, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    const rm = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: roadColor || 0x222238, roughness: 0.85, metalness: 0.08 }));
    rm.receiveShadow = true;
    this.add(rm);

    // Center dashes
    const dv: number[] = [], di: number[] = [];
    for (let i = 0; i < SN; i += 6) {
      const c2 = SP[i], n2 = SP[(i + 2) % SN];
      const dx2 = n2[0] - c2[0], dz2 = n2[1] - c2[1], l2 = Math.sqrt(dx2 * dx2 + dz2 * dz2) || 1;
      const nx2 = -dz2 / l2, nz2 = dx2 / l2, fw = [dx2 / l2, dz2 / l2], b2 = dv.length / 3;
      [-3, 3].forEach(s => {
        dv.push(c2[0] + nx2 * s, 0.07, c2[1] + nz2 * s);
        dv.push(c2[0] + nx2 * s + fw[0] * 8, 0.07, c2[1] + nz2 * s + fw[1] * 8);
      });
      di.push(b2, b2 + 2, b2 + 1, b2 + 1, b2 + 2, b2 + 3);
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.Float32BufferAttribute(dv, 3));
    dg.setIndex(di);
    dg.computeVertexNormals();
    this.add(new THREE.Mesh(dg, new THREE.MeshBasicMaterial({ color: 0xffff44, transparent: true, opacity: 0.12 })));
  }

  private buildEdgeLines(SP: number[][], SW: number[], SN: number): void {
    [-1, 1].forEach(side => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < SN; i++) {
        const c = SP[i], n = SP[(i + 1) % SN], hw = SW[i] - 1.5;
        const dx = n[0] - c[0], dz = n[1] - c[1], l = Math.sqrt(dx * dx + dz * dz) || 1;
        pts.push(new THREE.Vector3(c[0] + (-dz / l) * side * hw, 0.08, c[1] + (dx / l) * side * hw));
      }
      pts.push(pts[0].clone());
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      this.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })));
    });
  }

  private buildCurbs(SP: number[][], SW: number[], SN: number): void {
    const v: number[] = [], idx: number[] = [];
    for (let i = 0; i < SN; i++) {
      const c = SP[i], n = SP[(i + 1) % SN], hw = SW[i];
      const dx = n[0] - c[0], dz = n[1] - c[1], l = Math.sqrt(dx * dx + dz * dz) || 1;
      const nx = -dz / l, nz = dx / l, b = v.length / 3;
      v.push(c[0] + nx * hw, 0.06, c[1] + nz * hw, c[0] + nx * (hw + 5), 0.06, c[1] + nz * (hw + 5),
        c[0] - nx * hw, 0.06, c[1] - nz * hw, c[0] - nx * (hw + 5), 0.06, c[1] - nz * (hw + 5));
      if (i < SN - 1) idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const cols = new Float32Array(v.length);
    for (let i = 0; i < v.length / 3; i++) {
      const s = Math.floor(i / 4 / 4) % 2 === 0;
      if (s) { cols[i * 3] = 1; cols[i * 3 + 1] = 0.08; cols[i * 3 + 2] = 0.08; }
      else { cols[i * 3] = 1; cols[i * 3 + 1] = 1; cols[i * 3 + 2] = 1; }
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    this.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 })));
  }

  private buildBarriers(SP: number[][], SW: number[], SN: number, theme: TrackDefinition): void {
    [-1, 1].forEach(side => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < SN; i++) {
        const c = SP[i], n = SP[(i + 1) % SN], hw = SW[i] + 7;
        const dx = n[0] - c[0], dz = n[1] - c[1], l = Math.sqrt(dx * dx + dz * dz) || 1;
        pts.push(new THREE.Vector3(c[0] + (-dz / l) * side * hw, 0.5, c[1] + (dx / l) * side * hw));
      }
      pts.push(pts[0].clone());
      const crv = new THREE.CatmullRomCurve3(pts, true);
      const bm = new THREE.Mesh(
        new THREE.TubeGeometry(crv, SN, 0.6, 6, true),
        new THREE.MeshStandardMaterial({ color: 0x1a1a30, roughness: 0.7, metalness: 0.4, emissive: 0x000022, emissiveIntensity: 0.3 }),
      );
      bm.castShadow = true;
      this.add(bm);
      const gp = pts.map(v => new THREE.Vector3(v.x, v.y + 0.6, v.z));
      this.add(new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(gp, true), SN, 0.08, 4, true),
        new THREE.MeshBasicMaterial({ color: side < 0 ? theme.bL : theme.bR, transparent: true, opacity: 0.9 }),
      ));
    });
  }

  private buildStartLine(SP: number[][], SW: number[]): void {
    const p = SP[0], q = SP[1], hw = SW[0];
    const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.sqrt(dx * dx + dz * dz) || 1;
    const geo = new THREE.PlaneGeometry(hw * 2, 5, 8, 1);
    geo.rotateX(-Math.PI / 2);
    const cv = new Float32Array(geo.attributes.position.count * 3);
    for (let i = 0; i < 9; i++) {
      const c = i % 2 ? [1, 1, 1] : [0, 0, 0];
      for (let j = 0; j < 2; j++) { const b = (i * 2 + j) * 3; cv[b] = c[0]; cv[b + 1] = c[1]; cv[b + 2] = c[2]; }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cv, 3));
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true }));
    m.position.set(p[0], 0.09, p[1]);
    m.rotation.y = Math.atan2(dx, dz);
    this.add(m);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, 0.18, 0.5), new THREE.MeshBasicMaterial({ color: 0xffe14d }));
    bar.position.set(p[0], 0.17, p[1]);
    bar.rotation.y = Math.atan2(dx, dz);
    this.add(bar);
  }

  private buildTrackLights(SP: number[][], SN: number, theme: TrackDefinition): void {
    const step = Math.max(1, Math.floor(SN / 14));
    for (let i = 0; i < SN; i += step) {
      const p = SP[i];
      const col = (Math.floor(i / step) % 2 === 0) ? theme.ptA : theme.ptB;
      const lt = new THREE.PointLight(col, 2.5, 140);
      lt.position.set(p[0], 16, p[1]);
      this.add(lt);
    }
  }
}
