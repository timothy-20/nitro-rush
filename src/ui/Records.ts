import { fmtTime } from '@/utils/format';

interface RecordEntry {
  time: number;
  lap: number;
  date: string;
}

const RECORDS: Record<string, RecordEntry[]> = {};

export function addRecord(name: string, time: number, bestLap: number): number {
  if (!RECORDS[name]) RECORDS[name] = [];
  RECORDS[name].push({ time, lap: bestLap, date: new Date().toLocaleDateString('ko-KR') });
  RECORDS[name].sort((a, b) => a.time - b.time);
  if (RECORDS[name].length > 10) RECORDS[name].length = 10;
  return RECORDS[name].findIndex(r => r.time === time && r.lap === bestLap);
}

export function renderRecords(name: string, newIdx: number): void {
  const l = document.getElementById('records-list')!;
  const r = RECORDS[name] || [];
  if (!r.length) {
    l.innerHTML = '<div style="color:#333;font-size:10px;text-align:center;padding:8px">\uAE30\uB85D \uC5C6\uC74C</div>';
    return;
  }
  l.innerHTML = r.map((x, i) =>
    `<div class="rec-row"><span class="rec-rank">${i + 1}</span><span class="rec-map">${name}</span><span class="rec-time">${fmtTime(x.time)}</span><span style="color:#555;font-size:9px">BL:${fmtTime(x.lap)}</span>${i === newIdx ? '<span class="rec-new">NEW!</span>' : ''}</div>`
  ).join('');
}
