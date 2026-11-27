import LinkifyIt from "linkify-it";

const linkify = new LinkifyIt()
  .set({ fuzzyEmail: false })
  .tlds(
    [
      "app",
      "dev",
      "tech",
      "online",
      "site",
      "store",
      "xyz",
      "cloud",
      "social",
      "link",
      "live",
      "world",
      "design",
      "art",
      "photography",
      "media",
      "studio",
      "video",
      "news",
    ],
    true,
  )
  .add("ftp:", null)
  .add("mailto:", null);

export type LinkedTextPart = { text: string; href?: string };

export function linkedTextParts(value?: string | null): LinkedTextPart[] {
  const text = typeof value === "string" ? value : "";
  const parts: LinkedTextPart[] = [];
  let cursor = 0;
  for (const match of linkify.match(text) || []) {
    if (match.index > cursor)
      parts.push({ text: text.slice(cursor, match.index) });
    let href: string | undefined;
    try {
      const candidate = match.url.startsWith("//")
        ? `https:${match.url}`
        : match.schema
          ? match.url
          : `https://${match.text}`;
      const url = new URL(candidate);
      if (
        ["http:", "https:"].includes(url.protocol) &&
        !url.username &&
        !url.password
      )
        href = url.href;
    } catch {
      // Invalid URLs remain ordinary text.
    }
    parts.push({ text: match.text, ...(href ? { href } : {}) });
    cursor = match.lastIndex;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}
