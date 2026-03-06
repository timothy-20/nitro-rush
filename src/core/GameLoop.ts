export class GameLoop {
  private lastT = 0;
  private running = false;
  private callback: (dt: number) => void;

  constructor(callback: (dt: number) => void) {
    this.callback = callback;
  }

  start(): void {
    this.running = true;
    this.lastT = 0;
    requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
  }

  private loop = (now: number): void => {
    if (!this.running) return;
    requestAnimationFrame(this.loop);
    const dt = Math.min((now - this.lastT) / 1000, 0.05);
    this.lastT = now;
    this.callback(dt);
  };
}
