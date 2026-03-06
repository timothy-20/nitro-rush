import type { Game } from '@/core/Game';

export class Minimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private readonly W = 150;
  private readonly H = 120;

  private cachedSP: number[][] | null = null;
  private mnX = 0; private mxX = 0;
  private mnZ = 0; private mxZ = 0;
  private sc = 1; private oX = 0; private oZ = 0;

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

    if (SP !== this.cachedSP) {
      this.cachedSP = SP;
      const xs = SP.map(p => p[0]), zs = SP.map(p => p[1]);
      this.mnX = Math.min(...xs); this.mxX = Math.max(...xs);
      this.mnZ = Math.min(...zs); this.mxZ = Math.max(...zs);
      this.sc = Math.min((this.W - 16) / ((this.mxX - this.mnX) || 1), (this.H - 16) / ((this.mxZ - this.mnZ) || 1));
      this.oX = (this.W - (this.mxX - this.mnX) * this.sc) / 2 - this.mnX * this.sc;
      this.oZ = (this.H - (this.mxZ - this.mnZ) * this.sc) / 2 - this.mnZ * this.sc;
    }

    const { sc, oX, oZ } = this;

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
