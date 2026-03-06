import type { Game } from '@/core/Game';

export interface GameScene {
  enter(game: Game): void;
  update(game: Game, dt: number): void;
  exit(game: Game): void;
}
