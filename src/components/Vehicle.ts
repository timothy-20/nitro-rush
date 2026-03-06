export interface Vehicle {
  boostGauge: number;
  boostActive: number;
  boostMax: number;
  drifting: boolean;
  driftIntensity: number;
  hp: number;
  dead: boolean;
  exploding: boolean;
  turn: number;
  isPlayer: boolean;
  id: number;
  color: string;
  name: string;
}
