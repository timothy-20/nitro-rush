import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import { BASE_TRACK_HW } from '@/config/constants';
import { CAR_RADIUS, CAR_SCRAPE_DIST, DMG_GLOBAL, CAR_DMG_MULT } from '@/config/physics';
import { findNearestTrackPoint } from '@/utils/physics';
import { MiniExplosion } from '@/effects/ExplosionEffect';
import type { Game } from '@/core/Game';

export class CollisionSystem implements System {
  constructor(private game: Game) {}

  update(world: World, dt: number): void {
    this.resolveWallCollisions(world, dt);
    this.resolveCarCollisions(world, dt);
  }

  private resolveWallCollisions(world: World, dt: number): void {
    const entities = world.query('Transform', 'Physics', 'Vehicle', 'TrackProgress', 'ParticleSet');
    const SP = this.game.trackManager.SP;
    const SW = this.game.trackManager.SW;
    const SN = this.game.trackManager.SN;

    for (const entity of entities) {
      const tr = world.getComponent(entity, 'Transform')!;
      const ph = world.getComponent(entity, 'Physics')!;
      const veh = world.getComponent(entity, 'Vehicle')!;
      const prog = world.getComponent(entity, 'TrackProgress')!;
      const particles = world.getComponent(entity, 'ParticleSet')!;

      if (veh.dead) continue;

      const ni = prog.trackI;
      const tW = SW[ni] || BASE_TRACK_HW;
      const wallR = tW - 3;

      const { dist: nd } = findNearestTrackPoint(tr.x, tr.z, SP, ni, 5, 5);
      const absSpd = Math.abs(ph.speed);

      if (nd > wallR) {
        const np = SP[ni], px = tr.x - np[0], pz = tr.z - np[1], pl = Math.sqrt(px * px + pz * pz) || 1;
        const wnx = -px / pl, wnz = -pz / pl;
        const cvx = Math.sin(tr.velAng) * ph.speed, cvz = Math.cos(tr.velAng) * ph.speed;
        const dot = cvx * wnx + cvz * wnz, impS = Math.abs(Math.min(0, dot));
        const tanS = Math.sqrt(Math.max(0, ph.speed * ph.speed - dot * dot));
        tr.x = np[0] + (px / pl) * wallR; tr.z = np[1] + (pz / pl) * wallR;
        ph.bvx += wnx * impS * 0.45 * 0.5; ph.bvz += wnz * impS * 0.45 * 0.5;
        ph.speed *= 0.5 + 0.4 * (tanS / (absSpd || 1));
        if (impS > 15) {
          veh.hp = Math.max(0, veh.hp - impS * 0.035 * 0.4);
          if (veh.hp <= 0 && !veh.dead) this.game.killCar(entity);
        }
        veh.driftIntensity = 0;
        if (impS > 5) {
          const cx = np[0] + (px / pl) * (wallR + 1), cz = np[1] + (pz / pl) * (wallR + 1);
          particles.sparks.emit(cx, 0.5, cz, impS * 1.5);
        }
      } else if (nd > wallR - 3 && absSpd > 20) {
        const si = (nd - (wallR - 3)) / 3;
        const sd = absSpd * 0.003 * si * dt * 0.4;
        veh.hp = Math.max(0, veh.hp - sd);
        if (veh.hp <= 0 && !veh.dead) this.game.killCar(entity);
        if (Math.random() < si * 0.5) {
          const np = SP[ni], px = tr.x - np[0], pz = tr.z - np[1], pl2 = Math.sqrt(px * px + pz * pz) || 1;
          particles.sparks.emit(tr.x + (px / pl2) * 3, 0.5, tr.z + (pz / pl2) * 3, absSpd);
        }
      }
    }
  }

