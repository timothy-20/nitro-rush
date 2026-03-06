import * as THREE from 'three';

export class ParticleEmitter {
  private max: number;
  private pos: Float32Array;
  private vel: Float32Array;
  private life: Float32Array;
  private geo: THREE.BufferGeometry;
  mat: THREE.PointsMaterial;
  mesh: THREE.Points;
  private ptr = 0;

  constructor(scene: THREE.Scene, col = 0xaabbff, sz = 1.2, opacity = 0.5) {
    this.max = 400;
    this.pos = new Float32Array(this.max * 3);
    this.vel = new Float32Array(this.max * 3);
    this.life = new Float32Array(this.max);
    for (let i = 0; i < this.max; i++) this.pos[i * 3 + 1] = -999;
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.mat = new THREE.PointsMaterial({ color: col, size: sz, transparent: true, opacity, sizeAttenuation: true, depthWrite: false });
    this.mesh = new THREE.Points(this.geo, this.mat);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  emit(x: number, y: number, z: number, spd: number): void {
    if (spd < 1) return;
    const i = this.ptr % this.max;
    this.ptr++;
    this.pos[i * 3] = x;
    this.pos[i * 3 + 1] = y + 0.5;
    this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = (Math.random() - 0.5) * 1.4;
    this.vel[i * 3 + 1] = Math.random() * 0.8 + 0.3;
    this.vel[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
    this.life[i] = 1;
  }

  update(): void {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -999; continue; }
      this.pos[i * 3] += this.vel[i * 3];
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1];
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2];
      this.vel[i * 3 + 1] -= 0.018;
      this.life[i] -= 0.018;
    }
    this.geo.attributes.position.needsUpdate = true;
  }
}
