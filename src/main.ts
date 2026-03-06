import './ui/styles.css';
import { Game } from './core/Game';
import { GameLoop } from './core/GameLoop';

const canvas = document.getElementById('c') as HTMLCanvasElement;
const game = new Game(canvas);
game.init();

const loop = new GameLoop((dt) => game.update(dt));
loop.start();
