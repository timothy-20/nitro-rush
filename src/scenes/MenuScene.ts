import type { GameScene } from './Scene';
import type { Game } from '@/core/Game';

export class MenuScene implements GameScene {
  enter(game: Game): void {
    game.screens.show('s-start');
    game.fpsCam = false;
    game.trackManager.loadMap(
      game.selectedMap,
      game.renderer.scene,
      game.renderer.groundMesh,
      game.renderer.ambLight,
      game.renderer.dirLight,
    );
  }

  update(game: Game, dt: number): void {
    const t = performance.now() * 0.00025;
    const cam = game.renderer.camera;
    cam.position.set(Math.cos(t) * 250, 85, Math.sin(t) * 250);
    cam.lookAt(0, 0, 0);
    game.renderer.render();
  }

  exit(_game: Game): void {}
}
