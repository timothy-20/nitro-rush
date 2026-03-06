import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { Transform } from '@/components/Transform';
import type { Physics } from '@/components/Physics';
import type { Vehicle } from '@/components/Vehicle';
import type { TrackProgress } from '@/components/TrackProgress';
import { BASE_TRACK_HW } from '@/config/constants';
import { ACCEL_RATE, BRAKE_RATE, COAST_DECAY, NORMAL_CAP_RATIO, BOOST_CAP_RATIO } from '@/config/physics';
import { applyPosition } from '@/utils/physics';
import type { Game } from '@/core/Game';

export class VehicleSystem implements System {
  constructor(private game: Game) {}

  update(world: World, dt: number): void {
    const entities = world.query('Transform', 'Physics', 'Vehicle', 'TrackProgress');

    for (const entity of entities) {
      const tr = world.getComponent(entity, 'Transform')!;
      const ph = world.getComponent(entity, 'Physics')!;
      const veh = world.getComponent(entity, 'Vehicle')!;
      const prog = world.getComponent(entity, 'TrackProgress')!;

      if (veh.dead) {
        ph.speed = Math.max(0, ph.speed - 200 * dt);
        applyPosition(tr, ph, dt);
        continue;
      }

      let trn = 0, acc = false, brk = false, rev = false, nitro = false;
      const keys = this.game.keys;
      const SP = this.game.trackManager.SP;
      const SW = this.game.trackManager.SW;
      const SN = this.game.trackManager.SN;

      if (veh.isPlayer) {
        acc = !!keys.up; brk = !!keys.brake; rev = !!keys.down; nitro = !!keys.nitro;
        if (keys.left) trn = -1;
        if (keys.right) trn = 1;
      } else {
        // AI handled by AISystem
        continue;
      }

      veh.turn = trn;
      const ni = prog.trackI;
      const tW = SW[ni] || BASE_TRACK_HW;
      const nd = this.nearPtDist(tr, SP, prog);
      const onRoad = nd < tW + 2;
      const sm = onRoad ? 1 : 0.28;
      ph.onRoad = onRoad;

      const canDrift = brk && Math.abs(trn) > 0.05 && ph.speed > 60;
      veh.drifting = canDrift;
      if (canDrift) veh.driftIntensity = Math.min(1, veh.driftIntensity + Math.abs(trn) * 0.18);
      else veh.driftIntensity = Math.max(0, veh.driftIntensity * 0.78);

      // Boost
      if (canDrift) veh.boostGauge = Math.min(1, veh.boostGauge + dt * 0.35);
      if (nitro && veh.boostGauge > 0) { veh.boostGauge = Math.max(0, veh.boostGauge - dt * 0.45); veh.boostActive = 0.15; }
      if (veh.boostActive > 0) veh.boostActive = Math.max(0, veh.boostActive - dt);

      const boostOn = veh.boostActive > 0;
      const normalCap = ph.baseMaxSpeed * NORMAL_CAP_RATIO;
      const effectiveCap = (boostOn ? ph.baseMaxSpeed * BOOST_CAP_RATIO : normalCap) * sm;
      const absSpd = Math.abs(ph.speed);

      // Acceleration
      if (ph.speed >= 0) {
        if (acc) {
          const cap = effectiveCap;
          ph.speed = Math.min(cap, ph.speed + ACCEL_RATE * dt * sm * 1.1);
          if (!boostOn && ph.speed > normalCap * sm) ph.speed = Math.max(normalCap * sm, ph.speed - 140 * dt);
        } else if (brk && !canDrift) {
          ph.speed = Math.max(0, ph.speed - BRAKE_RATE * dt);
        } else if (canDrift) {
          ph.speed = Math.max(0, ph.speed - 76 * dt);
        } else if (rev) {
          ph.speed = Math.max(-ph.baseMaxSpeed * 0.25 * sm, ph.speed - 153 * dt * sm);
        } else {
          ph.speed *= Math.pow(COAST_DECAY, dt * 60);
          if (!boostOn && ph.speed > normalCap * sm) ph.speed = Math.max(normalCap * sm, ph.speed - 102 * dt);
        }
      } else {
        if (rev) ph.speed = Math.max(-ph.baseMaxSpeed * 0.25 * sm, ph.speed - 64 * dt * sm);
        else if (acc) ph.speed = Math.min(0, ph.speed + 380 * dt);
        else ph.speed *= Math.pow(0.88, dt * 60);
      }

      // Steering
      const sR = Math.min(1, absSpd / ph.baseMaxSpeed);
      const tf = canDrift ? 2.9 * (0.6 + 0.4 * sR) : 2.1 * (0.55 + 0.45 * sR);
      const ts = ph.speed >= 0 ? trn : -trn;
      if (absSpd > 2) tr.ang -= ts * tf * dt;

      // Velocity angle
      let vd = tr.ang - tr.velAng;
      while (vd > Math.PI) vd -= Math.PI * 2;
      while (vd < -Math.PI) vd += Math.PI * 2;
      const sB = brk && !canDrift && Math.abs(trn) < 0.15;
      const vSnap = canDrift ? 3 : sB ? 15 : 11;
      tr.velAng += Math.sign(vd) * Math.min(Math.abs(vd), vSnap * dt);

      applyPosition(tr, ph, dt);
    }
  }

  private nearPtDist(tr: Transform, SP: number[][], prog: TrackProgress): number {
    let best = 1e9;
    let bi = prog.trackI;
    const SN = SP.length;
    for (let d = -75; d <= 75; d++) {
      const i = (prog.trackI + d + SN) % SN;
      const dx = SP[i][0] - tr.x, dz = SP[i][1] - tr.z;
      const dd = dx * dx + dz * dz;
      if (dd < best) { best = dd; bi = i; }
    }
    prog.trackI = bi;
    return Math.sqrt(best);
  }
}
