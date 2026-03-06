import type { GameScene } from './Scene';
import type { Game } from '@/core/Game';
import { CAR_COUNT, LAPS } from '@/config/constants';

export class RaceScene implements GameScene {
  private cdVal = 3;
  private cdAcc = 0;

  enter(game: Game): void {
    game.initRace();
    this.cdVal = 3;
    this.cdAcc = 0;
    game.stateMachine.transition('countdown');
    game.screens.show('s-cd');
    const cdNum = document.getElementById('cd-num')!;
    const cdSub = document.getElementById('cd-sub')!;
    cdNum.textContent = '3';
    cdSub.textContent = '\uC900\uBE44\uD558\uC138\uC694!';
  }

  update(game: Game, dt: number): void {
    const state = game.stateMachine.current;

    if (state === 'countdown') {
      game.ecsWorld.update(0); // just camera
      game.renderer.render();
      this.cdAcc += dt;
      if (this.cdAcc >= 1) {
        this.cdAcc = 0;
        this.cdVal--;
        if (this.cdVal < 0) {
          game.stateMachine.transition('racing');
          game.screens.show(null);
        } else {
          const cdNum = document.getElementById('cd-num')!;
          const cdSub = document.getElementById('cd-sub')!;
          cdNum.textContent = this.cdVal > 0 ? String(this.cdVal) : 'GO!';
          cdSub.textContent = this.cdVal > 0 ? '\uC900\uBE44\uD558\uC138\uC694!' : '\uC5D4\uC9C4 \uC810\uD654!';
        }
      }
      return;
    }

    if (state === 'racing') {
      game.gTime += dt;
      game.ecsWorld.update(dt);
      game.hud.update(game);
      game.minimap.draw(game);

      // Check finish
      const entities = game.ecsWorld.query('Vehicle', 'TrackProgress');
      for (const entity of entities) {
        const veh = game.ecsWorld.getComponent(entity, 'Vehicle')!;
        const prog = game.ecsWorld.getComponent(entity, 'TrackProgress')!;
        if (prog.done && !game.finishOrder.includes(veh.id)) {
          game.finishOrder.push(veh.id);
          if (veh.id === 0) {
            game.stateMachine.transition('finish');
            game.finishTimeout = window.setTimeout(() => game.showFinish(), 2800);
          } else if (game.finishOrder.length === CAR_COUNT) {
            game.stateMachine.transition('finish');
            game.finishTimeout = window.setTimeout(() => game.showFinish(), 1200);
          }
        }
      }
      game.renderer.render();
      return;
    }

    if (state === 'finish') {
      game.ecsWorld.update(dt);
      game.hud.update(game);
      game.minimap.draw(game);
      game.renderer.render();
    }
  }

  exit(_game: Game): void {}
}
