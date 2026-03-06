type Listener = (...args: unknown[]) => void;

export class EventBus {
  private listeners = new Map<string, Listener[]>();

  on(event: string, fn: Listener): void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(fn);
  }

  off(event: string, fn: Listener): void {
    const list = this.listeners.get(event);
    if (list) this.listeners.set(event, list.filter(f => f !== fn));
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach(fn => fn(...args));
  }
}
