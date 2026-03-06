import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';

export class PhysicsSystem implements System {
  update(_world: World, _dt: number): void {
    // No-op stub for future Rapier integration
  }
}
