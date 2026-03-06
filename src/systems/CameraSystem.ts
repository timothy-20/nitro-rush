import * as THREE from 'three';
import type { System } from '@/ecs/System';
import type { World } from '@/ecs/World';
import type { Game } from '@/core/Game';

export class CameraSystem implements System {
  private tmpLerp = new THREE.Vector3();
  private tmpLook = new THREE.Vector3();

  constructor(private game: Game) {}

  update(world: World, _dt: number): void {
    const playerEntity = this.game.playerEntity;
    if (playerEntity === undefined) return;

    const tr = world.getComponent(playerEntity, 'Transform');
    const veh = world.getComponent(playerEntity, 'Vehicle');
    const rend = world.getComponent(playerEntity, 'Renderable');
    if (!tr || !veh || !rend) return;

    const cam = this.game.renderer.camera;
    const fpsCam = this.game.fpsCam;

    if (fpsCam) {
      const fx = Math.sin(tr.ang), fz = Math.cos(tr.ang);
      const rx = Math.cos(tr.ang), rz = -Math.sin(tr.ang);
      const ts = veh.turn * 0.8;
      const cx = tr.x - fx * 1.0 + rx * ts, cy = 3.2, cz = tr.z - fz * 1.0 + rz * ts;
      const lx = tr.x + fx * 80 + rx * ts * 3, ly = 2.0, lz = tr.z + fz * 80 + rz * ts * 3;
      cam.position.lerp(this.tmpLerp.set(cx, cy, cz), 0.22);
      cam.lookAt(this.tmpLook.set(lx, ly, lz));
      if (!rend.group.visible && !veh.dead) rend.group.visible = true;
      if (rend.group.children[2]) rend.group.children[2].visible = false;
      if (rend.group.children[3]) rend.group.children[3].visible = false;
    } else {
      cam.position.lerp(this.tmpLerp.set(tr.x - Math.sin(tr.ang) * 40, 17, tr.z - Math.cos(tr.ang) * 40), 0.09);
      cam.lookAt(this.tmpLook.set(tr.x + Math.sin(tr.ang) * 14, 1.5, tr.z + Math.cos(tr.ang) * 14));
      if (!rend.group.visible && !veh.dead) rend.group.visible = true;
      if (rend.group.children[2]) rend.group.children[2].visible = true;
      if (rend.group.children[3]) rend.group.children[3].visible = true;
    }
  }
}
