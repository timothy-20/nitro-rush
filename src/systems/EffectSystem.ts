import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { Game } from '@/core/Game';

export class EffectSystem implements System {
  constructor(private game: Game) {}

  update(world: World, dt: number): void {
    const entities = world.query('Transform', 'Physics', 'Vehicle', 'ParticleSet', 'Renderable');

    for (const entity of entities) {
      const tr = world.getComponent(entity, 'Transform')!;
      const ph = world.getComponent(entity, 'Physics')!;
      const veh = world.getComponent(entity, 'Vehicle')!;
      const particles = world.getComponent(entity, 'ParticleSet')!;
      const rend = world.getComponent(entity, 'Renderable')!;

      if (veh.dead) continue;

      const absSpd = Math.abs(ph.speed);
      const brk = veh.isPlayer ? !!this.game.keys.brake : false;
      const canDrift = veh.drifting;
      const doSmoke = canDrift || (brk && !canDrift && absSpd > 30);

      // Exhaust
      particles.exhaust.update(dt);

      // Smoke
      if (doSmoke) {
        if (canDrift) {
          const rl = tr.x - Math.sin(tr.ang) * 4 + Math.cos(tr.ang) * 2.5;
          const rlz = tr.z - Math.cos(tr.ang) * 4 - Math.sin(tr.ang) * 2.5;
          const rr = tr.x - Math.sin(tr.ang) * 4 - Math.cos(tr.ang) * 2.5;
          const rrz = tr.z - Math.cos(tr.ang) * 4 + Math.sin(tr.ang) * 2.5;
          particles.smoke.emit(rl, 0, rlz, Math.max(20, absSpd));
          particles.smoke.emit(rr, 0, rrz, Math.max(20, absSpd));
        } else {
          const sr = Math.min(1, absSpd / ph.baseMaxSpeed);
          if (Math.random() < 0.05 + sr * 0.1) {
            const rl = tr.x - Math.sin(tr.ang) * 4 + Math.cos(tr.ang) * 2.5;
            const rlz = tr.z - Math.cos(tr.ang) * 4 - Math.sin(tr.ang) * 2.5;
            const rr = tr.x - Math.sin(tr.ang) * 4 - Math.cos(tr.ang) * 2.5;
            const rrz = tr.z - Math.cos(tr.ang) * 4 + Math.sin(tr.ang) * 2.5;
            particles.smoke.emit(rl, 0, rlz, absSpd * 0.5);
            particles.smoke.emit(rr, 0, rrz, absSpd * 0.5);
          }
        }
      }
      particles.smoke.update(dt);
      particles.sparks.update(dt);

      // Apply mesh transform
      rend.group.position.set(tr.x, 0, tr.z);
      rend.group.rotation.y = tr.ang;
      const lean = veh.drifting ? (veh.turn * 0.22 * veh.driftIntensity) : (veh.turn * 0.06 * absSpd / ph.maxSpeed);
      rend.group.rotation.z = rend.group.rotation.z * 0.82 + (-lean) * 0.18;
    }

    // Update explosions
    const scene = this.game.renderer.scene;
    this.game.explosions = this.game.explosions.filter(e => {
      e.update(scene, dt);
      return !e.done;
    });
  }
}
