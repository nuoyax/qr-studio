import * as XLSX from "xlsx";

export interface RowRecord {
  [key: string]: string | number | boolean | null;
}

/**
 * Read an .xlsx file into an array of row objects, keyed by header.
 * The first worksheet is used. Returns [] if the sheet is empty.
 */
export function readXlsx(file: File): Promise<RowRecord[]> {
  return file
    .arrayBuffer()
    .then((buf) => XLSX.read(buf, { type: "array" }))
    .then((wb) => {
      const firstSheetName = wb.SheetNames[0];
      if (!firstSheetName) return [];
      const ws = wb.Sheets[firstSheetName];
      return XLSX.utils.sheet_to_json<RowRecord>(ws, { defval: "" });
    });
}

/**
 * Read a plain-text file (one entry per line, or CSV first-column).
 * Used for bulk text imports (.txt / .csv) into the generator.
 */
export function readTextLines(file: File): Promise<string[]> {
  return file.text().then((text) =>
    text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0),
  );
}

/**
 * Read a CSV file and return the first column of every non-empty row.
 */
export function readCsvFirstColumn(file: File): Promise<string[]> {
  return file.text().then((text) =>
    text
      .split(/\r?\n/)
      .map((line) => line.split(",")[0]?.trim() ?? "")
      .filter((v) => v.length > 0),
  );
}

/**
 * Write rows to an .xlsx workbook and trigger a browser download.
 */
export function writeXlsx(rows: RowRecord[], fileName = "qrcode-results.xlsx") {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "results");
  XLSX.writeFile(wb, fileName);
}

/**
 * Export raw text rows to .xlsx (single column "Content").
 */
export function exportTextToXlsx(items: string[], fileName = "qrcode-content.xlsx") {
  const rows: RowRecord[] = items.map((text, i) => ({
    "#": i + 1,
    Content: text,
  }));
  writeXlsx(rows, fileName);
}
