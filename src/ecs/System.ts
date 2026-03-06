import type { World } from './World';

export interface System {
  init?(world: World): void;
  update(world: World, dt: number): void;
  destroy?(): void;
}
