const BOUNCE_DECAY = 0.04;
const BOUNCE_THRESHOLD = 0.5;

export function applyPosition(
  tr: { x: number; z: number; velAng: number },
  ph: { speed: number; bvx: number; bvz: number },
  dt: number,
): void {
  tr.x += Math.sin(tr.velAng) * ph.speed * dt;
  tr.z += Math.cos(tr.velAng) * ph.speed * dt;
  tr.x += ph.bvx * dt;
  tr.z += ph.bvz * dt;
  const bD = Math.pow(BOUNCE_DECAY, dt);
  ph.bvx *= bD; ph.bvz *= bD;
  if (Math.abs(ph.bvx) < BOUNCE_THRESHOLD) ph.bvx = 0;
  if (Math.abs(ph.bvz) < BOUNCE_THRESHOLD) ph.bvz = 0;
}

export function findNearestTrackPoint(
  x: number,
  z: number,
  SP: number[][],
  currentI: number,
  rangeBack: number,
  rangeFwd: number,
): { dist: number; trackI: number } {
  const SN = SP.length;
  let best = 1e9;
  let bi = currentI;
  for (let d = -rangeBack; d <= rangeFwd; d++) {
    const i = (currentI + d + SN) % SN;
    const dx = SP[i][0] - x, dz = SP[i][1] - z;
    const dd = dx * dx + dz * dz;
    if (dd < best) { best = dd; bi = i; }
  }
  return { dist: Math.sqrt(best), trackI: bi };
}
