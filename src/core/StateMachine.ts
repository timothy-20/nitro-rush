export type GameState = 'start' | 'countdown' | 'racing' | 'finish';

export class StateMachine {
  current: GameState = 'start';

  transition(to: GameState): void {
    this.current = to;
  }
}
