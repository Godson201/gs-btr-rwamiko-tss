import { BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';

export async function parseSpreadsheet(
  buffer: Buffer,
  filename: string,
): Promise<Record<string, string>[]> {
  const extension = filename.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    const records = parse(buffer, {
      columns: (header: string[]) => header.map((column) => column.trim()),
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];
    return records;
  }

  if (extension === 'xlsx' || extension === 'xls') {
    const workbook = new ExcelJS.Workbook();
    // exceljs's .d.ts declares its own local `Buffer extends ArrayBuffer` shadow type that
    // doesn't structurally match Node's real Buffer (a Uint8Array subclass) — the runtime
    // accepts a real Buffer fine, only the type definition is wrong.
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return [];
    }

    const rows: Record<string, string>[] = [];
    const headerRow = sheet.getRow(1);
    const headers = headerRow.values as (string | undefined)[];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const record: Record<string, string> = {};
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          record[String(header).trim()] = cell.text?.trim() ?? '';
        }
      });
      if (Object.keys(record).length > 0) {
        rows.push(record);
      }
    });

    return rows;
  }

  throw new BadRequestException('Unsupported file type. Please upload a .csv or .xlsx file.');
}
