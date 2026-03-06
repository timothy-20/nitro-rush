import { BASE_TRACK_HW } from '@/config/constants';
import type { SplineData } from './types';

function cmPt(p0: number[], p1: number[], p2: number[], p3: number[], t: number): number[] {
  const t2 = t * t, t3 = t2 * t;
  return [
    0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
    0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
  ];
}

function cmV(a: number, b: number, c: number, d: number, t: number): number {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
}

export function buildSpline(raw: number[][], widths: number[], sps: number): SplineData {
  const pts: number[][] = [];
  const ws: number[] = [];
  const n = raw.length;
  const w = widths || [];
  for (let i = 0; i < n; i++) {
    const a = raw[(i - 1 + n) % n], b = raw[i], c = raw[(i + 1) % n], d = raw[(i + 2) % n];
    const wa = w[(i - 1 + n) % n] || BASE_TRACK_HW, wb = w[i] || BASE_TRACK_HW;
    const wc = w[(i + 1) % n] || BASE_TRACK_HW, wd = w[(i + 2) % n] || BASE_TRACK_HW;
    for (let s = 0; s < sps; s++) {
      const t = s / sps;
      pts.push(cmPt(a, b, c, d, t));
      ws.push(cmV(wa, wb, wc, wd, t));
    }
  }
  return { pts, ws };
}
