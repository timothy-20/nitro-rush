import * as THREE from 'three';

export class MiniExplosion {
  private pos: Float32Array;
  private vel: Float32Array;
  private life: Float32Array;
  private geo: THREE.BufferGeometry;
  mesh: THREE.Points;
  private max: number;
  done = false;

  constructor(scene: THREE.Scene, x: number, y: number, z: number, str: number) {
    this.max = Math.round(15 + str * 0.15);
    this.pos = new Float32Array(this.max * 3);
    this.vel = new Float32Array(this.max * 3);
    this.life = new Float32Array(this.max);
    for (let i = 0; i < this.max; i++) {
      this.pos[i * 3] = x; this.pos[i * 3 + 1] = y + 1; this.pos[i * 3 + 2] = z;
      const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI, sp = 2 + Math.random() * 5;
      this.vel[i * 3] = Math.sin(ph) * Math.cos(th) * sp;
      this.vel[i * 3 + 1] = Math.cos(ph) * sp * 0.6 + 2;
      this.vel[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * sp;
      this.life[i] = 0.4 + Math.random() * 0.3;
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.mesh = new THREE.Points(this.geo, new THREE.PointsMaterial({ color: 0xff8800, size: 2.5, transparent: true, opacity: 1, sizeAttenuation: true, depthWrite: false }));
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  update(scene: THREE.Scene, dt: number): void {
    let alive = 0;
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -999; continue; }
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.vel[i * 3 + 1] -= 12 * dt;
      this.life[i] -= dt * 1.2;
      alive++;
    }
    (this.mesh.material as THREE.PointsMaterial).opacity = Math.max(0, alive / this.max * 1.5);
    this.geo.attributes.position.needsUpdate = true;
    if (alive === 0) { scene.remove(this.mesh); this.done = true; }
  }
}

export class Explosion {
  private pos: Float32Array;
  private vel: Float32Array;
  private life: Float32Array;
  private geo: THREE.BufferGeometry;
  mesh: THREE.Points;
  private max: number;
  done = false;

  constructor(scene: THREE.Scene, x: number, y: number, z: number) {
    this.max = 80;
    this.pos = new Float32Array(this.max * 3);
    this.vel = new Float32Array(this.max * 3);
    this.life = new Float32Array(this.max);
    for (let i = 0; i < this.max; i++) {
      this.pos[i * 3] = x; this.pos[i * 3 + 1] = y + 1; this.pos[i * 3 + 2] = z;
      const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI, sp = 8 + Math.random() * 14;
      this.vel[i * 3] = Math.sin(ph) * Math.cos(th) * sp;
      this.vel[i * 3 + 1] = Math.cos(ph) * sp * 0.8 + 4;
      this.vel[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * sp;
      this.life[i] = 1;
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.mesh = new THREE.Points(this.geo, new THREE.PointsMaterial({ color: 0xff6600, size: 6, transparent: true, opacity: 1, sizeAttenuation: true, depthWrite: false }));
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  update(scene: THREE.Scene, dt: number): void {
    let alive = 0;
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -999; continue; }
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.vel[i * 3 + 1] -= 20 * dt;
      this.life[i] -= dt * 0.9;
      alive++;
    }
    (this.mesh.material as THREE.PointsMaterial).opacity = Math.max(0, alive / this.max * 1.5);
    this.geo.attributes.position.needsUpdate = true;
    if (alive === 0) { scene.remove(this.mesh); this.done = true; }
  }
}
