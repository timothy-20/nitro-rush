const RAPIER_ENABLED = false;

export class PhysicsWorld {
  private world: unknown = null;

  async init(): Promise<void> {
    if (!RAPIER_ENABLED) return;
    // Future: import RAPIER and init WASM
    // const RAPIER = await import('@dimforge/rapier3d-compat');
    // await RAPIER.init();
    // this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  }

  step(_dt: number): void {
    if (!RAPIER_ENABLED || !this.world) return;
  }
}
