import * as THREE from 'three';

export class SparkEffect {
  private max: number;
  private pos: Float32Array;
  private vel: Float32Array;
  private life: Float32Array;
  private geo: THREE.BufferGeometry;
  mesh: THREE.Points;
  private ptr = 0;

  constructor(scene: THREE.Scene) {
    this.max = 200;
    this.pos = new Float32Array(this.max * 3);
    this.vel = new Float32Array(this.max * 3);
    this.life = new Float32Array(this.max);
    for (let i = 0; i < this.max; i++) this.pos[i * 3 + 1] = -999;
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffaa22, size: 0.5, transparent: true, opacity: 0.9, sizeAttenuation: true, depthWrite: false });
    this.mesh = new THREE.Points(this.geo, mat);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  emit(x: number, y: number, z: number, intensity: number): void {
    const cnt = Math.ceil(Math.min(6, intensity * 0.04));
    for (let c = 0; c < cnt; c++) {
      const i = this.ptr % this.max;
      this.ptr++;
      this.pos[i * 3] = x + (Math.random() - 0.5) * 1.5;
      this.pos[i * 3 + 1] = y + 0.3 + Math.random() * 0.8;
      this.pos[i * 3 + 2] = z + (Math.random() - 0.5) * 1.5;
      const sp = 3 + Math.random() * 6, th = Math.random() * Math.PI * 2;
      this.vel[i * 3] = Math.cos(th) * sp;
      this.vel[i * 3 + 1] = 2 + Math.random() * 5;
      this.vel[i * 3 + 2] = Math.sin(th) * sp;
      this.life[i] = 0.3 + Math.random() * 0.35;
    }
  }

  update(dt: number): void {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) { this.pos[i * 3 + 1] = -999; continue; }
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.vel[i * 3 + 1] -= 18 * dt;
      this.life[i] -= dt;
    }
    this.geo.attributes.position.needsUpdate = true;
  }
}
