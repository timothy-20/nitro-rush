export interface TrackDefinition {
  name: string;
  emoji: string;
  raw: number[][];
  widths: number[];
  bg: number;
  gnd: number;
  fog: number;
  bL: number;
  bR: number;
  ptA: number;
  ptB: number;
  ambColor: number;
  ambInt: number;
  dlColor: number;
  dlInt: number;
  fogNear: number;
  fogFar: number;
  scenery: string;
  roadColor: number;
}

export interface SplineData {
  pts: number[][];
  ws: number[];
}
