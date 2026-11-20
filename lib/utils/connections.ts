export interface ConnectionUser {
  _id: string;
  isTalent: boolean;
  userName: string;
  name: string;
  isFollow: number;
  profileImage: string;
  professional: { professional: string };
}

export type ConnectionResult =
  | { status: "7400"; response: ConnectionUser[]; hasMore: boolean }
  | { status: number; message: string; restricted?: boolean };

export function connectionId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}
export function followFlag(value: unknown) {
  return value === true || value === 1 || value === "1" || value === "true";
}
export function normalizeConnections(value: unknown): ConnectionUser[] | null {
  if (
    !Array.isArray(value) ||
    value.some((item) => !item || !connectionId(item._id))
  )
    return null;
  return value.map((item) => ({
    _id: item._id,
    isTalent: followFlag(item.isTalent),
    userName: typeof item.userName === "string" ? item.userName : "user",
    name:
      typeof item.name === "string"
        ? item.name
        : typeof item.userName === "string"
          ? item.userName
          : "User",
    isFollow: followFlag(item.isFollow) ? 1 : 0,
    profileImage:
      typeof item.profileImage === "string" ? item.profileImage : "",
    professional: {
      professional:
        typeof item.professional === "string"
          ? item.professional
          : typeof item.professional?.professional === "string"
            ? item.professional.professional
            : "",
    },
  }));
}
export function connectionTabs(
  isTalent: boolean,
  ratings: boolean,
  followers: boolean,
  following: boolean,
) {
  return [
    { id: 0, label: "Ratings", allowed: isTalent && ratings },
    { id: 1, label: "Followers", allowed: followers },
    { id: 2, label: "Following", allowed: following },
  ].filter((tab) => tab.allowed);
}

export class ConnectionPages {
  private items: ConnectionUser[] = [];
  private page = 0;
  private busy = false;
  private more = true;
  private error = "";
  private restricted = false;
  private version = 0;
  private editVersion = 0;
  private edits = new Map<string, { version: number; following: boolean }>();
  snapshot() {
    return {
      items: this.items,
      loading: this.busy,
      hasMore: this.more,
      error: this.error,
      restricted: this.restricted,
    };
  }

  reset(keepItems = false) {
    this.version++;
    this.page = 0;
    this.busy = false;
    this.more = true;
    this.error = "";
    this.restricted = false;
    if (!keepItems) this.items = [];
    this.edits.clear();
    this.editVersion = 0;
  }

  invalidate() {
    this.version++;
  }

  update(id: string, following: boolean, remove = false) {
    this.edits.set(id, { version: ++this.editVersion, following });
    this.items = remove
      ? this.items.filter((item) => item._id !== id)
      : this.items.map((item) =>
          item._id === id ? { ...item, isFollow: following ? 1 : 0 } : item,
        );
  }

  async load(loader: (page: number) => Promise<ConnectionResult>) {
    if (this.busy || !this.more) return;
    const current = this.version;
    const started = this.editVersion;
    const next = this.page + 1;
    this.busy = true;
    this.error = "";
    try {
      const result = await loader(next);
      if (current !== this.version) return;
      if (!("response" in result)) {
        this.error = result.message;
        this.restricted = !!result.restricted;
        if (this.restricted) {
          this.items = [];
          this.more = false;
        }
        return;
      }
      const incoming = result.response.map((item) => {
        const edit = this.edits.get(item._id);
        return edit && edit.version > started
          ? { ...item, isFollow: edit.following ? 1 : 0 }
          : item;
      });
      const seen = new Set<string>();
      this.items = [...(next === 1 ? [] : this.items), ...incoming].filter(
        (item) => {
          if (seen.has(item._id)) return false;
          seen.add(item._id);
          return true;
        },
      );
      this.page = next;
      this.more = result.hasMore;
      this.restricted = false;
    } catch {
      if (current === this.version)
        this.error = "Unable to load this list. Please try again.";
    } finally {
      if (current === this.version) this.busy = false;
    }
  }
}
