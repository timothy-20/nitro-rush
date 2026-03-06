import { LAPS, CAR_COUNT } from '@/config/constants';
import { fmtTime } from '@/utils/format';
import type { Game } from '@/core/Game';

interface LbRow {
  root: HTMLDivElement;
  num: HTMLSpanElement;
  name: HTMLSpanElement;
  lap: HTMLSpanElement;
}

interface HpRow {
  root: HTMLDivElement;
  name: HTMLSpanElement;
  fill: HTMLDivElement;
  val: HTMLSpanElement;
}

export class HUD {
  private lbRows: LbRow[] = [];
  private hpRows: HpRow[] = [];

  constructor() {
    const lbContainer = document.getElementById('lb-rows')!;
    const hpContainer = document.getElementById('hp-wrap')!;
    lbContainer.innerHTML = '';
    hpContainer.innerHTML = '';

    for (let i = 0; i < CAR_COUNT; i++) {
      // Leaderboard row
      const lbRoot = document.createElement('div');
      lbRoot.className = 'lb-row';
      const lbNum = document.createElement('span');
      lbNum.className = 'lb-num';
      const lbName = document.createElement('span');
      lbName.className = 'lb-name';
      const lbLap = document.createElement('span');
      lbLap.className = 'lb-lap';
      lbRoot.append(lbNum, lbName, lbLap);
      lbContainer.appendChild(lbRoot);
      this.lbRows.push({ root: lbRoot, num: lbNum, name: lbName, lap: lbLap });

      // HP row
      const hpRoot = document.createElement('div');
      hpRoot.className = 'hp-row';
      const hpName = document.createElement('span');
      hpName.className = 'hp-name';
      const hpBarBg = document.createElement('div');
      hpBarBg.className = 'hp-bar-bg';
      const hpFill = document.createElement('div');
      hpFill.className = 'hp-bar-fill';
      hpBarBg.appendChild(hpFill);
      const hpVal = document.createElement('span');
      hpVal.className = 'hp-val';
      hpRoot.append(hpName, hpBarBg, hpVal);
      hpContainer.appendChild(hpRoot);
      this.hpRows.push({ root: hpRoot, name: hpName, fill: hpFill, val: hpVal });
    }
  }

  update(game: Game): void {
    const world = game.ecsWorld;
    const playerEntity = game.playerEntity;
    if (playerEntity === undefined) return;

    const veh = world.getComponent(playerEntity, 'Vehicle')!;
    const ph = world.getComponent(playerEntity, 'Physics')!;
    const prog = world.getComponent(playerEntity, 'TrackProgress')!;

    // Rank
    const allEntities = world.query('Vehicle', 'TrackProgress');
    const ranked = allEntities
      .map(e => ({ id: world.getComponent(e, 'Vehicle')!.id, total: world.getComponent(e, 'TrackProgress')!.total, color: world.getComponent(e, 'Vehicle')!.color, name: world.getComponent(e, 'Vehicle')!.name, lap: world.getComponent(e, 'TrackProgress')!.lap, dead: world.getComponent(e, 'Vehicle')!.dead, hp: world.getComponent(e, 'Vehicle')!.hp }))
      .sort((a, b) => b.total - a.total);
    const pos = ranked.findIndex(c => c.id === 0) + 1;

    const absSpd = Math.abs(ph.speed);
    const pct = Math.min(1, absSpd / ph.baseMaxSpeed);
    const kmh = Math.round(absSpd * 0.18);

    document.getElementById('lap-val')!.textContent = `${Math.min(prog.lap + 1, LAPS)}/${LAPS}`;
    document.getElementById('pos-val')!.textContent = `${pos}/4`;
    document.getElementById('spd-val')!.textContent = String(kmh);

    const sf = document.getElementById('spd-bar-fill')!;
    sf.style.width = Math.round(pct * 100) + '%';
    sf.classList.toggle('boosting', veh.boostActive > 0);

    document.getElementById('drift-indicator')!.classList.toggle('active', veh.drifting);
    document.getElementById('reverse-indicator')!.classList.toggle('active', ph.speed < -10);
    document.getElementById('view-indicator')!.textContent = game.fpsCam ? '\u{1F3CE}\uFE0F HOOD VIEW [Q]' : '\u{1F3A5} 3RD PERSON [Q]';

    const bp = veh.boostGauge, bOn = veh.boostActive > 0;
    const fl = document.getElementById('boost-bar-fill')!;
    fl.style.width = Math.round(bp * 100) + '%';
    fl.style.background = bOn ? 'linear-gradient(90deg,#ff2200,#ffee00)' : 'linear-gradient(90deg,#ff6600,#ffdd00)';
    fl.style.boxShadow = bOn ? '0 0 16px #ff4400' : '0 0 8px #ff6600';

    const lit = Math.ceil(bp * 7);
    for (let i = 0; i < 7; i++) document.getElementById('bp' + i)!.classList.toggle('lit', i < lit);
    document.getElementById('boost-label')!.textContent = bOn ? '\u{1F525} NITRO!' : (bp > 0.05 ? 'BOOST [SHIFT]' : 'DRIFT TO CHARGE');
    document.getElementById('race-timer')!.textContent = fmtTime(game.gTime);
    document.getElementById('best-lap-disp')!.textContent = `BEST LAP: ${prog.bestLap < 9999 ? fmtTime(prog.bestLap) : '--:--.---'}`;

    // Leaderboard — targeted DOM updates
    for (let i = 0; i < CAR_COUNT; i++) {
      const c = ranked[i];
      const row = this.lbRows[i];
      row.num.textContent = String(i + 1);
      row.name.textContent = c.name;
      row.name.style.color = c.color;
      row.lap.textContent = `L${Math.min(c.lap + 1, LAPS)}`;
    }

    // HP bars — targeted DOM updates
    for (let i = 0; i < CAR_COUNT; i++) {
      const c = ranked[i];
      const row = this.hpRows[i];
      const p2 = Math.max(0, c.hp);
      const col = p2 > 60 ? '#44ff88' : p2 > 30 ? '#ffe14d' : '#ff3355';
      row.name.textContent = c.name;
      row.name.style.color = c.color;
      row.fill.style.width = p2 + '%';
      row.fill.style.background = col;
      row.val.textContent = String(Math.round(p2));
    }
  }
}
