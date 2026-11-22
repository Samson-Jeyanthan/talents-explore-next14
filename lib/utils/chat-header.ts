export function chatEntityId(value: unknown): string | null {
  const candidate =
    typeof value === "string"
      ? value
      : value && typeof value === "object"
        ? (value as { _id?: unknown; id?: unknown })._id ??
          (value as { id?: unknown }).id
        : null;
  return typeof candidate === "string" && /^[a-f\d]{24}$/i.test(candidate)
    ? candidate.toLowerCase()
    : null;
}

export function chatCollaborationHref(details: any): string | null {
  const id =
    chatEntityId(details?.collaborationId) ||
    chatEntityId(details?.collaboration) ||
    chatEntityId(details);
  return id ? `/collaboration/${id}` : null;
}
