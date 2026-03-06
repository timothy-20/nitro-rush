export class GameLoop {
  private lastT = -1;
  private running = false;
  private callback: (dt: number) => void;

  constructor(callback: (dt: number) => void) {
    this.callback = callback;
  }

  start(): void {
    this.running = true;
    this.lastT = -1;
    requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
  }

  private loop = (now: number): void => {
    if (!this.running) return;
    requestAnimationFrame(this.loop);
    if (this.lastT < 0) { this.lastT = now; return; }
    const dt = Math.min((now - this.lastT) / 1000, 0.05);
    this.lastT = now;
    this.callback(dt);
  };
}
