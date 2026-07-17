/**
 * Excel Workbook Exporter
 *
 * Builds a multi-sheet .xlsx file with:
 *   Sheet 1 — Summary (KPIs + key stats)
 *   Sheet 2 — Trade Journal (all trades, formatted)
 *   Sheet 3 — Equity Curve (date + cumulative PnL)
 *   Sheet 4 — Strategy Performance
 *   Sheet 5 — Session Performance
 *   Sheet 6 — Pair Performance
 *   Sheet 7 — Emotion Impact
 *   Sheet 8 — Analytics (win rate, profit factor etc.)
 *
 * Uses ExcelJS to create a real styled Excel file
 * (not CSV — preserves colors, bold headers, formats as .xlsx)
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { JournalSettings, Strategy, Trade } from '../types';
import {
  computeStats, equityCurve, pnlByPair, pnlBySession, pnlByStrategy, emotionImpact,
} from './stats';
import { formatMoney, formatPercent } from './stats';

interface ExportOptions {
  user: { username: string; displayName: string; email?: string };
  trades: Trade[];
  strategies: Strategy[];
  settings: JournalSettings;
  period?: 'all' | 'week' | 'month' | 'year';
}

const C = {
  amber:   'FFFBBF24',
  gold:    'FFD4AF37',
  cyan:    'FF22D3EE',
  emerald: 'FF34D399',
  rose:    'FFF87171',
  violet:  'FFA78BFA',
  dark:    'FF050A14',
  darkMid: 'FF0B1525',
  darkRow: 'FF0F1A2A',
  white:   'FFFFFFFF',
  slate:   'FF94A3B8',
  slate2:  'FF64748B',
  border:  'FF1E293B',
};

function fillRow(row: ExcelJS.Row, color: string) {
  for (let i = 1; i <= row.cellCount; i++) {
    row.getCell(i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
  }
}

function setBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top:    { style: 'thin', color: { argb: C.border } },
    bottom: { style: 'thin', color: { argb: C.border } },
    left:   { style: 'thin', color: { argb: C.border } },
    right:  { style: 'thin', color: { argb: C.border } },
  };
}

function headerStyle(cell: ExcelJS.Cell) {
  cell.font = { bold: true, color: { argb: C.dark }, size: 11 };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.amber } };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  cell.border = {
    top:    { style: 'medium', color: { argb: C.amber } },
    bottom: { style: 'medium', color: { argb: C.amber } },
    left:   { style: 'thin',   color: { argb: C.amber } },
    right:  { style: 'thin',   color: { argb: C.amber } },
  };
}

function setHeader(ws: ExcelJS.Worksheet, row: number, headers: string[]) {
  ws.getRow(row).values = headers;
  ws.getRow(row).height = 24;
  for (let i = 1; i <= headers.length; i++) {
    headerStyle(ws.getRow(row).getCell(i));
  }
}

export async function exportToExcel(opts: ExportOptions): Promise<void> {
  const { user, trades, strategies, settings, period = 'all' } = opts;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'The Fools Hunting Room';
  wb.lastModifiedBy = user.displayName;
  wb.created = new Date();
  wb.modified = new Date();

  // Filter trades by period
  const now = new Date();
  let from = new Date(0);
  if (period === 'week')  { from = new Date(now); from.setDate(from.getDate() - 7); }
  if (period === 'month') { from = new Date(now); from.setMonth(from.getMonth() - 1); }
  if (period === 'year')  { from = new Date(now); from.setFullYear(from.getFullYear() - 1); }
  const filtered = trades.filter(t => {
    const d = new Date(t.closeTime || t.openTime);
    return t.status === 'closed' && d >= from;
  });
  const stats = computeStats(filtered);
  const equity = equityCurve(filtered);

  /* ════════════════════════════════════
     SHEET 1 — SUMMARY
  ════════════════════════════════════ */
  const ws1 = wb.addWorksheet('Summary', { properties: { tabColor: { argb: C.amber } } });
  ws1.columns = [
    { width: 28 }, { width: 22 }, { width: 18 }, { width: 22 },
  ];

  // Big title
  ws1.mergeCells('A1:D1');
  const title = ws1.getCell('A1');
  title.value = '⚔️ THE FOOLS HUNTING ROOM — PERFORMANCE REPORT';
  title.font = { bold: true, size: 16, color: { argb: C.amber } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.dark } };
  ws1.getRow(1).height = 32;

  ws1.mergeCells('A2:D2');
  const sub = ws1.getCell('A2');
  sub.value = `Generated for ${user.displayName} (@${user.username}) · ${new Date().toLocaleString()}`;
  sub.font = { italic: true, color: { argb: C.slate } };
  sub.alignment = { horizontal: 'center' };
  sub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.dark } };
  ws1.getRow(2).height = 20;

  // Key metrics
  ws1.getCell('A4').value = 'KEY METRICS';
  ws1.mergeCells('A4:D4');
  ws1.getCell('A4').font = { bold: true, size: 12, color: { argb: C.amber } };
  ws1.getCell('A4').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.darkMid } };

  const kpiRows: [string, string, string][] = [
    ['Total PnL',       formatMoney(stats.totalPnl, settings.accountCurrency), stats.totalPnl >= 0 ? '▲ PROFIT' : '▼ LOSS'],
    ['Win Rate',        formatPercent(stats.winRate),                       stats.winRate >= 50 ? '✓ EDGE' : '✗ WEAK'],
    ['Profit Factor',   stats.profitFactor.toFixed(2),                       stats.profitFactor >= 1.5 ? '✓ STRONG' : stats.profitFactor >= 1 ? '◐ OK' : '✗ POOR'],
    ['Total Trades',    String(filtered.length),                             '—'],
    ['Expectancy',      formatMoney(stats.expectancy, settings.accountCurrency), stats.expectancy >= 0 ? '✓ POSITIVE' : '✗ NEGATIVE'],
    ['Max Drawdown',    formatMoney(stats.maxDrawdown, settings.accountCurrency), '—'],
    ['Discipline',      formatPercent(stats.planAdherence),                 stats.planAdherence >= 70 ? '✓ STRONG' : '◐ OK'],
    ['Best Trade',      formatMoney(stats.bestTrade, settings.accountCurrency),   '—'],
    ['Worst Trade',     formatMoney(stats.worstTrade, settings.accountCurrency),  '—'],
    ['Total Pips',      stats.totalPips.toFixed(1), '—'],
  ];

  kpiRows.forEach((r, i) => {
    const row = 5 + i;
    ws1.getCell(`A${row}`).value = r[0];
    ws1.getCell(`B${row}`).value = r[1];
    ws1.mergeCells(`C${row}:D${row}`);
    ws1.getCell(`C${row}`).value = r[2];

    ws1.getCell(`A${row}`).font = { bold: true, color: { argb: C.slate } };
    setBorder(ws1.getCell(`A${row}`));
    setBorder(ws1.getCell(`B${row}`));
    setBorder(ws1.getCell(`C${row}`));

    // color value
    if (r[0] === 'Total PnL' || r[0] === 'Expectancy' || r[0] === 'Best Trade') {
      ws1.getCell(`B${row}`).font = { bold: true, color: { argb: r[1].includes('-') ? C.rose : C.emerald }, size: 12 };
    } else {
      ws1.getCell(`B${row}`).font = { bold: true, color: { argb: C.white }, size: 11 };
    }
    ws1.getCell(`B${row}`).alignment = { horizontal: 'right' };

    // alternate row fill
    if (i % 2 === 0) fillRow(ws1.getRow(row), C.darkRow);
  });

  // Period info
  const startRow = 5 + kpiRows.length + 1;
  ws1.getCell(`A${startRow}`).value = 'Period';
  ws1.mergeCells(`B${startRow}:D${startRow}`);
  ws1.getCell(`B${startRow}`).value = period === 'all' ? 'All Time' : `Last ${period}`;
  ws1.getCell(`A${startRow}`).font = { bold: true, color: { argb: C.slate } };
  ws1.getCell(`B${startRow}`).font = { color: { argb: C.cyan }, bold: true };
  fillRow(ws1.getRow(startRow), C.darkMid);

  ws1.getCell(`A${startRow + 1}`).value = 'Account Currency';
  ws1.mergeCells(`B${startRow + 1}:D${startRow + 1}`);
  ws1.getCell(`B${startRow + 1}`).value = settings.accountCurrency;
  ws1.getCell(`A${startRow + 1}`).font = { bold: true, color: { argb: C.slate } };
  ws1.getCell(`B${startRow + 1}`).font = { color: { argb: C.white } };
  fillRow(ws1.getRow(startRow + 1), C.darkRow);

  /* ════════════════════════════════════
     SHEET 2 — TRADE JOURNAL
  ════════════════════════════════════ */
  const ws2 = wb.addWorksheet('Trade Journal', { properties: { tabColor: { argb: C.cyan } } });
  ws2.columns = [
    { width: 8 }, { width: 18 }, { width: 12 }, { width: 12 }, { width: 12 },
    { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },
    { width: 10 }, { width: 10 }, { width: 10 }, { width: 18 },
    { width: 15 }, { width: 18 }, { width: 12 }, { width: 12 },
    { width: 25 }, { width: 25 }, { width: 12 },
  ];

  setHeader(ws2, 1, [
    '#', 'Pair', 'Direction', 'Status', 'Result', 'Open Time', 'Close Time',
    'Entry', 'Exit', 'Lots', 'SL', 'TP', 'R:R',
    'Pips', 'PnL', 'Session', 'Timeframe', 'Strategy', 'Setup', 'Notes',
  ]);
  ws2.views = [{ state: 'frozen', ySplit: 1 }];

  filtered
    .sort((a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime())
    .forEach((t, i) => {
      const r = i + 2;
      ws2.getCell(`A${r}`).value = i + 1;
      ws2.getCell(`B${r}`).value = t.pair;
      ws2.getCell(`C${r}`).value = t.direction;
      ws2.getCell(`D${r}`).value = t.status;
      ws2.getCell(`E${r}`).value = t.result || '—';
      ws2.getCell(`F${r}`).value = new Date(t.openTime);
      ws2.getCell(`F${r}`).numFmt = 'yyyy-mm-dd hh:mm';
      ws2.getCell(`G${r}`).value = t.closeTime ? new Date(t.closeTime) : null;
      if (t.closeTime) ws2.getCell(`G${r}`).numFmt = 'yyyy-mm-dd hh:mm';
      ws2.getCell(`H${r}`).value = t.entryPrice;
      ws2.getCell(`I${r}`).value = t.exitPrice ?? null;
      ws2.getCell(`J${r}`).value = t.lotSize;
      ws2.getCell(`K${r}`).value = t.stopLoss;
      ws2.getCell(`L${r}`).value = t.takeProfit;
      ws2.getCell(`M${r}`).value = t.riskReward ?? null;
      ws2.getCell(`N${r}`).value = t.pips ?? null;
      ws2.getCell(`O${r}`).value = t.pnl ?? null;
      ws2.getCell(`P${r}`).value = t.session;
      ws2.getCell(`Q${r}`).value = t.timeframe;
      ws2.getCell(`R${r}`).value = t.strategy;
      ws2.getCell(`S${r}`).value = t.setup;
      ws2.getCell(`T${r}`).value = t.notes;

      // style each cell
      for (let c = 1; c <= 20; c++) setBorder(ws2.getRow(r).getCell(c));

      // color result column
      const eCell = ws2.getCell(`E${r}`);
      if (t.result === 'win')       eCell.font = { bold: true, color: { argb: C.emerald } };
      else if (t.result === 'loss') eCell.font = { bold: true, color: { argb: C.rose } };
      else                         eCell.font = { color: { argb: C.slate } };

      // color direction
      const dCell = ws2.getCell(`C${r}`);
      dCell.font = { bold: true, color: { argb: t.direction === 'long' ? C.emerald : C.rose } };

      // color PnL
      const pCell = ws2.getCell(`O${r}`);
      if ((t.pnl ?? 0) > 0) pCell.font = { bold: true, color: { argb: C.emerald } };
      else if ((t.pnl ?? 0) < 0) pCell.font = { bold: true, color: { argb: C.rose } };
      pCell.numFmt = '"$"#,##0.00';

      // format numbers
      ws2.getCell(`H${r}`).numFmt = '0.00000';
      ws2.getCell(`I${r}`).numFmt = '0.00000';
      ws2.getCell(`K${r}`).numFmt = '0.00000';
      ws2.getCell(`L${r}`).numFmt = '0.00000';
      ws2.getCell(`J${r}`).numFmt = '0.00';
      ws2.getCell(`M${r}`).numFmt = '0.00';
      ws2.getCell(`N${r}`).numFmt = '0.0';

      // alternate fill
      if (i % 2 === 0) {
        for (let c = 1; c <= 20; c++) {
          ws2.getRow(r).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.darkRow } };
        }
      }
    });

  /* ════════════════════════════════════
     SHEET 3 — EQUITY CURVE
  ════════════════════════════════════ */
  const ws3 = wb.addWorksheet('Equity Curve', { properties: { tabColor: { argb: C.emerald } } });
  ws3.columns = [{ width: 14 }, { width: 18 }, { width: 18 }];
  setHeader(ws3, 1, ['Date', 'Cumulative PnL', 'Daily PnL']);

  equity.forEach((e, i) => {
    const r = i + 2;
    ws3.getCell(`A${r}`).value = e.date;
    ws3.getCell(`B${r}`).value = e.equity;
    ws3.getCell(`B${r}`).numFmt = '"$"#,##0.00';
    ws3.getCell(`C${r}`).value = e.pnl;
    ws3.getCell(`C${r}`).numFmt = '"$"#,##0.00';

    for (let c = 1; c <= 3; c++) setBorder(ws3.getRow(r).getCell(c));
    if (e.equity >= 0) ws3.getCell(`B${r}`).font = { color: { argb: C.emerald } };
    else               ws3.getCell(`B${r}`).font = { color: { argb: C.rose } };
    if (e.pnl >= 0)    ws3.getCell(`C${r}`).font = { color: { argb: C.emerald } };
    else               ws3.getCell(`C${r}`).font = { color: { argb: C.rose } };

    if (i % 2 === 0) {
      for (let c = 1; c <= 3; c++) {
        ws3.getRow(r).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.darkRow } };
      }
    }
  });

  /* ════════════════════════════════════
     SHEET 4 — STRATEGY PERFORMANCE
  ════════════════════════════════════ */
  const ws4 = wb.addWorksheet('Strategies', { properties: { tabColor: { argb: C.violet } } });
  ws4.columns = [{ width: 24 }, { width: 12 }, { width: 14 }, { width: 12 }, { width: 12 }];
  setHeader(ws4, 1, ['Strategy', 'Trades', 'Win Rate', 'Avg R:R', 'Total PnL']);

  pnlByStrategy(filtered).forEach((s, i) => {
    const r = i + 2;
    ws4.getCell(`A${r}`).value = s.strategy;
    ws4.getCell(`B${r}`).value = s.count;
    ws4.getCell(`C${r}`).value = s.winRate / 100;
    ws4.getCell(`C${r}`).numFmt = '0.0%';
    ws4.getCell(`D${r}`).value = '—';
    ws4.getCell(`E${r}`).value = s.pnl;
    ws4.getCell(`E${r}`).numFmt = '"$"#,##0.00';
    for (let c = 1; c <= 5; c++) setBorder(ws4.getRow(r).getCell(c));
    ws4.getCell(`A${r}`).font = { bold: true, color: { argb: C.white } };
    ws4.getCell(`E${r}`).font = { bold: true, color: { argb: s.pnl >= 0 ? C.emerald : C.rose } };
    if (i % 2 === 0) for (let c = 1; c <= 5; c++) {
      ws4.getRow(r).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.darkRow } };
    }
  });

  /* ════════════════════════════════════
     SHEET 5 — SESSION PERFORMANCE
  ════════════════════════════════════ */
  const ws5 = wb.addWorksheet('Sessions', { properties: { tabColor: { argb: C.cyan } } });
  ws5.columns = [{ width: 18 }, { width: 12 }, { width: 14 }];
  setHeader(ws5, 1, ['Session', 'Trades', 'Total PnL']);

  pnlBySession(filtered).forEach((s, i) => {
    const r = i + 2;
    ws5.getCell(`A${r}`).value = s.session;
    ws5.getCell(`B${r}`).value = s.count;
    ws5.getCell(`C${r}`).value = s.pnl;
    ws5.getCell(`C${r}`).numFmt = '"$"#,##0.00';
    for (let c = 1; c <= 3; c++) setBorder(ws5.getRow(r).getCell(c));
    ws5.getCell(`A${r}`).font = { bold: true, color: { argb: C.cyan }, size: 11 };
    ws5.getCell(`A${r}`).alignment = { horizontal: 'center' };
    ws5.getCell(`C${r}`).font = { bold: true, color: { argb: s.pnl >= 0 ? C.emerald : C.rose } };
    if (i % 2 === 0) for (let c = 1; c <= 3; c++) {
      ws5.getRow(r).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.darkRow } };
    }
  });

  /* ════════════════════════════════════
     SHEET 6 — PAIR PERFORMANCE
  ════════════════════════════════════ */
  const ws6 = wb.addWorksheet('Pairs', { properties: { tabColor: { argb: C.amber } } });
  ws6.columns = [{ width: 14 }, { width: 12 }, { width: 14 }];
  setHeader(ws6, 1, ['Pair', 'Trades', 'Total PnL']);

  pnlByPair(filtered).forEach((p, i) => {
    const r = i + 2;
    ws6.getCell(`A${r}`).value = p.pair;
    ws6.getCell(`B${r}`).value = p.count;
    ws6.getCell(`C${r}`).value = p.pnl;
    ws6.getCell(`C${r}`).numFmt = '"$"#,##0.00';
    for (let c = 1; c <= 3; c++) setBorder(ws6.getRow(r).getCell(c));
    ws6.getCell(`A${r}`).font = { bold: true, color: { argb: C.amber }, size: 11 };
    ws6.getCell(`C${r}`).font = { bold: true, color: { argb: p.pnl >= 0 ? C.emerald : C.rose } };
    if (i % 2 === 0) for (let c = 1; c <= 3; c++) {
      ws6.getRow(r).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.darkRow } };
    }
  });

  /* ════════════════════════════════════
     SHEET 7 — EMOTION IMPACT
  ════════════════════════════════════ */
  const ws7 = wb.addWorksheet('Psychology', { properties: { tabColor: { argb: C.violet } } });
  ws7.columns = [{ width: 18 }, { width: 12 }, { width: 14 }, { width: 14 }];
  setHeader(ws7, 1, ['Emotion', 'Trades', 'Win Rate', 'Total PnL']);

  emotionImpact(filtered).forEach((e, i) => {
    const r = i + 2;
    ws7.getCell(`A${r}`).value = e.emotion;
    ws7.getCell(`B${r}`).value = e.count;
    ws7.getCell(`C${r}`).value = e.winRate / 100;
    ws7.getCell(`C${r}`).numFmt = '0.0%';
    ws7.getCell(`D${r}`).value = e.pnl;
    ws7.getCell(`D${r}`).numFmt = '"$"#,##0.00';
    for (let c = 1; c <= 4; c++) setBorder(ws7.getRow(r).getCell(c));
    ws7.getCell(`A${r}`).font = { bold: true, color: { argb: C.white }, size: 11 };
    ws7.getCell(`A${r}`).alignment = { horizontal: 'center' };
    ws7.getCell(`D${r}`).font = { bold: true, color: { argb: e.pnl >= 0 ? C.emerald : C.rose } };
    if (i % 2 === 0) for (let c = 1; c <= 4; c++) {
      ws7.getRow(r).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.darkRow } };
    }
  });

  /* ════════════════════════════════════
     SHEET 8 — STRATEGIES (PLAYBOOK)
  ════════════════════════════════════ */
  const ws8 = wb.addWorksheet('Playbook', { properties: { tabColor: { argb: C.gold } } });
  ws8.columns = [{ width: 22 }, { width: 40 }, { width: 50 }];
  setHeader(ws8, 1, ['Strategy', 'Description', 'Rules']);

  strategies.forEach((s, i) => {
    const r = i + 2;
    ws8.getCell(`A${r}`).value = s.name;
    ws8.getCell(`B${r}`).value = s.description;
    ws8.getCell(`C${r}`).value = s.rules.map((rl, k) => `${k + 1}. ${rl}`).join('\n');
    ws8.getCell(`C${r}`).alignment = { wrapText: true, vertical: 'top' };
    ws8.getRow(r).height = 100;
    for (let c = 1; c <= 3; c++) setBorder(ws8.getRow(r).getCell(c));
    ws8.getCell(`A${r}`).font = { bold: true, color: { argb: C.amber }, size: 12 };
    ws8.getCell(`B${r}`).font = { color: { argb: C.white } };
    ws8.getCell(`C${r}`).font = { color: { argb: C.slate }, size: 9 };
    if (i % 2 === 0) for (let c = 1; c <= 3; c++) {
      ws8.getRow(r).getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.darkRow } };
    }
  });

  /* ─── Save as .xlsx ─── */
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fname = `fools-hunting-room-${period}-${user.username}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  saveAs(blob, fname);
}