  private resolveCarCollisions(world: World, _dt: number): void {
    const entities = world.query('Transform', 'Physics', 'Vehicle', 'ParticleSet');
    const scene = this.game.renderer.scene;

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const aE = entities[i], bE = entities[j];
        const aT = world.getComponent(aE, 'Transform')!;
        const bT = world.getComponent(bE, 'Transform')!;
        const aP = world.getComponent(aE, 'Physics')!;
        const bP = world.getComponent(bE, 'Physics')!;
        const aV = world.getComponent(aE, 'Vehicle')!;
        const bV = world.getComponent(bE, 'Vehicle')!;
        const aPart = world.getComponent(aE, 'ParticleSet')!;

        if (aV.dead || bV.dead) continue;

        const dx = bT.x - aT.x, dz = bT.z - aT.z, dist = Math.sqrt(dx * dx + dz * dz) || 0.01;
        const minDist = CAR_RADIUS * 2;

        if (dist < CAR_SCRAPE_DIST && dist >= minDist) {
          const bs = Math.abs(aP.speed) + Math.abs(bP.speed);
          if (bs > 40 && Math.random() < 0.35) {
            const mx = (aT.x + bT.x) / 2, mz = (aT.z + bT.z) / 2;
            aPart.sparks.emit(mx, 0.5, mz, bs * 0.5);
          }
          continue;
        }
        if (dist >= minDist) continue;

        const nx = dx / dist, nz = dz / dist, overlap = (minDist - dist) / 2;
        const avx = Math.sin(aT.velAng) * aP.speed + aP.bvx, avz = Math.cos(aT.velAng) * aP.speed + aP.bvz;
        const bvx = Math.sin(bT.velAng) * bP.speed + bP.bvx, bvz = Math.cos(bT.velAng) * bP.speed + bP.bvz;
        const relN = (avx - bvx) * nx + (avz - bvz) * nz;

        if (relN <= 0) {
          aT.x -= nx * overlap; aT.z -= nz * overlap;
          bT.x += nx * overlap; bT.z += nz * overlap;
          continue;
        }

        aT.x -= nx * (overlap + 0.1); aT.z -= nz * (overlap + 0.1);
        bT.x += nx * (overlap + 0.1); bT.z += nz * (overlap + 0.1);
        const cbm = Math.min(0.675, 0.45 + relN * 0.0008);
        aP.bvx -= nx * relN * cbm; aP.bvz -= nz * relN * cbm;
        bP.bvx += nx * relN * cbm; bP.bvz += nz * relN * cbm;
        aP.speed *= 0.82; bP.speed *= 0.82;
        aP.speed = Math.max(-aP.maxSpeed * 0.3, Math.min(aP.maxSpeed, aP.speed));
        bP.speed = Math.max(-bP.maxSpeed * 0.3, Math.min(bP.maxSpeed, bP.speed));

        const cross = dx * Math.cos(aT.ang) - dz * Math.sin(aT.ang);
        const spin = Math.min(0.08, relN * 0.0003);
        aT.ang += cross > 0 ? spin : -spin;
        bT.ang += cross > 0 ? -spin : spin;

        const mx = (aT.x + bT.x) / 2, mz = (aT.z + bT.z) / 2;
        aPart.sparks.emit(mx, 0.6, mz, relN * 1.2);
        const bPart = world.getComponent(bE, 'ParticleSet')!;
        bPart.sparks.emit(mx, 0.6, mz, relN * 1.2);

        if (relN > 15) this.game.explosions.push(new MiniExplosion(scene, mx, 0, mz, relN));

        const impF = relN;
        if (impF < 8) continue;
        const aAtk = Math.max(0, avx * nx + avz * nz), bAtk = Math.max(0, bvx * (-nx) + bvz * (-nz));
        const tot = aAtk + bAtk || 1, aR = aAtk / tot, bR = bAtk / tot;
        const baseDmg = impF * 0.04 * DMG_GLOBAL * CAR_DMG_MULT;
        aV.hp = Math.max(0, aV.hp - baseDmg * (0.2 + 0.8 * bR));
        bV.hp = Math.max(0, bV.hp - baseDmg * (0.2 + 0.8 * aR));
        if (aV.hp <= 0 && !aV.dead) this.game.killCar(aE);
        if (bV.hp <= 0 && !bV.dead) this.game.killCar(bE);
      }
    }
  }
}
