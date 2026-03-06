import type { Transform } from '@/components/Transform';
import type { Physics } from '@/components/Physics';
import type { Vehicle } from '@/components/Vehicle';
import type { AIDriver } from '@/components/AIDriver';
import type { TrackProgress } from '@/components/TrackProgress';
import type { Renderable } from '@/components/Renderable';
import type { ParticleSet } from '@/components/ParticleSet';

export interface ComponentMap {
  Transform: Transform;
  Physics: Physics;
  Vehicle: Vehicle;
  AIDriver: AIDriver;
  TrackProgress: TrackProgress;
  Renderable: Renderable;
  ParticleSet: ParticleSet;
}

export type ComponentType = keyof ComponentMap;
