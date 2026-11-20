import { z } from "zod";

export const CATEGORY_PAGE_SIZE = 20;
export const SHARE_PAGE_SIZE = 10;
const id = z.string().regex(/^[a-f\d]{24}$/i);
const time = z.enum(["one month", "six month", "one year", "two year"]);
export const categoryFeedQueryValidation = z.object({
  mainCategoryId: id,
  searchText: z.string().optional(),
  subCategoryId: id.optional(),
  skillId: id.optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  primaryLanguage: id.optional(),
  secondaryLanguage: id.optional(),
  publicRating: z.number().finite().min(0).max(5).optional(),
  description: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  creditTitle: z.string().optional(),
  resultTime: time.optional(),
});
export type CategoryFeedQuery = z.infer<typeof categoryFeedQueryValidation>;

export function buildCategoryFeedQuery(
  categoryId: string,
  params: Record<string, string | string[] | undefined>,
): CategoryFeedQuery {
  const text = (key: string) => {
    const value = params[key];
    return typeof value === "string" ? value.trim() || undefined : undefined;
  };
  const rating = text("publicRating");
  return categoryFeedQueryValidation.parse({
    // The route defines the category; a query-string category must not override it.
    mainCategoryId: categoryId,
    searchText: text("q"),
    subCategoryId: text("subCategory"),
    skillId: text("skill"),
    level: text("level"),
    primaryLanguage: text("primaryLanguage"),
    secondaryLanguage: text("secondaryLanguage"),
    publicRating:
      rating !== undefined && Number.isFinite(Number(rating))
        ? Number(rating)
        : undefined,
    description: text("postDescription"),
    country: text("country"),
    state: text("state"),
    creditTitle: text("creditTitle"),
    resultTime: text("timeDuration"),
  });
}
