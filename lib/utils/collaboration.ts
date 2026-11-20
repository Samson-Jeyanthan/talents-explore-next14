import { z } from "zod";

export const collaborationId = z.string().regex(/^[a-f\d]{24}$/i);
export const collaborationTabs = [
  "ALL",
  "COMMITTED",
  "RECEIVED",
  "MY",
  "APPLIED",
] as const;
export type CollaborationTab = (typeof collaborationTabs)[number];
export const COLLABORATION_PAGE_SIZE = 20;
const optionalId = z
  .union([collaborationId, z.literal(""), z.null()])
  .optional();
const optionalText = z.string().trim().nullable().optional();
export const collaborationFilterValidation = z.object({
  keywords: z.string().trim().optional(),
  mainCategoryId: optionalId,
  subCategoryId: optionalId,
  skillId: optionalId,
  level: z
    .union([
      z.enum(["beginner", "intermediate", "advanced"]),
      z.literal(""),
      z.null(),
    ])
    .optional(),
  gender: z
    .union([
      z.enum(["male", "female", "other", "prefferNotToSay"]),
      z.literal(""),
      z.null(),
    ])
    .optional(),
  languageId: optionalId,
  ethnicId: optionalId,
  country: optionalText,
  state: optionalText,
  city: optionalText,
  resultTime: z
    .union([
      z.enum(["one month", "six month", "one year", "two year"]),
      z.literal(""),
      z.null(),
    ])
    .optional(),
});
export type CollaborationFilters = z.infer<
  typeof collaborationFilterValidation
>;
export const collaborationListValidation = z.object({
  type: z.enum(collaborationTabs),
  pageNo: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  filters: collaborationFilterValidation.default({}),
});
export const applicantQueryValidation = z.object({
  pageNo: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().trim().default(""),
  roleId: optionalId,
  filter: z
    .enum([
      "ALL",
      "INVITED",
      "SHORTLISTED",
      "FINALIZED",
      "REJECTED",
      "ROLE",
      "ACCEPTED",
      "APPLIED",
    ])
    .default("ALL"),
});
export const inviteResponseValidation = z.object({
  collaborationRoleId: collaborationId,
  action: z.enum(["ACCEPT", "DECLINE"]),
});
export const reviewApplicantValidation = z.object({
  collaborationRoleId: collaborationId,
  applicantId: collaborationId,
  action: z.enum(["SHORTLIST", "ACCEPT", "REJECT", "FINALIZED"]),
});
export const bulkInviteValidation = z.object({
  invites: z
    .array(
      z.object({
        collaborationRoleId: collaborationId,
        applicantId: collaborationId,
      }),
    )
    .min(1),
});
export const applyCollaborationValidation = z.object({
  collaborationRoleId: collaborationId,
  applicantName: z.string().trim().optional(),
  applicantEmail: z
    .union([z.string().trim().email(), z.literal("")])
    .optional(),
  applicantPhone: z.string().trim().optional(),
  message: z.string().trim().optional(),
  resumeFileUrl: z.union([z.string().url(), z.literal("")]).optional(),
  resumeFileKey: z.string().optional(),
});
export function collaborationKey(item: any): string | undefined {
  const key = item?.collaboration?._id || item?.collaboration?.id || item?._id;
  return collaborationId.safeParse(key).success ? key : undefined;
}
export type CollaborationItem = { [key: string]: any };
export type CollaborationListResult =
  | { status: "7400"; response: CollaborationItem[]; message?: string }
  | { status: "400"; response: []; message: string };
export function collaborationListItems(data: any): any[] | null {
  const items = [data?.response, data?.response?.list, data?.data].find(
    Array.isArray,
  );
  return items && items.every((item: any) => collaborationKey(item))
    ? items
    : null;
}
export function emptyCollaborationFilters() {
  return {
    keywords: "",
    mainCategoryId: "",
    subCategoryId: "",
    skillId: "",
    level: "",
    gender: "",
    languageId: "",
    ethnicId: "",
    country: "",
    state: "",
    city: "",
    resultTime: "",
  };
}
type TabState = {
  items: CollaborationItem[];
  loading: boolean;
  error: string;
  loaded: boolean;
  page: number;
  hasMore: boolean;
  filters: CollaborationFilters;
  version: number;
};
export class CollaborationPages {
  private tabs = {} as Record<CollaborationTab, TabState>;
  constructor(initial: CollaborationListResult) {
    for (const tab of collaborationTabs)
      this.tabs[tab] = {
        items: [],
        loading: false,
        error: "",
        loaded: false,
        page: 0,
        hasMore: true,
        filters: {},
        version: 0,
      };
    this.seed(initial);
  }

  snapshot() {
    return Object.fromEntries(
      collaborationTabs.map((tab) => [tab, { ...this.tabs[tab] }]),
    ) as Record<CollaborationTab, TabState>;
  }

  seed(initial: CollaborationListResult) {
    const current = this.tabs.ALL;
    if (current.loading || Object.values(current.filters).some(Boolean)) return;
    current.version++;
    current.items =
      initial.status === "7400"
        ? this.merge([], initial.response)
        : current.items;
    current.error = initial.status === "7400" ? "" : initial.message;
    current.loaded = initial.status === "7400";
    current.page = current.loaded ? 1 : 0;
    current.hasMore =
      initial.status !== "7400" ||
      initial.response.length >= COLLABORATION_PAGE_SIZE;
  }

  private merge(old: CollaborationItem[], next: CollaborationItem[]) {
    const items = new Map<string, CollaborationItem>();
    for (const item of [...old, ...next]) {
      const key = collaborationKey(item);
      if (key) items.set(key, item);
    }
    return Array.from(items.values());
  }

  prepare(tab: CollaborationTab, filters?: CollaborationFilters) {
    const state = this.tabs[tab];
    state.version++;
    state.loading = false;
    state.error = "";
    state.page = 0;
    state.loaded = false;
    state.hasMore = true;
    if (filters !== undefined) {
      state.filters = { ...filters };
      state.items = [];
    }
  }

  invalidate() {
    for (const tab of collaborationTabs) this.tabs[tab].version++;
  }

  async load(
    tab: CollaborationTab,
    loader: (
      query: z.infer<typeof collaborationListValidation>,
    ) => Promise<CollaborationListResult>,
  ) {
    const state = this.tabs[tab];
    if (state.loading || (state.loaded && !state.hasMore)) return;
    const version = state.version;
    const pageNo = state.page + 1;
    state.loading = true;
    state.error = "";
    try {
      const result = await loader({
        type: tab,
        pageNo,
        pageSize: COLLABORATION_PAGE_SIZE,
        filters: { ...state.filters },
      });
      if (version !== state.version) return;
      if (result.status !== "7400") {
        state.error = result.message;
        return;
      }
      state.items = this.merge(
        pageNo === 1 ? [] : state.items,
        result.response,
      );
      state.page = pageNo;
      state.loaded = true;
      state.hasMore = result.response.length >= COLLABORATION_PAGE_SIZE;
    } catch {
      if (version === state.version)
        state.error = "Unable to load collaborations. Please try again.";
    } finally {
      if (version === state.version) state.loading = false;
    }
  }
}
