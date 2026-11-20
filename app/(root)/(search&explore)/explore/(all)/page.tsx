import {
  searchAction,
  getExploreFilterOptionsAction,
} from "@/actions/search.action";
import ExploreCategories from "@/components/widgets/explore/ExploreCategories";
import ExploreTopPosts from "@/components/widgets/explore/ExploreTopPosts";
import ExploreTopTalents from "@/components/widgets/explore/ExploreTopTalents";
import ExploreResultsPage from "@/components/widgets/explore/ExploreResultsPage";
import RetryExplore from "@/components/widgets/explore/RetryExplore";
import { filterFields, paramsString } from "@/lib/utils/explore";
import type { ISearchParamsProps } from "@/types/utils.types";

export default async function Page({ searchParams }: ISearchParamsProps) {
  const params = paramsString(searchParams);
  const current = new URLSearchParams(params);
  const hasFilters =
    !!current.get("q")?.trim() ||
    filterFields.some((key) => !!current.get(key)?.trim());
  if (hasFilters)
    return (
      <ExploreResultsPage
        type="ALL"
        searchParams={searchParams}
        path="/explore"
      />
    );
  const [categories, talents, posts] = await Promise.all([
    getExploreFilterOptionsAction("categories"),
    searchAction({
      searchType: "TALENT",
      pageNo: 1,
      pageSize: 12,
      userRating: 4.5,
    }),
    searchAction({
      searchType: "FEED",
      pageNo: 1,
      pageSize: 12,
      publicRating: 4.5,
    }),
  ]);
  return (
    <div className="flex w-full min-w-0 flex-col gap-8">
      {categories.success ? (
        <ExploreCategories
          data={categories.data.map((item) => ({
            _id: item.value,
            name: item.label,
          }))}
        />
      ) : (
        <RetryExplore message={categories.message} />
      )}
      {posts.status === "7400" ? (
        <ExploreTopPosts data={posts.response} />
      ) : (
        <RetryExplore message={posts.message} />
      )}
      {talents.status === "7400" ? (
        <ExploreTopTalents data={talents.response as any} />
      ) : (
        <RetryExplore message={talents.message} />
      )}
      <ExploreResultsPage
        type="ALL"
        searchParams={Object.fromEntries(new URLSearchParams(params))}
        path="/explore"
      />
    </div>
  );
}
