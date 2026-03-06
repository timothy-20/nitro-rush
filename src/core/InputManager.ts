export interface Keys {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
  nitro: boolean;
}

export class InputManager {
  keys: Keys = { up: false, down: false, left: false, right: false, brake: false, nitro: false };
  private onStart: (() => void) | null = null;
  private onRestart: (() => void) | null = null;
  private onMenu: (() => void) | null = null;
  private onToggleView: (() => void) | null = null;
  private getState: (() => string) | null = null;

  setup(callbacks: {
    onStart: () => void;
    onRestart: () => void;
    onMenu: () => void;
    onToggleView: () => void;
    getState: () => string;
  }): void {
    this.onStart = callbacks.onStart;
    this.onRestart = callbacks.onRestart;
    this.onMenu = callbacks.onMenu;
    this.onToggleView = callbacks.onToggleView;
    this.getState = callbacks.getState;
    this.bindKeyboard();
    this.bindMobile();
    this.bindButtons();
  }

  private KM: Record<string, keyof Keys> = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.KM[e.code]) this.keys[this.KM[e.code]] = true;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.nitro = true;
    if (e.code === 'Space') {
      const st = this.getState?.();
      if (st === 'start') this.onStart?.();
      else if (st === 'finish') this.onMenu?.();
      else this.keys.brake = true;
      e.preventDefault();
    }
    if (e.code === 'Enter') {
      const st = this.getState?.();
      if (st === 'start') this.onStart?.();
      else if (st === 'finish') this.onMenu?.();
    }
    if (e.code === 'KeyR' && this.getState?.() === 'finish') this.onRestart?.();
    if (e.code === 'KeyQ') {
      const st = this.getState?.();
      if (st === 'racing' || st === 'finish') this.onToggleView?.();
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    if (this.KM[e.code]) this.keys[this.KM[e.code]] = false;
    if (e.code === 'Space') this.keys.brake = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.nitro = false;
  };

  private bindKeyboard(): void {
    addEventListener('keydown', this.handleKeyDown);
    addEventListener('keyup', this.handleKeyUp);
  }

  private bindMobile(): void {
    const mcT = (id: string, cb: (v: boolean) => void) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => { e.preventDefault(); cb(true); }, { passive: false });
      el.addEventListener('touchend', (e) => { e.preventDefault(); cb(false); }, { passive: false });
    };
    mcT('mc-up', v => this.keys.up = v);
    mcT('mc-down', v => this.keys.down = v);
    mcT('mc-left', v => this.keys.left = v);
    mcT('mc-right', v => this.keys.right = v);
    mcT('mc-brake', v => this.keys.brake = v);
  }

  private bindButtons(): void {
    document.getElementById('start-btn')?.addEventListener('click', () => this.onStart?.());
    document.getElementById('btn-restart')?.addEventListener('click', () => this.onRestart?.());
    document.getElementById('btn-menu')?.addEventListener('click', () => this.onMenu?.());
  }

  dispose(): void {
    removeEventListener('keydown', this.handleKeyDown);
    removeEventListener('keyup', this.handleKeyUp);
  }
}
