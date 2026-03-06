import type { ParticleEmitter } from '@/effects/ParticleEmitter';
import type { SparkEffect } from '@/effects/SparkEffect';

export interface ParticleSet {
  exhaust: ParticleEmitter;
  smoke: ParticleEmitter;
  sparks: SparkEffect;
}
