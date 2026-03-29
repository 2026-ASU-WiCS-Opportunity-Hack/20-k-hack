import Papa from "papaparse";

export interface ClientCSVRow {
  name: string;
  date_of_birth: string;
  phone: string;
  email: string;
  household_size: string;
  language: string;
  notes: string;
}

export const CSV_HEADERS: (keyof ClientCSVRow)[] = [
  "name", "date_of_birth", "phone", "email", "household_size", "language", "notes",
];

export function exportToCSV(clients: Partial<ClientCSVRow>[]): string {
  const rows = clients.map((c) =>
    CSV_HEADERS.reduce((acc, key) => {
      acc[key] = (c[key] as string) ?? "";
      return acc;
    }, {} as ClientCSVRow)
  );
  return Papa.unparse(rows, { header: true, columns: CSV_HEADERS });
}

export function parseCSV(csvText: string): Promise<{ data: ClientCSVRow[]; errors: string[] }> {
  return new Promise((resolve) => {
    Papa.parse<ClientCSVRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
      complete: (results) => {
        const errors: string[] = [];
        results.data.forEach((row, i) => {
          if (!row.name?.trim()) errors.push(`Row ${i + 2}: name is required`);
        });
        resolve({ data: results.data, errors });
      },
      error: (err) => resolve({ data: [], errors: [err.message] }),
    });
  });
}

export function downloadCSV(csvString: string, filename: string) {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadTemplate() {
  const template = Papa.unparse(
    [CSV_HEADERS.reduce((acc, key) => { acc[key] = ""; return acc; }, {} as ClientCSVRow)],
    { header: true, columns: CSV_HEADERS }
  );
  downloadCSV(template, "safecase_import_template.csv");
}