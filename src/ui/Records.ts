import { fmtTime } from '@/utils/format';

interface RecordEntry {
  time: number;
  lap: number;
  date: string;
}

const STORAGE_KEY = 'nitro-rush-records';

function loadRecords(): Record<string, RecordEntry[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore corrupt data */ }
  return {};
}

function saveRecords(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(RECORDS));
  } catch { /* storage full or unavailable */ }
}

const RECORDS: Record<string, RecordEntry[]> = loadRecords();

export function addRecord(name: string, time: number, bestLap: number): number {
  if (!RECORDS[name]) RECORDS[name] = [];
  const entry: RecordEntry = { time, lap: bestLap, date: new Date().toLocaleDateString('ko-KR') };
  RECORDS[name].push(entry);
  RECORDS[name].sort((a, b) => a.time - b.time);
  if (RECORDS[name].length > 10) RECORDS[name].length = 10;
  saveRecords();
  return RECORDS[name].indexOf(entry);
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
