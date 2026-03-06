import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import { LAPS } from '@/config/constants';
import type { Game } from '@/core/Game';

export class LapSystem implements System {
  constructor(private game: Game) {}

  update(world: World, dt: number): void {
    const entities = world.query('Transform', 'Physics', 'TrackProgress', 'Vehicle');
    const SN = this.game.trackManager.SN;

    for (const entity of entities) {
      const ph = world.getComponent(entity, 'Physics')!;
      const prog = world.getComponent(entity, 'TrackProgress')!;
      const veh = world.getComponent(entity, 'Vehicle')!;

      if (ph.speed >= 0) {
        let di = prog.trackI - prog.lastI;
        if (di < -SN / 2) di += SN;
        else if (di > SN / 2) di = 0;
        if (di > 0) {
          prog.prog += di;
          prog.lastI = prog.trackI;
          if (prog.prog >= SN) {
            prog.prog -= SN;
            const pLT = prog.lapTime;
            prog.lap++;
            if (prog.lapTime > 0 && prog.lapTime < prog.bestLap) prog.bestLap = prog.lapTime;
            prog.lapTime = 0;
            if (veh.isPlayer && prog.lap < LAPS) {
              this.game.showLapNotify(prog.lap + 1, pLT);
            }
            if (prog.lap >= LAPS) {
              prog.done = true;
              if (veh.isPlayer) {
                this.game.showRaceBanner('\u{1F3C1} FINISH!', '\uC644\uC8FC!', '#44ff88');
              }
            }
          }
        }
      }
      if (!veh.dead && !prog.done) prog.lapTime += dt;
      prog.total = prog.lap * SN + prog.prog;
    }
  }
}
