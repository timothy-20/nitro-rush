import * as THREE from 'three';
import { World } from '@/ecs/World';
import type { Entity } from '@/ecs/Entity';
import { StateMachine } from './StateMachine';
import { InputManager } from './InputManager';
import { Renderer } from '@/rendering/Renderer';
import { TrackManager } from '@/tracks/TrackManager';
import { HUD } from '@/ui/HUD';
import { Minimap } from '@/ui/Minimap';
import { Screens } from '@/ui/Screens';
import { VehicleSystem } from '@/systems/VehicleSystem';
import { AISystem } from '@/systems/AISystem';
import { CollisionSystem } from '@/systems/CollisionSystem';
import { LapSystem } from '@/systems/LapSystem';
import { EffectSystem } from '@/systems/EffectSystem';
import { CameraSystem } from '@/systems/CameraSystem';
import { createPlayerCar } from '@/prefabs/PlayerCar';
import { createAICar } from '@/prefabs/AICar';
import { CAR_COUNT, LAPS, MEDALS } from '@/config/constants';
import { MAPS } from '@/tracks/data';
import { fmtTime } from '@/utils/format';
import { addRecord, renderRecords } from '@/ui/Records';
import { Explosion } from '@/effects/ExplosionEffect';
import type { MiniExplosion } from '@/effects/ExplosionEffect';
import type { Keys } from './InputManager';

export class Game {
  renderer: Renderer;
  trackManager: TrackManager;
  stateMachine: StateMachine;
  inputManager: InputManager;
  hud!: HUD;
  minimap!: Minimap;
  screens!: Screens;
  ecsWorld!: World;

  selectedMap = 0;
  fpsCam = false;
  gTime = 0;
  finishOrder: number[] = [];
  finishTimeout: number | null = null;
  playerEntity?: Entity;
  carEntities: Entity[] = [];
  explosions: (Explosion | MiniExplosion)[] = [];

  private lapNotifyTO: number | null = null;
  private bannerTO: number | null = null;

