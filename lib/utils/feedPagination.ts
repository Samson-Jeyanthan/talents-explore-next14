export type FeedPageResult<T> = T[] | { message: string };

/** Protects page ordering across refreshes, concurrent requests, and failures. */
export class FeedPagination<T extends { _id: string }> {
  private items: T[] = [];
  private page = 1;
  private busy = false;
  private more = false;
  private error = "";
  private version = 0;

  constructor(
    initialItems: T[],
    private pageSize: number,
    private initialPage = 1,
  ) {
    this.reset(initialItems);
  }

  snapshot() {
    return {
      items: this.items,
      page: this.page,
      loading: this.busy,
      hasMore: this.more,
      error: this.error,
    };
  }

  reset(items: T[]) {
    this.version++;
    this.items = this.unique(items);
    this.page = this.initialPage;
    this.busy = false;
    this.more = this.initialPage === 0 || items.length >= this.pageSize;
    this.error = "";
  }

  invalidate() {
    this.version++;
  }

  private unique(items: T[]) {
    const ids = new Set<string>();
    return items.filter((item) => {
      if (ids.has(item._id)) return false;
      ids.add(item._id);
      return true;
    });
  }

  async load(loader: (page: number) => Promise<FeedPageResult<T>>) {
    if (this.busy || !this.more) return;
    const version = this.version;
    const nextPage = this.page + 1;
    this.busy = true;
    this.error = "";
    try {
      const result = await loader(nextPage);
      if (version !== this.version) return;
      if (!Array.isArray(result)) throw new Error(result.message);
      this.items = this.unique([...this.items, ...result]);
      this.page = nextPage;
      this.more = result.length >= this.pageSize;
    } catch (error) {
      if (version === this.version)
        this.error =
          error instanceof Error
            ? error.message
            : "Unable to load more content. Please try again.";
    } finally {
      if (version === this.version) this.busy = false;
    }
  }
}
