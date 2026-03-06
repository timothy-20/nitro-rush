import type { GameScene } from './Scene';
import type { Game } from '@/core/Game';

export class ResultScene implements GameScene {
  enter(game: Game): void {
    game.showFinish();
  }

  update(game: Game, dt: number): void {
    game.ecsWorld.update(dt);
    game.renderer.render();
  }

  exit(_game: Game): void {}
}
