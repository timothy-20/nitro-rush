import { buildSpline } from './SplineBuilder';
import type { TrackDefinition } from './types';

export function drawTrackPreview(canvas: HTMLCanvasElement, track: TrackDefinition): void {
  const r = buildSpline(track.raw, track.widths, 8);
  const pts = r.pts, ws = r.ws;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(5,5,20,0.95)';
  ctx.beginPath();
  ctx.roundRect(0, 0, canvas.width, canvas.height, 6);
  ctx.fill();

  const xs = pts.map(p => p[0]), zs = pts.map(p => p[1]);
  const mnX = Math.min(...xs), mxX = Math.max(...xs), mnZ = Math.min(...zs), mxZ = Math.max(...zs);
  const pad = 20;
  const sc = Math.min((canvas.width - pad * 2) / ((mxX - mnX) || 1), (canvas.height - pad * 2) / ((mxZ - mnZ) || 1));
  const oX = (canvas.width - (mxX - mnX) * sc) / 2 - mnX * sc;
  const oZ = (canvas.height - (mxZ - mnZ) * sc) / 2 - mnZ * sc;

  // Track width ribbon
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const c = pts[i], n = pts[(i + 1) % pts.length];
    const dx = n[0] - c[0], dz = n[1] - c[1], l = Math.sqrt(dx * dx + dz * dz) || 1;
    const nx = -dz / l * ws[i] * 0.8, nz = dx / l * ws[i] * 0.8;
    const sx = c[0] * sc + oX, sy = c[1] * sc + oZ;
    if (i === 0) ctx.moveTo(sx + nx * sc * 0.015, sy + nz * sc * 0.015);
    else ctx.lineTo(sx + nx * sc * 0.015, sy + nz * sc * 0.015);
  }
  ctx.closePath();
  ctx.lineWidth = Math.max(4, sc * 8);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.stroke();

  // Center line
  ctx.beginPath();
  ctx.moveTo(pts[0][0] * sc + oX, pts[0][1] * sc + oZ);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * sc + oX, pts[i][1] * sc + oZ);
  ctx.closePath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.stroke();
  ctx.lineWidth = 1.5;
  const bLhex = '#' + track.bL.toString(16).padStart(6, '0');
  ctx.strokeStyle = bLhex; ctx.stroke();

  // Start marker
  ctx.beginPath();
  ctx.arc(pts[0][0] * sc + oX, pts[0][1] * sc + oZ, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffe14d'; ctx.fill();
  ctx.font = 'bold 8px Orbitron';
  ctx.fillStyle = '#ffe14d';
  ctx.fillText('START', pts[0][0] * sc + oX + 8, pts[0][1] * sc + oZ + 3);
}
