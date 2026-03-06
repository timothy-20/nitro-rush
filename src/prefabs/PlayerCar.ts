import * as THREE from 'three';
import type { World } from '@/ecs/World';
import type { Entity } from '@/ecs/Entity';
import { COLORS_HEX, COLORS_CSS, NAMES } from '@/config/constants';
import { BASE_MAX_SPEED } from '@/config/physics';
import { makeCar } from '@/rendering/CarMeshFactory';
import { ParticleEmitter } from '@/effects/ParticleEmitter';
import { SparkEffect } from '@/effects/SparkEffect';

export function createPlayerCar(world: World, scene: THREE.Scene, SP: number[][]): Entity {
  const entity = world.createEntity();
  const id = 0;

  const mesh = makeCar(COLORS_HEX[id], true);
  scene.add(mesh);

  // Start position
  const p = SP[0], q = SP[1];
  const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.sqrt(dx * dx + dz * dz) || 1;
  const nx = -dz / l, nz = dx / l;
  const col = 1, row = 0;
  const x = p[0] + nx * col * 14 - dx / l * row * 36 + dx / l * 20;
  const z = p[1] + nz * col * 14 - dz / l * row * 36 + dz / l * 20;
  const ang = Math.atan2(dx / l, dz / l);

  world.addComponent(entity, 'Transform', { x, z, ang, velAng: ang });
  world.addComponent(entity, 'Physics', { speed: 0, bvx: 0, bvz: 0, maxSpeed: BASE_MAX_SPEED, baseMaxSpeed: BASE_MAX_SPEED, onRoad: true });
  world.addComponent(entity, 'Vehicle', { boostGauge: 0, boostActive: 0, boostMax: 1, drifting: false, driftIntensity: 0, hp: 100, dead: false, exploding: false, turn: 0, isPlayer: true, id, color: COLORS_CSS[id], name: NAMES[id] });
  world.addComponent(entity, 'TrackProgress', { trackI: 0, prog: 0, lastI: 0, lap: 0, total: 0, done: false, lapTime: 0, bestLap: 9999 });
  world.addComponent(entity, 'Renderable', { group: mesh });
  world.addComponent(entity, 'ParticleSet', {
    exhaust: new ParticleEmitter(scene, 0xaabbff, 1.2),
    smoke: new ParticleEmitter(scene, 0xccccbb, 1.6, 0.35),
    sparks: new SparkEffect(scene),
  });

  mesh.position.set(x, 0, z);
  mesh.rotation.set(0, ang, 0);

  return entity;
}
