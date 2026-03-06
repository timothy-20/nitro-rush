import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import { BASE_TRACK_HW } from '@/config/constants';
import type { Game } from '@/core/Game';

export class AISystem implements System {
  constructor(private game: Game) {}

  update(world: World, dt: number): void {
    const entities = world.query('Transform', 'Physics', 'Vehicle', 'AIDriver', 'TrackProgress');
    const SP = this.game.trackManager.SP;
    const SW = this.game.trackManager.SW;
    const SN = this.game.trackManager.SN;

    for (const entity of entities) {
      const tr = world.getComponent(entity, 'Transform')!;
      const ph = world.getComponent(entity, 'Physics')!;
      const veh = world.getComponent(entity, 'Vehicle')!;
      const ai = world.getComponent(entity, 'AIDriver')!;
      const prog = world.getComponent(entity, 'TrackProgress')!;

      if (veh.dead) {
        ph.speed = Math.max(0, ph.speed - 200 * dt);
        this.applyPosition(tr, ph, dt);
        continue;
      }

      if (prog.done) {
        ph.speed = Math.max(0, ph.speed - 200 * dt);
        this.applyPosition(tr, ph, dt);
        continue;
      }

      // AI nearPtForward
      let best = 1e9, bi = prog.trackI;
      for (let d = -10; d <= 60; d++) {
        const i = (prog.trackI + d + SN) % SN;
        const dx = SP[i][0] - tr.x, dz = SP[i][1] - tr.z;
        const dd = dx * dx + dz * dz;
        if (dd < best) { best = dd; bi = i; }
      }
      prog.trackI = bi;
      const nd = Math.sqrt(best);

      const spdF = Math.max(0.15, Math.abs(ph.speed) / ph.baseMaxSpeed);
      const look = Math.round(10 + spdF * ai.lookahead);
      const ti = (prog.trackI + look) % SN;
      const cp = SP[prog.trackI], tp = SP[ti];
      const offX = tr.x - cp[0], offZ = tr.z - cp[1], offD = Math.sqrt(offX * offX + offZ * offZ);
      const tW = SW[prog.trackI] || BASE_TRACK_HW;
      const cb = Math.min(0.5, offD / (tW * 0.8) * 0.4);
      const tX = tp[0] * (1 - cb) + cp[0] * cb, tZ = tp[1] * (1 - cb) + cp[1] * cb;
      let df = Math.atan2(tX - tr.x, tZ - tr.z) - tr.ang;
      while (df > Math.PI) df -= Math.PI * 2;
      while (df < -Math.PI) df += Math.PI * 2;

      const trn = -Math.sign(df) * Math.min(1, Math.abs(df) * 2.8);
      const brk = Math.abs(df) > 0.7 && spdF > 0.3;
      veh.turn = trn;

      const onRoad = nd < tW + 2;
      const sm = onRoad ? 1 : 0.28;
      ph.onRoad = onRoad;

      // AI acceleration
      const absSpd = Math.abs(ph.speed);
      const cap = ph.baseMaxSpeed * 0.6 * sm;
      if (!brk) {
        ph.speed = Math.min(cap, ph.speed + 230 * dt * sm);
      } else {
        ph.speed = Math.max(0, ph.speed - 76 * dt);
      }

      // Steering
      const sR = Math.min(1, absSpd / ph.baseMaxSpeed);
      const tf = 2.4 * (0.55 + 0.45 * sR);
      const ts = ph.speed >= 0 ? trn : -trn;
      if (absSpd > 2) tr.ang -= ts * tf * dt;

      // Velocity angle
      let vd = tr.ang - tr.velAng;
      while (vd > Math.PI) vd -= Math.PI * 2;
      while (vd < -Math.PI) vd += Math.PI * 2;
      const vSnap = 14;
      tr.velAng += Math.sign(vd) * Math.min(Math.abs(vd), vSnap * dt);

      this.applyPosition(tr, ph, dt);

      // Wall collision recovery
      const wallR = tW - 3;
      if (nd > wallR) {
        const np = SP[bi], px = tr.x - np[0], pz = tr.z - np[1], pl = Math.sqrt(px * px + pz * pz) || 1;
        const fwd = (prog.trackI + 6) % SN;
        let ra = Math.atan2(SP[fwd][0] - tr.x, SP[fwd][1] - tr.z) - tr.ang;
        while (ra > Math.PI) ra -= Math.PI * 2;
        while (ra < -Math.PI) ra += Math.PI * 2;
        tr.ang += ra * 0.15;
        tr.velAng += ra * 0.15;
      }
    }
  }

  private applyPosition(tr: { x: number; z: number; velAng: number }, ph: { speed: number; bvx: number; bvz: number }, dt: number): void {
    tr.x += Math.sin(tr.velAng) * ph.speed * dt;
    tr.z += Math.cos(tr.velAng) * ph.speed * dt;
    tr.x += ph.bvx * dt;
    tr.z += ph.bvz * dt;
    const bD = Math.pow(0.04, dt);
    ph.bvx *= bD; ph.bvz *= bD;
    if (Math.abs(ph.bvx) < 0.5) ph.bvx = 0;
    if (Math.abs(ph.bvz) < 0.5) ph.bvz = 0;
  }
}
