export type ProfileOptionKind = "language" | "profession";
export type ProfileOption = { _id: string; name: string };
export type ProfileOptionsState = {
  status: "loading" | "ready" | "empty" | "error";
  options: ProfileOption[];
};

export function parseProfileOptions(
  value: unknown,
  kind: ProfileOptionKind,
): ProfileOptionsState {
  const error: ProfileOptionsState = { status: "error", options: [] };
  if (!value || typeof value !== "object") return error;
  const result = value as { status?: unknown; response?: unknown };
  if (String(result.status) !== "7400" || !Array.isArray(result.response))
    return error;
  const field = kind === "language" ? "language" : "professional";
  const options: ProfileOption[] = [];
  for (const row of result.response) {
    if (
      !row ||
      typeof row._id !== "string" ||
      !/^[a-f\d]{24}$/i.test(row._id) ||
      typeof row[field] !== "string" ||
      !row[field].trim()
    )
      return error;
    if (!options.some((option) => option._id === row._id))
      options.push({ _id: row._id, name: row[field].trim() });
  }
  options.sort((a, b) => a.name.localeCompare(b.name));
  return { status: options.length ? "ready" : "empty", options };
}

export function retainProfileOption(
  options: ProfileOption[],
  id: unknown,
  label: string,
) {
  if (
    typeof id !== "string" ||
    !id ||
    options.some((option) => option._id === id)
  )
    return options;
  return [{ _id: id, name: label }, ...options];
}
