import { MAPS } from '@/tracks/data';
import { drawTrackPreview } from '@/tracks/TrackPreview';

export class Screens {
  constructor() {
    this.createDOM();
  }

  private createDOM(): void {
    const body = document.body;
    const canvas = document.getElementById('c')!;

    // HUD
    const hud = this.el('div', { id: 'hud', class: 'hidden' });
    hud.innerHTML = `
      <div id="top-bar">
        <div class="hud-block"><div class="hud-label">LAP</div><div class="hud-val" id="lap-val">1/3</div></div>
        <div class="hud-block"><div class="hud-label">POSITION</div><div class="hud-val" id="pos-val">1/4</div></div>
        <div class="hud-block"><div class="hud-label">KM/H</div><div class="hud-val" id="spd-val">0</div></div>
      </div>
      <div id="drift-indicator">\u27E8 DRIFT \u27E9</div>
      <div id="reverse-indicator">\u25C0\u25C0 REVERSE</div>
      <div id="view-indicator">\u{1F3A5} 3RD PERSON [Q]</div>
      <div id="lap-notify"><div class="ln-main"></div><div class="ln-sub"></div></div>
      <div id="race-banner"><div class="rb-main"></div><div class="rb-sub"></div></div>
      <div id="right-hud">
        <div class="hud-panel">
          <div class="hud-panel-label">SPEED</div>
          <div id="spd-bar-bg"><div id="spd-bar-fill"></div><div id="spd-limit-line"></div></div>
        </div>
        <div class="hud-panel">
          <div id="boost-label">DRIFT TO CHARGE</div>
          <div id="boost-bar-bg"><div id="boost-bar-fill"></div></div>
          <div id="boost-pips">
            <div class="boost-pip" id="bp0"></div><div class="boost-pip" id="bp1"></div>
            <div class="boost-pip" id="bp2"></div><div class="boost-pip" id="bp3"></div>
            <div class="boost-pip" id="bp4"></div><div class="boost-pip" id="bp5"></div>
            <div class="boost-pip" id="bp6"></div>
          </div>
        </div>
        <div class="hud-panel" id="hp-panel">
          <div class="hud-panel-label">HP</div>
          <div id="hp-wrap"></div>
        </div>
      </div>
      <div id="lb"><div id="lb-title">STANDINGS</div><div id="lb-rows"></div></div>
      <canvas id="minimap" width="150" height="120"></canvas>
      <div id="race-timer">00:00.000</div>
      <div id="best-lap-disp">BEST LAP: --:--.---</div>
    `;
    body.appendChild(hud);

    // Start screen
    const sStart = this.el('div', { class: 'screen', id: 's-start' });
    let mapCards = '';
    MAPS.forEach((m, i) => {
      mapCards += `<div class="map-card${i === 0 ? ' selected' : ''}" data-map="${i}">
        <div class="map-preview"><canvas width="200" height="160"></canvas><div class="map-preview-label">TRACK LAYOUT</div></div>
        <div class="map-icon">${m.emoji}</div><div class="map-name">${m.name}</div><div class="map-desc">${['항구 시가지 서킷', '테크니컬 S커브', '사막 고속 서킷'][i]}</div>
      </div>`;
    });
    sStart.innerHTML = `
      <div class="game-title"><span class="title-n">NITRO</span><br><span class="title-r">RUSH 3D</span></div>
      <div class="sub-text">3 LAPS \u00B7 4 CARS \u00B7 FULL 3D RACING</div>
      <div id="map-select">${mapCards}</div>
      <button class="press-btn" id="start-btn">[ SPACE ] 또는 클릭하여 시작</button>
      <div class="hint">\u2191가속 \u00B7 \u2193후진 \u00B7 \u2190\u2192방향 \u00B7 SPACE 브레이크 \u00B7 SPACE+\u2190\u2192 드리프트 \u2192 게이지 충전 \u00B7 SHIFT 니트로 발동 \u00B7 Q 1인칭/3인칭 전환</div>
    `;
    body.appendChild(sStart);

    // Countdown screen
    const sCd = this.el('div', { class: 'screen hidden', id: 's-cd' });
    sCd.innerHTML = `<div id="cd-num">3</div><div id="cd-sub">\uC900\uBE44\uD558\uC138\uC694!</div>`;
    body.appendChild(sCd);

    // Finish screen
    const sFin = this.el('div', { class: 'screen hidden', id: 's-finish' });
    sFin.innerHTML = `
      <div id="win-label">RACE OVER</div><div id="win-sub">\uCD5C\uC885 \uACB0\uACFC</div>
      <div id="result-board"></div>
      <div id="records-panel"><h3>\u{1F3C6} BEST TIMES</h3><div id="records-list"></div></div>
      <div class="btn-row">
        <button class="action-btn btn-restart" id="btn-restart">\u21BA 다시하기</button>
        <button class="action-btn btn-menu" id="btn-menu">메인 메뉴</button>
      </div>
    `;
    body.appendChild(sFin);

    // Mobile controls
    const mc = this.el('div', { id: 'mobile-ctrl' });
    mc.innerHTML = `
      <div class="mc-btn" id="mc-left">\u25C0</div>
      <div style="flex:2;display:flex;flex-direction:column">
        <div class="mc-btn" id="mc-up" style="flex:1">\u25B2</div>
        <div class="mc-btn" id="mc-down" style="flex:1">\u25BC</div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column">
        <div class="mc-btn" id="mc-brake" style="flex:1;color:rgba(255,150,0,.3);font-size:10px;letter-spacing:1px">DRIFT<br>BRAKE</div>
        <div class="mc-btn" id="mc-right" style="flex:1">\u25B6</div>
      </div>
    `;
    body.appendChild(mc);
  }

  private el(tag: string, attrs: Record<string, string>): HTMLElement {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else e.setAttribute(k, v);
    }
    return e;
  }

  show(id: string | null): void {
    ['s-start', 's-cd', 's-finish'].forEach(s =>
      document.getElementById(s)?.classList.add('hidden')
    );
    document.getElementById('hud')?.classList.add('hidden');
    if (id) {
      document.getElementById(id)?.classList.remove('hidden');
    } else {
      document.getElementById('hud')?.classList.remove('hidden');
    }
  }

  initPreviews(): void {
    document.querySelectorAll('.map-card').forEach(card => {
      const idx = parseInt((card as HTMLElement).dataset.map!);
      const canvas = card.querySelector('.map-preview canvas') as HTMLCanvasElement;
      if (canvas) drawTrackPreview(canvas, MAPS[idx]);
    });
  }
}
