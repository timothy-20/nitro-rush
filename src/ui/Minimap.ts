import type { Game } from '@/core/Game';

export class Minimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private readonly W = 150;
  private readonly H = 120;

  constructor() {
    this.canvas = document.getElementById('minimap') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
  }

  draw(game: Game): void {
    const ctx = this.ctx;
    const SP = game.trackManager.SP;
    const world = game.ecsWorld;
    const entities = world.query('Transform', 'Vehicle');

    ctx.fillStyle = 'rgba(0,0,0,.8)';
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.strokeStyle = 'rgba(255,255,255,.06)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, this.W, this.H);

    const xs = SP.map(p => p[0]), zs = SP.map(p => p[1]);
    const mnX = Math.min(...xs), mxX = Math.max(...xs), mnZ = Math.min(...zs), mxZ = Math.max(...zs);
    const sc = Math.min((this.W - 16) / ((mxX - mnX) || 1), (this.H - 16) / ((mxZ - mnZ) || 1));
    const oX = (this.W - (mxX - mnX) * sc) / 2 - mnX * sc;
    const oZ = (this.H - (mxZ - mnZ) * sc) / 2 - mnZ * sc;

    // Track shape
    ctx.beginPath();
    ctx.moveTo(SP[0][0] * sc + oX, SP[0][1] * sc + oZ);
    SP.forEach(p => ctx.lineTo(p[0] * sc + oX, p[1] * sc + oZ));
    ctx.closePath();
    ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.stroke();
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(80,80,120,.9)'; ctx.stroke();

    // Cars
    for (const entity of entities) {
      const tr = world.getComponent(entity, 'Transform')!;
      const veh = world.getComponent(entity, 'Vehicle')!;
      ctx.beginPath();
      ctx.arc(tr.x * sc + oX, tr.z * sc + oZ, veh.isPlayer ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = veh.color;
      ctx.shadowColor = veh.color;
      ctx.shadowBlur = veh.isPlayer ? 8 : 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}
