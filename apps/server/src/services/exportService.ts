import ExcelJS from 'exceljs';
import type { QueryResult } from '@querydash/types';

const NUMERIC_TYPES = new Set(['integer', 'float']);
const DATE_TYPES = new Set(['date', 'datetime']);

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(result: QueryResult): string {
  const header = result.columns.map((c) => csvEscape(c.name)).join(',');
  const lines = result.rows.map((row) => result.columns.map((c) => csvEscape(row[c.name])).join(','));
  // UTF-8 BOM so Excel on Windows opens Korean text correctly instead of mojibake.
  return '﻿' + [header, ...lines].join('\r\n');
}

export function buildJson(result: QueryResult): string {
  return JSON.stringify(result.rows, null, 2);
}

export async function buildExcel(result: QueryResult, sheetName: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const safeName = sheetName.replace(/[\\/*?:[\]]/g, '_').slice(0, 31) || 'Sheet1';
  const sheet = workbook.addWorksheet(safeName);

  sheet.columns = result.columns.map((col) => ({
    header: col.name,
    key: col.name,
    width: Math.min(40, Math.max(10, col.name.length + 4)),
  }));
  sheet.getRow(1).font = { bold: true };

  for (const row of result.rows) {
    sheet.addRow(result.columns.map((c) => row[c.name]));
  }

  result.columns.forEach((col, idx) => {
    const column = sheet.getColumn(idx + 1);
    if (NUMERIC_TYPES.has(col.type)) {
      column.numFmt = '#,##0.00';
    } else if (DATE_TYPES.has(col.type)) {
      column.numFmt = col.type === 'date' ? 'yyyy-mm-dd' : 'yyyy-mm-dd hh:mm:ss';
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
