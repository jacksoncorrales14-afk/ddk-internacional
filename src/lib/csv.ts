// Utilidad simple para generar CSV sin dependencias externas.
// Incluye BOM UTF-8 para que Excel muestre tildes y eñes correctamente.

const BOM = "\uFEFF";

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Si contiene coma, comilla o salto de linea -> envolver en comillas y duplicar comillas internas
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convierte un arreglo de objetos a una cadena CSV.
 * @param rows arreglo de objetos
 * @param columns opcional: orden y etiquetas de columnas { key, label }
 */
export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns?: { key: keyof T; label: string }[]
): string {
  if (rows.length === 0 && !columns) return BOM;

  const cols =
    columns ||
    (Object.keys(rows[0] || {}) as (keyof T)[]).map((k) => ({
      key: k,
      label: String(k),
    }));

  const header = cols.map((c) => escapeCell(c.label)).join(",");
  const body = rows
    .map((row) => cols.map((c) => escapeCell(row[c.key])).join(","))
    .join("\r\n");

  return BOM + header + "\r\n" + body;
}

/**
 * Devuelve un nombre de archivo con fecha actual, e.g. "registros_2026-04-04.csv"
 */
export function csvFilename(base: string): string {
  const d = new Date();
  const iso = d.toISOString().slice(0, 10);
  return `${base}_${iso}.csv`;
}