  get keys(): Keys {
    return this.inputManager.keys;
  }

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.trackManager = new TrackManager();
    this.stateMachine = new StateMachine();
    this.inputManager = new InputManager();
  }

  init(): void {
    this.screens = new Screens();
    this.hud = new HUD();
    this.minimap = new Minimap();

    // Load initial map
    this.trackManager.loadMap(
      this.selectedMap,
      this.renderer.scene,
      this.renderer.groundMesh,
      this.renderer.ambLight,
      this.renderer.dirLight,
    );

    // Map selection
    document.querySelectorAll('.map-card').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.map-card').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedMap = parseInt((btn as HTMLElement).dataset.map!);
        this.trackManager.loadMap(
          this.selectedMap,
          this.renderer.scene,
          this.renderer.groundMesh,
          this.renderer.ambLight,
          this.renderer.dirLight,
        );
      });
    });

    // Input
    this.inputManager.setup({
      onStart: () => this.startGame(),
      onRestart: () => this.restartGame(),
      onMenu: () => this.goMenu(),
      onToggleView: () => { this.fpsCam = !this.fpsCam; },
      getState: () => this.stateMachine.current,
    });

    // Show start screen
    this.screens.show('s-start');
    setTimeout(() => this.screens.initPreviews(), 100);
  }

  startGame(): void {
    this.initRace();
    this.stateMachine.transition('countdown');
    this.screens.show('s-cd');
    document.getElementById('cd-num')!.textContent = '3';
    document.getElementById('cd-sub')!.textContent = '\uC900\uBE44\uD558\uC138\uC694!';
  }

  restartGame(): void {
    this.startGame();
  }

  goMenu(): void {
    this.stateMachine.transition('start');
    this.fpsCam = false;
    this.trackManager.loadMap(
      this.selectedMap,
      this.renderer.scene,
      this.renderer.groundMesh,
      this.renderer.ambLight,
      this.renderer.dirLight,
    );
    this.screens.show('s-start');
  }

  initRace(): void {
    if (this.finishTimeout) { clearTimeout(this.finishTimeout); this.finishTimeout = null; }
    if (this.lapNotifyTO) { clearTimeout(this.lapNotifyTO); this.lapNotifyTO = null; }
    if (this.bannerTO) { clearTimeout(this.bannerTO); this.bannerTO = null; }
    document.getElementById('lap-notify')?.classList.remove('show');
    document.getElementById('race-banner')?.classList.remove('show');

    // Clean up old entities
    if (this.ecsWorld) {
      for (const e of this.carEntities) {
        const rend = this.ecsWorld.getComponent(e, 'Renderable');
        if (rend) this.renderer.scene.remove(rend.group);
        const particles = this.ecsWorld.getComponent(e, 'ParticleSet');
        if (particles) {
          this.renderer.scene.remove(particles.exhaust.mesh);
          this.renderer.scene.remove(particles.smoke.mesh);
          this.renderer.scene.remove(particles.sparks.mesh);
        }
      }
      this.ecsWorld.destroy();
    }
    this.explosions.forEach(e => this.renderer.scene.remove(e.mesh));
    this.explosions = [];
    this.finishOrder = [];
    this.gTime = 0;

    // Load map
    this.trackManager.loadMap(
      this.selectedMap,
      this.renderer.scene,
      this.renderer.groundMesh,
      this.renderer.ambLight,
      this.renderer.dirLight,
    );

    // Create ECS world
    this.ecsWorld = new World();
    const SP = this.trackManager.SP;

    // Create entities
    this.carEntities = [];
    this.playerEntity = createPlayerCar(this.ecsWorld, this.renderer.scene, SP);
    this.carEntities.push(this.playerEntity);
    for (let i = 1; i < CAR_COUNT; i++) {
      this.carEntities.push(createAICar(this.ecsWorld, this.renderer.scene, SP, i));
    }

    // Add systems
    this.ecsWorld.addSystem(new VehicleSystem(this));
    this.ecsWorld.addSystem(new AISystem(this));
    this.ecsWorld.addSystem(new CollisionSystem(this));
    this.ecsWorld.addSystem(new LapSystem(this));
    this.ecsWorld.addSystem(new EffectSystem(this));
    this.ecsWorld.addSystem(new CameraSystem(this));
  }

  killCar(entity: Entity): void {
    const veh = this.ecsWorld.getComponent(entity, 'Vehicle')!;
    const tr = this.ecsWorld.getComponent(entity, 'Transform')!;
    const ph = this.ecsWorld.getComponent(entity, 'Physics')!;
    const prog = this.ecsWorld.getComponent(entity, 'TrackProgress')!;
    const rend = this.ecsWorld.getComponent(entity, 'Renderable')!;

    veh.dead = true;
    prog.done = true;
    ph.speed = 0;
    this.explosions.push(new Explosion(this.renderer.scene, tr.x, 0, tr.z));
    this.renderer.scene.remove(rend.group);

    if (veh.isPlayer) {
      this.showRaceBanner('\u{1F4A5} GAME OVER', '\uCC28\uB7C9\uC774 \uD30C\uAD34\uB410\uC2B5\uB2C8\uB2E4!', '#ff3300');
      setTimeout(() => {
        if (this.stateMachine.current === 'racing') {
          this.stateMachine.transition('finish');
          this.finishTimeout = window.setTimeout(() => this.showFinish(), 800);
        }
      }, 2000);
    }
  }

  showLapNotify(lapNum: number, lapTime: number): void {
    if (this.lapNotifyTO) clearTimeout(this.lapNotifyTO);
    const el = document.getElementById('lap-notify')!;
    const isFinal = lapNum === LAPS;
    if (isFinal) {
      el.classList.add('final-lap');
      el.querySelector('.ln-main')!.textContent = '\u{1F3C1} FINAL LAP';
      el.querySelector('.ln-sub')!.textContent = '\uB9C8\uC9C0\uB9C9 \uB7A9!';
    } else {
      el.classList.remove('final-lap');
      el.querySelector('.ln-main')!.textContent = `LAP ${lapNum}/${LAPS}`;
      el.querySelector('.ln-sub')!.textContent = lapTime > 0 ? `\uB7A9 \uD0C0\uC784: ${fmtTime(lapTime)}` : '';
    }
    el.classList.add('show');
    this.lapNotifyTO = window.setTimeout(() => el.classList.remove('show'), 2200);
  }

  showRaceBanner(t: string, s: string, c: string): void {
    if (this.bannerTO) clearTimeout(this.bannerTO);
    const el = document.getElementById('race-banner')!;
    const main = el.querySelector('.rb-main') as HTMLElement;
    main.textContent = t;
    main.style.color = c;
    main.style.textShadow = `0 0 50px ${c}, 0 0 15px ${c}`;
    el.querySelector('.rb-sub')!.textContent = s;
    el.classList.add('show');
    this.bannerTO = window.setTimeout(() => el.classList.remove('show'), 3000);
  }

  showFinish(): void {
    const allEntities = this.ecsWorld.query('Vehicle', 'TrackProgress');
    const ranked = allEntities
      .map(e => ({
        id: this.ecsWorld.getComponent(e, 'Vehicle')!.id,
        total: this.ecsWorld.getComponent(e, 'TrackProgress')!.total,
        color: this.ecsWorld.getComponent(e, 'Vehicle')!.color,
        name: this.ecsWorld.getComponent(e, 'Vehicle')!.name,
        dead: this.ecsWorld.getComponent(e, 'Vehicle')!.dead,
        lap: this.ecsWorld.getComponent(e, 'TrackProgress')!.lap,
      }))
      .sort((a, b) => b.total - a.total);

    const pl = this.ecsWorld.getComponent(this.playerEntity!, 'Vehicle')!;
    const plProg = this.ecsWorld.getComponent(this.playerEntity!, 'TrackProgress')!;
    const pD = pl.dead;
    const pF = plProg.lap >= LAPS;
    const pP = this.finishOrder.indexOf(0);
    const wl = document.getElementById('win-label')!;

    if (pD) {
      wl.textContent = 'GAME OVER';
      wl.style.color = '#ff3300';
      wl.style.textShadow = '0 0 40px #ff3300';
      document.getElementById('win-sub')!.textContent = '\uCC28\uB7C9\uC774 \uD30C\uAD34\uB410\uC2B5\uB2C8\uB2E4!';
    } else if (pF && pP === 0) {
      wl.textContent = '\u{1F3C6} VICTORY!';
      wl.style.color = '#ffe14d';
      wl.style.textShadow = '0 0 40px #ffe14d';
      document.getElementById('win-sub')!.textContent = `\uC644\uC8FC \uC2DC\uAC04: ${fmtTime(this.gTime)}  |  \uCD5C\uACE0 \uB7A9: ${plProg.bestLap < 9999 ? fmtTime(plProg.bestLap) : '--'}`;
    } else if (pF) {
      const pn = pP + 1;
      wl.textContent = `${pn}${pn === 2 ? 'ND' : pn === 3 ? 'RD' : 'TH'} PLACE`;
      wl.style.color = '#00e0ff';
      wl.style.textShadow = '0 0 40px #00e0ff';
      document.getElementById('win-sub')!.textContent = `\uC644\uC8FC \uC2DC\uAC04: ${fmtTime(this.gTime)}  |  \uCD5C\uACE0 \uB7A9: ${plProg.bestLap < 9999 ? fmtTime(plProg.bestLap) : '--'}`;
    } else {
      wl.textContent = 'RACE OVER';
      wl.style.color = '#ff3355';
      wl.style.textShadow = '0 0 40px #ff3355';
      document.getElementById('win-sub')!.textContent = '\uC544\uC27D\uB124\uC694! \uB2E4\uC2DC \uB3C4\uC804\uD558\uC138\uC694';
    }

    document.getElementById('result-board')!.innerHTML = ranked.map((c, i) =>
      `<div class="res-row"><span class="res-medal">${MEDALS[i]}</span><span class="res-name" style="color:${c.color}">${c.name}</span>${c.dead ? '<span style="color:#ff3300;font-size:9px">\u{1F4A5} DESTROYED</span>' : ''}</div>`
    ).join('');

    const mn = MAPS[this.selectedMap].name;
    let ni = -1;
    if (plProg.lap >= LAPS && plProg.bestLap < 9999) ni = addRecord(mn, this.gTime, plProg.bestLap);
    renderRecords(mn, ni);
    this.screens.show('s-finish');
  }

  update(dt: number): void {
    const state = this.stateMachine.current;

    if (state === 'start') {
      const t = performance.now() * 0.00025;
      this.renderer.camera.position.set(Math.cos(t) * 250, 85, Math.sin(t) * 250);
      this.renderer.camera.lookAt(0, 0, 0);
      this.renderer.render();
      return;
    }

    if (state === 'countdown') {
      // Camera follows player during countdown
      if (this.ecsWorld) {
        // Just update camera system
        const camSys = new CameraSystem(this);
        camSys.update(this.ecsWorld, 0);
      }
      this.renderer.render();
      return;
    }

    if (state === 'racing') {
      this.gTime += dt;
      this.ecsWorld.update(dt);
      this.hud.update(this);
      this.minimap.draw(this);

      // Check finish
      const entities = this.ecsWorld.query('Vehicle', 'TrackProgress');
      for (const entity of entities) {
        const veh = this.ecsWorld.getComponent(entity, 'Vehicle')!;
        const prog = this.ecsWorld.getComponent(entity, 'TrackProgress')!;
        if (prog.done && !this.finishOrder.includes(veh.id)) {
          this.finishOrder.push(veh.id);
          if (veh.id === 0) {
            this.stateMachine.transition('finish');
            this.finishTimeout = window.setTimeout(() => this.showFinish(), 2800);
          } else if (this.finishOrder.length === CAR_COUNT) {
            this.stateMachine.transition('finish');
            this.finishTimeout = window.setTimeout(() => this.showFinish(), 1200);
          }
        }
      }
      this.renderer.render();
      return;
    }

    if (state === 'finish') {
      this.ecsWorld.update(dt);
      this.hud.update(this);
      this.minimap.draw(this);
      this.renderer.render();
    }
  }
}
