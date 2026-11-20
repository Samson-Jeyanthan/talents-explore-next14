const textKeys = [
  "mainCategory",
  "subCategory",
  "skill",
  "level",
  "postDescription",
  "primaryLanguage",
  "secondaryLanguage",
  "timeDuration",
  "country",
  "state",
  "creditTitle",
] as const;

export function getPostFilterDefaults(params: string) {
  const query = new URLSearchParams(params);
  const fields = Object.fromEntries(
    textKeys.map((key) => [key, query.get(key) || ""]),
  ) as Record<(typeof textKeys)[number], string>;
  const rating = Number(query.get("publicRating") || 0);
  return {
    ...fields,
    publicRating:
      Number.isFinite(rating) && rating >= 0 && rating <= 5 ? rating : 0,
  };
}

export function replacePostFilterParams(
  params: string,
  values: ReturnType<typeof getPostFilterDefaults>,
) {
  const query = new URLSearchParams(params);
  for (const key of textKeys) {
    const value = values[key].trim();
    if (value) query.set(key, value);
    else query.delete(key);
  }
  if (values.publicRating > 0)
    query.set("publicRating", String(values.publicRating));
  else query.delete("publicRating");
  return query.toString();
}
