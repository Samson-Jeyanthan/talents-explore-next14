/** The mobile app's Town selector uses the backend's legacy `state` values. */
export function townOptions(rows: unknown): { _id: string; name: string }[] {
  if (!Array.isArray(rows)) return [];
  const names = rows.flatMap((row) => {
    const value = typeof row === "string" ? row : row?.state || row?.name;
    return typeof value === "string" && value.trim() ? [value.trim()] : [];
  });
  return Array.from(new Set(names))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ _id: name, name }));
}
