export function minDistToTrack(x: number, z: number, pts: number[][], step?: number): number {
  let mn = 1e18;
  const s = step || 3;
  for (let i = 0; i < pts.length; i += s) {
    const dx = pts[i][0] - x;
    const dz = pts[i][1] - z;
    const d = dx * dx + dz * dz;
    if (d < mn) mn = d;
  }
  return Math.sqrt(mn);
}
